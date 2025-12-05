// server/services/ai/feelingLuckyService.js
// Service for generating "feeling lucky" research queries using Google Generative AI

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

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

let lastFallbackTopic = null;

const MODEL_NAME = 'gemini-2.0-flash';

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

/**
 * Generates a random research query using Google Generative AI
 * Falls back to predefined topics if AI generation fails
 * @returns {Promise<string>} A research query string
 */
export async function getFeelingLuckyQuery() {
  const API_KEY = process.env.GOOGLE_GENAI_API_KEY;

  if (!API_KEY) {
    return getFallbackTopic();
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
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
    console.warn('[FeelingLuckyService] GenAI request failed, using fallback.', error);
  }

  return getFallbackTopic();
}

