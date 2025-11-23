import { Paper } from '../models/types';
import OpenAlexAPI from './openAlex';
import ArxivAPI from './arxiv';
import CoreAPI from './coreApi';

interface SearchOptions {
  type?: 'keyword' | 'topic';
  maxResults?: number;
  userId?: string;
  forceRefresh?: boolean;
}

export async function searchPapers(query: string, options: SearchOptions = {}): Promise<Paper[]> {
  const { type = 'keyword', maxResults = 10 } = options;

  const apis = [
    new OpenAlexAPI({ defaultMaxResults: maxResults }),
    new ArxivAPI({ defaultMaxResults: maxResults }),
    new CoreAPI({ defaultMaxResults: maxResults }),
  ];

  const apiPromises = apis.map(async (api) => {
    try {
      if (type === 'topic' && typeof api.queryByTopic === 'function') {
        return await api.queryByTopic(query, maxResults);
      } else if (type === 'keyword' && typeof api.queryByKeyword === 'function') {
        return await api.queryByKeyword(query, maxResults);
      }
      return [];
    } catch (err: any) {
      console.warn(`${api.constructor.name} failed:`, err.message);
      return [];
    }
  });

  const apiResults = await Promise.allSettled(apiPromises);
  const combinedResults = apiResults
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => (result as PromiseFulfilledResult<Paper[]>).value);

  const uniqueResults = Object.values(
    combinedResults.reduce((acc, r) => {
      acc[r.id] = r;
      return acc;
    }, {} as Record<string, Paper>)
  );

  return uniqueResults;
}

