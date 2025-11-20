import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as dbService from '../../../services/db_service.js';
import { cleanupTestUser, createTestUser, getTestUid } from '../../utils/db-setup.js';

describe('DB Service - Integration Tests', () => {
  let testUid: string;

  beforeEach(async () => {
    testUid = getTestUid();
    // Clean up any existing test data
    await cleanupTestUser(testUid);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestUser(testUid);
  });

  describe('User Operations', () => {
    it('should create and retrieve user', async () => {
      const user = await dbService.createUser(testUid, 'test@example.com');

      expect(user.id).toBe(testUid);
      expect(user.email).toBe('test@example.com');
      expect(user.preferences).toEqual({});
      expect(user.createdAt).toBeGreaterThan(0);

      const retrieved = await dbService.getUser(testUid);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      const user = await dbService.getUser('non-existent-uid');
      expect(user).toBeNull();
    });

    it('should update user preferences', async () => {
      await dbService.createUser(testUid, 'test@example.com');

      await dbService.updateUserPreferences(testUid, {
        theme: 'dark',
        notifications: true,
      });

      const user = await dbService.getUser(testUid);
      expect(user?.preferences).toEqual({
        theme: 'dark',
        notifications: true,
      });
    });
  });

  describe('Folder Operations', () => {
    beforeEach(async () => {
      await dbService.createUser(testUid, 'test@example.com');
    });

    it('should create and retrieve folders', async () => {
      const folder1 = await dbService.createFolder(testUid, 'Folder 1');
      const folder2 = await dbService.createFolder(testUid, 'Folder 2');

      expect(folder1.id).toBeTruthy();
      expect(folder1.name).toBe('Folder 1');
      expect(folder2.name).toBe('Folder 2');

      const folders = await dbService.getFolders(testUid);
      expect(folders).toHaveLength(2);
      expect(folders.map(f => f.name)).toContain('Folder 1');
      expect(folders.map(f => f.name)).toContain('Folder 2');
    });

    it('should update folder name', async () => {
      const folder = await dbService.createFolder(testUid, 'Original Name');

      const updated = await dbService.updateFolder(testUid, folder.id, 'Updated Name');

      expect(updated.name).toBe('Updated Name');
      expect(updated.id).toBe(folder.id);

      const folders = await dbService.getFolders(testUid);
      expect(folders.find(f => f.id === folder.id)?.name).toBe('Updated Name');
    });

    it('should delete folder', async () => {
      const folder = await dbService.createFolder(testUid, 'To Delete');

      await dbService.deleteFolder(testUid, folder.id);

      const folders = await dbService.getFolders(testUid);
      expect(folders).toHaveLength(0);
    });

    it('should throw error when updating non-existent folder', async () => {
      await expect(
        dbService.updateFolder(testUid, 'non-existent-id', 'New Name')
      ).rejects.toThrow('Folder not found');
    });
  });

  describe('Saved Paper Operations', () => {
    beforeEach(async () => {
      await dbService.createUser(testUid, 'test@example.com');
    });

    it('should create and retrieve saved papers', async () => {
      const paperData = {
        title: 'Test Paper',
        authors: ['Author One', 'Author Two'],
        link: 'https://example.com/paper',
        summary: 'Test summary',
        published: '2024-01-01',
        source: 'arxiv',
        starred: false,
        folderId: null,
      };

      const paper = await dbService.createSavedPaper(testUid, paperData);

      expect(paper.id).toBeTruthy();
      expect(paper.title).toBe('Test Paper');
      expect(paper.authors).toEqual(['Author One', 'Author Two']);
      expect(paper.starred).toBe(false);
      expect(paper.folderId).toBeNull();
      expect(paper.createdAt).toBeGreaterThan(0);
      expect(paper.updatedAt).toBeGreaterThan(0);

      const papers = await dbService.getSavedPapers(testUid);
      expect(papers).toHaveLength(1);
      expect(papers[0].title).toBe('Test Paper');
    });

    it('should retrieve papers in descending order by createdAt', async () => {
      const paper1 = await dbService.createSavedPaper(testUid, {
        title: 'Paper 1',
        authors: ['Author'],
        link: 'https://example.com/1',
        summary: '',
        published: '2024-01-01',
        starred: false,
        folderId: null,
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const paper2 = await dbService.createSavedPaper(testUid, {
        title: 'Paper 2',
        authors: ['Author'],
        link: 'https://example.com/2',
        summary: '',
        published: '2024-01-01',
        starred: false,
        folderId: null,
      });

      const papers = await dbService.getSavedPapers(testUid);

      expect(papers).toHaveLength(2);
      expect(papers[0].id).toBe(paper2.id); // Most recent first
      expect(papers[1].id).toBe(paper1.id);
    });

    it('should update saved paper', async () => {
      const paper = await dbService.createSavedPaper(testUid, {
        title: 'Original Title',
        authors: ['Author'],
        link: 'https://example.com',
        summary: '',
        published: '2024-01-01',
        starred: false,
        folderId: null,
      });

      const updated = await dbService.updateSavedPaper(testUid, paper.id, {
        title: 'Updated Title',
        starred: true,
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.starred).toBe(true);
      expect(updated.updatedAt).toBeGreaterThan(paper.updatedAt);
    });

    it('should delete saved paper', async () => {
      const paper = await dbService.createSavedPaper(testUid, {
        title: 'To Delete',
        authors: ['Author'],
        link: 'https://example.com',
        summary: '',
        published: '2024-01-01',
        starred: false,
        folderId: null,
      });

      await dbService.deleteSavedPaper(testUid, paper.id);

      const papers = await dbService.getSavedPapers(testUid);
      expect(papers).toHaveLength(0);
    });

    it('should associate paper with folder', async () => {
      const folder = await dbService.createFolder(testUid, 'My Folder');
      const paper = await dbService.createSavedPaper(testUid, {
        title: 'Paper',
        authors: ['Author'],
        link: 'https://example.com',
        summary: '',
        published: '2024-01-01',
        starred: false,
        folderId: folder.id,
      });

      expect(paper.folderId).toBe(folder.id);
    });
  });

  describe('Query History Operations', () => {
    beforeEach(async () => {
      await dbService.createUser(testUid, 'test@example.com');
    });

    it('should add and retrieve query history', async () => {
      const historyItem = await dbService.addQueryHistory(testUid, {
        query: 'machine learning',
        type: 'keyword',
        resultCount: 10,
      });

      expect(historyItem.id).toBeTruthy();
      expect(historyItem.query).toBe('machine learning');
      expect(historyItem.type).toBe('keyword');
      expect(historyItem.resultCount).toBe(10);
      expect(historyItem.timestamp).toBeGreaterThan(0);

      const history = await dbService.getQueryHistory(testUid);
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe('machine learning');
    });

    it('should retrieve history in descending order', async () => {
      await dbService.addQueryHistory(testUid, {
        query: 'Query 1',
        type: 'keyword',
        resultCount: 5,
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await dbService.addQueryHistory(testUid, {
        query: 'Query 2',
        type: 'keyword',
        resultCount: 10,
      });

      const history = await dbService.getQueryHistory(testUid);
      expect(history).toHaveLength(2);
      expect(history[0].query).toBe('Query 2'); // Most recent first
      expect(history[1].query).toBe('Query 1');
    });

    it('should respect limit parameter', async () => {
      // Add multiple history items
      for (let i = 0; i < 5; i++) {
        await dbService.addQueryHistory(testUid, {
          query: `Query ${i}`,
          type: 'keyword',
          resultCount: i,
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const history = await dbService.getQueryHistory(testUid, 3);
      expect(history).toHaveLength(3);
    });

    it('should clear all query history', async () => {
      await dbService.addQueryHistory(testUid, {
        query: 'Query 1',
        type: 'keyword',
        resultCount: 5,
      });

      await dbService.addQueryHistory(testUid, {
        query: 'Query 2',
        type: 'keyword',
        resultCount: 10,
      });

      const deletedCount = await dbService.clearQueryHistory(testUid);
      expect(deletedCount).toBe(2);

      const history = await dbService.getQueryHistory(testUid);
      expect(history).toHaveLength(0);
    });

    it('should return 0 when clearing empty history', async () => {
      const deletedCount = await dbService.clearQueryHistory(testUid);
      expect(deletedCount).toBe(0);
    });
  });
});

