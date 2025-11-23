import 'server-only';

export interface Config {
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  coreApiKey: string | undefined;
  arxivProxyUrl: string | undefined;
}

function parsePrivateKey(key: string | undefined): string {
  if (!key) return '';
  return key
    .replace(/\\n/g, '\n')
    .replace(/"/g, '')
    .trim();
}

export const config: Config = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  },
  coreApiKey: process.env.CORE_API_KEY,
  arxivProxyUrl: process.env.ARXIV_PROXY_URL,
};

export default config;

