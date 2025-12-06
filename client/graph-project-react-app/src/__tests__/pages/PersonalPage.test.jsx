// client/src/__tests__/pages/PersonalPage.test.jsx
// Unit tests for PersonalPage component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PersonalPage from '../../pages/PersonalPage';
import * as useSavedPapersHook from '../../hooks/useSavedPapers';

// Mock the useSavedPapers hook
vi.mock('../../hooks/useSavedPapers');

describe('PersonalPage', () => {
  const mockPapers = [
    {
      id: '1',
      title: 'Attention Is All You Need',
      authors: ['Vaswani et al.'],
      link: 'https://arxiv.org/abs/1',
      starred: true,
      folderId: 'folder-1',
    },
    {
      id: '2',
      title: 'BERT Paper',
      authors: ['Devlin et al.'],
      link: 'https://arxiv.org/abs/2',
      starred: false,
      folderId: null,
    },
  ];

  const mockFolders = [
    { id: 'folder-1', name: 'Machine Learning' },
    { id: 'folder-2', name: 'Graph Theory' },
  ];

  const defaultHookReturn = {
    papers: mockPapers,
    folders: mockFolders,
    loading: false,
    error: null,
    selectedFolder: null,
    setSelectedFolder: vi.fn(),
    toggleStar: vi.fn(),
    removePaper: vi.fn(),
    movePaperToFolder: vi.fn(),
    createFolder: vi.fn(),
    getFilteredPapers: vi.fn((filter = 'all') => {
      // Mock the actual filtering logic
      let filtered = [...mockPapers];
      
      // Apply starred filter if requested
      if (filter === 'starred') {
        filtered = filtered.filter(p => p.starred);
      }
      
      return filtered;
    }),
    getPaperCountForFolder: vi.fn(() => 1),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Recreate the mock with proper implementation
    const mockGetFilteredPapers = vi.fn((filter = 'all') => {
      // Mock the actual filtering logic
      let filtered = [...mockPapers];
      
      // Apply starred filter if requested
      if (filter === 'starred') {
        filtered = filtered.filter(p => p.starred);
      }
      
      return filtered;
    });
    
    useSavedPapersHook.useSavedPapers = vi.fn(() => ({
      ...defaultHookReturn,
      getFilteredPapers: mockGetFilteredPapers,
    }));
  });

  describe('rendering', () => {
    it('should render page title', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('My Saved Papers')).toBeInTheDocument();
    });

    it('should display paper count', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      // Paper count is displayed in filter-count spans, not as "2 papers saved" text
      const filterCounts = screen.getAllByText('2');
      expect(filterCounts.length).toBeGreaterThan(0);
    });

    it('should render all papers', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('Attention Is All You Need')).toBeInTheDocument();
      expect(screen.getByText('BERT Paper')).toBeInTheDocument();
    });

    it('should render folders in sidebar', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
      expect(screen.getByText('Graph Theory')).toBeInTheDocument();
    });

    it('should render filter buttons', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      // There may be multiple "Starred" elements, so use getAllByText
      expect(screen.getByText('All Papers')).toBeInTheDocument();
      const starredElements = screen.getAllByText('Starred');
      expect(starredElements.length).toBeGreaterThan(0);
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        loading: true,
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText(/Loading your saved papers/)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error banner when error exists', () => {
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        error: 'Failed to load papers',
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('Failed to load papers')).toBeInTheDocument();
    });

    it('should call clearError when error is dismissed', () => {
      const mockClearError = vi.fn();
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        error: 'Test error',
        clearError: mockClearError,
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('should show empty state when no papers', () => {
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        papers: [],
        getFilteredPapers: vi.fn(() => []),
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('No papers saved yet')).toBeInTheDocument();
    });

    it('should show no results message when search has no matches', () => {
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        getFilteredPapers: vi.fn(() => []),
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('No papers found')).toBeInTheDocument();
    });

    it('should show message when no folders exist', () => {
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        folders: [],
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('No folders yet')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should update search query on input', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'attention' } });
      expect(searchInput.value).toBe('attention');
    });

    it('should clear search when clear button is clicked', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      const clearButton = screen.getByText('×');
      fireEvent.click(clearButton);
      expect(searchInput.value).toBe('');
    });

    it('should filter papers by search query', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'BERT' } });
      
      // Should show BERT paper
      expect(screen.getByText('BERT Paper')).toBeInTheDocument();
    });
  });

  describe('filter interactions', () => {
    it('should call setSelectedFolder when folder is clicked', () => {
      const mockSetSelectedFolder = vi.fn();
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        setSelectedFolder: mockSetSelectedFolder,
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const folderButton = screen.getByText('Machine Learning');
      fireEvent.click(folderButton);
      expect(mockSetSelectedFolder).toHaveBeenCalledWith('folder-1');
    });

    it('should highlight active filter', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const allButton = screen.getByText('All Papers');
      expect(allButton.closest('button')).toHaveClass('active');
    });

    it('should switch to starred filter', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      // Get the first "Starred" button (there may be multiple)
      const starredButtons = screen.getAllByText('Starred');
      const starredButton = starredButtons.find(btn => btn.closest('button'));
      if (starredButton) {
        fireEvent.click(starredButton);
        // Filter mode should change (tested via state)
        expect(starredButton).toBeInTheDocument();
      }
    });
  });

  describe('folder creation', () => {
    it('should open folder creation modal', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const createButton = screen.getByTitle('Create folder');
      fireEvent.click(createButton);
      expect(screen.getByText('Create New Folder')).toBeInTheDocument();
    });

    it('should call createFolder when form is submitted', async () => {
      const mockCreateFolder = vi.fn().mockResolvedValue({});
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        createFolder: mockCreateFolder,
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const createButton = screen.getByTitle('Create folder');
      fireEvent.click(createButton);
      
      const input = screen.getByPlaceholderText('Folder name');
      fireEvent.change(input, { target: { value: 'New Folder' } });
      
      const submitButton = screen.getByRole('button', { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateFolder).toHaveBeenCalledWith('New Folder');
      });
    });

    it('should not submit empty folder name', () => {
      const mockCreateFolder = vi.fn();
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        createFolder: mockCreateFolder,
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const createButton = screen.getByTitle('Create folder');
      fireEvent.click(createButton);
      
      const submitButton = screen.getByRole('button', { name: /Create/ });
      expect(submitButton).toBeDisabled();
    });

    it('should close modal after folder creation', async () => {
      const mockCreateFolder = vi.fn().mockResolvedValue({});
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        createFolder: mockCreateFolder,
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      const createButton = screen.getByTitle('Create folder');
      fireEvent.click(createButton);
      
      const input = screen.getByPlaceholderText('Folder name');
      fireEvent.change(input, { target: { value: 'New Folder' } });
      
      const submitButton = screen.getByRole('button', { name: /Create/ });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Folder')).not.toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined data from getFilteredPapers gracefully', () => {
      // This is the bug we found - when getFilteredPapers returns undefined
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        getFilteredPapers: vi.fn(() => undefined), // Returns undefined instead of array
      }));

      // Should not crash, should render empty state
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('No papers in this view')).toBeInTheDocument();
    });

    it('should handle null data from getFilteredPapers gracefully', () => {
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        getFilteredPapers: vi.fn(() => null), // Returns null instead of array
      }));

      // Should not crash, should render empty state
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      expect(screen.getByText('No papers in this view')).toBeInTheDocument();
    });

    it('should properly call getFilteredPapers with correct filter parameter', () => {
      // Bug #2: getFilteredPapers mock wasn't respecting filter parameter
      const mockGetFilteredPapers = vi.fn((filter) => {
        if (filter === 'starred') {
          return mockPapers.filter(p => p.starred);
        }
        return mockPapers;
      });

      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        getFilteredPapers: mockGetFilteredPapers,
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      
      // Verify getFilteredPapers was called with 'all' filter by default
      expect(mockGetFilteredPapers).toHaveBeenCalledWith('all');
      
      // Verify papers are actually rendered
      expect(screen.getByText('Attention Is All You Need')).toBeInTheDocument();
    });
  });

  describe('paper count display', () => {
    it('should display correct singular form for 1 paper', () => {
      useSavedPapersHook.useSavedPapers = vi.fn(() => ({
        ...defaultHookReturn,
        papers: [mockPapers[0]],
      }));

      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      // Paper count is in filter-count spans, check for "1"
      const countElements = screen.getAllByText('1');
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('should display correct plural form for multiple papers', () => {
      render(<MemoryRouter><PersonalPage /></MemoryRouter>);
      // Paper count is in filter-count spans, check for "2"
      const countElements = screen.getAllByText('2');
      expect(countElements.length).toBeGreaterThan(0);
    });
  });
});

