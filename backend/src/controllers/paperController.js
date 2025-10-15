const db = require('../config/database');

const paperController = {
  // Get all saved papers
  getSavedPapers: async (req, res) => {
    try {
      const { category, author, keyword } = req.query;
      
      let query = 'SELECT * FROM papers WHERE is_saved = true';
      const params = [];
      let paramCount = 1;
      
      if (category) {
        query += ` AND category ILIKE $${paramCount}`;
        params.push(`%${category}%`);
        paramCount++;
      }
      
      if (author) {
        query += ` AND EXISTS (SELECT 1 FROM unnest(authors) AS author WHERE author ILIKE $${paramCount})`;
        params.push(`%${author}%`);
        paramCount++;
      }
      
      if (keyword) {
        query += ` AND (title ILIKE $${paramCount} OR abstract ILIKE $${paramCount})`;
        params.push(`%${keyword}%`);
        paramCount++;
      }
      
      query += ' ORDER BY published_date DESC';
      
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching saved papers:', error);
      res.status(500).json({ error: 'Failed to fetch saved papers' });
    }
  },

  // Get paper by ID
  getPaperById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM papers WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Paper not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching paper:', error);
      res.status(500).json({ error: 'Failed to fetch paper' });
    }
  },

  // Get related papers
  getRelatedPapers: async (req, res) => {
    try {
      const { paperId } = req.params;
      const { category, author, keyword, limit = 10 } = req.query;
      
      // First, get the current paper's details
      const currentPaper = await db.query('SELECT * FROM papers WHERE id = $1', [paperId]);
      
      if (currentPaper.rows.length === 0) {
        return res.status(404).json({ error: 'Paper not found' });
      }
      
      const paper = currentPaper.rows[0];
      
      // Build query for related papers
      let query = `
        SELECT DISTINCT p.*, 
               CASE 
                 WHEN p.category = $2 THEN 3
                 WHEN p.category ILIKE '%' || $2 || '%' THEN 2
                 ELSE 1
               END as relevance_score
        FROM papers p
        WHERE p.id != $1 AND p.is_saved = false
      `;
      
      const params = [paperId, paper.category];
      let paramCount = 3;
      
      if (category) {
        query += ` AND p.category ILIKE $${paramCount}`;
        params.push(`%${category}%`);
        paramCount++;
      }
      
      if (author) {
        query += ` AND EXISTS (SELECT 1 FROM unnest(p.authors) AS author WHERE author ILIKE $${paramCount})`;
        params.push(`%${author}%`);
        paramCount++;
      }
      
      if (keyword) {
        query += ` AND (p.title ILIKE $${paramCount} OR p.abstract ILIKE $${paramCount})`;
        params.push(`%${keyword}%`);
        paramCount++;
      }
      
      query += ` ORDER BY relevance_score DESC, p.published_date DESC LIMIT $${paramCount}`;
      params.push(limit);
      
      const result = await db.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching related papers:', error);
      res.status(500).json({ error: 'Failed to fetch related papers' });
    }
  },

  // Find similar papers
  findSimilarPapers: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the current paper
      const currentPaper = await db.query('SELECT * FROM papers WHERE id = $1', [id]);
      
      if (currentPaper.rows.length === 0) {
        return res.status(404).json({ error: 'Paper not found' });
      }
      
      const paper = currentPaper.rows[0];
      
      // Find papers in the same category
      const query = `
        SELECT *, 
               CASE 
                 WHEN category = $2 THEN 1.0
                 WHEN category ILIKE '%' || $2 || '%' THEN 0.7
                 ELSE 0.3
               END as similarity_score
        FROM papers
        WHERE id != $1 
        ORDER BY similarity_score DESC, published_date DESC
        LIMIT 20
      `;
      
      const result = await db.query(query, [id, paper.category]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error finding similar papers:', error);
      res.status(500).json({ error: 'Failed to find similar papers' });
    }
  }
};

module.exports = paperController;