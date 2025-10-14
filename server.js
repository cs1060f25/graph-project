const express = require('express');
const cors = require('cors');
const path = require('path');
const mockData = require('./mockData.json');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'client/build')));

// API Routes
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  // Simple keyword matching for mock data
  const keywords = query.toLowerCase().split(' ');
  const matchingPapers = mockData.papers.filter(paper => {
    const searchText = `${paper.title} ${paper.abstract} ${paper.keywords.join(' ')}`.toLowerCase();
    return keywords.some(keyword => searchText.includes(keyword));
  });

  // Get related papers through citations
  const relatedPapers = [];
  matchingPapers.forEach(paper => {
    // Add papers that cite this paper
    const citingPapers = mockData.papers.filter(p => 
      p.citations && p.citations.includes(paper.id)
    );
    relatedPapers.push(...citingPapers);

    // Add papers that this paper cites
    if (paper.citations) {
      const citedPapers = mockData.papers.filter(p => 
        paper.citations.includes(p.id)
      );
      relatedPapers.push(...citedPapers);
    }
  });

  // Remove duplicates and combine
  const allPapers = [...new Set([...matchingPapers, ...relatedPapers])];
  
  res.json({
    query,
    papers: allPapers,
    total: allPapers.length
  });
});

app.get('/api/papers', (req, res) => {
  res.json(mockData.papers);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
