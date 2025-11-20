export interface ValidationResult {
  valid: boolean;
  error?: string;
  queries?: string[];
}

export function parseMultipleQueries(input: string): string[] {
  if (!input || !input.trim()) {
    return [];
  }
  
  const queries = input
    .split(/[,;]/)
    .map(q => q.trim())
    .filter(q => q.length > 0);
  
  return queries;
}

export function validateQuery(queryText: string): ValidationResult {
  if (!queryText || !queryText.trim()) {
    return { valid: false, error: 'Please enter a search query' };
  }
  
  const queries = parseMultipleQueries(queryText);
  if (queries.length === 0) {
    return { valid: false, error: 'Please enter at least one search query' };
  }
  
  for (const q of queries) {
    if (q.length > 200) {
      return { valid: false, error: `Query "${q.substring(0, 30)}..." is too long (max 200 characters)` };
    }
  }
  
  return { valid: true, queries };
}

export function formatQueryTimestamp(timestamp: number | string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

