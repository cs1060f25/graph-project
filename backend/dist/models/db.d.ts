export interface User {
    id: string;
    email: string;
    createdAt: number;
    preferences: Record<string, any>;
}
export interface Folder {
    id: string;
    name: string;
    createdAt: number;
}
export interface SavedPaper {
    id: string;
    paper_id?: string;
    title: string;
    summary: string;
    published: string;
    authors: string[];
    link: string;
    source?: string;
    similarity?: number;
    starred: boolean;
    folderId: string | null;
    createdAt: number;
    updatedAt: number;
}
export interface QueryHistory {
    id: string;
    query: string;
    type: string;
    resultCount: number;
    timestamp: number;
    createdAt: string;
}
export declare function validateUserId(uid: string): void;
export declare function validateFolderName(name: string): void;
export declare function validatePaperData(paperData: Partial<SavedPaper>): void;
export declare function validateQueryHistoryData(queryData: Partial<QueryHistory>): void;
//# sourceMappingURL=db.d.ts.map