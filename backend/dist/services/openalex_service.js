import axios from 'axios';
import { Paper } from '../models/paper.js';
function reconstructAbstract(invIdx) {
    /**Reconstruct abstract text from OpenAlex inverted index.*/
    if (!invIdx || typeof invIdx !== 'object') {
        return "";
    }
    const pairs = [];
    for (const [word, positions] of Object.entries(invIdx)) {
        for (const pos of positions) {
            pairs.push({ pos, word });
        }
    }
    pairs.sort((a, b) => a.pos - b.pos);
    return pairs.map(p => p.word).join(" ");
}
export function formatQuery(query) {
    // pass
    return query;
}
export async function searchOpenalex(query, maxResults = 10) {
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
        const queryUrl = `${baseUrl}/works?filter=title.search:${encodedQuery}&per-page=${maxResults}`;
        const response = await axios.get(queryUrl, { timeout: 15000 });
        const data = response.data;
        const entries = data.results || [];
        const results = [];
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
            const authors = [];
            if (Array.isArray(authorships)) {
                for (const authorship of authorships) {
                    const author = authorship.author;
                    if (author && author.display_name) {
                        authors.push(author.display_name);
                    }
                }
            }
            // Extract link (prefer open access URL, fallback to DOI, then ID)
            const link = (entry.open_access?.oa_url ||
                entry.doi ||
                entry.id ||
                "");
            results.push(new Paper(paperId, title, summary, published, authors, link, 'openalex'));
        }
        return results;
    }
    catch (error) {
        const axiosError = error;
        if (axiosError.response) {
            throw new Error(`Failed to fetch papers from OpenAlex: ${axiosError.message}`);
        }
        else {
            throw new Error(`OpenAlex search failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
//# sourceMappingURL=openalex_service.js.map