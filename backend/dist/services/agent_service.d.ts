import { Paper } from '../models/paper.js';
export declare class AgentService {
    private genAI;
    private system_prompt;
    constructor(apis?: string[]);
    generateContentFromVertexAI(query: string): Promise<string>;
    private getEmbedding;
    calculateSemanticSimilarity(a: string, b: string): Promise<number>;
    rerankResults(query: string, results: Paper[]): Promise<Paper[]>;
    query(query: string): Promise<Paper[]>;
}
export declare const agentService: AgentService;
//# sourceMappingURL=agent_service.d.ts.map