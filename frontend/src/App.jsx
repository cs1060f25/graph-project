import React, { useState, useEffect } from 'react';
import PaperLibrary from './components/PaperLibrary';
import RelatedPapers from './components/RelatedPapers';
import FilterBar from './components/FilterBar';
import AIChatbot from './components/AIChatbot';
import { api } from './services/api';

function App() {
  const [savedPapers, setSavedPapers] = useState([]);
  const [relatedPapers, setRelatedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    keyword: ''
  });
  const [relatedFilters, setRelatedFilters] = useState({
    category: '',
    author: '',
    keyword: ''
  });
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Load saved papers
  useEffect(() => {
    loadSavedPapers();
  }, [filters]);

  // Load related papers when a paper is selected or filters change
  useEffect(() => {
    if (savedPapers.length > 0) {
      // Use first paper as reference for related papers
      const referencePaper = savedPapers[0];
      loadRelatedPapers(referencePaper.id);
    }
  }, [savedPapers, relatedFilters]);

  const loadSavedPapers = async () => {
    try {
      setLoading(true);
      const papers = await api.getSavedPapers(filters);
      setSavedPapers(papers);
      setError(null);
    } catch (err) {
      setError('Failed to load papers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPapers = async (paperId) => {
    try {
      const papers = await api.getRelatedPapers(paperId, relatedFilters);
      setRelatedPapers(papers);
    } catch (err) {
      console.error('Failed to load related papers:', err);
    }
  };

  const handleFindSimilar = async (paperId) => {
    try {
      const similar = await api.findSimilarPapers(paperId);
      setRelatedPapers(similar);
    } catch (err) {
      console.error('Failed to find similar papers:', err);
    }
  };

  const handlePaperSelect = (paper) => {
    setSelectedPaper(paper);
    setChatOpen(true);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleRelatedFilterChange = (newFilters) => {
    setRelatedFilters(newFilters);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Research Paper Discovery</h1>
          <p className="app-subtitle">Explore and discover cutting-edge research across multiple domains</p>
        </div>
      </header>

      <main className="app-main">
        <section className="library-section">
          <div className="section-header">
            <h2>Your Library</h2>
            <p className="section-description">
              Your saved papers across {new Set(savedPapers.map(p => p.category)).size} research domains
            </p>
          </div>

          <FilterBar 
            filters={filters} 
            onFilterChange={handleFilterChange}
            paperCount={savedPapers.length}
          />

          {loading && <div className="loading">Loading papers...</div>}
          {error && <div className="error">{error}</div>}
          
          {!loading && !error && (
            <PaperLibrary 
              papers={savedPapers}
              onFindSimilar={handleFindSimilar}
              onSelectPaper={handlePaperSelect}
            />
          )}
        </section>

        <section className="related-section">
          <div className="section-header">
            <h2>Explore Adjacent Topics</h2>
            <p className="section-description">
              Discover papers in related fields you haven't explored yet
            </p>
          </div>

          <FilterBar 
            filters={relatedFilters} 
            onFilterChange={handleRelatedFilterChange}
            paperCount={relatedPapers.length}
            isRelated={true}
          />

          <RelatedPapers 
            papers={relatedPapers}
            onSelectPaper={handlePaperSelect}
          />
        </section>
      </main>

      <AIChatbot 
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        selectedPaper={selectedPaper}
      />

      <footer className="app-footer">
        <p>Research Paper Discovery Platform • CS 1060 Project</p>
      </footer>
    </div>
  );
}

export default App;