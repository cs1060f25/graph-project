import sqlite3

DATABASE = 'research_graph.db'

def add_feedback_tables():
    """Add feedback/moderation tables to existing database"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create paper_feedback table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS paper_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            paper_id INTEGER NOT NULL,
            vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
            reason TEXT,
            user_session TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
        )
    ''')
    
    # Create citation_feedback table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS citation_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            citation_id INTEGER NOT NULL,
            vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
            reason TEXT,
            user_session TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (citation_id) REFERENCES citations(id) ON DELETE CASCADE
        )
    ''')
    
    # Create index for faster queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_paper_feedback_paper_id ON paper_feedback(paper_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_citation_feedback_citation_id ON citation_feedback(citation_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_paper_feedback_user_session ON paper_feedback(user_session)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_citation_feedback_user_session ON citation_feedback(user_session)')
    
    conn.commit()
    conn.close()
    
    print("Feedback tables created successfully!")

if __name__ == '__main__':
    add_feedback_tables()
