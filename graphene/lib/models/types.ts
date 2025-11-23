export interface Paper {
  id: string;
  title: string;
  authors: string[];
  link: string;
  abstract?: string;
  publishedDate?: string;
  starred?: boolean;
  folderId?: string | null;
  summary?: string;
  published?: string;
  year?: number;
  citations?: number;
  citationCount?: number;
  url?: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt?: number | string;
}

export interface QueryHistory {
  id: string;
  query: string;
  type: 'keyword' | 'topic';
  resultCount: number;
  timestamp: number | string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type PaperInput = Omit<Paper, 'id'>;
export type QueryHistoryInput = Omit<QueryHistory, 'id' | 'timestamp'>;
export type UserInput = Omit<User, 'id'>;
export type FolderInput = Omit<Folder, 'id'>;

