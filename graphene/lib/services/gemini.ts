import { GoogleGenerativeAI } from '@google/generative-ai';
import { Paper } from '../models/types';

export default class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found. Set GEMINI_API_KEY in your .env file.");
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateSummary(paper: Paper): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    const { title, authors, summary, abstract } = paper;
    const paperText = summary || abstract || '';
    const authorsText = Array.isArray(authors) ? authors.join(', ') : (authors || 'Unknown authors');

    let prompt = `Summarize this research paper in 1-2 concise sentences:\n\n`;
    prompt += `Title: ${title || 'Untitled'}\n`;
    prompt += `Authors: ${authorsText}\n`;
    
    if (paperText) {
      prompt += `Abstract: ${paperText.substring(0, 2000)}\n`;
    }

    prompt += `\nProvide a clear, concise summary highlighting the main contributions and findings.`;

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
    //   console.log('Gemini response:', response);
      const summaryText = response.text();

      if (!summaryText) {
        throw new Error('No summary generated from Gemini API');
      }

      return summaryText.trim();
    } catch (err: any) {
      console.error("Gemini summary generation failed:", err);
      throw new Error(`Failed to generate summary: ${err.message || 'Unknown error'}`);
    }
  }
}

