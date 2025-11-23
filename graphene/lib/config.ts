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
  let parsed = key
    .replace(/\\n/g, '\n')
    .replace(/"/g, '')
    .trim();
  
  if (parsed && !parsed.includes('\n') && parsed.length > 100) {
    parsed = parsed.replace(/(.{64})/g, '$1\n');
    parsed = parsed.replace(/\n$/, '');
  }
  
  return parsed;
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

