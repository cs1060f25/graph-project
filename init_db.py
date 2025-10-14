#!/usr/bin/env python3
"""
Database initialization script for Research Graph Explorer
This script creates the database and populates it with sample data from sample_data.sql
"""

import sqlite3
import os

def init_database():
    """Initialize the database from sample_data.sql"""
    
    # Remove existing database if it exists
    if os.path.exists('research_papers.db'):
        os.remove('research_papers.db')
        print("Removed existing database")
    
    # Create new database
    conn = sqlite3.connect('research_papers.db')
    cursor = conn.cursor()
    
    # Read and execute SQL file
    with open('sample_data.sql', 'r') as f:
        sql_script = f.read()
    
    # Split script into individual statements and execute
    statements = sql_script.split(';')
    for statement in statements:
        statement = statement.strip()
        if statement and not statement.startswith('--'):
            try:
                cursor.execute(statement)
            except sqlite3.Error as e:
                print(f"Error executing statement: {e}")
                print(f"Statement: {statement[:100]}...")
    
    conn.commit()
    conn.close()
    
    print("Database initialized successfully!")
    print("Sample data loaded from sample_data.sql")

if __name__ == '__main__':
    init_database()
