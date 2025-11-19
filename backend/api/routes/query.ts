import express, { Router, Request, Response } from 'express';
import { agentService } from '../../services/agent_service.js';

const router: Router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required and must be a string' });
  }
  
  try {
    const results = await agentService.query(query);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

export default router;

