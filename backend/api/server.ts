import express, { Request, Response, NextFunction } from 'express';
import queryRouter from './routes/query.js';
import userRouter from './routes/user.js';
import dbRouter from './routes/db.js';
import authRouter from './routes/auth.js';

const app = express();

// Middleware
app.use(express.json());

// CORS middleware (basic - adjust as needed)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Root route
app.get('/', (req: Request, res: Response) => {
  return res.json({
    message: 'Graph Project API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      query: '/api/query',
      user: '/api/user',
      db: '/api/db'
    }
  });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/query', queryRouter);
app.use('/api/user', userRouter);
app.use('/api/db', dbRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;

