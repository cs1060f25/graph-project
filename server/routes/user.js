// server/routes/user.js
import express from 'express';
import { 
  getUserFolders, 
  addUserFolder,
  deleteUserFolder,
  addSavedPaper, 
  getSavedPapers,
  updateSavedPaper,
  deleteSavedPaper,
  getUserData,
  addQueryHistory,
  getQueryHistory,
  clearQueryHistory
} from '../user-db-interface/index.js';

const router = express.Router();

// Middleware to extract uid from authenticated request
// (assumes you have auth middleware that adds user to req)
const extractUid = (req, res, next) => {
  // Get uid from Firebase Auth token (you'll need auth middleware)
  const uid = req.user?.uid; // Assuming auth middleware adds user to req
  if (!uid) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  req.uid = uid;
  next();
};

// Apply auth middleware to all routes
router.use(extractUid);

// ========== PAPERS ROUTES ==========

// GET /api/user/papers - Get all saved papers
router.get('/papers', async (req, res) => {
  try {
    const result = await getSavedPapers(req.uid);
    console.log('result', result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/papers - Add a saved paper
router.post('/papers', async (req, res) => {
  try {
    console.log('req.body', req.body);
    const paperData = req.body; // { title, authors, link, ... }
    const result = await addSavedPaper(req.uid, paperData);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/user/papers/:paperId - Update a saved paper
router.patch('/papers/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;
    const updateData = req.body; // { starred, folderId, title, etc. }
    const result = await updateSavedPaper(req.uid, paperId, updateData);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/user/papers/:paperId - Delete a saved paper
router.delete('/papers/:paperId', async (req, res) => {
  try {
    const { paperId } = req.params;
    const result = await deleteSavedPaper(req.uid, paperId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== FOLDERS ROUTES ==========

// GET /api/user/folders - Get all folders
router.get('/folders', async (req, res) => {
  try {
    const result = await getUserFolders(req.uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/folders - Create a new folder
router.post('/folders', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await addUserFolder(req.uid, name);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/user/folders/:folderId - Delete a folder
router.delete('/folders/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    const result = await deleteUserFolder(req.uid, folderId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== USER DATA ROUTE ==========

// GET /api/user/data - Get user data
router.get('/data', async (req, res) => {
  try {
    const result = await getUserData(req.uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== QUERY HISTORY ROUTES ==========

// GET /api/user/history - Get query history
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const result = await getQueryHistory(req.uid, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/user/history - Add query to history
router.post('/history', async (req, res) => {
  try {
    const queryData = req.body; // { query, type, resultCount }
    const result = await addQueryHistory(req.uid, queryData);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/user/history - Clear query history
router.delete('/history', async (req, res) => {
  try {
    const result = await clearQueryHistory(req.uid);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;