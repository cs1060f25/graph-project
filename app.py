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

    # Create feedback table for papers and edges
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            paper_id INTEGER,
            edge_id INTEGER,
            vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paper_id) REFERENCES papers(id),
            FOREIGN KEY (edge_id) REFERENCES citations(id)
        )
    ''')

    # Unique constraints per user per target (SQLite partial indices)
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_user_paper
        ON feedback(user_id, paper_id)
        WHERE paper_id IS NOT NULL
    ''')
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_user_edge
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
    data = request.get_json(force=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON body'}), 400
    if not data.get('title') or not data.get('authors'):
        return jsonify({'error': 'title and authors are required'}), 400
    
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
    data = request.get_json(force=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Invalid JSON body'}), 400
    if data.get('citing_paper_id') is None or data.get('cited_paper_id') is None:
        return jsonify({'error': 'citing_paper_id and cited_paper_id are required'}), 400
    
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
        SELECT id, citing_paper_id as source, cited_paper_id as target
        FROM citations
    ''')
    citations = cursor.fetchall()
    
    links = []
    for citation in citations:
        links.append({
            'id': citation['id'],
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


def _aggregate_scores(conn):
    """Return aggregated scores for papers and edges."""
    cursor = conn.cursor()
    # Papers
    cursor.execute('''
        SELECT paper_id as id,
               SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
               SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
               COALESCE(SUM(vote), 0) as score
        FROM feedback
        WHERE paper_id IS NOT NULL
        GROUP BY paper_id
    ''')
    paper_rows = cursor.fetchall()
    papers = {str(r['id']): {'up': r['up'] or 0, 'down': r['down'] or 0, 'score': r['score'] or 0} for r in paper_rows}

    # Edges
    cursor.execute('''
        SELECT edge_id as id,
               SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
               SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
               COALESCE(SUM(vote), 0) as score
        FROM feedback
        WHERE edge_id IS NOT NULL
        GROUP BY edge_id
    ''')
    edge_rows = cursor.fetchall()
    edges = {str(r['id']): {'up': r['up'] or 0, 'down': r['down'] or 0, 'score': r['score'] or 0} for r in edge_rows}

    return {'papers': papers, 'edges': edges}


@app.route('/api/scores', methods=['GET'])
def get_scores():
    """Get aggregated vote counts and scores for all papers and edges."""
    conn = get_db()
    data = _aggregate_scores(conn)
    conn.close()
    return jsonify(data)


@app.route('/api/my-votes', methods=['GET'])
def get_my_votes():
    """Get current user's votes for papers and edges."""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT paper_id, vote FROM feedback WHERE user_id = ? AND paper_id IS NOT NULL', (user_id,))
    paper_votes = {str(r['paper_id']): r['vote'] for r in cursor.fetchall()}
    cursor.execute('SELECT edge_id, vote FROM feedback WHERE user_id = ? AND edge_id IS NOT NULL', (user_id,))
    edge_votes = {str(r['edge_id']): r['vote'] for r in cursor.fetchall()}
    conn.close()
    return jsonify({'papers': paper_votes, 'edges': edge_votes})


@app.route('/api/vote', methods=['POST'])
def vote():
    """Submit a vote for a paper or edge. Body: {type: 'paper'|'edge', id: int, vote: -1|0|1, user_id: str}"""
    data = request.get_json(force=True)
    vote_type = data.get('type')
    target_id = data.get('id')
    vote_val = int(data.get('vote', 0))
    user_id = data.get('user_id')

    if vote_type not in ('paper', 'edge') or not target_id or not user_id:
        return jsonify({'error': 'Invalid parameters'}), 400

    if vote_val not in (-1, 0, 1):
        return jsonify({'error': 'Invalid vote value'}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        if vote_type == 'paper':
            if vote_val == 0:
                cursor.execute('DELETE FROM feedback WHERE user_id = ? AND paper_id = ?', (user_id, target_id))
            else:
                # Try update, else insert
                cursor.execute('UPDATE feedback SET vote = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND paper_id = ?', (vote_val, user_id, target_id))
                if cursor.rowcount == 0:
                    cursor.execute('INSERT INTO feedback (user_id, paper_id, vote) VALUES (?, ?, ?)', (user_id, target_id, vote_val))

            conn.commit()
            # Return aggregates
            cursor.execute('''
                SELECT SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
                       SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
                       COALESCE(SUM(vote), 0) AS score
                FROM feedback WHERE paper_id = ?
            ''', (target_id,))
            row = cursor.fetchone()
            # Determine current user vote after change
            cursor.execute('SELECT vote FROM feedback WHERE user_id = ? AND paper_id = ?', (user_id, target_id))
            uv = cursor.fetchone()
            user_vote = uv['vote'] if uv else 0
            result = {'type': 'paper', 'id': target_id, 'user_vote': user_vote,
                      'counts': {'up': (row['up'] or 0), 'down': (row['down'] or 0), 'score': (row['score'] or 0)}}
        else:
            if vote_val == 0:
                cursor.execute('DELETE FROM feedback WHERE user_id = ? AND edge_id = ?', (user_id, target_id))
            else:
                cursor.execute('UPDATE feedback SET vote = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND edge_id = ?', (vote_val, user_id, target_id))
                if cursor.rowcount == 0:
                    cursor.execute('INSERT INTO feedback (user_id, edge_id, vote) VALUES (?, ?, ?)', (user_id, target_id, vote_val))

            conn.commit()
            cursor.execute('''
                SELECT SUM(CASE WHEN vote = 1 THEN 1 ELSE 0 END) AS up,
                       SUM(CASE WHEN vote = -1 THEN 1 ELSE 0 END) AS down,
                       COALESCE(SUM(vote), 0) AS score
                FROM feedback WHERE edge_id = ?
            ''', (target_id,))
            row = cursor.fetchone()
            cursor.execute('SELECT vote FROM feedback WHERE user_id = ? AND edge_id = ?', (user_id, target_id))
            uv = cursor.fetchone()
            user_vote = uv['vote'] if uv else 0
            result = {'type': 'edge', 'id': target_id, 'user_vote': user_vote,
                      'counts': {'up': (row['up'] or 0), 'down': (row['down'] or 0), 'score': (row['score'] or 0)}}
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

    conn.close()
    return jsonify(result)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
