const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/research_discovery'
});

// Get all papers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM papers ORDER BY citations DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get papers by topic
router.get('/topic/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const result = await pool.query(
      'SELECT * FROM papers WHERE topic = $1 ORDER BY citations DESC',
      [topic]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get specific paper
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM papers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get recommendations (papers from different topics)
router.get('/recommendations/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const result = await pool.query(
      'SELECT * FROM papers WHERE topic != $1 ORDER BY citations DESC LIMIT 3',
      [topic]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add new paper
router.post('/', async (req, res) => {
  try {
    const { title, authors, year, arxiv_id, topic, citations, summary } = req.body;
    const result = await pool.query(
      `INSERT INTO papers (title, authors, year, arxiv_id, topic, citations, summary) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, authors, year, arxiv_id, topic, citations, summary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;