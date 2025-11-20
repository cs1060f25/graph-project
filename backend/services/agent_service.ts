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
    try {
      console.log(`[AgentService] Calling GenAI with query: "${query.substring(0, 50)}..."`);
      console.log(`[AgentService] Model: gemini-2.5-pro, Project: ${config.GOOGLE_CLOUD_PROJECT}, Location: ${config.GOOGLE_CLOUD_LOCATION}`);
      
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

      const text = response.text ?? '';
      console.log(`[AgentService] GenAI response received, length: ${text.length}`);
      return text;
    } catch (error: any) {
      console.error(`[AgentService] GenAI API call failed:`, error);
      if (error.response) {
        console.error(`[AgentService]   Status: ${error.response.status}, StatusText: ${error.response.statusText}`);
        console.error(`[AgentService]   Response:`, JSON.stringify(error.response.data).substring(0, 500));
      }
      if (error.message) {
        console.error(`[AgentService]   Error message: ${error.message}`);
      }
      throw new Error(`GenAI API call failed: ${error.message || 'Unknown error'}`);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // Get embedding using Google's text-embedding model via Vertex AI
    try {
      console.log(`[AgentService] Getting embedding for text (length: ${text.length})`);
      
      // Try different embedding models if one fails
      const models = ['text-embedding-004', 'textembedding-gecko@003', 'textembedding-gecko@002'];
      
      for (const model of models) {
        try {
          console.log(`[AgentService] Trying embedding model: ${model}`);
          const response = await this.genAI.models.embedContent({
            model: model,
            contents: text,
          });
          
          const embedding = response.embeddings?.[0]?.values || [];
          if (embedding.length > 0) {
            console.log(`[AgentService] Successfully got embedding (dimensions: ${embedding.length}) using model: ${model}`);
            return embedding;
          }
        } catch (modelError: any) {
          console.warn(`[AgentService] Model ${model} failed: ${modelError.message}`);
          // Try next model
          continue;
        }
      }
      
      // If all models fail, throw error
      throw new Error('All embedding models failed');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentService] Failed to get embedding: ${errorMsg}`);
      throw new Error(`Failed to get embedding: ${errorMsg}`);
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
    // If no results, return early
    if (results.length === 0) {
      return results;
    }

    // Try semantic reranking, but fallback to original order if it fails
    try {
      console.log(`[AgentService] Attempting semantic reranking for ${results.length} papers...`);
      
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
      
      console.log(`[AgentService] Semantic reranking successful`);
      return sortedResults;
    } catch (error: any) {
      // If embedding/reranking fails, return results in original order
      console.warn(`[AgentService] Semantic reranking failed, returning results in original order: ${error.message}`);
      return results;
    }
  }

  async query(query: string): Promise<Paper[]> {
    try {
      // 1. LLM invocation to generate query plans (with fallback)
      console.log(`[AgentService] Starting query for: "${query}"`);
      
      let arxiv_queries: any[] = [];
      let openalex_queries: any[] = [];
      let core_queries: any[] = [];
      
      try {
        const result = await this.generateContentFromVertexAI(query);
        console.log(`[AgentService] LLM response received, length: ${result.length}`);
        
        // parse llm output
        let parsed: any;
        try {
          parsed = typeof result === 'string' ? JSON.parse(result) : result;
        } catch (parseError) {
          console.error(`[AgentService] Failed to parse LLM response:`, parseError);
          console.error(`[AgentService] Raw response:`, result);
          throw new Error(`Failed to parse LLM response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
        
        arxiv_queries = parsed.arxiv_queries || [];
        openalex_queries = parsed.openalex_queries || [];
        core_queries = parsed.core_queries || [];
        console.log(`[AgentService] Parsed queries - Arxiv: ${arxiv_queries.length}, OpenAlex: ${openalex_queries.length}, CORE: ${core_queries.length}`);
      } catch (llmError: any) {
        console.warn(`[AgentService] LLM call failed, using fallback: ${llmError.message}`);
        // Fallback: use the original query for all APIs
        console.log(`[AgentService] Using fallback: direct query to all APIs`);
        arxiv_queries = [{ query, mode: 'keyword' }];
        openalex_queries = [{ query, mode: 'keyword' }];
        core_queries = [{ query, mode: 'keyword' }];
      }

      // 2. hit the actual APIs with each of the queries
      const requestFns: Array<Promise<Paper[]>> = [];
      
      // Arxiv queries
      for (const q of arxiv_queries) {
        const queryText = q.query || query; // Fallback to original query if missing
        const mode = q.mode || '';
        console.log(`[AgentService] Queuing Arxiv query: "${queryText}" (mode: ${mode})`);
        requestFns.push(
          searchArxiv(queryText, 10, 0, mode).catch(err => {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`[AgentService] Arxiv search failed for "${queryText}":`, errorMsg);
            if (err.response) {
              console.error(`[AgentService]   Status: ${err.response.status}, URL: ${err.config?.url}`);
            }
            return []; // Return empty array on error to allow other APIs to succeed
          })
        );
      }
      
      // OpenAlex queries
      for (const q of openalex_queries) {
        const queryText = q.query || query; // Fallback to original query if missing
        console.log(`[AgentService] Queuing OpenAlex query: "${queryText}"`);
        requestFns.push(
          searchOpenalex(queryText, 10).catch(err => {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`[AgentService] OpenAlex search failed for "${queryText}":`, errorMsg);
            if (err.response) {
              console.error(`[AgentService]   Status: ${err.response.status}, URL: ${err.config?.url}`);
            }
            return []; // Return empty array on error to allow other APIs to succeed
          })
        );
      }
      
      // CORE queries
      for (const q of core_queries) {
        const queryText = q.query || query; // Fallback to original query if missing
        const mode = q.mode || '';
        console.log(`[AgentService] Queuing CORE query: "${queryText}" (mode: ${mode})`);
        requestFns.push(
          searchCore(queryText, 10, mode).catch(err => {
            const errorMsg = err instanceof Error ? err.message : String(err);
            console.error(`[AgentService] CORE search failed for "${queryText}":`, errorMsg);
            if (err.response) {
              console.error(`[AgentService]   Status: ${err.response.status}, URL: ${err.config?.url}`);
            }
            return []; // Return empty array on error to allow other APIs to succeed
          })
        );
      }

      console.log(`[AgentService] Executing ${requestFns.length} API requests...`);
      const responses = await Promise.all(requestFns);
      const allResults = responses.flat();
      console.log(`[AgentService] Received ${allResults.length} total papers from all APIs`);

      // 3. semantic reranking of the results (optional - will skip if embeddings fail)
      if (allResults.length === 0) {
        console.warn(`[AgentService] No papers found from any API. Returning empty array.`);
        return [];
      }
      
      // Try reranking, but return original results if it fails
      try {
        console.log(`[AgentService] Starting semantic reranking...`);
        const rerankedResults = await this.rerankResults(query, allResults);
        console.log(`[AgentService] Reranking complete. Returning ${rerankedResults.length} papers`);
        return rerankedResults;
      } catch (rerankError: any) {
        console.warn(`[AgentService] Reranking failed, returning results in original order: ${rerankError.message}`);
        // Return results without reranking if embeddings fail
        return allResults;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[AgentService] Query failed:`, errorMsg);
      console.error(`[AgentService] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      throw new Error(`AI-augmented query process failed: ${errorMsg}`);
    }
  }
}

export const agentService = new AgentService();