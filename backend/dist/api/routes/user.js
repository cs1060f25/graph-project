import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { getSavedPapers, createSavedPaper, updateSavedPaper, deleteSavedPaper, getFolders, createFolder, updateFolder, deleteFolder, getUser, getQueryHistory, addQueryHistory, clearQueryHistory, } from '../../services/db_service.js';
const router = express.Router();
// Apply auth middleware to all routes
router.use(verifyFirebaseToken);
// ========== PAPERS ROUTES ==========
// GET /api/user/papers - Get all saved papers
router.get('/papers', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const papers = await getSavedPapers(req.uid);
        res.json(papers);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch papers',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /api/user/papers - Add a saved paper
router.post('/papers', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const paper = await createSavedPaper(req.uid, req.body);
        res.status(201).json(paper);
    }
    catch (error) {
        res.status(400).json({
            error: 'Failed to create paper',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// PATCH /api/user/papers/:paperId - Update a saved paper
router.patch('/papers/:paperId', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { paperId } = req.params;
        const paper = await updateSavedPaper(req.uid, paperId, req.body);
        res.json(paper);
    }
    catch (error) {
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 400;
        res.status(status).json({
            error: 'Failed to update paper',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// DELETE /api/user/papers/:paperId - Delete a saved paper
router.delete('/papers/:paperId', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { paperId } = req.params;
        await deleteSavedPaper(req.uid, paperId);
        res.status(204).send();
    }
    catch (error) {
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            error: 'Failed to delete paper',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ========== FOLDERS ROUTES ==========
// GET /api/user/folders - Get all folders
router.get('/folders', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const folders = await getFolders(req.uid);
        res.json(folders);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch folders',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /api/user/folders - Create a new folder
router.post('/folders', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }
        const folder = await createFolder(req.uid, name);
        res.status(201).json(folder);
    }
    catch (error) {
        res.status(400).json({
            error: 'Failed to create folder',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// PATCH /api/user/folders/:folderId - Update folder name
router.patch('/folders/:folderId', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { folderId } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }
        const folder = await updateFolder(req.uid, folderId, name);
        res.json(folder);
    }
    catch (error) {
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 400;
        res.status(status).json({
            error: 'Failed to update folder',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// DELETE /api/user/folders/:folderId - Delete a folder
router.delete('/folders/:folderId', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { folderId } = req.params;
        await deleteFolder(req.uid, folderId);
        res.status(204).send();
    }
    catch (error) {
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            error: 'Failed to delete folder',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ========== USER DATA ROUTE ==========
// GET /api/user/data - Get user data
router.get('/data', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await getUser(req.uid);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch user data',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// ========== QUERY HISTORY ROUTES ==========
// GET /api/user/history - Get query history
router.get('/history', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const limit = parseInt(req.query.limit) || 20;
        const history = await getQueryHistory(req.uid, limit);
        res.json(history);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to fetch query history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /api/user/history - Add query to history
router.post('/history', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const historyItem = await addQueryHistory(req.uid, req.body);
        res.status(201).json(historyItem);
    }
    catch (error) {
        res.status(400).json({
            error: 'Failed to add query history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// DELETE /api/user/history - Clear query history
router.delete('/history', async (req, res) => {
    try {
        if (!req.uid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const deletedCount = await clearQueryHistory(req.uid);
        res.json({ deletedCount });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to clear query history',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=user.js.map