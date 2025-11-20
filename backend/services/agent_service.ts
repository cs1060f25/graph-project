// import { QueryOrchestrator } from '../agent/query_orchestrator.js';
// import { QuerySubagent } from '../agent/query_subagent.js';
// CURRENT PLACEHOLDER FOR AGENTIC QUERIES; right now, just a one-step LLM invocation + semantic reranking
import { GoogleGenAI, Type } from "@google/genai";

import config from '../config';
import { Paper } from '../models/paper';
import { searchArxiv } from './arxiv_service';
import { searchOpenalex } from './openalex_service';
import { searchCore } from './core_service';

export class AgentService {
  private genAI: GoogleGenAI;
  private system_prompt: string;

  constructor(apis?: string[]) {
    // for each api, set up a subagent with a query tool
    // this.subagents = apis.map(api => {
    //   return new QuerySubagent(api);
    // });

    // CURRENT PLACEHOLDER LLM IMPLEMENTATION
    if (!config.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found in config");
    }

    this.genAI = new GoogleGenAI({
      vertexai: true,
      project: config.GOOGLE_CLOUD_PROJECT,
      location: config.GOOGLE_CLOUD_LOCATION,
      apiKey: config.GEMINI_API_KEY,
    });

    this.system_prompt = `

    `
  }

  async generateContentFromVertexAI(query: string): Promise<string> {
    const response = await this.genAI.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: query,
      config: {
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            arxiv_queries: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  query: { type: Type.STRING },
                  mode: { type: Type.STRING, enum: ['topic', 'keyword'], nullable: true }
                }
              }
            },
            openalex_queries: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  query: { type: Type.STRING },
                  mode: { type: Type.STRING, enum: ['topic', 'keyword'], nullable: true }
                }
              }
            },
            core_queries: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                  query: { type: Type.STRING },
                  mode: { type: Type.STRING, enum: ['topic', 'keyword'], nullable: true }
                }
              }
            }
          }
        },
        systemInstruction: this.system_prompt
      }
    });

    return response.text ?? '';
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Get embedding using Google's text-embedding model via Vertex AI
    try {
      const response = await this.genAI.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });
      
      return response.embeddings?.[0]?.values || [];
    } catch (error) {
      throw new Error(`Failed to get embedding: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async calculateSemanticSimilarity(a: string, b: string): Promise<number> {
    // Calculate semantic similarity using cosine similarity of embeddings
    try {
      const [embeddingA, embeddingB] = await Promise.all([
        this.getEmbedding(a),
        this.getEmbedding(b)
      ]);

      if (embeddingA.length === 0 || embeddingB.length === 0) {
        return 0;
      }

      if (embeddingA.length !== embeddingB.length) {
        throw new Error('Embedding dimensions do not match');
      }

      // Calculate cosine similarity manually
      // Cosine similarity = dot product / (magnitude A * magnitude B)
      let dotProduct = 0;
      let magnitudeA = 0;
      let magnitudeB = 0;
      
      for (let i = 0; i < embeddingA.length; i++) {
        dotProduct += embeddingA[i] * embeddingB[i];
        magnitudeA += embeddingA[i] * embeddingA[i];
        magnitudeB += embeddingB[i] * embeddingB[i];
      }
      
      magnitudeA = Math.sqrt(magnitudeA);
      magnitudeB = Math.sqrt(magnitudeB);
      
      if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
      }
      
      const similarity = dotProduct / (magnitudeA * magnitudeB);
      
      // Cosine similarity returns -1 to 1, normalize to 0-1 for semantic similarity
      return (similarity + 1) / 2;
    } catch (error) {
      throw new Error(`Failed to calculate semantic similarity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async rerankResults(query: string, results: Paper[]): Promise<Paper[]> {
    // for each, calc semantic similarity between the query and the results
    // Extract text content from results (title and summary combined)
    const similarityFns = results.map((paper: Paper) => {
      const text = `${paper.title} ${paper.summary}`.trim();
      return this.calculateSemanticSimilarity(query, text);
    });
    
    const similarities = await Promise.all(similarityFns);
    
    // Create array of results with similarity scores, then sort
    const resultsWithSimilarity = results.map((paper, index) => {
      paper.similarity = similarities[index];
      return paper;
    });
    
    // Sort by similarity (highest first)
    const sortedResults = resultsWithSimilarity.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    
    return sortedResults;
  }

  async query(query: string): Promise<Paper[]> {
    try {
      // 1. LLM invocation to generate query plans
      const result = await this.generateContentFromVertexAI(query);
      // 2. hit the actual APIs with each of the queries
      // parse llm output
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      const { arxiv_queries = [], openalex_queries = [], core_queries = [] } = parsed;

      // make and await async requests
      const requestFns = [
        ...arxiv_queries.map((q: any) => searchArxiv(q.query, 10, 0, q.mode || "")),
        ...openalex_queries.map((q: any) => searchOpenalex(q.query, 10)),
        ...core_queries.map((q: any) => searchCore(q.query, 10, q.mode || ""))
      ];

      const responses = await Promise.all(requestFns);

      // 3. semantic reranking of the results
      const rerankedResults = await this.rerankResults(query, responses.flat());

      // 4. output results with metadata
      return rerankedResults;
    } catch (error) {
      throw new Error(`AI-augmented query process failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const agentService = new AgentService();