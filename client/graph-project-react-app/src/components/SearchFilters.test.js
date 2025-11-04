// client/src/components/SearchFilters.test.js
// Tests for SearchFilters component

import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from './SearchFilters';

describe('SearchFilters', () => {
  const mockPapers = [
    {
      id: '1',
      title: 'Machine Learning Paper',
      year: 2023,
      citations: 150,
      venue: 'NeurIPS',
      tags: ['ML', 'AI'],
      abstract: 'Abstract text',
    },
    {
      id: '2',
      title: 'Deep Learning Paper',
      year: 2022,
      citations: 50,
      venue: 'ICML',
      tags: ['DL'],
      abstract: '',
    },
    {
      id: '3',
      title: 'Old Paper',
      year: 2010,
      citations: 500,
      venue: 'NeurIPS',
      tags: ['ML'],
    },
  ];

  const defaultProps = {
    papers: mockPapers,
    onFiltersChange: jest.fn(),
    onSortChange: jest.fn(),
    currentSort: 'relevance',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render filters toggle button', () => {
      render(<SearchFilters {...defaultProps} />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('should render sort dropdown', () => {
      render(<SearchFilters {...defaultProps} />);
      expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should not show filters panel initially', () => {
      render(<SearchFilters {...defaultProps} />);
      expect(screen.queryByLabelText('Publication Date')).not.toBeInTheDocument();
    });

    it('should show filters panel when toggle clicked', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByLabelText('Publication Date')).toBeInTheDocument();
    });
  });

  describe('sort functionality', () => {
    it('should call onSortChange when sort option selected', () => {
      render(<SearchFilters {...defaultProps} />);
      const sortSelect = screen.getByRole('combobox');
      
      fireEvent.change(sortSelect, { target: { value: 'date-desc' } });
      
      expect(defaultProps.onSortChange).toHaveBeenCalledWith('date-desc');
    });

    it('should display all sort options', () => {
      render(<SearchFilters {...defaultProps} />);
      const sortSelect = screen.getByRole('combobox');
      
      expect(sortSelect).toHaveTextContent('Relevance');
      expect(sortSelect).toHaveTextContent('Newest First');
      expect(sortSelect).toHaveTextContent('Oldest First');
      expect(sortSelect).toHaveTextContent('Most Citations');
    });
  });

  describe('date range filter', () => {
    it('should render date range inputs', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      expect(screen.getByPlaceholderText('From year')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('To year')).toBeInTheDocument();
    });

    it('should call onFiltersChange when date range updated', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      const fromInput = screen.getByPlaceholderText('From year');
      fireEvent.change(fromInput, { target: { value: '2020' } });
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ dateFrom: '2020' })
      );
    });
  });

  describe('citation filter', () => {
    it('should render minimum citations input', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      expect(screen.getByLabelText('Minimum Citations')).toBeInTheDocument();
    });

    it('should call onFiltersChange when citations filter updated', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      const citationsInput = screen.getByLabelText('Minimum Citations');
      fireEvent.change(citationsInput, { target: { value: '100' } });
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ minCitations: '100' })
      );
    });
  });

  describe('venue filter', () => {
    it('should render venue dropdown with unique venues', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      const venueSelect = screen.getByLabelText('Venue');
      expect(venueSelect).toBeInTheDocument();
      expect(venueSelect).toHaveTextContent('NeurIPS');
      expect(venueSelect).toHaveTextContent('ICML');
    });

    it('should call onFiltersChange when venue selected', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      const venueSelect = screen.getByLabelText('Venue');
      fireEvent.change(venueSelect, { target: { value: 'NeurIPS' } });
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ venue: 'NeurIPS' })
      );
    });
  });

  describe('tags filter', () => {
    it('should render tag checkboxes with unique tags', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      expect(screen.getByText('ML')).toBeInTheDocument();
      expect(screen.getByText('AI')).toBeInTheDocument();
      expect(screen.getByText('DL')).toBeInTheDocument();
    });

    it('should call onFiltersChange when tag toggled', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      // Find the checkbox by its sibling text
      const mlCheckbox = screen.getByText('ML').previousSibling;
      fireEvent.click(mlCheckbox);
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['ML'] })
      );
    });

    it('should handle multiple tag selections', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      const mlCheckbox = screen.getByText('ML').previousSibling;
      const aiCheckbox = screen.getByText('AI').previousSibling;
      
      fireEvent.click(mlCheckbox);
      fireEvent.click(aiCheckbox);
      
      expect(defaultProps.onFiltersChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ tags: expect.arrayContaining(['ML', 'AI']) })
      );
    });
  });

  describe('has abstract filter', () => {
    it('should render has abstract checkbox', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      expect(screen.getByText('Has Abstract')).toBeInTheDocument();
    });

    it('should call onFiltersChange when has abstract toggled', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      const abstractCheckbox = screen.getByText('Has Abstract').previousSibling;
      fireEvent.click(abstractCheckbox);
      
      expect(defaultProps.onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ hasAbstract: true })
      );
    });
  });

  describe('filter badge', () => {
    it('should not show badge when no filters active', () => {
      render(<SearchFilters {...defaultProps} />);
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it('should show badge count when filters active', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      // Apply a filter
      const fromInput = screen.getByPlaceholderText('From year');
      fireEvent.change(fromInput, { target: { value: '2020' } });
      
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('clear filters', () => {
    it('should render clear filters button', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
    });

    it('should disable clear button when no filters active', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      const clearButton = screen.getByText('Clear All Filters');
      expect(clearButton).toBeDisabled();
    });

    it('should clear all filters when clicked', () => {
      render(<SearchFilters {...defaultProps} />);
      fireEvent.click(screen.getByText('Filters'));
      
      // Apply some filters
      const fromInput = screen.getByPlaceholderText('From year');
      fireEvent.change(fromInput, { target: { value: '2020' } });
      
      const citationsInput = screen.getByLabelText('Minimum Citations');
      fireEvent.change(citationsInput, { target: { value: '100' } });
      
      // Clear filters
      const clearButton = screen.getByText('Clear All Filters');
      fireEvent.click(clearButton);
      
      expect(defaultProps.onFiltersChange).toHaveBeenLastCalledWith({
        dateFrom: '',
        dateTo: '',
        minCitations: '',
        venue: '',
        tags: [],
        hasAbstract: false,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle papers without venues', () => {
      const papersWithoutVenue = [
        { id: '1', title: 'Paper 1', tags: [] },
        { id: '2', title: 'Paper 2', tags: [] },
      ];
      
      render(<SearchFilters {...defaultProps} papers={papersWithoutVenue} />);
      fireEvent.click(screen.getByText('Filters'));
      
      expect(screen.queryByLabelText('Venue')).not.toBeInTheDocument();
    });

    it('should handle papers without tags', () => {
      const papersWithoutTags = [
        { id: '1', title: 'Paper 1', venue: 'Test' },
        { id: '2', title: 'Paper 2', venue: 'Test' },
      ];
      
      render(<SearchFilters {...defaultProps} papers={papersWithoutTags} />);
      fireEvent.click(screen.getByText('Filters'));
      
      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    });

    it('should handle empty papers array', () => {
      render(<SearchFilters {...defaultProps} papers={[]} />);
      
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });
});