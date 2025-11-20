import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { Paper } from '../models/paper.js';
const parseXML = promisify(parseString);
export function formatQuery(query) {
    // pass
    return query;
}
export async function searchArxiv(query, maxResults = 10, start = 0, mode = "") {
    /**
     * Search Arxiv for papers matching the query.
     *
     * @param query - Search query string (e.g., "cat:cs.AI" or "machine learning")
     * @param maxResults - Maximum number of results to return (default: 10)
     * @returns Promise<Paper[]>
     */
    try {
        const baseUrl = "http://export.arxiv.org/api/query";
        const params = new URLSearchParams({
            query: query,
            start: start.toString(),
            max_results: maxResults.toString()
        });
        // query modes
        if (mode === "topic") {
            params.append("type", "topic");
        }
        else if (mode === "keyword") {
            params.append("type", "keyword");
        }
        const url = `${baseUrl}?${params.toString()}`;
        const response = await axios.get(url, { timeout: 15000 });
        // Parse XML response
        const result = await parseXML(response.data);
        const feed = result.feed || {};
        // Extract entries
        const entries = feed.entry || [];
        const results = [];
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
            const authors = [];
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
            results.push(new Paper(paperId, title, summary, published, authors, link, 'arxiv'));
        }
        return results;
    }
    catch (error) {
        const axiosError = error;
        if (axiosError.response) {
            throw new Error(`Failed to fetch papers from Arxiv: ${axiosError.message}`);
        }
        else if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
            throw new Error(`Failed to fetch papers from Arxiv: ${axiosError.message}`);
        }
        else {
            throw new Error(`Arxiv search failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
// convenience functions for specific query modes
export async function searchArxivByTopic(topic, maxResults = 10) {
    return await searchArxiv(topic, maxResults, 0, "topic");
}
export async function searchArxivByKeyword(keyword, maxResults = 10) {
    return await searchArxiv(keyword, maxResults, 0, "keyword");
}
//# sourceMappingURL=arxiv_service.js.map