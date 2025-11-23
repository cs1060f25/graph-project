import { verifyFirebaseToken } from '../auth/verifyToken';
import { getSavedPapers, addSavedPaper, updateSavedPaper, deleteSavedPaper } from '../services/db';
import { Paper, PaperInput, ApiResponse } from '../models/types';

export async function getPapers(token: string): Promise<ApiResponse<Paper[]>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await getSavedPapers(decodedToken.uid);
}

export async function addPaper(token: string, paperData: PaperInput): Promise<ApiResponse<Paper>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await addSavedPaper(decodedToken.uid, paperData);
}

export async function updatePaper(token: string, paperId: string, updateData: Partial<Paper>): Promise<ApiResponse<Paper>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await updateSavedPaper(decodedToken.uid, paperId, updateData);
}

export async function removePaper(token: string, paperId: string): Promise<ApiResponse<void>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await deleteSavedPaper(decodedToken.uid, paperId);
}

