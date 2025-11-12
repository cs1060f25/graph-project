import { useState } from 'react';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import './PersonalPage.css'; // reuse existing styles
import Icon from '../components/Icon';

export default function ExplorationPage() {
  const luckyTopics = [
    'Machine Learning',
    'Artificial Intelligence',
    'Quantum Computing',
    'Natural Language Processing',
    'Robotics',
    'Computer Vision',
  ];

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedTopics, setSavedTopics] = useState([]);

  const apiHandler = new APIHandlerInterface({ maxResults: 5 });
  const userId = 'authenticated-user'; // replace with auth context if available

  const handleSelectTopic = async (topic) => {
    setSelectedTopic(topic);
    setError(null);
    setLoading(true);

    try {
      const results = await apiHandler.makeQuery(topic, { type: 'topic', userId, forceRefresh: true });
      setPapers(results);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch papers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeelingLucky = () => {
    const randomTopic = luckyTopics[Math.floor(Math.random() * luckyTopics.length)];
    handleSelectTopic(randomTopic);
  };

  const handleSaveTopic = () => {
    if (!selectedTopic) return;
    if (!savedTopics.includes(selectedTopic)) {
      setSavedTopics(prev => [...prev, selectedTopic]);
    }
  };

  const handleRefreshTopic = () => {
    if (selectedTopic) {
      handleSelectTopic(selectedTopic);
    }
  };

  return (
    <div className="personal-page">
      {/* Header */}
      <header className="personal-page-header">
        <div className="header-content">
          <h1 className="page-title">Explore Topics</h1>
          <p className="page-subtitle">
            Browse papers by topic or discover something randomly
          </p>
        </div>
      </header>

      <div className="personal-page-content">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Lucky Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">I'm Feeling Lucky</h3>
            <button className="filter-btn" onClick={handleFeelingLucky}>
              <Icon name="dice" ariaLabel="Pick a random topic" /> <span style={{ marginLeft: 8 }}>Pick a Random Topic</span>
            </button>
          </div>

          {/* Saved Topics Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Saved Topics</h3>
            {savedTopics.length === 0 ? (
              <p className="sidebar-empty">No topics saved yet</p>
            ) : (
              savedTopics.map(topic => (
                <button
                  key={topic}
                  className="filter-btn"
                  onClick={() => handleSelectTopic(topic)}
                >
                  <Icon name="pin" ariaLabel={`Saved topic ${topic}`} /> <span style={{ marginLeft: 8 }}>{topic}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          {selectedTopic && papers.length > 0 && (
            <div className="topic-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
              <h2 style={{ margin: 0 }}>{selectedTopic}</h2>
              <button className="btn btn-primary" onClick={handleSaveTopic}>
                <Icon name="save" ariaLabel="Save topic" /> <span style={{ marginLeft: 8 }}>Save Topic</span>
              </button>
              <button className="btn btn-secondary" onClick={handleRefreshTopic}>
                <Icon name="refresh" ariaLabel="Refresh" /> <span style={{ marginLeft: 8 }}>Refresh</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading papers for "{selectedTopic}"...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="warning" ariaLabel="Error" /></div>
              <h2>{error}</h2>
            </div>
          ) : !selectedTopic ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="dice" ariaLabel="Feeling lucky" /></div>
              <h2>Pick a topic or feel lucky!</h2>
              <p>Click a topic on the left or press "I'm Feeling Lucky" to explore papers.</p>
            </div>
          ) : papers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="clipboard" ariaLabel="No papers" /></div>
              <h2>No papers found</h2>
              <p>Try selecting another topic</p>
            </div>
          ) : (
            <div className="papers-list">
              {papers.map((paper) => (
                <div key={paper.id} className="result-card">
                  <div className="result-header">
                    <h3 className="result-title">{paper.title}</h3>
                  </div>
                  {paper.authors && (
                    <div className="result-authors">{paper.authors.join(', ')}</div>
                  )}
                  {paper.summary && (
                    <p className="result-summary">{paper.summary}</p>
                  )}
                  <div className="result-footer">
                    <span className="result-date">{paper.published ? new Date(paper.published).getFullYear() : 'Unknown year'}</span>
                    {paper.link && (
                      <a
                        href={paper.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-paper-link"
                      >
                        View Paper →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
