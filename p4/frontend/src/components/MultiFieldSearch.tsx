'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Mock data embedded directly in the component
const mockPapers = [
  { id: 'p1', title: 'Attention Is All You Need', authors: 'Vaswani et al.', year: 2017, venue: 'NIPS', keywords: ['transformer', 'attention', 'nlp'] },
  { id: 'p2', title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: 'Devlin et al.', year: 2018, venue: 'NAACL', keywords: ['transformer', 'nlp', 'embeddings'] },
  { id: 'p3', title: 'Generative Pre-training of a Language Model', authors: 'Radford et al.', year: 2018, venue: 'OpenAI', keywords: ['transformer', 'nlp', 'generative'] },
  { id: 'p4', title: 'ImageNet Classification with Deep Convolutional Neural Networks', authors: 'Krizhevsky et al.', year: 2012, venue: 'NIPS', keywords: ['cnn', 'computer vision'] },
  { id: 'p5', title: 'Deep Learning', authors: 'Goodfellow et al.', year: 2016, venue: 'MIT Press', keywords: ['deep learning', 'ai', 'transformer'] },
  { id: 'p6', title: 'Reinforcement Learning: An Introduction', authors: 'Sutton and Barto', year: 1998, venue: 'MIT Press', keywords: ['reinforcement learning', 'ai', 'transformer'] },
  { id: 'p7', title: 'The Illustrated Transformer', authors: 'Alammar', year: 2018, venue: 'Blog', keywords: ['transformer', 'attention', 'nlp'] },
  { id: 'p8', title: 'GPT-3: Language Models are Few-Shot Learners', authors: 'Brown et al.', year: 2020, venue: 'OpenAI', keywords: ['transformer', 'generative', 'nlp'] },
  { id: 'p9', title: 'Long Short-Term Memory', authors: 'Hochreiter & Schmidhuber', year: 1997, venue: 'Neural Computation', keywords: ['rnn', 'lstm', 'nlp', 'transformer'] },
  { id: 'p10', title: 'Neural Machine Translation by Jointly Learning to Align and Translate', authors: 'Bahdanau et al.', year: 2014, venue: 'ICLR', keywords: ['attention', 'nlp', 'rnn'] }
];

interface Suggestion {
  text: string;
  type: 'keyword' | 'author' | 'paper';
  id?: string;
  authors?: string;
  year?: number;
  venue?: string;
}

interface SelectedItem {
  text: string;
  type: 'keyword' | 'author' | 'paper';
  id?: string;
}

export default function MultiFieldSearch() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Generate suggestions from mock data
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const newSuggestions: Suggestion[] = [];

    // Keywords
    const allKeywords = Array.from(new Set(mockPapers.flatMap(p => p.keywords)));
    const keywordMatches = allKeywords.filter(kw => kw.includes(queryLower));
    newSuggestions.push(...keywordMatches.map(kw => ({
      text: kw,
      type: 'keyword' as const
    })));

    // Authors
    const allAuthors = Array.from(new Set(mockPapers.flatMap(p => p.authors.split(' et al.')[0].trim())));
    const authorMatches = allAuthors.filter(author => author.toLowerCase().includes(queryLower));
    newSuggestions.push(...authorMatches.map(author => ({
      text: author,
      type: 'author' as const
    })));

    // Papers
    const paperMatches = mockPapers.filter(p => p.title.toLowerCase().includes(queryLower));
    newSuggestions.push(...paperMatches.map(paper => ({
      text: paper.title,
      type: 'paper' as const,
      id: paper.id,
      authors: paper.authors,
      year: paper.year,
      venue: paper.venue,
    })));

    setSuggestions(newSuggestions.slice(0, 8)); // Limit to 8 suggestions
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(input);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [input]);

  const addItem = (item: Suggestion) => {
    if (!selectedItems.some(selected => selected.text === item.text && selected.type === item.type)) {
      setSelectedItems(prev => [...prev, {
        text: item.text,
        type: item.type,
        id: item.id
      }]);
    }
    setInput('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const addCurrentInput = () => {
    if (input.trim() && !selectedItems.some(selected => selected.text === input.trim() && selected.type === 'keyword')) {
      setSelectedItems(prev => [...prev, {
        text: input.trim(),
        type: 'keyword'
      }]);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Always add the current input as a keyword, regardless of suggestions
      addCurrentInput();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      return;
    }

    setIsLoading(true);

    // Add current input if it exists
    if (input.trim()) {
      addCurrentInput();
    }

    // Wait a bit for the state to update
    setTimeout(() => {
      const keywords = selectedItems.filter(item => item.type === 'keyword').map(item => item.text);
      const authors = selectedItems.filter(item => item.type === 'author').map(item => item.text);
      const papers = selectedItems.filter(item => item.type === 'paper').map(item => item.id || item.text);

      const query = { keywords, authors, papers };
      const queryString = encodeURIComponent(JSON.stringify(query));
      
      router.push(`/graph?query=${queryString}`);
      setIsLoading(false);
    }, 100);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'keyword': return '#3b82f6';
      case 'author': return '#10b981';
      case 'paper': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '800px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          color: 'white', 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Research Graph Explorer
        </h1>
        
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '1.1rem', 
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Discover connections between research papers through keywords, authors, and citations
        </p>

        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <div style={{ 
            position: 'relative',
            background: '#1f2937',
            borderRadius: '12px',
            border: '1px solid #374151',
            padding: '8px',
            minHeight: '60px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* Selected items */}
            {selectedItems.map((item, index) => (
              <div
                key={index}
                style={{
                  background: getTypeColor(item.type),
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{item.text}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedItems.length === 0 ? "Search for keywords, authors, or papers..." : "Add more..."}
              style={{
                flex: 1,
                minWidth: '200px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '16px',
                padding: '8px'
              }}
            />
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#1f2937',
              border: '1px solid #374151',
              borderTop: 'none',
              borderRadius: '0 0 12px 12px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => addItem(suggestion)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid #374151' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#374151';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: getTypeColor(suggestion.type)
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '14px' }}>
                      {suggestion.text}
                    </div>
                    {suggestion.type === 'paper' && (
                      <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '2px' }}>
                        {suggestion.authors} • {suggestion.year}
                      </div>
                    )}
                  </div>
                  <div style={{
                    color: '#6b7280',
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}>
                    {suggestion.type}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={selectedItems.length === 0 || isLoading}
            style={{
              marginTop: '20px',
              background: selectedItems.length === 0 || isLoading 
                ? '#374151' 
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: selectedItems.length === 0 || isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: selectedItems.length === 0 || isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Generating Graph...' : 'Generate Graph'}
          </button>
        </form>

        <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: '16px' }}>
          Example: &quot;transformer&quot;, &quot;Vaswani&quot;, or &quot;Attention Is All You Need&quot;
        </div>
      </div>
    </div>
  );
}