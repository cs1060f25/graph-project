import { verifyFirebaseToken } from '../auth/verifyToken';
import { getQueryHistory, addQueryHistory, clearQueryHistory } from '../services/db';
import { QueryHistory, QueryHistoryInput, ApiResponse } from '../models/types';

export async function getHistory(token: string, limit: number = 20): Promise<ApiResponse<QueryHistory[]>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await getQueryHistory(decodedToken.uid, limit);
}

export async function addHistory(token: string, queryData: QueryHistoryInput): Promise<ApiResponse<QueryHistory>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await addQueryHistory(decodedToken.uid, queryData);
}

export async function clearHistory(token: string): Promise<ApiResponse<void>> {
  const decodedToken = await verifyFirebaseToken(token);
  return await clearQueryHistory(decodedToken.uid);
}

