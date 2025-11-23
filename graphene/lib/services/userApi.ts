import { apiClient } from '../api';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  link: string;
  abstract?: string;
  publishedDate?: string;
  starred?: boolean;
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  createdAt?: string;
}

export interface QueryHistory {
  id: string;
  query: string;
  type: 'keyword' | 'topic';
  resultCount: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

let getToken: (() => string | null) | null = null;

export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken ? getToken() : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function getSavedPapers(): Promise<Paper[]> {
  const response = await apiClient('/user/papers', { headers: getAuthHeaders() });
  return response?.data || [];
}

export async function savePaper(paperData: Omit<Paper, 'id'>): Promise<ApiResponse<Paper>> {
  return await apiClient('/user/papers', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(paperData),
  });
}

export async function updatePaper(paperId: string, updates: Partial<Paper>): Promise<ApiResponse<Paper>> {
  return await apiClient(`/user/papers/${paperId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deletePaper(paperId: string): Promise<ApiResponse<void>> {
  return await apiClient(`/user/papers/${paperId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function getFolders(): Promise<Folder[]> {
  const response = await apiClient('/user/folders', { headers: getAuthHeaders() });
  return response?.data || [];
}

export async function createFolder(folderName: string): Promise<ApiResponse<Folder>> {
  return await apiClient('/user/folders', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: folderName }),
  });
}

export async function updateFolder(folderId: string, newName: string): Promise<ApiResponse<Folder>> {
  return await apiClient(`/user/folders/${folderId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name: newName }),
  });
}

export async function deleteFolder(folderId: string): Promise<ApiResponse<void>> {
  return await apiClient(`/user/folders/${folderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export async function getQueryHistory(limit: number = 20): Promise<QueryHistory[]> {
  const response = await apiClient(`/user/history?limit=${limit}`, { headers: getAuthHeaders() });
  return response?.data || [];
}

export async function addQueryHistory(queryData: Omit<QueryHistory, 'id' | 'timestamp'>): Promise<QueryHistory> {
  const response = await apiClient('/user/history', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(queryData),
  });
  return response.data;
}

export async function clearQueryHistory(): Promise<void> {
  await apiClient('/user/history', {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}

export const userApi = {
  getSavedPapers,
  savePaper,
  updatePaper,
  deletePaper,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getQueryHistory,
  addQueryHistory,
  clearQueryHistory,
};

export default userApi;
