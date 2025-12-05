// server/services/aiSummaryService.js
// Service for generating AI summaries using Google Generative AI

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.REACT_APP_GOOGLE_GENAI_API_KEY;

/**
 * Generates an AI summary for a research paper
 * @param {Object} paperData - Paper data
 * @param {string} paperData.title - Paper title
 * @param {Array<string>} paperData.authors - List of authors
 * @param {string} [paperData.summary] - Paper abstract/summary
 * @param {string} [paperData.abstract] - Paper abstract (alternative field name)
 * @param {number} [paperData.year] - Publication year
 * @param {number} [paperData.citations] - Citation count
 * @returns {Promise<{success: boolean, summary: string|null, error: string|null}>}
 */
export async function generatePaperSummary(paperData) {
  if (!API_KEY) {
    return {
      success: false,
      summary: null,
      error: 'Google Generative AI API key not configured'
    };
  }

  if (!paperData || !paperData.title) {
    return {
      success: false,
      summary: null,
      error: 'Paper data is required'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build prompt from available paper data
    const abstract = paperData.summary || paperData.abstract || '';
    const authors = Array.isArray(paperData.authors) 
      ? paperData.authors.join(', ') 
      : (paperData.authors || 'Unknown authors');
    const year = paperData.year || '';
    const citations = paperData.citations ? ` (${paperData.citations} citations)` : '';

    const prompt = `Please provide a concise, informative summary of the following research paper. Focus on key contributions, methodology, and findings. Keep the summary to 2-3 sentences.

Title: ${paperData.title}
Authors: ${authors}${year ? `\nYear: ${year}` : ''}${citations ? `\nCitations: ${citations}` : ''}
${abstract ? `\nAbstract:\n${abstract}` : ''}

Summary:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    if (!summary || summary.length === 0) {
      return {
        success: false,
        summary: null,
        error: 'Generated summary is empty'
      };
    }

    return {
      success: true,
      summary,
      error: null
    };
  } catch (error) {
    console.error('Error generating paper summary:', error);
    return {
      success: false,
      summary: null,
      error: error.message || 'Failed to generate summary'
    };
  }
}
