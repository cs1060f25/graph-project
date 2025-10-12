const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

// Allow requests from localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

app.use(express.json());

// Get all papers
app.get('/api/papers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM papers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get folders
app.get('/api/folders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM folders ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add folder
app.post('/api/folders', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query('INSERT INTO folders (name) VALUES ($1) RETURNING *', [name]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Move paper to folder
app.put('/api/papers/:id/folder', async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_id } = req.body;
    const result = await pool.query(
      'UPDATE papers SET folder_id=$1 WHERE id=$2 RETURNING *',
      [folder_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete paper
app.delete('/api/papers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM papers WHERE id=$1', [id]);
    res.json({ message: 'Paper deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
