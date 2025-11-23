import { verifyFirebaseToken } from '../auth/verifyToken';
import { getPaperSummary, savePaperSummary } from '../services/db';
import GeminiService from '../services/gemini';
import { Paper, ApiResponse } from '../models/types';

export async function getOrGenerateSummary(token: string, paperId: string, paper: Paper): Promise<ApiResponse<string>> {
  try {
    const decodedToken = await verifyFirebaseToken(token);
    const uid = decodedToken.uid;

    // Check database first
    const existingSummary = await getPaperSummary(uid, paperId);
    if (existingSummary.success && existingSummary.data) {
      return createResponse(true, existingSummary.data, null);
    }

    // Generate new summary
    const geminiService = new GeminiService();
    const summary = await geminiService.generateSummary(paper);

    // Save to database
    const saveResult = await savePaperSummary(uid, paperId, summary);
    if (!saveResult.success) {
      console.warn(`Failed to save summary for paper ${paperId}:`, saveResult.error);
    }

    return createResponse(true, summary, null);
  } catch (error: any) {
    return createResponse(false, '', error.message || 'Failed to get or generate summary');
  }
}

export async function regenerateSummary(token: string, paperId: string, paper: Paper): Promise<ApiResponse<string>> {
  try {
    const decodedToken = await verifyFirebaseToken(token);
    const uid = decodedToken.uid;

    // Generate new summary (force regenerate)
    const geminiService = new GeminiService();
    const summary = await geminiService.generateSummary(paper);

    // Save to database
    const saveResult = await savePaperSummary(uid, paperId, summary);
    if (!saveResult.success) {
      console.warn(`Failed to save regenerated summary for paper ${paperId}:`, saveResult.error);
    }

    return createResponse(true, summary, null);
  } catch (error: any) {
    return createResponse(false, '', error.message || 'Failed to regenerate summary');
  }
}

function createResponse<T>(success: boolean, data: T | null = null, error: string | null = null): ApiResponse<T> {
  return { success, data: data || undefined, error: error || undefined };
}

