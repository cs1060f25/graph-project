require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const paperRoutes = require('./routes/papers');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/papers', paperRoutes);

// Chat endpoint for AI summarization
app.post('/api/chat/summarize', async (req, res) => {
  const { paperId, question } = req.body;
  
  try {
    const db = require('./config/database');
    const result = await db.query('SELECT * FROM papers WHERE id = $1', [paperId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    
    const paper = result.rows[0];
    
    // Simulate AI response (in production, integrate with actual LLM API)
    let response = '';
    
    if (question && question.toLowerCase().includes('summarize')) {
      response = `This paper titled "${paper.title}" focuses on ${paper.category}. 

Key Points:
- Published: ${new Date(paper.published_date).toLocaleDateString()}
- Authors: ${paper.authors.slice(0, 3).join(', ')}${paper.authors.length > 3 ? ', et al.' : ''}

Abstract Summary: ${paper.abstract.substring(0, 300)}...

The research contributes to the field by exploring innovative approaches and methodologies relevant to ${paper.category}.`;
    } else {
      response = `I can help you understand this paper about "${paper.title}". 

This work in ${paper.category} was published on ${new Date(paper.published_date).toLocaleDateString()} by ${paper.authors[0]} and colleagues.

What would you like to know? I can:
- Summarize the main findings
- Explain key concepts
- Compare with related work
- Discuss practical applications`;
    }
    
    res.json({ 
      response,
      paper: {
        id: paper.id,
        title: paper.title,
        category: paper.category
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});