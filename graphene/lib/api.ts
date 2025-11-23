const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiClientOptions extends RequestInit {
  token?: string;
}

export const apiClient = async (endpoint: string, options: ApiClientOptions = {}): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const { token, ...fetchOptions } = options;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    ...fetchOptions,
    headers,
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};
