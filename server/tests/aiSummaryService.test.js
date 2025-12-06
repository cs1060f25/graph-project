// server/tests/aiSummaryService.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';

vi.mock('@google/generative-ai');

// Ensure env var is set before any imports
process.env.GOOGLE_GENAI_API_KEY = 'test-key';

// Import the service
let generatePaperSummary;

describe('aiSummaryService', () => {
  let mockModel;
  let originalEnv;

  beforeEach(async () => {
    originalEnv = process.env.GOOGLE_GENAI_API_KEY;
    process.env.GOOGLE_GENAI_API_KEY = 'test-key';
    
    // Reload module to pick up env var
    vi.resetModules();
    const module = await import('../services/ai/aiSummaryService.js');
    generatePaperSummary = module.generatePaperSummary;

    mockModel = {
      generateContent: vi.fn(),
    };
    vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
      getGenerativeModel: vi.fn(() => mockModel),
    }));
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.GOOGLE_GENAI_API_KEY = originalEnv;
    } else {
      delete process.env.GOOGLE_GENAI_API_KEY;
    }
    vi.clearAllMocks();
  });

  it('should generate summary successfully', async () => {
    const mockResponse = {
      response: Promise.resolve({
        text: () => 'This is a test summary of the paper.',
      }),
    };
    mockModel.generateContent.mockResolvedValue(mockResponse);

    const result = await generatePaperSummary({
      title: 'Test Paper',
      authors: ['Author 1'],
      abstract: 'Test abstract',
    });

    expect(result.success).toBe(true);
    expect(result.summary).toContain('test summary');
    expect(result.error).toBeNull();
  });

  it('should handle missing API key', async () => {
    // Clear mocks to avoid interference
    vi.clearAllMocks();
    
    // Temporarily remove the API key - need to do this before reloading module
    const savedKey = process.env.GOOGLE_GENAI_API_KEY;
    const savedReactKey = process.env.REACT_APP_GOOGLE_GENAI_API_KEY;
    
    // Delete env vars
    delete process.env.GOOGLE_GENAI_API_KEY;
    delete process.env.REACT_APP_GOOGLE_GENAI_API_KEY;
    
    // Reload the module to pick up the missing env var
    vi.resetModules();
    const { generatePaperSummary: generateWithoutKey } = await import('../services/ai/aiSummaryService.js');
    
    const result = await generateWithoutKey({
      title: 'Test Paper',
    });

    expect(result.success).toBe(false);
    expect(result.summary).toBeNull();
    expect(result.error).toContain('API key not configured');
    
    // Restore for other tests
    if (savedKey) {
      process.env.GOOGLE_GENAI_API_KEY = savedKey;
    } else {
      process.env.GOOGLE_GENAI_API_KEY = 'test-key';
    }
    if (savedReactKey) {
      process.env.REACT_APP_GOOGLE_GENAI_API_KEY = savedReactKey;
    }
    
    vi.resetModules();
    // Reload the module with the key restored
    const module = await import('../services/ai/aiSummaryService.js');
    generatePaperSummary = module.generatePaperSummary;
  });

  it('should handle missing title', async () => {
    // API key is set in beforeEach, so the service should check for title
    const result = await generatePaperSummary({
      authors: ['Author 1'],
    });

    expect(result.success).toBe(false);
    expect(result.summary).toBeNull();
    expect(result.error).toContain('Paper data is required');
  });

  it('should handle API errors', async () => {
    mockModel.generateContent.mockRejectedValue(new Error('API error'));

    const result = await generatePaperSummary({
      title: 'Test Paper',
      abstract: 'Test abstract',
    });

    expect(result.success).toBe(false);
    expect(result.summary).toBeNull();
    expect(result.error).toBeDefined();
  });
});

