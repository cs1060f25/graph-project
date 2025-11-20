import axios, { AxiosError } from 'axios';
import { Paper } from '../models/paper.js';

interface InvertedIndex {
  [word: string]: number[];
}

interface OpenAlexAuthor {
  display_name?: string;
}

interface OpenAlexAuthorship {
  author?: OpenAlexAuthor;
}

interface OpenAlexOpenAccess {
  oa_url?: string;
}

interface OpenAlexEntry {
  id?: string;
  display_name?: string;
  abstract_inverted_index?: InvertedIndex | null;
  publication_year?: number | null;
  authorships?: OpenAlexAuthorship[];
  open_access?: OpenAlexOpenAccess;
  doi?: string;
}

interface OpenAlexResponse {
  results?: OpenAlexEntry[];
}

function reconstructAbstract(invIdx: InvertedIndex | null | undefined): string {
  /**Reconstruct abstract text from OpenAlex inverted index.*/
  if (!invIdx || typeof invIdx !== 'object') {
    return "";
  }
  
  const pairs: Array<{ pos: number; word: string }> = [];
  for (const [word, positions] of Object.entries(invIdx)) {
    for (const pos of positions) {
      pairs.push({ pos, word });
    }
  }
  
  pairs.sort((a, b) => a.pos - b.pos);
  return pairs.map(p => p.word).join(" ");
}

export function formatQuery(query: string): string {
  // pass
  return query;
}

export async function searchOpenalex(
  query: string,
  maxResults: number = 10
): Promise<Paper[]> {
  /**
   * Search OpenAlex for papers matching the query.
   * 
   * @param query - Search query string
   * @param maxResults - Maximum number of results to return (default: 10)
   * @returns Promise<Paper[]>
   */
  try {
    const baseUrl = "https://api.openalex.org";
    const encodedQuery = encodeURIComponent(query);
    // OpenAlex uses 'search' parameter for general search, not 'filter=title.search:'
    const queryUrl = `${baseUrl}/works?search=${encodedQuery}&per-page=${maxResults}`;
    
    const response = await axios.get<OpenAlexResponse>(queryUrl, { timeout: 15000 });
    
    const data = response.data;
    const entries = data.results || [];
    const results: Paper[] = [];
    
    for (const entry of entries) {
      // Extract paper ID
      const paperId = entry.id || "";
      
      // Extract title
      const title = entry.display_name?.trim() || "";
      
      // Reconstruct summary from inverted index
      const abstractInvIdx = entry.abstract_inverted_index;
      const summary = reconstructAbstract(abstractInvIdx);
      
      // Extract published date
      const publicationYear = entry.publication_year;
      const published = publicationYear ? `${publicationYear}-01-01T00:00:00Z` : "Unknown";
      
      // Extract authors
      const authorships = entry.authorships || [];
      const authors: string[] = [];
      if (Array.isArray(authorships)) {
        for (const authorship of authorships) {
          const author = authorship.author;
          if (author && author.display_name) {
            authors.push(author.display_name);
          }
        }
      }
      
      // Extract link (prefer open access URL, fallback to DOI, then ID)
      const link = (
        entry.open_access?.oa_url ||
        entry.doi ||
        entry.id ||
        ""
      );
      
      results.push(new Paper(
        paperId,
        title,
        summary,
        published,
        authors,
        link,
        'openalex'
      ));
    }
    
    return results;
    
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const status = axiosError.response.status;
      const statusText = axiosError.response.statusText;
      const url = axiosError.config?.url || 'unknown URL';
      const responseData = axiosError.response.data;
      
      console.error(`[OpenAlexService] API error - Status: ${status} ${statusText}, URL: ${url}`);
      if (responseData) {
        console.error(`[OpenAlexService] Response data:`, typeof responseData === 'string' 
          ? responseData.substring(0, 500) 
          : JSON.stringify(responseData).substring(0, 500));
      }
      
      throw new Error(`Failed to fetch papers from OpenAlex: ${status} ${statusText} - ${axiosError.message}`);
    } else {
      throw new Error(`OpenAlex search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

