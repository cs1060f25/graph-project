const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for your React app
app.use(cors({
  origin: 'http://localhost:3000'
}));

// Root route (so you don't get "Cannot GET /")
app.get('/', (req, res) => {
  res.send('arXiv Proxy Server is running');
});

// Proxy endpoint for arXiv API
app.get('/api/arxiv', async (req, res) => {
  try {
    const { search_query, start = 0, max_results = 15 } = req.query;
    
    if (!search_query) {
      return res.status(400).json({ error: 'search_query is required' });
    }

    const arxivUrl = `https://export.arxiv.org/api/query?search_query=${search_query}&start=${start}&max_results=${max_results}&sortBy=submittedDate&sortOrder=descending`;
    
    console.log('Fetching from arXiv:', arxivUrl);
    
    const response = await fetch(arxivUrl);
    const text = await response.text();
    
    res.set('Content-Type', 'application/xml');
    res.send(text);
  } catch (error) {
    console.error('Error fetching from arXiv:', error);
    res.status(500).json({ error: 'Failed to fetch from arXiv' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});