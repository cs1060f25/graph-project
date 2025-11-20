import { Paper } from '../models/paper.js';
export declare function formatQuery(query: string): string;
export declare function searchArxiv(query: string, maxResults?: number, start?: number, mode?: string): Promise<Paper[]>;
export declare function searchArxivByTopic(topic: string, maxResults?: number): Promise<Paper[]>;
export declare function searchArxivByKeyword(keyword: string, maxResults?: number): Promise<Paper[]>;
//# sourceMappingURL=arxiv_service.d.ts.map