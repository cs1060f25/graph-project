import { Paper } from '../models/types';

export default class OpenAlexAPI {
  private baseUrl = "https://api.openalex.org";
  private defaultMaxResults: number;

  constructor({ defaultMaxResults = 10 } = {}) {
    this.defaultMaxResults = defaultMaxResults;
  }

  private reconstructAbstract(invIdx: any): string {
    if (!invIdx || typeof invIdx !== "object") return "";
    const pairs: { pos: number; word: string }[] = [];
    for (const [word, positions] of Object.entries(invIdx)) {
      (positions as number[]).forEach((pos: number) => pairs.push({ pos, word }));
    }
    pairs.sort((a, b) => a.pos - b.pos);
    return pairs.map((p) => p.word).join(" ");
  }

  private async fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  private async fetchResults(searchQuery: string, maxResults?: number): Promise<Paper[]> {
    const limit = maxResults ?? this.defaultMaxResults;
    const queryUrl = `${this.baseUrl}/works?filter=title.search:${encodeURIComponent(searchQuery)}&per-page=${limit}&select=id,display_name,abstract_inverted_index,publication_year,authorships,open_access,doi,cited_by_count,referenced_works,cited_by_api_url`;

    try {
      const response = await this.fetchWithTimeout(queryUrl, 15000);
      if (!response.ok) throw new Error(`Failed to fetch papers: ${response.statusText}`);

      const data = await response.json();
      const entries = data.results || [];

      const papers = entries.map((entry: any) => {
        const references = Array.isArray(entry.referenced_works)
          ? entry.referenced_works.map((ref: any) => typeof ref === 'string' ? ref : (ref?.id || null)).filter(Boolean)
          : [];

        return {
          id: entry.id,
          title: entry.display_name?.trim(),
          summary: this.reconstructAbstract(entry.abstract_inverted_index),
          published: entry.publication_year ? `${entry.publication_year}-01-01T00:00:00Z` : "Unknown",
          authors: Array.isArray(entry.authorships) ? entry.authorships.map((a: any) => a.author?.display_name) : [],
          link: entry.open_access?.oa_url || entry.doi || entry.id || null,
          citationCount: entry.cited_by_count || 0,
          references,
          citedByApiUrl: entry.cited_by_api_url || null,
        };
      });

      const papersWithCitedBy = await Promise.all(
        papers.map(async (paper: any) => {
          const citingPapers: Paper[] = [];
          const referencedPapers: Paper[] = [];
          
          if (paper.citedByApiUrl && paper.citationCount > 0) {
            try {
              const perPage = 200;
              let page = 1;
              let hasMore = true;
              
              while (hasMore && citingPapers.length < paper.citationCount) {
                const citedByUrl = `${paper.citedByApiUrl}&per-page=${perPage}&page=${page}`;
                const citedByResponse = await this.fetchWithTimeout(citedByUrl, 20000);
                
                if (citedByResponse.ok) {
                  const citedByData = await citedByResponse.json();
                  const citedByWorks = citedByData.results || [];
                  
                  if (citedByWorks.length === 0) {
                    hasMore = false;
                    break;
                  }
                  
                  citingPapers.push(...citedByWorks.map((work: any) => ({
                    id: work.id,
                    title: work.display_name?.trim() || 'Untitled',
                    summary: this.reconstructAbstract(work.abstract_inverted_index),
                    published: work.publication_year ? `${work.publication_year}-01-01T00:00:00Z` : "Unknown",
                    authors: Array.isArray(work.authorships) ? work.authorships.map((a: any) => a.author?.display_name) : [],
                    link: work.open_access?.oa_url || work.doi || work.id || null,
                    citationCount: work.cited_by_count || 0,
                    references: Array.isArray(work.referenced_works) ? work.referenced_works.map((ref: any) => typeof ref === 'string' ? ref : (ref?.id || null)).filter(Boolean) : [],
                  })));
                  
                  hasMore = citedByWorks.length === perPage && citingPapers.length < paper.citationCount;
                  page++;
                } else {
                  hasMore = false;
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch cited_by for ${paper.id}:`, err);
            }
          }
          
          if (paper.references && paper.references.length > 0) {
            try {
              const refFetchPromises = paper.references.map(async (refId: string) => {
                try {
                  const workId = refId.startsWith('http') ? refId : `https://openalex.org/${refId}`;
                  const workUrl = `${this.baseUrl}/works/${workId}`;
                  const workResponse = await this.fetchWithTimeout(workUrl, 10000);
                  
                  if (workResponse.ok) {
                    const work = await workResponse.json();
                    return {
                      id: work.id,
                      title: work.display_name?.trim() || 'Untitled',
                      summary: this.reconstructAbstract(work.abstract_inverted_index),
                      published: work.publication_year ? `${work.publication_year}-01-01T00:00:00Z` : "Unknown",
                      authors: Array.isArray(work.authorships) ? work.authorships.map((a: any) => a.author?.display_name) : [],
                      link: work.open_access?.oa_url || work.doi || work.id || null,
                      citationCount: work.cited_by_count || 0,
                      references: Array.isArray(work.referenced_works) ? work.referenced_works.map((ref: any) => typeof ref === 'string' ? ref : (ref?.id || null)).filter(Boolean) : [],
                    };
                  }
                } catch (err) {
                  console.warn(`Failed to fetch referenced paper ${refId}:`, err);
                  return null;
                }
                return null;
              });
              
              const fetchedRefs = await Promise.all(refFetchPromises);
              referencedPapers.push(...fetchedRefs.filter(Boolean) as Paper[]);
            } catch (err) {
              console.warn(`Failed to fetch referenced papers for ${paper.id}:`, err);
            }
          }
          
          return { ...paper, citingPapers, referencedPapers };
        })
      );

      const allCitingPapers = papersWithCitedBy.flatMap((p: any) => p.citingPapers || []);
      const allReferencedPapers = papersWithCitedBy.flatMap((p: any) => p.referencedPapers || []);
      const papersWithoutExtras = papersWithCitedBy.map(({ citingPapers, referencedPapers, ...paper }: any) => paper);
      
      const allPapers = [...papersWithoutExtras, ...allCitingPapers, ...allReferencedPapers];
      const seenIds = new Set();
      const uniquePapers: Paper[] = [];
      
      for (const paper of allPapers) {
        if (!seenIds.has(paper.id)) {
          seenIds.add(paper.id);
          uniquePapers.push(paper);
        }
      }
      
      return uniquePapers;
    } catch (err) {
      console.error("OpenAlex fetch failed:", err);
      return [];
    }
  }

  async queryByTopic(topic: string, maxResults?: number): Promise<Paper[]> {
    return await this.fetchResults(topic, maxResults);
  }

  async queryByKeyword(keyword: string, maxResults?: number): Promise<Paper[]> {
    return await this.fetchResults(keyword, maxResults);
  }
}

