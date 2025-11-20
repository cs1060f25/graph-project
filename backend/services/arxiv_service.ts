import axios, { AxiosError } from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { Paper } from '../models/paper.js';

const parseXML = promisify(parseString);

interface ArxivEntry {
  id?: string[];
  title?: string[];
  summary?: string[];
  published?: string[];
  author?: Array<{ name?: string[] }>;
  link?: Array<{ $: { href?: string; type?: string } }>;
}

interface ArxivFeed {
  feed?: {
    entry?: ArxivEntry[];
  };
}

export function formatQuery(query: string): string {
  // pass
  return query;
}

export async function searchArxiv(
  query: string,
  maxResults: number = 10,
  start: number = 0,
  mode: string = ""
): Promise<Paper[]> {
  /**
   * Search Arxiv for papers matching the query.
   * 
   * @param query - Search query string (e.g., "cat:cs.AI" or "machine learning")
   * @param maxResults - Maximum number of results to return (default: 10)
   * @returns Promise<Paper[]>
   */
  try {
    const baseUrl = "https://export.arxiv.org/api/query";
    const params = new URLSearchParams({
      search_query: query, // Arxiv API uses 'search_query', not 'query'
      start: start.toString(),
      max_results: maxResults.toString()
    });

    // Note: Arxiv API doesn't support 'type' parameter - mode is handled via query format
    // For topic mode, query should be formatted as "cat:cs.AI" etc.
    // For keyword mode, use plain text search

    const url = `${baseUrl}?${params.toString()}`;
    
    const response = await axios.get<string>(url, { timeout: 15000 });
    
    // Parse XML response
    const result = await parseXML(response.data) as ArxivFeed;
    const feed = result.feed || {};
    
    // Extract entries
    const entries = feed.entry || [];
    const results: Paper[] = [];
    
    for (const entry of entries) {
      // Extract paper ID (remove the arxiv.org/abs/ prefix if present)
      const idElem = entry.id?.[0];
      const paperId = idElem || "";
      
      // Extract title
      const titleElem = entry.title?.[0];
      const title = titleElem?.trim() || "";
      
      // Extract summary
      const summaryElem = entry.summary?.[0];
      const summary = summaryElem?.trim() || "";
      
      // Extract published date
      const publishedElem = entry.published?.[0];
      const published = publishedElem || "";
      
      // Extract authors (can be multiple)
      const authorElems = entry.author || [];
      const authors: string[] = [];
      for (const authorElem of authorElems) {
        const nameElem = authorElem.name?.[0];
        if (nameElem) {
          authors.push(nameElem);
        }
      }
      
      // Extract link (prefer PDF link, fallback to first link)
      const linkElems = entry.link || [];
      let link = "";
      for (const linkElem of linkElems) {
        const href = linkElem.$.href || "";
        if (href) {
          link = href;
          // Prefer PDF link if available
          if (linkElem.$.type === "application/pdf") {
            break;
          }
        }
      }
      
      results.push(new Paper(
        paperId,
        title,
        summary,
        published,
        authors,
        link,
        'arxiv'
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
      
      console.error(`[ArxivService] API error - Status: ${status} ${statusText}, URL: ${url}`);
      if (responseData) {
        console.error(`[ArxivService] Response data:`, typeof responseData === 'string' 
          ? responseData.substring(0, 500) 
          : JSON.stringify(responseData).substring(0, 500));
      }
      
      throw new Error(`Failed to fetch papers from Arxiv: ${status} ${statusText} - ${axiosError.message}`);
    } else if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
      throw new Error(`Failed to fetch papers from Arxiv: Timeout - ${axiosError.message}`);
    } else {
      throw new Error(`Arxiv search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// convenience functions for specific query modes
export async function searchArxivByTopic(topic: string, maxResults: number = 10): Promise<Paper[]> {
  return await searchArxiv(topic, maxResults, 0, "topic");
}

export async function searchArxivByKeyword(keyword: string, maxResults: number = 10): Promise<Paper[]> {
  return await searchArxiv(keyword, maxResults, 0, "keyword");
}

