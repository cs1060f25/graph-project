const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const { token, ...fetchOptions } = options;
  
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  // Add Authorization header if token is provided
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const config = {
    ...fetchOptions,
    headers,
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'API request failed');
  }
  
  // Handle empty responses or non-JSON content
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

