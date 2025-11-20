import { apiClient } from './client';

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  link: string;
  summary?: string;
  published?: string;
  year?: number;
  citations?: number;
  source?: string;
  similarity?: number;
}

export type QueryType = 'keyword' | 'topic';

export async function queryPapers(
  query: string,
  type: QueryType = 'keyword',
  token?: string
): Promise<Paper[]> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await apiClient('/api/query', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  
  return Array.isArray(response) ? response : [];
}

