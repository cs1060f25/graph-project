from flask import Flask, render_template, request, jsonify, session
import sqlite3
import json
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)  # For session management

DATABASE = 'research_graph.db'
HIDE_THRESHOLD = -0.5  # Papers with score below this are hidden

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with schema"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create papers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            authors TEXT NOT NULL,
            abstract TEXT,
            year INTEGER,
            url TEXT,
            keywords TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create citations table (edges in the graph)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS citations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            citing_paper_id INTEGER NOT NULL,
            cited_paper_id INTEGER NOT NULL,
            FOREIGN KEY (citing_paper_id) REFERENCES papers(id),
            FOREIGN KEY (cited_paper_id) REFERENCES papers(id),
            UNIQUE(citing_paper_id, cited_paper_id)
        )
    ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    """Main page"""
    # Create session ID if not exists
    if 'user_id' not in session:
        session['user_id'] = secrets.token_hex(16)
    return render_template('index.html')

@app.route('/moderation')
def moderation():
    """Moderation dashboard"""
    if 'user_id' not in session:
        session['user_id'] = secrets.token_hex(16)
    return render_template('moderation.html')

@app.route('/api/papers', methods=['GET'])
def get_papers():
    """Get all papers with vote scores, filtering out hidden ones unless include_hidden=true"""
    include_hidden = request.args.get('include_hidden', 'false').lower() == 'true'
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get papers with their vote scores
    cursor.execute('''
        SELECT p.*,
               COALESCE(SUM(CASE WHEN pf.vote_type = 'up' THEN 1 
                                 WHEN pf.vote_type = 'down' THEN -1 
                                 ELSE 0 END), 0) as score
        FROM papers p
        LEFT JOIN paper_feedback pf ON p.id = pf.paper_id
        GROUP BY p.id
        ORDER BY p.year DESC, p.created_at DESC
    ''')
    
    papers = []
    for row in cursor.fetchall():
        paper = dict(row)
        # Filter out hidden papers unless explicitly requested
        if include_hidden or paper['score'] >= HIDE_THRESHOLD:
            papers.append(paper)
    
    conn.close()
    return jsonify(papers)

@app.route('/api/papers/<int:paper_id>', methods=['GET'])
def get_paper(paper_id):
    """Get a specific paper"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM papers WHERE id = ?', (paper_id,))
    paper = cursor.fetchone()
    conn.close()
    
    if paper:
        return jsonify(dict(paper))
    return jsonify({'error': 'Paper not found'}), 404

@app.route('/api/papers', methods=['POST'])
def add_paper():
    """Add a new paper"""
    data = request.json
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO papers (title, authors, abstract, year, url, keywords)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data.get('title'),
        data.get('authors'),
        data.get('abstract'),
        data.get('year'),
        data.get('url'),
        data.get('keywords')
    ))
    
    paper_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': paper_id, 'message': 'Paper added successfully'}), 201

@app.route('/api/citations', methods=['POST'])
def add_citation():
    """Add a citation relationship"""
    data = request.json
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO citations (citing_paper_id, cited_paper_id)
            VALUES (?, ?)
        ''', (data.get('citing_paper_id'), data.get('cited_paper_id')))
        
        conn.commit()
        citation_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'id': citation_id, 'message': 'Citation added successfully'}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Citation already exists'}), 400

@app.route('/api/graph', methods=['GET'])
def get_graph():
    """Get graph data for visualization"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all papers as nodes
    cursor.execute('SELECT id, title, authors, year, keywords FROM papers')
    papers = cursor.fetchall()
    
    nodes = []
    for paper in papers:
        nodes.append({
            'id': paper['id'],
            'title': paper['title'],
            'authors': paper['authors'],
            'year': paper['year'],
            'keywords': paper['keywords']
        })
    
    # Get all citations as links
    cursor.execute('''
        SELECT citing_paper_id as source, cited_paper_id as target
        FROM citations
    ''')
    citations = cursor.fetchall()
    
    links = []
    for citation in citations:
        links.append({
            'source': citation['source'],
            'target': citation['target']
        })
    
    conn.close()
    
    return jsonify({
        'nodes': nodes,
        'links': links
    })

@app.route('/api/search', methods=['GET'])
def search_papers():
    """Search papers by keyword"""
    query = request.args.get('q', '')
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM papers
        WHERE title LIKE ? OR abstract LIKE ? OR keywords LIKE ? OR authors LIKE ?
        ORDER BY year DESC
    ''', (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%'))
    
    papers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(papers)

@app.route('/api/related/<int:paper_id>', methods=['GET'])
def get_related_papers(paper_id):
    """Get papers related to a specific paper (papers it cites and papers that cite it)"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Papers this paper cites
    cursor.execute('''
        SELECT p.* FROM papers p
        JOIN citations c ON p.id = c.cited_paper_id
        WHERE c.citing_paper_id = ?
    ''', (paper_id,))
    cited_papers = [dict(row) for row in cursor.fetchall()]
    
    # Papers that cite this paper
    cursor.execute('''
        SELECT p.* FROM papers p
        JOIN citations c ON p.id = c.citing_paper_id
        WHERE c.cited_paper_id = ?
    ''', (paper_id,))
    citing_papers = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'cites': cited_papers,
        'cited_by': citing_papers
    })

@app.route('/api/feedback/paper', methods=['POST'])
def submit_paper_feedback():
    """Submit feedback for a paper"""
    data = request.json
    paper_id = data.get('paper_id')
    vote_type = data.get('vote_type')  # 'up' or 'down'
    reason = data.get('reason', '')
    
    if not paper_id or vote_type not in ['up', 'down']:
        return jsonify({'error': 'Invalid data'}), 400
    
    user_session = session.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user already voted on this paper
    cursor.execute('''
        SELECT id FROM paper_feedback 
        WHERE paper_id = ? AND user_session = ?
    ''', (paper_id, user_session))
    
    existing = cursor.fetchone()
    
    if existing:
        # Update existing vote
        cursor.execute('''
            UPDATE paper_feedback 
            SET vote_type = ?, reason = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (vote_type, reason, existing['id']))
    else:
        # Insert new vote
        cursor.execute('''
            INSERT INTO paper_feedback (paper_id, vote_type, reason, user_session)
            VALUES (?, ?, ?, ?)
        ''', (paper_id, vote_type, reason, user_session))
    
    conn.commit()
    
    # Get updated score
    cursor.execute('''
        SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 
                                 WHEN vote_type = 'down' THEN -1 
                                 ELSE 0 END), 0) as score
        FROM paper_feedback
        WHERE paper_id = ?
    ''', (paper_id,))
    
    score = cursor.fetchone()['score']
    conn.close()
    
    return jsonify({
        'message': 'Feedback submitted',
        'score': score,
        'hidden': score < HIDE_THRESHOLD
    })

@app.route('/api/feedback/citation', methods=['POST'])
def submit_citation_feedback():
    """Submit feedback for a citation/edge"""
    data = request.json
    citation_id = data.get('citation_id')
    vote_type = data.get('vote_type')  # 'up' or 'down'
    reason = data.get('reason', '')
    
    if not citation_id or vote_type not in ['up', 'down']:
        return jsonify({'error': 'Invalid data'}), 400
    
    user_session = session.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if user already voted on this citation
    cursor.execute('''
        SELECT id FROM citation_feedback 
        WHERE citation_id = ? AND user_session = ?
    ''', (citation_id, user_session))
    
    existing = cursor.fetchone()
    
    if existing:
        # Update existing vote
        cursor.execute('''
            UPDATE citation_feedback 
            SET vote_type = ?, reason = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (vote_type, reason, existing['id']))
    else:
        # Insert new vote
        cursor.execute('''
            INSERT INTO citation_feedback (citation_id, vote_type, reason, user_session)
            VALUES (?, ?, ?, ?)
        ''', (citation_id, vote_type, reason, user_session))
    
    conn.commit()
    
    # Get updated score
    cursor.execute('''
        SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 
                                 WHEN vote_type = 'down' THEN -1 
                                 ELSE 0 END), 0) as score
        FROM citation_feedback
        WHERE citation_id = ?
    ''', (citation_id,))
    
    score = cursor.fetchone()['score']
    conn.close()
    
    return jsonify({
        'message': 'Feedback submitted',
        'score': score
    })

@app.route('/api/feedback/paper/<int:paper_id>', methods=['GET'])
def get_paper_feedback(paper_id):
    """Get feedback stats for a paper"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
            COALESCE(SUM(CASE WHEN vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
            COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 
                              WHEN vote_type = 'down' THEN -1 
                              ELSE 0 END), 0) as score
        FROM paper_feedback
        WHERE paper_id = ?
    ''', (paper_id,))
    
    stats = dict(cursor.fetchone())
    
    # Get user's vote if exists
    user_session = session.get('user_id')
    cursor.execute('''
        SELECT vote_type FROM paper_feedback
        WHERE paper_id = ? AND user_session = ?
    ''', (paper_id, user_session))
    
    user_vote = cursor.fetchone()
    stats['user_vote'] = user_vote['vote_type'] if user_vote else None
    
    conn.close()
    return jsonify(stats)

@app.route('/api/moderation/flagged', methods=['GET'])
def get_flagged_papers():
    """Get most flagged papers for moderation"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT p.*, 
               COALESCE(SUM(CASE WHEN pf.vote_type = 'down' THEN 1 ELSE 0 END), 0) as downvotes,
               COALESCE(SUM(CASE WHEN pf.vote_type = 'up' THEN 1 ELSE 0 END), 0) as upvotes,
               COALESCE(SUM(CASE WHEN pf.vote_type = 'up' THEN 1 
                                 WHEN pf.vote_type = 'down' THEN -1 
                                 ELSE 0 END), 0) as score,
               COUNT(DISTINCT pf.user_session) as unique_voters
        FROM papers p
        LEFT JOIN paper_feedback pf ON p.id = pf.paper_id
        GROUP BY p.id
        HAVING downvotes > 0
        ORDER BY downvotes DESC, score ASC
        LIMIT 50
    ''')
    
    papers = [dict(row) for row in cursor.fetchall()]
    
    # Get reasons for each paper
    for paper in papers:
        cursor.execute('''
            SELECT reason, COUNT(*) as count
            FROM paper_feedback
            WHERE paper_id = ? AND vote_type = 'down' AND reason IS NOT NULL AND reason != ''
            GROUP BY reason
            ORDER BY count DESC
        ''', (paper['id'],))
        paper['reasons'] = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return jsonify(papers)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
