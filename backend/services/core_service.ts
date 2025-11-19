import axios, { AxiosError } from 'axios';
import { Paper } from '../models/paper.js';

interface CoreAuthor {
  name?: string;
}

interface CoreEntry {
  id?: number | string;
  title?: string;
  abstract?: string;
  publishedDate?: string;
  authors?: Array<CoreAuthor | string>;
  downloadUrl?: string;
  fullTextUrl?: string;
  uri?: string;
}

interface CoreResponse {
  results?: CoreEntry[];
}

export function formatQuery(query: string): string {
  // pass
  return query;
}

export async function searchCore(
  query: string,
  maxResults: number = 10,
  mode: string = ""
): Promise<Paper[]> {
  /**
   * Search CORE for papers matching the query.
   * 
   * @param query - Search query string
   * @param maxResults - Maximum number of results to return (default: 10)
   * @param mode - Query mode (unused for CORE, kept for consistency)
   * @returns Promise<Paper[]>
   */
  try {
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey) {
      throw new Error("CORE API key not found. Set CORE_API_KEY environment variable.");
    }
    
    const baseUrl = "https://api.core.ac.uk/v3";
    const encodedQuery = encodeURIComponent(query);
    const queryUrl = `${baseUrl}/search/works?query=${encodedQuery}&limit=${maxResults}`;
    
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };
    
    const response = await axios.get<CoreResponse>(queryUrl, { headers, timeout: 15000 });
    
    const data = response.data;
    let entries = data.results || [];
    if (!Array.isArray(entries)) {
      entries = [];
    }
    
    const results: Paper[] = [];
    
    for (const entry of entries) {
      // Extract paper ID
      const paperId = String(entry.id || "");
      
      // Extract title
      const title = entry.title || "Untitled";
      
      // Extract summary
      const summary = entry.abstract || "";
      
      // Extract published date
      const published = entry.publishedDate || "Unknown";
      
      // Extract authors
      const authorsData = entry.authors || [];
      const authors: string[] = [];
      if (Array.isArray(authorsData)) {
        for (const author of authorsData) {
          let authorName: string | undefined;
          if (typeof author === 'object' && author !== null) {
            authorName = author.name;
          } else {
            authorName = String(author);
          }
          if (authorName) {
            authors.push(authorName);
          }
        }
      }
      
      // Extract link (prefer download URL, fallback to full text URL, then URI)
      const link = (
        entry.downloadUrl ||
        entry.fullTextUrl ||
        entry.uri ||
        ""
      );
      
      results.push(new Paper(
        paperId,
        title,
        summary,
        published,
        authors,
        link,
        'core'
      ));
    }
    
    return results;
    
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      throw new Error(`Failed to fetch papers from CORE: ${axiosError.message}`);
    } else {
      throw new Error(`CORE search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

