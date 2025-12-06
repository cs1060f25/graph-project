// server/routes/papers.js
// Paper search and related endpoints

import express from 'express';
import PaperService from '../services/papers/paperService.js';
import GraphService from '../services/graph/graphService.js';
import { generatePaperSummary } from '../services/ai/aiSummaryService.js';
import { getFeelingLuckyQuery } from '../services/ai/feelingLuckyService.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();
const paperService = new PaperService();
const graphService = new GraphService();

/**
 * POST /api/papers/search
 * Search for papers across all APIs
 * Body: { query: string, type?: 'keyword' | 'topic' | 'author', maxResults?: number, forceRefresh?: boolean }
 */
router.post('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const { query, type, maxResults, forceRefresh } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Query is required and must be a non-empty string'
      });
    }

    const results = await paperService.searchPapers(query.trim(), {
      type: type || 'keyword',
      maxResults,
      forceRefresh: forceRefresh || false,
    });

    res.json({
      success: true,
      data: results,
      error: null
    });
  } catch (error) {
    console.error('[Papers Route] Error searching papers:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to search papers'
    });
  }
});

/**
 * POST /api/papers/summary
 * Generate AI summary for a paper
 * Body: { title: string, authors?: Array<string>, summary?: string, abstract?: string, year?: number, citations?: number }
 */
router.post('/summary', verifyFirebaseToken, async (req, res) => {
  try {
    const paperData = req.body;

    if (!paperData || !paperData.title) {
      return res.status(400).json({
        success: false,
        summary: null,
        error: 'Paper data with title is required'
      });
    }

    const result = await generatePaperSummary(paperData);

    if (result.success) {
      res.json({
        success: true,
        summary: result.summary,
        error: null
      });
    } else {
      res.status(500).json({
        success: false,
        summary: null,
        error: result.error || 'Failed to generate summary'
      });
    }
  } catch (error) {
    console.error('[Papers Route] Error generating summary:', error);
    res.status(500).json({
      success: false,
      summary: null,
      error: error.message || 'Failed to generate summary'
    });
  }
});

/**
 * POST /api/papers/layers
 * Expand graph layer with related papers
 * Body: { currentLayerPapers: Array, allExistingPapers: Array, authorName?: string, maxPerPaper?: number }
 */
router.post('/layers', verifyFirebaseToken, async (req, res) => {
  try {
    const { currentLayerPapers, allExistingPapers, authorName, maxPerPaper } = req.body;

    if (!currentLayerPapers || !Array.isArray(currentLayerPapers)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'currentLayerPapers is required and must be an array'
      });
    }

    if (!allExistingPapers || !Array.isArray(allExistingPapers)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'allExistingPapers is required and must be an array'
      });
    }

    const newPapers = await graphService.expandLayer({
      currentLayerPapers,
      allExistingPapers,
      authorName,
      maxPerPaper: maxPerPaper || 3,
    });

    res.json({
      success: true,
      data: newPapers,
      error: null
    });
  } catch (error) {
    console.error('[Papers Route] Error expanding graph layer:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to expand graph layer'
    });
  }
});

/**
 * GET /api/papers/feeling-lucky
 * Generate a random research query using AI
 */
router.get('/feeling-lucky', verifyFirebaseToken, async (req, res) => {
  try {
    const query = await getFeelingLuckyQuery();
    res.json({
      success: true,
      query,
      error: null
    });
  } catch (error) {
    console.error('[Papers Route] Error generating feeling lucky query:', error);
    res.status(500).json({
      success: false,
      query: null,
      error: error.message || 'Failed to generate query'
    });
  }
});

export default router;

