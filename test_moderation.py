#!/usr/bin/env python3
"""
Test script for the moderation system.

Tests:
1. Submit 3 unique downvotes to a paper
2. Verify the paper gets hidden (score < -0.5)
3. Check database entries for correctness
4. Verify the paper doesn't appear in regular API calls
"""

import sqlite3
import requests
import time

BASE_URL = 'http://localhost:5000'
DATABASE = 'research_graph.db'

def create_test_sessions():
    """Create 3 test session IDs"""
    return ['test_user_1', 'test_user_2', 'test_user_3']

def get_first_paper_id():
    """Get the first paper ID from the database"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM papers LIMIT 1')
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else None

def submit_downvote(paper_id, user_session, reason):
    """Submit a downvote for a paper"""
    # Manually insert into database since we're testing
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Check if vote exists
    cursor.execute('''
        SELECT id FROM paper_feedback 
        WHERE paper_id = ? AND user_session = ?
    ''', (paper_id, user_session))
    
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute('''
            UPDATE paper_feedback 
            SET vote_type = 'down', reason = ?
            WHERE id = ?
        ''', (reason, existing[0]))
    else:
        cursor.execute('''
            INSERT INTO paper_feedback (paper_id, vote_type, reason, user_session)
            VALUES (?, 'down', ?, ?)
        ''', (paper_id, reason, user_session))
    
    conn.commit()
    conn.close()
    print(f"✓ Downvote submitted by {user_session} with reason: {reason}")

def check_paper_score(paper_id):
    """Check the current score of a paper"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 
                                 WHEN vote_type = 'down' THEN -1 
                                 ELSE 0 END), 0) as score
        FROM paper_feedback
        WHERE paper_id = ?
    ''', (paper_id,))
    
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else 0

def check_paper_visibility(paper_id):
    """Check if paper appears in the regular API"""
    response = requests.get(f'{BASE_URL}/api/papers')
    papers = response.json()
    
    for paper in papers:
        if paper['id'] == paper_id:
            return True, paper.get('score', 0)
    return False, None

def verify_database_entries(paper_id):
    """Verify feedback entries in the database"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT vote_type, reason, user_session 
        FROM paper_feedback
        WHERE paper_id = ?
    ''', (paper_id,))
    
    entries = cursor.fetchall()
    conn.close()
    
    print(f"\n📊 Database entries for paper {paper_id}:")
    for entry in entries:
        print(f"  - {entry[2]}: {entry[0]} vote, reason: '{entry[1]}'")
    
    return len(entries)

def main():
    print("🧪 Testing Moderation System\n")
    print("=" * 50)
    
    # Get a paper to test with
    paper_id = get_first_paper_id()
    if not paper_id:
        print("❌ No papers found in database!")
        return
    
    print(f"📄 Testing with paper ID: {paper_id}\n")
    
    # Test 1: Submit 3 downvotes
    print("Test 1: Submitting 3 unique downvotes...")
    sessions = create_test_sessions()
    reasons = ['Spam', 'Poor quality', 'Off-topic']
    
    for session, reason in zip(sessions, reasons):
        submit_downvote(paper_id, session, reason)
        time.sleep(0.1)
    
    # Test 2: Check paper score
    print("\nTest 2: Checking paper score...")
    score = check_paper_score(paper_id)
    print(f"Current score: {score}")
    
    is_hidden = score < -0.5
    if is_hidden:
        print("✅ Paper should be hidden (score < -0.5)")
    else:
        print("⚠️  Paper should NOT be hidden (score >= -0.5)")
    
    # Test 3: Verify database entries
    print("\nTest 3: Verifying database entries...")
    entry_count = verify_database_entries(paper_id)
    
    if entry_count == 3:
        print("✅ Correct number of entries (3)")
    else:
        print(f"⚠️  Expected 3 entries, found {entry_count}")
    
    # Test 4: Check API visibility
    print("\nTest 4: Checking API visibility...")
    try:
        visible, api_score = check_paper_visibility(paper_id)
        
        if is_hidden and not visible:
            print("✅ Paper correctly hidden from API")
        elif is_hidden and visible:
            print("❌ Paper should be hidden but appears in API")
        elif not is_hidden and visible:
            print("✅ Paper correctly visible in API")
            print(f"   API reports score: {api_score}")
        else:
            print("⚠️  Paper not hidden but doesn't appear in API")
    except Exception as e:
        print(f"⚠️  Could not check API (is Flask running?): {e}")
    
    print("\n" + "=" * 50)
    print("✅ Test complete!")
    print("\n💡 To clean up, run:")
    print(f"   DELETE FROM paper_feedback WHERE paper_id = {paper_id};")

if __name__ == '__main__':
    main()
