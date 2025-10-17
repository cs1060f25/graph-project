import sqlite3

DATABASE = 'research_graph.db'

def init_db():
    """Initialize the database with schema"""
    conn = sqlite3.connect(DATABASE)
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
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()
