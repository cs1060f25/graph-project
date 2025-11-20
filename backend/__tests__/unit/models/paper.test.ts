import { describe, it, expect } from 'vitest';
import { Paper } from '../../../models/paper.js';

describe('Paper Model', () => {
  describe('Constructor', () => {
    it('should create a Paper instance with all required fields', () => {
      const paper = new Paper(
        'paper-123',
        'Test Title',
        'Test Summary',
        '2024-01-01',
        ['Author One'],
        'https://example.com'
      );

      expect(paper.paper_id).toBe('paper-123');
      expect(paper.title).toBe('Test Title');
      expect(paper.summary).toBe('Test Summary');
      expect(paper.published).toBe('2024-01-01');
      expect(paper.authors).toEqual(['Author One']);
      expect(paper.link).toBe('https://example.com');
    });

    it('should create a Paper instance with optional source', () => {
      const paper = new Paper(
        'paper-123',
        'Test Title',
        'Test Summary',
        '2024-01-01',
        ['Author One'],
        'https://example.com',
        'arxiv'
      );

      expect(paper.source).toBe('arxiv');
    });

    it('should create a Paper instance with optional similarity', () => {
      const paper = new Paper(
        'paper-123',
        'Test Title',
        'Test Summary',
        '2024-01-01',
        ['Author One'],
        'https://example.com',
        'arxiv',
        0.85
      );

      expect(paper.similarity).toBe(0.85);
    });
  });

  describe('toDict', () => {
    it('should convert Paper to dictionary', () => {
      const paper = new Paper(
        'paper-123',
        'Test Title',
        'Test Summary',
        '2024-01-01',
        ['Author One', 'Author Two'],
        'https://example.com',
        'arxiv',
        0.85
      );

      const dict = paper.toDict();

      expect(dict).toEqual({
        paper_id: 'paper-123',
        title: 'Test Title',
        summary: 'Test Summary',
        published: '2024-01-01',
        authors: ['Author One', 'Author Two'],
        link: 'https://example.com',
        source: 'arxiv',
        similarity: 0.85,
      });
    });

    it('should handle Paper without optional fields', () => {
      const paper = new Paper(
        'paper-123',
        'Test Title',
        'Test Summary',
        '2024-01-01',
        ['Author One'],
        'https://example.com'
      );

      const dict = paper.toDict();

      expect(dict.source).toBeUndefined();
      expect(dict.similarity).toBeUndefined();
    });
  });

  describe('fromDict', () => {
    it('should create Paper from dictionary', () => {
      const dict = {
        paper_id: 'paper-123',
        title: 'Test Title',
        summary: 'Test Summary',
        published: '2024-01-01',
        authors: ['Author One'],
        link: 'https://example.com',
        source: 'arxiv',
        similarity: 0.85,
      };

      const paper = Paper.fromDict(dict);

      expect(paper.paper_id).toBe('paper-123');
      expect(paper.title).toBe('Test Title');
      expect(paper.summary).toBe('Test Summary');
      expect(paper.published).toBe('2024-01-01');
      expect(paper.authors).toEqual(['Author One']);
      expect(paper.link).toBe('https://example.com');
      expect(paper.source).toBe('arxiv');
      expect(paper.similarity).toBe(0.85);
    });

    it('should handle dictionary without optional fields', () => {
      const dict = {
        paper_id: 'paper-123',
        title: 'Test Title',
        summary: 'Test Summary',
        published: '2024-01-01',
        authors: ['Author One'],
        link: 'https://example.com',
      };

      const paper = Paper.fromDict(dict);

      expect(paper.source).toBeUndefined();
      expect(paper.similarity).toBeUndefined();
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through toDict and fromDict', () => {
      const original = new Paper(
        'paper-123',
        'Test Title',
        'Test Summary',
        '2024-01-01',
        ['Author One', 'Author Two'],
        'https://example.com',
        'arxiv',
        0.85
      );

      const dict = original.toDict();
      const reconstructed = Paper.fromDict(dict);

      expect(reconstructed.paper_id).toBe(original.paper_id);
      expect(reconstructed.title).toBe(original.title);
      expect(reconstructed.summary).toBe(original.summary);
      expect(reconstructed.published).toBe(original.published);
      expect(reconstructed.authors).toEqual(original.authors);
      expect(reconstructed.link).toBe(original.link);
      expect(reconstructed.source).toBe(original.source);
      expect(reconstructed.similarity).toBe(original.similarity);
    });
  });
});

