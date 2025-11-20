export interface PaperDict {
    paper_id: string;
    title: string;
    summary: string;
    published: string;
    authors: string[];
    link: string;
    source?: string;
    similarity?: number;
}
export declare class Paper {
    paper_id: string;
    title: string;
    summary: string;
    published: string;
    authors: string[];
    link: string;
    source?: string;
    similarity?: number;
    constructor(paperId: string, title: string, summary: string, published: string, authors: string[], link: string, source?: string, similarity?: number);
    toDict(): PaperDict;
    static fromDict(data: PaperDict): Paper;
}
//# sourceMappingURL=paper.d.ts.map