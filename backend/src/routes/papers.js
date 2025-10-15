const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');

// Get all saved papers
router.get('/saved', paperController.getSavedPapers);

// Get single paper by ID
router.get('/:id', paperController.getPaperById);

// Get related papers
router.get('/related/:paperId', paperController.getRelatedPapers);

// Find similar papers
router.post('/:id/similar', paperController.findSimilarPapers);

module.exports = router;