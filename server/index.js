// graph-project/server/index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import { verifyFirebaseToken } from './middleware/auth.js';

// Ensure server/.env overrides any existing PORT env to avoid conflicts with CRA
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Graphene API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      user: '/api/user',
      arxiv: '/api/arxiv'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add ArXiv proxy endpoint
app.get('/api/arxiv', async (req, res) => {
  try {
    // Get query parameters
    const query = req.query.query;
    const type = req.query.type || 'keyword';
    const maxResults = req.query.maxResults || 10;
    
    // Build ArXiv query
    let searchQuery;
    if (type === 'topic') {
      searchQuery = `cat:${query}`;
    } else {
      searchQuery = `all:${query}`;
    }
    
    console.log(`Proxying ArXiv request: ${searchQuery}`);
    
    // Make request to ArXiv API
    const response = await axios.get('https://export.arxiv.org/api/query', {
      params: {
        search_query: searchQuery,
        start: 0,
        max_results: maxResults
      },
      headers: {
        'User-Agent': 'Graphene/1.0 (educational project)'
      }
    });
    
    // Return the XML data
    res.set('Content-Type', 'application/xml');
    res.send(response.data);
  } catch (error) {
    console.error('Error proxying ArXiv request:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch from ArXiv API',
      details: error.message
    });
  }
});

// Auth routes (no authentication required for bootstrap)
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/user', verifyFirebaseToken, userRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;