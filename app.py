from flask import Flask, render_template, request, jsonify
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)

DATABASE = 'research_graph.db'

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

    # Create feedback table (votes for papers and edges)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            paper_id INTEGER,
            edge_id INTEGER,
            vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paper_id) REFERENCES papers(id),
            FOREIGN KEY (edge_id) REFERENCES citations(id)
        )
    ''')
    # Unique vote per user per paper
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS ux_feedback_user_paper
        ON feedback(user_id, paper_id)
        WHERE paper_id IS NOT NULL
    ''')
    # Unique vote per user per edge
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS ux_feedback_user_edge
        ON feedback(user_id, edge_id)
        WHERE edge_id IS NOT NULL
    ''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/papers', methods=['GET'])
def get_papers():
    """Get all papers"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM papers ORDER BY year DESC, created_at DESC')
    papers = [dict(row) for row in cursor.fetchall()]
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
    data = request.json or {}
    
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
    data = request.json or {}
    
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
    user_id = request.args.get('user_id')
    
    # Get all papers as nodes
    cursor.execute('''
        WITH agg AS (
            SELECT paper_id,
                   SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
                   SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
                   SUM(vote) AS score
            FROM feedback
            WHERE paper_id IS NOT NULL
            GROUP BY paper_id
        )
        SELECT p.id, p.title, p.authors, p.year, p.keywords,
               COALESCE(a.up, 0) AS up,
               COALESCE(a.down, 0) AS down,
               COALESCE(a.score, 0) AS score
        FROM papers p
        LEFT JOIN agg a ON a.paper_id = p.id
    ''')
    papers = cursor.fetchall()
    
    nodes = []
    for paper in papers:
        nodes.append({
            'id': paper['id'],
            'title': paper['title'],
            'authors': paper['authors'],
            'year': paper['year'],
            'keywords': paper['keywords'],
            'up': paper['up'],
            'down': paper['down'],
            'score': paper['score']
        })
    
    # Get all citations as links
    cursor.execute('''
        WITH agg AS (
            SELECT edge_id,
                   SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
                   SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
                   SUM(vote) AS score
            FROM feedback
            WHERE edge_id IS NOT NULL
            GROUP BY edge_id
        )
        SELECT c.id, c.citing_paper_id as source, c.cited_paper_id as target,
               COALESCE(a.up, 0) AS up,
               COALESCE(a.down, 0) AS down,
               COALESCE(a.score, 0) AS score
        FROM citations c
        LEFT JOIN agg a ON a.edge_id = c.id
    ''')
    citations = cursor.fetchall()
    
    links = []
    for citation in citations:
        links.append({
            'id': citation['id'],
            'source': citation['source'],
            'target': citation['target'],
            'up': citation['up'],
            'down': citation['down'],
            'score': citation['score']
        })

    # If user_id provided, include user's current vote for nodes and links
    if user_id:
        # paper votes
        cursor.execute('''
            SELECT paper_id, vote FROM feedback
            WHERE user_id = ? AND paper_id IS NOT NULL
        ''', (user_id,))
        user_paper_votes = {row['paper_id']: row['vote'] for row in cursor.fetchall()}
        for n in nodes:
            n['userVote'] = user_paper_votes.get(n['id'])

        # edge votes
        cursor.execute('''
            SELECT edge_id, vote FROM feedback
            WHERE user_id = ? AND edge_id IS NOT NULL
        ''', (user_id,))
        user_edge_votes = {row['edge_id']: row['vote'] for row in cursor.fetchall()}
        for l in links:
            l['userVote'] = user_edge_votes.get(l['id'])
    
    conn.close()
    
    return jsonify({
        'nodes': nodes,
        'links': links
    })

def _aggregate_paper(cursor, paper_id):
    cursor.execute('''
        SELECT
            SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
            SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
            COALESCE(SUM(vote), 0) AS score
        FROM feedback WHERE paper_id = ?
    ''', (paper_id,))
    row = cursor.fetchone()
    return {
        'up': row['up'] or 0,
        'down': row['down'] or 0,
        'score': row['score'] or 0
    }

def _aggregate_edge(cursor, edge_id):
    cursor.execute('''
        SELECT
            SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
            SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
            COALESCE(SUM(vote), 0) AS score
        FROM feedback WHERE edge_id = ?
    ''', (edge_id,))
    row = cursor.fetchone()
    return {
        'up': row['up'] or 0,
        'down': row['down'] or 0,
        'score': row['score'] or 0
    }

@app.route('/api/vote/paper', methods=['POST'])
def vote_paper():
    data = request.json or {}
    paper_id = data.get('paper_id')
    user_id = data.get('user_id')
    vote = data.get('vote')  # expected 1 or -1
    if not paper_id or not user_id or vote not in (-1, 1):
        return jsonify({'error': 'Invalid payload'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, vote FROM feedback WHERE user_id = ? AND paper_id = ?', (user_id, paper_id))
    existing = cursor.fetchone()
    if existing:
        if existing['vote'] == vote:
            # toggle off => remove
            cursor.execute('DELETE FROM feedback WHERE id = ?', (existing['id'],))
            user_vote = None
        else:
            # update
            cursor.execute('UPDATE feedback SET vote = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', (vote, existing['id']))
            user_vote = vote
    else:
        cursor.execute('INSERT INTO feedback (user_id, paper_id, vote) VALUES (?, ?, ?)', (user_id, paper_id, vote))
        user_vote = vote

    conn.commit()
    agg = _aggregate_paper(cursor, paper_id)
    conn.close()
    return jsonify({
        'paper_id': paper_id,
        'up': agg['up'],
        'down': agg['down'],
        'score': agg['score'],
        'userVote': user_vote
    })

@app.route('/api/vote/edge', methods=['POST'])
def vote_edge():
    data = request.json or {}
    edge_id = data.get('edge_id')
    user_id = data.get('user_id')
    vote = data.get('vote')  # expected 1 or -1
    if not edge_id or not user_id or vote not in (-1, 1):
        return jsonify({'error': 'Invalid payload'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, vote FROM feedback WHERE user_id = ? AND edge_id = ?', (user_id, edge_id))
    existing = cursor.fetchone()
    if existing:
        if existing['vote'] == vote:
            cursor.execute('DELETE FROM feedback WHERE id = ?', (existing['id'],))
            user_vote = None
        else:
            cursor.execute('UPDATE feedback SET vote = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', (vote, existing['id']))
            user_vote = vote
    else:
        cursor.execute('INSERT INTO feedback (user_id, edge_id, vote) VALUES (?, ?, ?)', (user_id, edge_id, vote))
        user_vote = vote

    conn.commit()
    agg = _aggregate_edge(cursor, edge_id)
    conn.close()
    return jsonify({
        'edge_id': edge_id,
        'up': agg['up'],
        'down': agg['down'],
        'score': agg['score'],
        'userVote': user_vote
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

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
