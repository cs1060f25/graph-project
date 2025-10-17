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
            thumbs_up INTEGER DEFAULT 0 NOT NULL,
            thumbs_down INTEGER DEFAULT 0 NOT NULL,
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
    data = request.json
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO papers (title, authors, abstract, year, url, keywords)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data.get('title'),
        data.get('authors'),
        data.get('abstract',
        data.get('year'),
        data.get('url'),
        data.get('keywords')
    )))
    
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
    cursor.execute('SELECT id, title, authors, year, keywords, thumbs_up, thumbs_down FROM papers')
    papers = cursor.fetchall()
    
    nodes = []
    for paper in papers:
        nodes.append({
            'id': paper['id'],
            'title': paper['title'],
            'authors': paper['authors'],
            'year': paper['year'],
            'keywords': paper['keywords'],
            'thumbs_up': paper['thumbs_up'],
            'thumbs_down': paper['thumbs_down']
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

@app.route('/api/papers/<int:paper_id>/vote', methods=['POST'])
def vote_paper(paper_id):
    """Vote on a paper"""
    data = request.json
    vote_type = data.get('vote_type')

    if vote_type not in ['up', 'down']:
        return jsonify({'error': 'Invalid vote type'}), 400

    conn = get_db()
    cursor = conn.cursor()

    if vote_type == 'up':
        cursor.execute('UPDATE papers SET thumbs_up = thumbs_up + 1 WHERE id = ?', (paper_id,))
    else:
        cursor.execute('UPDATE papers SET thumbs_down = thumbs_down + 1 WHERE id = ?', (paper_id,))
    
    conn.commit()

    cursor.execute('SELECT thumbs_up, thumbs_down FROM papers WHERE id = ?', (paper_id,))
    updated_counts = cursor.fetchone()
    
    conn.close()

    return jsonify(dict(updated_counts))

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
