/**
 * OpenAlexAPI
 * Handles queries to the OpenAlex API for research papers.
 *
 * Docs: https://docs.openalex.org/api-entities/works/search-works
 * 
 * Supported queries:
 *   - queryByTopic(topic, maxResults)
 *   - queryByKeyword(keyword, maxResults)
 *
 * Features:
 *   - No API key required (completely free)
 *   - Normalized response format (same as ArxivAPI / SemanticScholarAPI)
 *   - Reconstructs abstracts from abstract_inverted_index when available
 */

export default class OpenAlexAPI {
  constructor({ defaultMaxResults = 10 } = {}) {
    this.baseUrl = "https://api.openalex.org";
    this.defaultMaxResults = defaultMaxResults;
  }

  /** Reconstruct abstract text from OpenAlex inverted index */
  #reconstructAbstract(invIdx) {
    // if no abstract available then return this
    if (!invIdx || typeof invIdx !== "object") return "";

    const pairs = [];
    for (const [word, positions] of Object.entries(invIdx)) {
      positions.forEach((pos) => pairs.push({ pos, word }));
    }
    pairs.sort((a, b) => a.pos - b.pos);
    return pairs.map((p) => p.word).join(" ");
  }

  /**
   * Fetch with timeout helper
   * @param {string} url - URL to fetch
   * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
   * @returns {Promise<Response>}
   */
  async #fetchWithTimeout(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Internal fetch helper
   * @param {string} searchQuery - Keyword or topic query
   * @param {number} maxResults
   */
  async #fetchResults(searchQuery, maxResults) {
    const limit = maxResults ?? this.defaultMaxResults;
    // Include referenced_works and cited_by_api_url in response to get citation relationships
    const queryUrl = `${this.baseUrl}/works?filter=title.search:${encodeURIComponent(
      searchQuery
    )}&per-page=${limit}&select=id,display_name,abstract_inverted_index,publication_year,authorships,open_access,doi,cited_by_count,referenced_works,cited_by_api_url`;

    try {
      const response = await this.#fetchWithTimeout(queryUrl, 15000);

      if (!response.ok) {
        console.error(
          "OpenAlex API failed:",
          response.status,
          response.statusText
        );
        throw new Error(`Failed to fetch papers: ${response.statusText}`);
      }

      const data = await response.json();
      const entries = data.results || [];

      // First pass: extract basic data and referenced_works
      const papers = entries.map((entry) => {
        // Extract referenced works (papers this paper cites)
        // OpenAlex provides referenced_works as an array of work IDs
        const references = Array.isArray(entry.referenced_works)
          ? entry.referenced_works.map(ref => {
              // Extract work ID from OpenAlex format (e.g., "https://openalex.org/W123456" -> "W123456")
              if (typeof ref === 'string') {
                return ref;
              } else if (ref && ref.id) {
                return ref.id;
              }
              return null;
            }).filter(Boolean)
          : [];

        return {
          id: entry.id,
          title: entry.display_name?.trim(),
          summary: this.#reconstructAbstract(entry.abstract_inverted_index),
          published: entry.publication_year
            ? `${entry.publication_year}-01-01T00:00:00Z`
            : "Unknown",
          authors: Array.isArray(entry.authorships)
            ? entry.authorships.map((a) => a.author?.display_name)
            : [],
          link:
            entry.open_access?.oa_url ||
            entry.doi ||
            entry.id ||
            null,
          // GRAPH-85: Extract citation count for node sizing and display
          citationCount: entry.cited_by_count || 0,
          // Extract citation relationships for edge creation
          references: references, // Papers this paper cites (referenced_works)
          // Store cited_by_api_url for fetching papers that cite this paper
          citedByApiUrl: entry.cited_by_api_url || null,
        };
      });

      // Second pass: fetch citing papers (papers that cite each paper) and referenced papers (papers each paper cites)
      const papersWithCitedBy = await Promise.all(
        papers.map(async (paper) => {
          const citingPapers = [];
          const referencedPapers = [];
          
          // Fetch citing papers (papers that cite this paper)
          if (paper.citedByApiUrl && paper.citationCount > 0) {
            try {
              // Fetch all citing papers (up to citation count, but cap at 50 to avoid too many API calls)
              const maxCitingPapers = Math.min(paper.citationCount || 0, 50);
              const citedByUrl = `${paper.citedByApiUrl}&per-page=${maxCitingPapers}`;
              const citedByResponse = await this.#fetchWithTimeout(citedByUrl, 15000);
              
              if (citedByResponse.ok) {
                const citedByData = await citedByResponse.json();
                const citedByWorks = citedByData.results || [];
                
                // Create paper objects for citing papers
                citingPapers.push(...citedByWorks.map(work => ({
                  id: work.id,
                  title: work.display_name?.trim() || 'Untitled',
                  summary: this.#reconstructAbstract(work.abstract_inverted_index),
                  published: work.publication_year
                    ? `${work.publication_year}-01-01T00:00:00Z`
                    : "Unknown",
                  authors: Array.isArray(work.authorships)
                    ? work.authorships.map((a) => a.author?.display_name)
                    : [],
                  link: work.open_access?.oa_url || work.doi || work.id || null,
                  citationCount: work.cited_by_count || 0,
                  references: Array.isArray(work.referenced_works)
                    ? work.referenced_works.map(ref => typeof ref === 'string' ? ref : (ref?.id || null)).filter(Boolean)
                    : [],
                  isCitingPaper: true,
                  citedPaperId: paper.id,
                })));
              }
            } catch (err) {
              console.warn(`Failed to fetch cited_by for ${paper.id}:`, err);
            }
          }
          
          // Fetch referenced papers (papers this paper cites)
          if (paper.references && paper.references.length > 0) {
            try {
              // Fetch details for referenced papers (limit to 20 to avoid too many API calls)
              const refsToFetch = paper.references.slice(0, 20);
              const refFetchPromises = refsToFetch.map(async (refId) => {
                try {
                  // OpenAlex work ID format: https://openalex.org/W123456 or just W123456
                  const workId = refId.startsWith('http') ? refId : `https://openalex.org/${refId}`;
                  const workUrl = `${this.baseUrl}/works/${workId}`;
                  const workResponse = await this.#fetchWithTimeout(workUrl, 10000);
                  
                  if (workResponse.ok) {
                    const work = await workResponse.json();
                    return {
                      id: work.id,
                      title: work.display_name?.trim() || 'Untitled',
                      summary: this.#reconstructAbstract(work.abstract_inverted_index),
                      published: work.publication_year
                        ? `${work.publication_year}-01-01T00:00:00Z`
                        : "Unknown",
                      authors: Array.isArray(work.authorships)
                        ? work.authorships.map((a) => a.author?.display_name)
                        : [],
                      link: work.open_access?.oa_url || work.doi || work.id || null,
                      citationCount: work.cited_by_count || 0,
                      references: Array.isArray(work.referenced_works)
                        ? work.referenced_works.map(ref => typeof ref === 'string' ? ref : (ref?.id || null)).filter(Boolean)
                        : [],
                      isReferencedPaper: true,
                      referencedByPaperId: paper.id,
                    };
                  }
                } catch (err) {
                  console.warn(`Failed to fetch referenced paper ${refId}:`, err);
                  return null;
                }
                return null;
              });
              
              const fetchedRefs = await Promise.all(refFetchPromises);
              referencedPapers.push(...fetchedRefs.filter(Boolean));
            } catch (err) {
              console.warn(`Failed to fetch referenced papers for ${paper.id}:`, err);
            }
          }
          
          const citedBy = citingPapers.map(p => p.id).filter(Boolean);
          
          return { ...paper, citedBy, citingPapers, referencedPapers };
        })
      );

      // Flatten all additional papers and add them to the results
      const allCitingPapers = papersWithCitedBy.flatMap(p => p.citingPapers || []);
      const allReferencedPapers = papersWithCitedBy.flatMap(p => p.referencedPapers || []);
      const papersWithoutExtras = papersWithCitedBy.map(({ citingPapers, referencedPapers, ...paper }) => paper);
      
      // Combine original papers with citing papers and referenced papers
      // Deduplicate by ID to avoid adding the same paper multiple times
      const allPapers = [...papersWithoutExtras, ...allCitingPapers, ...allReferencedPapers];
      const seenIds = new Set();
      const uniquePapers = [];
      
      for (const paper of allPapers) {
        if (!seenIds.has(paper.id)) {
          seenIds.add(paper.id);
          uniquePapers.push(paper);
        }
      }
      
      return uniquePapers;
    } catch (err) {
      console.error("OpenAlex fetch failed:", err);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Query papers by topic
   * @param {string} topic
   * @param {number} [maxResults]
   */
  async queryByTopic(topic, maxResults) {
    return await this.#fetchResults(topic, maxResults);
  }

  /**
   * Query papers by keyword
   * @param {string} keyword
   * @param {number} [maxResults]
   */
  async queryByKeyword(keyword, maxResults) {
    return await this.#fetchResults(keyword, maxResults);
  }
}
