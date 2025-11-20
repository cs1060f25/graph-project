import express from 'express';
import { agentService } from '../../services/agent_service.js';
const router = express.Router();
router.post('/', async (req, res) => {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required and must be a string' });
    }
    try {
        const results = await agentService.query(query);
        return res.json(results);
    }
    catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
});
export default router;
//# sourceMappingURL=query.js.map