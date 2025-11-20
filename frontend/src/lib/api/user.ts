import { apiClient } from './client';

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
  createdAt?: number;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  type: string;
  resultCount: number;
  timestamp: number;
  createdAt?: string;
}

export async function getSavedPapers(token: string): Promise<Paper[]> {
  const response = await apiClient('/api/user/papers', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(response) ? response : [];
}

export async function savePaper(token: string, paperData: Omit<Paper, 'id'>): Promise<Paper> {
  return apiClient('/api/user/papers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(paperData),
  });
}

export async function updatePaper(
  token: string,
  paperId: string,
  updates: Partial<Paper>
): Promise<Paper> {
  return apiClient(`/api/user/papers/${paperId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(updates),
  });
}

export async function deletePaper(token: string, paperId: string): Promise<void> {
  await apiClient(`/api/user/papers/${paperId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getFolders(token: string): Promise<Folder[]> {
  const response = await apiClient('/api/user/folders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(response) ? response : [];
}

export async function createFolder(token: string, name: string): Promise<Folder> {
  return apiClient('/api/user/folders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
}

export async function updateFolder(
  token: string,
  folderId: string,
  name: string
): Promise<Folder> {
  return apiClient(`/api/user/folders/${folderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });
}

export async function deleteFolder(token: string, folderId: string): Promise<void> {
  await apiClient(`/api/user/folders/${folderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getQueryHistory(token: string, limit: number = 20): Promise<QueryHistoryItem[]> {
  const response = await apiClient(`/api/user/history?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(response) ? response : [];
}

export async function addQueryHistory(
  token: string,
  queryData: { query: string; type: string; resultCount: number }
): Promise<QueryHistoryItem> {
  return apiClient('/api/user/history', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(queryData),
  });
}

export async function clearQueryHistory(token: string): Promise<void> {
  await apiClient('/api/user/history', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

