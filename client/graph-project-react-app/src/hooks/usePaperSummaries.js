// client/src/hooks/usePaperSummaries.js
// React hook for managing AI-generated paper summaries with caching

import { useState, useCallback, useRef } from 'react';
import { generatePaperSummary } from '../services/aiSummaryService';

/**
 * Custom hook for managing paper summaries with in-memory caching
 * @returns {Object} Summary state and methods
 */
export function usePaperSummaries() {
  const [summaries, setSummaries] = useState(new Map()); // Map<paperId, {summary, timestamp}>
  const [loading, setLoading] = useState(new Set()); // Set<paperId>
  const [errors, setErrors] = useState(new Map()); // Map<paperId, errorMessage>
  const generatingRef = useRef(new Set()); // Track papers currently being generated to prevent duplicates

  /**
   * Get summary for a paper (from cache or generate new)
   * @param {string} paperId - Paper ID
   * @param {Object} paperData - Paper data for generation
   * @returns {Promise<{success: boolean, summary: string|null, error: string|null}>}
   */
  const getSummary = useCallback(async (paperId, paperData) => {
    if (!paperId || !paperData) {
      return {
        success: false,
        summary: null,
        error: 'Paper ID and data are required'
      };
    }

    // Check cache first
    const cached = summaries.get(paperId);
    if (cached && cached.summary) {
      return {
        success: true,
        summary: cached.summary,
        error: null,
        fromCache: true
      };
    }

    // Prevent duplicate generation requests
    if (generatingRef.current.has(paperId)) {
      // Wait for existing generation to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const cached = summaries.get(paperId);
          if (cached && cached.summary) {
            clearInterval(checkInterval);
            resolve({
              success: true,
              summary: cached.summary,
              error: null,
              fromCache: true
            });
          } else if (errors.get(paperId)) {
            clearInterval(checkInterval);
            resolve({
              success: false,
              summary: null,
              error: errors.get(paperId)
            });
          }
        }, 100);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve({
            success: false,
            summary: null,
            error: 'Summary generation timeout'
          });
        }, 30000);
      });
    }

    // Generate new summary
    generatingRef.current.add(paperId);
    setLoading(prev => new Set(prev).add(paperId));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(paperId); // Clear any previous error
      return newErrors;
    });

    try {
      const result = await generatePaperSummary(paperData);
      
      if (result.success && result.summary) {
        // Cache the summary
        setSummaries(prev => {
          const newMap = new Map(prev);
          newMap.set(paperId, {
            summary: result.summary,
            timestamp: Date.now()
          });
          return newMap;
        });
        
        return result;
      } else {
        // Cache the error
        const errorMsg = result.error || 'Failed to generate summary';
        setErrors(prev => {
          const newErrors = new Map(prev);
          newErrors.set(paperId, errorMsg);
          return newErrors;
        });
        
        return result;
      }
    } catch (error) {
      console.error(`Error generating summary for paper ${paperId}:`, error);
      const errorMsg = error.message || 'Failed to generate summary';
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.set(paperId, errorMsg);
        return newErrors;
      });
      
      return {
        success: false,
        summary: null,
        error: errorMsg
      };
    } finally {
      generatingRef.current.delete(paperId);
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
    }
  }, [summaries, errors]);

  /**
   * Get cached summary if available
   * @param {string} paperId - Paper ID
   * @returns {string|null} Cached summary or null
   */
  const getCachedSummary = useCallback((paperId) => {
    const cached = summaries.get(paperId);
    return cached ? cached.summary : null;
  }, [summaries]);

  /**
   * Check if summary is loading
   * @param {string} paperId - Paper ID
   * @returns {boolean} True if loading
   */
  const isLoading = useCallback((paperId) => {
    return loading.has(paperId);
  }, [loading]);

  /**
   * Get error for a paper
   * @param {string} paperId - Paper ID
   * @returns {string|null} Error message or null
   */
  const getError = useCallback((paperId) => {
    return errors.get(paperId) || null;
  }, [errors]);

  /**
   * Clear cache for a specific paper or all papers
   * @param {string} [paperId] - Paper ID to clear (optional, clears all if omitted)
   */
  const clearCache = useCallback((paperId) => {
    if (paperId) {
      setSummaries(prev => {
        const newMap = new Map(prev);
        newMap.delete(paperId);
        return newMap;
      });
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(paperId);
        return newErrors;
      });
    } else {
      setSummaries(new Map());
      setErrors(new Map());
    }
  }, []);

  return {
    getSummary,
    getCachedSummary,
    isLoading,
    getError,
    clearCache
  };
}
