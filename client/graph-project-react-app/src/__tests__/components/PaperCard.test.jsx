// client/src/components/PaperCard.test.js
// Unit tests for PaperCard component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaperCard from '../../components/PaperCard';

describe('PaperCard', () => {
  const mockPaper = {
    id: '1',
    title: 'Test Paper Title',
    authors: ['Author One', 'Author Two'],
    link: 'https://example.com/paper',
    abstract: 'This is a test abstract for the paper.',
    starred: false,
    createdAt: Date.now(),
  };

  const mockFolders = [
    { id: 'folder-1', name: 'Machine Learning' },
    { id: 'folder-2', name: 'Graph Theory' },
  ];

  const defaultProps = {
    paper: mockPaper,
    onToggleStar: vi.fn(),
    onRemove: vi.fn(),
    onMoveToFolder: vi.fn(),
    folders: mockFolders,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render paper title', () => {
      render(<PaperCard {...defaultProps} />);
      expect(screen.getByText('Test Paper Title')).toBeInTheDocument();
    });

    it('should render authors', () => {
      render(<PaperCard {...defaultProps} />);
      expect(screen.getByText(/Author One, Author Two/)).toBeInTheDocument();
    });

    it('should render abstract', () => {
      render(<PaperCard {...defaultProps} />);
      expect(screen.getByText(/This is a test abstract/)).toBeInTheDocument();
    });

    it('should render paper link', () => {
      render(<PaperCard {...defaultProps} />);
      const links = screen.getAllByRole('link');
      expect(links[0]).toHaveAttribute('href', 'https://example.com/paper');
    });

    it('should show starred badge when paper is starred', () => {
      const starredPaper = { ...mockPaper, starred: true };
      render(<PaperCard {...defaultProps} paper={starredPaper} />);
      expect(screen.getByText(/Starred/)).toBeInTheDocument();
    });

    it('should not show starred badge when paper is not starred', () => {
      render(<PaperCard {...defaultProps} />);
      expect(screen.queryByText(/Starred/)).not.toBeInTheDocument();
    });
  });

  describe('star button interaction', () => {
    it('should call onToggleStar when star button is clicked', () => {
      render(<PaperCard {...defaultProps} />);
      const starButton = screen.getByTitle(/Star/);
      fireEvent.click(starButton);
      expect(defaultProps.onToggleStar).toHaveBeenCalledWith('1');
    });

    it('should show filled star when paper is starred', () => {
      const starredPaper = { ...mockPaper, starred: true };
      render(<PaperCard {...defaultProps} paper={starredPaper} />);
      const starButton = screen.getByTitle(/Unstar/);
      expect(starButton).toHaveTextContent('★');
    });

    it('should show empty star when paper is not starred', () => {
      render(<PaperCard {...defaultProps} />);
      const starButton = screen.getByTitle(/Star/);
      expect(starButton).toHaveTextContent('☆');
    });
  });

  describe('actions menu', () => {
    it('should show actions dropdown when more button is clicked', () => {
      render(<PaperCard {...defaultProps} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      expect(screen.getByText(/Move to folder:/)).toBeInTheDocument();
    });

    it('should display folders in dropdown', () => {
      render(<PaperCard {...defaultProps} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      expect(screen.getByText(/Machine Learning/)).toBeInTheDocument();
      expect(screen.getByText(/Graph Theory/)).toBeInTheDocument();
    });

    it('should call onMoveToFolder when folder is selected', () => {
      render(<PaperCard {...defaultProps} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      const folderButton = screen.getByText(/Machine Learning/);
      fireEvent.click(folderButton);
      expect(defaultProps.onMoveToFolder).toHaveBeenCalledWith('1', 'folder-1');
    });

    it('should show remove button in dropdown', () => {
      render(<PaperCard {...defaultProps} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      expect(screen.getByText(/Remove paper/)).toBeInTheDocument();
    });
  });

  describe('remove confirmation', () => {
    it('should show confirmation modal when remove is clicked', () => {
      render(<PaperCard {...defaultProps} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      const removeButton = screen.getByText(/Remove paper/);
      fireEvent.click(removeButton);
      expect(screen.getByText(/Are you sure you want to remove/)).toBeInTheDocument();
    });

    it('should call onRemove when confirmed', () => {
      render(<PaperCard {...defaultProps} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      const removeButton = screen.getByText(/Remove paper/);
      fireEvent.click(removeButton);
      const confirmButton = screen.getByRole('button', { name: /Remove/ });
      fireEvent.click(confirmButton);
      expect(defaultProps.onRemove).toHaveBeenCalledWith('1');
    });

    it('should not call onRemove when cancelled', () => {
      render(<PaperCard {...defaultProps} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      const removeButton = screen.getByText(/Remove paper/);
      fireEvent.click(removeButton);
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      fireEvent.click(cancelButton);
      expect(defaultProps.onRemove).not.toHaveBeenCalled();
    });
  });

  describe('abstract truncation', () => {
    it('should truncate long abstracts', () => {
      const longAbstract = 'A'.repeat(300);
      const longPaper = { ...mockPaper, abstract: longAbstract };
      render(<PaperCard {...defaultProps} paper={longPaper} />);
      const abstractText = screen.getByText(/A+\.\.\./);
      expect(abstractText.textContent.length).toBeLessThan(longAbstract.length);
    });

    it('should not truncate short abstracts', () => {
      const shortAbstract = 'Short abstract';
      const shortPaper = { ...mockPaper, abstract: shortAbstract };
      render(<PaperCard {...defaultProps} paper={shortPaper} />);
      expect(screen.getByText('Short abstract')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle paper without abstract', () => {
      const paperNoAbstract = { ...mockPaper, abstract: null };
      render(<PaperCard {...defaultProps} paper={paperNoAbstract} />);
      expect(screen.getByText('Test Paper Title')).toBeInTheDocument();
    });

    it('should handle paper with no folders available', () => {
      render(<PaperCard {...defaultProps} folders={[]} />);
      const moreButton = screen.getByTitle(/More actions/);
      fireEvent.click(moreButton);
      expect(screen.queryByText(/Move to folder:/)).not.toBeInTheDocument();
    });

    it('should handle string authors instead of array', () => {
      const paperStringAuthors = { ...mockPaper, authors: 'Single Author' };
      render(<PaperCard {...defaultProps} paper={paperStringAuthors} />);
      expect(screen.getByText('Single Author')).toBeInTheDocument();
    });
  });
});