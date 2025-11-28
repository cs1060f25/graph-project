import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_TOPICS = [
  'graph neural networks for drug discovery',
  'energy-efficient reinforcement learning policies',
  'federated learning for medical imaging',
  'quantum-inspired optimization for routing',
  'ethical alignment in autonomous robotics',
  'low-resource NLP for indigenous languages',
  'explainable AI for climate risk models',
  'causal inference in social network dynamics',
];

let cachedClient = null;
let lastFallbackTopic = null;

const MODEL_NAME = 'gemini-2.5-flash';

const BASE_PROMPT = `Generate exactly one short, specific, academically-relevant research query.
The output must be fewer than 12 words, contain no numbering or bullet points, and omit surrounding quotes.
Respond with only the query text.`;

const sanitizeQuery = (text) => text.replace(/^["'\s]+|["'\s]+$/g, '').trim();

const getFallbackTopic = () => {
  if (FALLBACK_TOPICS.length === 0) {
    return 'advanced research frontiers';
  }

  let topic = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
  if (topic === lastFallbackTopic) {
    const currentIndex = FALLBACK_TOPICS.indexOf(topic);
    topic = FALLBACK_TOPICS[(currentIndex + 1) % FALLBACK_TOPICS.length];
  }
  lastFallbackTopic = topic;
  return topic;
};

const getClient = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.REACT_APP_GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  cachedClient = new GoogleGenerativeAI(apiKey);
  return cachedClient;
};

export async function getFeelingLuckyQuery() {
  const client = getClient();

  if (client) {
    try {
      const model = client.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: BASE_PROMPT }],
          },
        ],
        generationConfig: {
          temperature: 1.1,
          maxOutputTokens: 32,
        },
      });

      const rawText = result?.response?.text();
      if (rawText) {
        const candidate = sanitizeQuery(rawText);
        if (candidate.length > 0) {
          return candidate;
        }
      }
    } catch (error) {
      console.warn('[FeelingLuckyGenerator] GenAI request failed, using fallback.', error);
    }
  }

  return getFallbackTopic();
}



