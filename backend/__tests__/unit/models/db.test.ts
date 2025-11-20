import { describe, it, expect } from 'vitest';
import {
  validateUserId,
  validateFolderName,
  validatePaperData,
  validateQueryHistoryData,
} from '../../../models/db.js';

describe('Model Validation Functions', () => {
  describe('validateUserId', () => {
    it('should accept valid user ID', () => {
      expect(() => validateUserId('valid-uid-123')).not.toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => validateUserId('')).toThrow('User ID is required');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => validateUserId('   ')).toThrow('User ID is required');
    });

    it('should throw error for null', () => {
      expect(() => validateUserId(null as any)).toThrow('User ID is required');
    });

    it('should throw error for undefined', () => {
      expect(() => validateUserId(undefined as any)).toThrow('User ID is required');
    });

    it('should throw error for non-string', () => {
      expect(() => validateUserId(123 as any)).toThrow('User ID is required');
    });
  });

  describe('validateFolderName', () => {
    it('should accept valid folder name', () => {
      expect(() => validateFolderName('My Folder')).not.toThrow();
    });

    it('should accept folder name with special characters', () => {
      expect(() => validateFolderName('Folder-Name_123')).not.toThrow();
    });

    it('should trim whitespace and accept', () => {
      expect(() => validateFolderName('  Valid Folder  ')).not.toThrow();
    });

    it('should throw error for empty string', () => {
      expect(() => validateFolderName('')).toThrow('Folder name is required');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => validateFolderName('   ')).toThrow('Folder name cannot be empty');
    });

    it('should throw error for null', () => {
      expect(() => validateFolderName(null as any)).toThrow('Folder name is required');
    });

    it('should throw error for undefined', () => {
      expect(() => validateFolderName(undefined as any)).toThrow('Folder name is required');
    });

    it('should throw error for non-string', () => {
      expect(() => validateFolderName(123 as any)).toThrow('Folder name is required');
    });

    it('should throw error for name exceeding 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(() => validateFolderName(longName)).toThrow('cannot exceed 100 characters');
    });

    it('should throw error for name with newline', () => {
      expect(() => validateFolderName('Folder\nName')).toThrow('cannot contain newlines');
    });

    it('should throw error for name with tab', () => {
      expect(() => validateFolderName('Folder\tName')).toThrow('cannot contain');
    });

    it('should throw error for name with carriage return', () => {
      expect(() => validateFolderName('Folder\rName')).toThrow('cannot contain');
    });
  });

  describe('validatePaperData', () => {
    it('should accept valid paper data', () => {
      const validPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
      };
      expect(() => validatePaperData(validPaper)).not.toThrow();
    });

    it('should accept paper with all optional fields', () => {
      const fullPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
        summary: 'Summary',
        published: '2024-01-01',
        source: 'arxiv',
        similarity: 0.85,
        paper_id: '123',
        starred: true,
        folderId: 'folder-123',
      };
      expect(() => validatePaperData(fullPaper)).not.toThrow();
    });

    it('should throw error for missing title', () => {
      const invalidPaper = {
        authors: ['Author One'],
        link: 'https://example.com',
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('Missing required fields');
    });

    it('should throw error for missing authors', () => {
      const invalidPaper = {
        title: 'Test Paper',
        link: 'https://example.com',
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('Missing required fields');
    });

    it('should throw error for missing link', () => {
      const invalidPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('Missing required fields');
    });

    it('should throw error for empty title', () => {
      const invalidPaper = {
        title: '',
        authors: ['Author One'],
        link: 'https://example.com',
      };
      // Validation checks for missing required fields first, then validates individual fields
      expect(() => validatePaperData(invalidPaper)).toThrow();
    });

    it('should throw error for whitespace-only title', () => {
      const invalidPaper = {
        title: '   ',
        authors: ['Author One'],
        link: 'https://example.com',
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('title must be a non-empty string');
    });

    it('should throw error for empty authors array', () => {
      const invalidPaper = {
        title: 'Test Paper',
        authors: [],
        link: 'https://example.com',
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('authors must be a non-empty array');
    });

    it('should throw error for non-array authors', () => {
      const invalidPaper = {
        title: 'Test Paper',
        authors: 'Author One' as any,
        link: 'https://example.com',
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('authors must be a non-empty array');
    });

    it('should throw error for empty link', () => {
      const invalidPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: '',
      };
      // Validation checks for missing required fields first, then validates individual fields
      expect(() => validatePaperData(invalidPaper)).toThrow();
    });

    it('should throw error for invalid starred type', () => {
      const invalidPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
        starred: 'true' as any,
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('starred must be a boolean');
    });

    it('should throw error for invalid folderId type', () => {
      const invalidPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
        folderId: 123 as any,
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('folderId must be a string or null');
    });

    it('should accept null folderId', () => {
      const validPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
        folderId: null,
      };
      expect(() => validatePaperData(validPaper)).not.toThrow();
    });

    it('should throw error for invalid similarity type', () => {
      const invalidPaper = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
        similarity: '0.85' as any,
      };
      expect(() => validatePaperData(invalidPaper)).toThrow('similarity must be a number');
    });

    it('should throw error for null input', () => {
      expect(() => validatePaperData(null as any)).toThrow('Paper data is required');
    });

    it('should throw error for undefined input', () => {
      expect(() => validatePaperData(undefined as any)).toThrow('Paper data is required');
    });
  });

  describe('validateQueryHistoryData', () => {
    it('should accept valid query history data', () => {
      const validQuery = {
        query: 'test query',
      };
      expect(() => validateQueryHistoryData(validQuery)).not.toThrow();
    });

    it('should accept query with all fields', () => {
      const fullQuery = {
        query: 'test query',
        type: 'keyword',
        resultCount: 10,
      };
      expect(() => validateQueryHistoryData(fullQuery)).not.toThrow();
    });

    it('should throw error for missing query', () => {
      const invalidQuery = {
        type: 'keyword',
      };
      expect(() => validateQueryHistoryData(invalidQuery)).toThrow('Query text is required');
    });

    it('should throw error for empty query string', () => {
      const invalidQuery = {
        query: '',
      };
      expect(() => validateQueryHistoryData(invalidQuery)).toThrow('Query text is required');
    });

    it('should throw error for non-string query', () => {
      const invalidQuery = {
        query: 123 as any,
      };
      expect(() => validateQueryHistoryData(invalidQuery)).toThrow('Query text is required');
    });

    it('should throw error for negative resultCount', () => {
      const invalidQuery = {
        query: 'test',
        resultCount: -1,
      };
      expect(() => validateQueryHistoryData(invalidQuery)).toThrow('resultCount must be a non-negative number');
    });

    it('should accept zero resultCount', () => {
      const validQuery = {
        query: 'test',
        resultCount: 0,
      };
      expect(() => validateQueryHistoryData(validQuery)).not.toThrow();
    });

    it('should throw error for null input', () => {
      expect(() => validateQueryHistoryData(null as any)).toThrow('Query data is required');
    });

    it('should throw error for undefined input', () => {
      expect(() => validateQueryHistoryData(undefined as any)).toThrow('Query data is required');
    });
  });
});

