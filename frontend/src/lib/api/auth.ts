import { apiClient } from './client';

export interface BootstrapResponse {
  id: string;
  email: string;
  preferences?: Record<string, any>;
}

export async function bootstrapAuth(token: string): Promise<BootstrapResponse> {
  return apiClient('/api/auth/bootstrap', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

