// server/index.mock.js
// Temporary mock server for development without Firebase credentials
// Use this until you get your Firebase service account key

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const mockPapers = [
  {
    id: 'paper-1',
    title: 'Attention Is All You Need',
    authors: ['Vaswani et al.'],
    link: 'https://arxiv.org/abs/1706.03762',
    abstract: 'We propose a new simple network architecture, the Transformer...',
    starred: true,
    folderId: 'folder-1',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'paper-2',
    title: 'BERT: Pre-training of Deep Bidirectional Transformers',
    authors: ['Devlin et al.'],
    link: 'https://arxiv.org/abs/1810.04805',
    abstract: 'We introduce a new language representation model called BERT...',
    starred: false,
    folderId: 'folder-1',
    createdAt: Date.now() - 172800000,
  },
  {
    id: 'paper-3',
    title: 'Graph Neural Networks: A Review',
    authors: ['Zhou et al.'],
    link: 'https://arxiv.org/abs/1812.08434',
    abstract: 'This paper provides a comprehensive survey on graph neural networks...',
    starred: true,
    folderId: 'folder-2',
    createdAt: Date.now() - 259200000,
  },
];

const mockFolders = [
  { id: 'folder-1', name: 'Machine Learning', createdAt: Date.now() - 604800000 },
  { id: 'folder-2', name: 'Graph Theory', createdAt: Date.now() - 518400000 },
  { id: 'folder-3', name: 'To Read', createdAt: Date.now() - 432000000 },
];

const mockUser = {
  id: 'mock-user-123',
  email: 'dev@example.com',
  name: 'Developer',
  emailVerified: true,
};

// Mock authentication middleware (bypasses Firebase)
const mockAuth = (req, res, next) => {
  req.user = mockUser;
  req.uid = mockUser.id;
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok (MOCK MODE - No Firebase credentials needed)',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'GRAPHENE API (MOCK MODE)',
      mode: 'development-mock',
      message: 'Using mock data - Firebase credentials not required',
    },
    error: null,
  });
});

// User routes with mock auth
app.get('/api/user/me', mockAuth, (req, res) => {
  res.json({ success: true, data: req.user, error: null });
});

app.get('/api/user/papers', mockAuth, (req, res) => {
  res.json({ success: true, data: mockPapers, error: null });
});

app.post('/api/user/papers', mockAuth, (req, res) => {
  const newPaper = {
    id: `paper-${Date.now()}`,
    ...req.body,
    starred: false,
    createdAt: Date.now(),
  };
  mockPapers.push(newPaper);
  res.status(201).json({ success: true, data: newPaper, error: null });
});

app.get('/api/user/folders', mockAuth, (req, res) => {
  res.json({ success: true, data: mockFolders, error: null });
});

app.post('/api/user/folders', mockAuth, (req, res) => {
  const newFolder = {
    id: `folder-${Date.now()}`,
    name: req.body.name,
    createdAt: Date.now(),
  };
  mockFolders.push(newFolder);
  res.status(201).json({ success: true, data: newFolder, error: null });
});

app.get('/api/user/data', mockAuth, (req, res) => {
  res.json({ success: true, data: mockUser, error: null });
});

// Query History endpoints
app.get('/api/user/history', mockAuth, (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const mockHistory = [
    {
      id: 'query-1',
      query: 'machine learning',
      type: 'keyword',
      resultCount: 15,
      timestamp: Date.now() - 3600000, // 1 hour ago
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'query-2', 
      query: 'neural networks',
      type: 'keyword',
      resultCount: 23,
      timestamp: Date.now() - 7200000, // 2 hours ago
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'query-3',
      query: 'deep learning',
      type: 'keyword', 
      resultCount: 18,
      timestamp: Date.now() - 10800000, // 3 hours ago
      createdAt: new Date(Date.now() - 10800000).toISOString()
    }
  ];
  res.json({ success: true, data: mockHistory.slice(0, limit), error: null });
});

app.post('/api/user/history', mockAuth, (req, res) => {
  const newQuery = {
    id: `query-${Date.now()}`,
    ...req.body,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  res.status(201).json({ success: true, data: newQuery, error: null });
});

app.delete('/api/user/history', mockAuth, (req, res) => {
  res.json({ success: true, data: { deletedCount: 0 }, error: null });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    data: null,
    error: `Route ${req.method} ${req.path} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 GRAPHENE Mock Server Running (Development Mode)');
  console.log('='.repeat(60));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`⚠️  MODE: MOCK DATA (Firebase credentials not required)`);
  console.log('='.repeat(60) + '\n');
  console.log('Available endpoints:');
  console.log('  GET  /health              - Health check');
  console.log('  GET  /api                 - API info');
  console.log('  GET  /api/user/me         - Current user (mock)');
  console.log('  GET  /api/user/papers     - Get saved papers (mock)');
  console.log('  POST /api/user/papers     - Save a paper (mock)');
  console.log('  GET  /api/user/folders    - Get folders (mock)');
  console.log('  POST /api/user/folders    - Create folder (mock)');
  console.log('  GET  /api/user/data       - Get user data (mock)');
  console.log('  GET  /api/user/history    - Get query history (mock)');
  console.log('  POST /api/user/history    - Add query to history (mock)');
  console.log('  DELETE /api/user/history - Clear query history (mock)');
  console.log('\n' + '='.repeat(60));
  console.log('💡 TIP: Use this server to develop your frontend!');
  console.log('🔄 Switch to real server once Firebase credentials are ready.');
  console.log('='.repeat(60) + '\n');
});