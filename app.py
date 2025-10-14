from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database configuration
DATABASE = 'research_papers.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with sample data"""
    conn = get_db_connection()
    
    # Create tables
    conn.execute('''
        CREATE TABLE IF NOT EXISTS papers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            abstract TEXT,
            venue TEXT,
            year INTEGER,
            citation_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS paper_authors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paper_id INTEGER NOT NULL,
            author_id INTEGER NOT NULL,
            is_first_author BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (paper_id) REFERENCES papers (id),
            FOREIGN KEY (author_id) REFERENCES authors (id)
        )
    ''')
    
    conn.execute('''
        CREATE TABLE IF NOT EXISTS citations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            citing_paper_id INTEGER NOT NULL,
            cited_paper_id INTEGER NOT NULL,
            FOREIGN KEY (citing_paper_id) REFERENCES papers (id),
            FOREIGN KEY (cited_paper_id) REFERENCES papers (id)
        )
    ''')
    
    # Check if data already exists
    papers_count = conn.execute('SELECT COUNT(*) FROM papers').fetchone()[0]
    if papers_count > 0:
        conn.close()
        return
    
    # Insert sample data
    sample_papers = [
        {
            'title': 'Attention Is All You Need',
            'abstract': 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.',
            'venue': 'NIPS',
            'year': 2017,
            'authors': ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar']
        },
        {
            'title': 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding',
            'abstract': 'We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers.',
            'venue': 'NAACL',
            'year': 2018,
            'authors': ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee']
        },
        {
            'title': 'GPT-3: Language Models are Few-Shot Learners',
            'abstract': 'We show that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
            'venue': 'NeurIPS',
            'year': 2020,
            'authors': ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder']
        },
        {
            'title': 'ResNet: Deep Residual Learning for Image Recognition',
            'abstract': 'Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.',
            'venue': 'CVPR',
            'year': 2016,
            'authors': ['Kaiming He', 'Xiangyu Zhang', 'Shaoqing Ren']
        },
        {
            'title': 'RoBERTa: A Robustly Optimized BERT Pretraining Approach',
            'abstract': 'Language model pretraining has led to significant performance gains but careful comparison between different approaches is challenging.',
            'venue': 'arXiv',
            'year': 2019,
            'authors': ['Yinhan Liu', 'Myle Ott', 'Naman Goyal']
        },
        {
            'title': 'DistilBERT: A Distilled Version of BERT',
            'abstract': 'As Transfer Learning from large-scale pre-trained models becomes more prevalent in Natural Language Processing (NLP), operating these large models in on-the-edge and/or under computational constraints and limited resources raises challenging questions.',
            'venue': 'NeurIPS',
            'year': 2019,
            'authors': ['Victor Sanh', 'Lysandre Debut', 'Julien Chaumond']
        },
        {
            'title': 'ALBERT: A Lite BERT for Self-supervised Learning of Language Representations',
            'abstract': 'Increasing model size when pretraining natural language representations often results in improved performance on downstream tasks. However, at some point further model increases become harder due to GPU/TPU memory limitations and longer training times.',
            'venue': 'ICLR',
            'year': 2019,
            'authors': ['Zhenzhong Lan', 'Mingda Chen', 'Sebastian Goodman']
        },
        {
            'title': 'GPT-2: Language Models are Unsupervised Multitask Learners',
            'abstract': 'Natural language processing tasks, such as question answering, machine translation, reading comprehension, and summarization, are typically approached with supervised learning on taskspecific datasets.',
            'venue': 'OpenAI',
            'year': 2019,
            'authors': ['Alec Radford', 'Jeffrey Wu', 'Rewon Child']
        },
        {
            'title': 'T5: Text-to-Text Transfer Transformer',
            'abstract': 'Transfer learning, where a model is first pre-trained on a data-rich task before being fine-tuned on a downstream task, has emerged as a powerful technique in natural language processing (NLP).',
            'venue': 'JMLR',
            'year': 2019,
            'authors': ['Colin Raffel', 'Noam Shazeer', 'Adam Roberts']
        },
        {
            'title': 'PaLM: Scaling Language Modeling with Pathways',
            'abstract': 'Large language models have been shown to achieve remarkable performance across a variety of natural language tasks using few-shot learning, which drastically reduces the number of task-specific training examples needed to adapt the model to a particular application.',
            'venue': 'arXiv',
            'year': 2022,
            'authors': ['Aakanksha Chowdhery', 'Sharan Narang', 'Jacob Devlin']
        }
    ]
    
    # Insert papers and authors
    for paper_data in sample_papers:
        # Insert paper
        cursor = conn.execute(
            'INSERT INTO papers (title, abstract, venue, year) VALUES (?, ?, ?, ?)',
            (paper_data['title'], paper_data['abstract'], paper_data['venue'], paper_data['year'])
        )
        paper_id = cursor.lastrowid
        
        # Insert authors and paper-author relationships
        for i, author_name in enumerate(paper_data['authors']):
            # Insert author if not exists
            author_cursor = conn.execute(
                'INSERT OR IGNORE INTO authors (name) VALUES (?)',
                (author_name,)
            )
            
            # Get author ID
            author = conn.execute('SELECT id FROM authors WHERE name = ?', (author_name,)).fetchone()
            author_id = author['id']
            
            # Insert paper-author relationship
            conn.execute(
                'INSERT INTO paper_authors (paper_id, author_id, is_first_author) VALUES (?, ?, ?)',
                (paper_id, author_id, i == 0)
            )
    
    # Insert some sample citations
    citations = [
        (2, 1),  # BERT cites Attention Is All You Need
        (3, 1),  # GPT-3 cites Attention Is All You Need
        (5, 2),  # RoBERTa cites BERT
        (6, 2),  # DistilBERT cites BERT
        (7, 2),  # ALBERT cites BERT
        (8, 1),  # GPT-2 cites Attention Is All You Need
        (9, 1),  # T5 cites Attention Is All You Need
        (10, 1), # PaLM cites Attention Is All You Need
    ]
    
    for citing_id, cited_id in citations:
        conn.execute(
            'INSERT INTO citations (citing_paper_id, cited_paper_id) VALUES (?, ?)',
            (citing_id, cited_id)
        )
    
    conn.commit()
    conn.close()
    print("Database initialized with sample data")

# API Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/search/autocomplete')
def autocomplete():
    query = request.args.get('q', '').strip()
    if len(query) < 2:
        return jsonify([])
    
    conn = get_db_connection()
    
    # Search papers
    papers = conn.execute(
        'SELECT id, title, year FROM papers WHERE title LIKE ? LIMIT 5',
        (f'%{query}%',)
    ).fetchall()
    paper_results = [{'type': 'paper', 'id': p['id'], 'title': p['title'], 'year': p['year']} for p in papers]
    
    # Search authors
    authors = conn.execute(
        'SELECT id, name FROM authors WHERE name LIKE ? LIMIT 5',
        (f'%{query}%',)
    ).fetchall()
    author_results = [{'type': 'author', 'id': a['id'], 'name': a['name']} for a in authors]
    
    conn.close()
    return jsonify(paper_results + author_results)

@app.route('/api/search/paper')
def search_paper():
    paper_id = request.args.get('id')
    if not paper_id:
        return jsonify({'error': 'Paper ID required'}), 400
    
    conn = get_db_connection()
    
    # Get paper
    paper = conn.execute('SELECT * FROM papers WHERE id = ?', (paper_id,)).fetchone()
    if not paper:
        conn.close()
        return jsonify({'error': 'Paper not found'}), 404
    
    # Get authors
    authors = conn.execute('''
        SELECT a.id, a.name FROM authors a
        JOIN paper_authors pa ON a.id = pa.author_id
        WHERE pa.paper_id = ?
    ''', (paper_id,)).fetchall()
    
    # Get co-citations (papers that cite the same papers as this one)
    cocitations = conn.execute('''
        SELECT DISTINCT p.id, p.title, p.year, p.venue FROM papers p
        JOIN citations c1 ON p.id = c1.citing_paper_id
        WHERE c1.cited_paper_id IN (
            SELECT cited_paper_id FROM citations WHERE citing_paper_id = ?
        ) AND p.id != ?
        LIMIT 20
    ''', (paper_id, paper_id)).fetchall()
    
    # Get co-authorship connections (papers by same authors)
    coauthorships = conn.execute('''
        SELECT DISTINCT p.id, p.title, p.year, p.venue FROM papers p
        JOIN paper_authors pa ON p.id = pa.paper_id
        WHERE pa.author_id IN (
            SELECT author_id FROM paper_authors WHERE paper_id = ?
        ) AND p.id != ?
        LIMIT 20
    ''', (paper_id, paper_id)).fetchall()
    
    conn.close()
    
    return jsonify({
        'paper': {
            'id': paper['id'],
            'title': paper['title'],
            'abstract': paper['abstract'],
            'venue': paper['venue'],
            'year': paper['year'],
            'citation_count': paper['citation_count'],
            'authors': [{'id': a['id'], 'name': a['name']} for a in authors]
        },
        'cocitations': [{'id': p['id'], 'title': p['title'], 'year': p['year'], 'venue': p['venue']} for p in cocitations],
        'coauthorships': [{'id': p['id'], 'title': p['title'], 'year': p['year'], 'venue': p['venue']} for p in coauthorships]
    })

@app.route('/api/graph/paper/<int:paper_id>')
def get_paper_graph(paper_id):
    conn = get_db_connection()
    
    # Get paper
    paper = conn.execute('SELECT * FROM papers WHERE id = ?', (paper_id,)).fetchone()
    if not paper:
        conn.close()
        return jsonify({'error': 'Paper not found'}), 404
    
    # Get all related papers through co-citation and co-authorship
    related_papers = set()
    
    # Co-citations
    cocitations = conn.execute('''
        SELECT DISTINCT p.id, p.title, p.year, p.venue FROM papers p
        JOIN citations c1 ON p.id = c1.citing_paper_id
        WHERE c1.cited_paper_id IN (
            SELECT cited_paper_id FROM citations WHERE citing_paper_id = ?
        ) AND p.id != ?
    ''', (paper_id, paper_id)).fetchall()
    
    # Co-authorships
    coauthorships = conn.execute('''
        SELECT DISTINCT p.id, p.title, p.year, p.venue FROM papers p
        JOIN paper_authors pa ON p.id = pa.paper_id
        WHERE pa.author_id IN (
            SELECT author_id FROM paper_authors WHERE paper_id = ?
        ) AND p.id != ?
    ''', (paper_id, paper_id)).fetchall()
    
    conn.close()
    
    # Create nodes and edges
    nodes = []
    edges = []
    
    # Add central paper
    nodes.append({
        'id': paper['id'],
        'title': paper['title'],
        'year': paper['year'],
        'venue': paper['venue'],
        'type': 'central'
    })
    
    # Add related papers
    for p in cocitations:
        nodes.append({
            'id': p['id'],
            'title': p['title'],
            'year': p['year'],
            'venue': p['venue'],
            'type': 'related'
        })
        
        edges.append({
            'source': paper['id'],
            'target': p['id'],
            'type': 'cocitation'
        })
    
    for p in coauthorships:
        # Check if node already exists
        existing_node = next((n for n in nodes if n['id'] == p['id']), None)
        if not existing_node:
            nodes.append({
                'id': p['id'],
                'title': p['title'],
                'year': p['year'],
                'venue': p['venue'],
                'type': 'related'
            })
        
        # Check if edge already exists
        existing_edge = next((e for e in edges if e['source'] == paper['id'] and e['target'] == p['id']), None)
        if existing_edge:
            existing_edge['type'] = 'both'
        else:
            edges.append({
                'source': paper['id'],
                'target': p['id'],
                'type': 'coauthorship'
            })
    
    return jsonify({
        'nodes': nodes,
        'edges': edges,
        'central_paper': {
            'id': paper['id'],
            'title': paper['title'],
            'abstract': paper['abstract'],
            'venue': paper['venue'],
            'year': paper['year']
        }
    })

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)