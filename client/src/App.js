import React, { useState, useEffect } from 'react';
import { Send, BookMarked, TrendingUp, Sparkles, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const App = () => {
  const [papers, setPapers] = useState({});
  const [selectedTopic, setSelectedTopic] = useState('Machine Learning');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your research assistant. Ask me to summarize papers, explain concepts, or suggest related work.' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [expandedPapers, setExpandedPapers] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const topics = ['Machine Learning', 'Computer Vision', 'Natural Language Processing', 'Reinforcement Learning', 'Graph Neural Networks'];

  // Fetch all papers on mount
  useEffect(() => {
    fetchPapers();
  }, []);

  // Update recommendations when topic changes
  useEffect(() => {
    if (selectedTopic) {
      fetchRecommendations(selectedTopic);
    }
  }, [selectedTopic]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/papers`);
      if (!response.ok) throw new Error('Failed to fetch papers');
      
      const data = await response.json();
      
      // Group papers by topic
      const groupedPapers = data.reduce((acc, paper) => {
        if (!acc[paper.topic]) {
          acc[paper.topic] = [];
        }
        acc[paper.topic].push(paper);
        return acc;
      }, {});
      
      setPapers(groupedPapers);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching papers:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchRecommendations = async (topic) => {
    try {
      const response = await fetch(`${API_URL}/papers/recommendations/${encodeURIComponent(topic)}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessages = [
      ...chatMessages,
      { role: 'user', content: inputMessage }
    ];
    
    // Simulate AI response
    setTimeout(() => {
      const response = `I understand you're asking about "${inputMessage}". Based on your saved papers in ${selectedTopic}, I can help you explore connections to related work. Would you like me to summarize specific papers or suggest research directions?`;
      setChatMessages([...newMessages, { role: 'assistant', content: response }]);
    }, 500);
    
    setChatMessages(newMessages);
    setInputMessage('');
  };

  const togglePaperExpansion = (paperId) => {
    setExpandedPapers(prev => ({
      ...prev,
      [paperId]: !prev[paperId]
    }));
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0e27',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e4e6eb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles size={48} color="#6366f1" />
          <p style={{ marginTop: '16px', fontSize: '18px' }}>Loading papers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0e27',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e4e6eb'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '24px' }}>
          <p style={{ fontSize: '18px', color: '#ef4444', marginBottom: '12px' }}>Error loading papers</p>
          <p style={{ color: '#9ca3af' }}>{error}</p>
          <p style={{ marginTop: '16px', color: '#9ca3af' }}>Make sure the backend server is running on port 5000</p>
        </div>
      </div>
    );
  }

  const currentPapers = papers[selectedTopic] || [];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0e27',
      color: '#e4e6eb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1e2139',
        padding: '20px 32px',
        backgroundColor: '#0d1129'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles size={28} color="#6366f1" />
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '600',
            margin: 0,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Research Discovery
          </h1>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Saved Papers Section */}
            <section style={{
              backgroundColor: '#0d1129',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #1e2139'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <BookMarked size={22} color="#6366f1" />
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Your Saved Papers</h2>
              </div>

              {/* Topic Selector */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                {topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: selectedTopic === topic ? '#6366f1' : '#1e2139',
                      color: selectedTopic === topic ? '#fff' : '#9ca3af',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              {/* Papers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentPapers.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
                    No papers found for this topic
                  </p>
                ) : (
                  currentPapers.map(paper => (
                    <div
                      key={paper.id}
                      style={{
                        backgroundColor: '#1e2139',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid #2d3148',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2d3148'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: '600',
                            margin: '0 0 8px 0',
                            color: '#e4e6eb'
                          }}>
                            {paper.title}
                          </h3>
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#9ca3af',
                            marginBottom: '8px'
                          }}>
                            {paper.authors} • {paper.year} • {paper.citations.toLocaleString()} citations
                          </div>
                          {expandedPapers[paper.id] && (
                            <p style={{ 
                              fontSize: '14px', 
                              color: '#c1c5d0',
                              margin: '12px 0 0 0',
                              lineHeight: '1.6'
                            }}>
                              {paper.summary}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => togglePaperExpansion(paper.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#6366f1',
                            cursor: 'pointer',
                            padding: '4px',
                            marginLeft: '12px'
                          }}
                        >
                          {expandedPapers[paper.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #2d3148'
                      }}>
                        <a
                          href={`https://arxiv.org/abs/${paper.arxiv_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '13px',
                            color: '#6366f1',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          View on arXiv <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Recommended Papers */}
            <section style={{
              backgroundColor: '#0d1129',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #1e2139'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <TrendingUp size={22} color="#8b5cf6" />
                <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                  Explore Adjacent Topics
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px' }}>
                    No recommendations available
                  </p>
                ) : (
                  recommendations.map(paper => (
                    <div
                      key={paper.id}
                      style={{
                        backgroundColor: '#1e2139',
                        borderRadius: '8px',
                        padding: '16px',
                        border: '1px solid #2d3148'
                      }}
                    >
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#8b5cf620',
                        color: '#8b5cf6',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>
                        {paper.topic}
                      </div>
                      <h3 style={{ 
                        fontSize: '15px', 
                        fontWeight: '600',
                        margin: '0 0 6px 0'
                      }}>
                        {paper.title}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                        {paper.authors} • {paper.year}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Chat Sidebar */}
          <aside style={{
            backgroundColor: '#0d1129',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #1e2139',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 180px)',
            position: 'sticky',
            top: '24px'
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              margin: '0 0 16px 0',
              color: '#e4e6eb'
            }}>
              Research Assistant
            </h2>

            {/* Chat Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: msg.role === 'user' ? '#6366f1' : '#1e2139',
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {msg.content}
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ 
              display: 'flex', 
              gap: '8px',
              borderTop: '1px solid #1e2139',
              paddingTop: '16px'
            }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about papers..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #2d3148',
                  backgroundColor: '#1e2139',
                  color: '#e4e6eb',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;