import express, { Request, Response } from 'express';
import queryRouter from './routes/query.js';
import config from '../config.js';

const app = express();
const PORT = Number(config.PORT) || 8000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  return res.json({ message: "Hello World" });
});

app.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 200 });
});

// API routes
app.use('/api/query', queryRouter);

// Start server if this file is run directly
// Check if this is the main module (when compiled, it will be server.js)
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('server')) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;

