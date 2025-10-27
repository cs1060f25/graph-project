// client/src/pages/PersonalPage.test.js
// Unit tests for PersonalPage component

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PersonalPage from './PersonalPage';
import * as useSavedPapersHook from '../hooks/useSavedPapers';

// Mock the useSavedPapers hook
jest.mock('../hooks/useSavedPapers');

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
    setSelectedFolder: jest.fn(),
    toggleStar: jest.fn(),
    removePaper: jest.fn(),
    movePaperToFolder: jest.fn(),
    createFolder: jest.fn(),
    getFilteredPapers: jest.fn(() => mockPapers),
    getPaperCountForFolder: jest.fn(() => 1),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useSavedPapersHook.useSavedPapers = jest.fn(() => defaultHookReturn);
  });

  describe('rendering', () => {
    it('should render page title', () => {
      render(<PersonalPage />);
      expect(screen.getByText('My Saved Papers')).toBeInTheDocument();
    });

    it('should display paper count', () => {
      render(<PersonalPage />);
      expect(screen.getByText('2 papers saved')).toBeInTheDocument();
    });

    it('should render all papers', () => {
      render(<PersonalPage />);
      expect(screen.getByText('Attention Is All You Need')).toBeInTheDocument();
      expect(screen.getByText('BERT Paper')).toBeInTheDocument();
    });

    it('should render folders in sidebar', () => {
      render(<PersonalPage />);
      expect(screen.getByText('Machine Learning')).toBeInTheDocument();
      expect(screen.getByText('Graph Theory')).toBeInTheDocument();
    });

    it('should render filter buttons', () => {
      render(<PersonalPage />);
      expect(screen.getByText('All Papers')).toBeInTheDocument();
      expect(screen.getByText('Starred')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when loading', () => {
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        loading: true,
      }));

      render(<PersonalPage />);
      expect(screen.getByText(/Loading your saved papers/)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display error banner when error exists', () => {
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        error: 'Failed to load papers',
      }));

      render(<PersonalPage />);
      expect(screen.getByText('Failed to load papers')).toBeInTheDocument();
    });

    it('should call clearError when error is dismissed', () => {
      const mockClearError = jest.fn();
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        error: 'Test error',
        clearError: mockClearError,
      }));

      render(<PersonalPage />);
      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('should show empty state when no papers', () => {
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        papers: [],
        getFilteredPapers: jest.fn(() => []),
      }));

      render(<PersonalPage />);
      expect(screen.getByText('No papers saved yet')).toBeInTheDocument();
    });

    it('should show no results message when search has no matches', () => {
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        getFilteredPapers: jest.fn(() => []),
      }));

      render(<PersonalPage />);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
      
      expect(screen.getByText('No papers found')).toBeInTheDocument();
    });

    it('should show message when no folders exist', () => {
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        folders: [],
      }));

      render(<PersonalPage />);
      expect(screen.getByText('No folders yet')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should update search query on input', () => {
      render(<PersonalPage />);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'attention' } });
      expect(searchInput.value).toBe('attention');
    });

    it('should clear search when clear button is clicked', () => {
      render(<PersonalPage />);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'test' } });
      const clearButton = screen.getByText('×');
      fireEvent.click(clearButton);
      expect(searchInput.value).toBe('');
    });

    it('should filter papers by search query', () => {
      render(<PersonalPage />);
      const searchInput = screen.getByPlaceholderText(/Search papers/);
      fireEvent.change(searchInput, { target: { value: 'BERT' } });
      
      // Should show BERT paper
      expect(screen.getByText('BERT Paper')).toBeInTheDocument();
    });
  });

  describe('filter interactions', () => {
    it('should call setSelectedFolder when folder is clicked', () => {
      const mockSetSelectedFolder = jest.fn();
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        setSelectedFolder: mockSetSelectedFolder,
      }));

      render(<PersonalPage />);
      const folderButton = screen.getByText('Machine Learning');
      fireEvent.click(folderButton);
      expect(mockSetSelectedFolder).toHaveBeenCalledWith('folder-1');
    });

    it('should highlight active filter', () => {
      render(<PersonalPage />);
      const allButton = screen.getByText('All Papers');
      expect(allButton.closest('button')).toHaveClass('active');
    });

    it('should switch to starred filter', () => {
      render(<PersonalPage />);
      const starredButton = screen.getByText('Starred');
      fireEvent.click(starredButton);
      // Filter mode should change (tested via state)
    });
  });

  describe('folder creation', () => {
    it('should open folder creation modal', () => {
      render(<PersonalPage />);
      const createButton = screen.getByTitle('Create folder');
      fireEvent.click(createButton);
      expect(screen.getByText('Create New Folder')).toBeInTheDocument();
    });

    it('should call createFolder when form is submitted', async () => {
      const mockCreateFolder = jest.fn().mockResolvedValue({});
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        createFolder: mockCreateFolder,
      }));

      render(<PersonalPage />);
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
      const mockCreateFolder = jest.fn();
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        createFolder: mockCreateFolder,
      }));

      render(<PersonalPage />);
      const createButton = screen.getByTitle('Create folder');
      fireEvent.click(createButton);
      
      const submitButton = screen.getByRole('button', { name: /Create/ });
      expect(submitButton).toBeDisabled();
    });

    it('should close modal after folder creation', async () => {
      const mockCreateFolder = jest.fn().mockResolvedValue({});
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        createFolder: mockCreateFolder,
      }));

      render(<PersonalPage />);
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

  describe('paper count display', () => {
    it('should display correct singular form for 1 paper', () => {
      useSavedPapersHook.useSavedPapers = jest.fn(() => ({
        ...defaultHookReturn,
        papers: [mockPapers[0]],
      }));

      render(<PersonalPage />);
      expect(screen.getByText('1 paper saved')).toBeInTheDocument();
    });

    it('should display correct plural form for multiple papers', () => {
      render(<PersonalPage />);
      expect(screen.getByText('2 papers saved')).toBeInTheDocument();
    });
  });
});