// graph-project/server/index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import papersRoutes from './routes/papers.js';
import { verifyFirebaseToken } from './middleware/auth.js';

// Ensure server/.env overrides any existing PORT env to avoid conflicts with CRA
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5002;

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
        papers: '/api/papers'
      }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (no authentication required for bootstrap)
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/user', verifyFirebaseToken, userRoutes);
app.use('/api/papers', papersRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;