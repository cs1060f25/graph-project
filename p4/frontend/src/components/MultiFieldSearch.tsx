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

export default function MultiFieldSearch() {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedItems, setSelectedItems] = useState<{text: string, type: 'keyword' | 'author' | 'paper', id?: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Detect input type and fetch suggestions from mock data
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const queryLower = query.toLowerCase();
    const allSuggestions: Suggestion[] = [];

    // Keywords
    const allKeywords = Array.from(new Set(mockPapers.flatMap(p => p.keywords)));
    const keywordMatches = allKeywords.filter(kw => kw.includes(queryLower));
    allSuggestions.push(...keywordMatches.map(kw => ({ text: kw, type: 'keyword' as const })));

    // Authors
    const allAuthors = Array.from(new Set(mockPapers.flatMap(p => p.authors.split(' et al.')[0].trim())));
    const authorMatches = allAuthors.filter(author => author.toLowerCase().includes(queryLower));
    allSuggestions.push(...authorMatches.map(author => ({ text: author, type: 'author' as const })));

    // Papers
    const paperMatches = mockPapers.filter(p => p.title.toLowerCase().includes(queryLower));
    allSuggestions.push(...paperMatches.map(paper => ({ 
      text: paper.title, 
      type: 'paper' as const, 
      id: paper.id,
      authors: paper.authors,
      year: paper.year,
      venue: paper.venue
    })));

    setSuggestions(allSuggestions.slice(0, 8)); // Limit to 8 suggestions
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  // Add item to selected list
  const addItem = (suggestion: Suggestion) => {
    if (!selectedItems.some(item => item.text === suggestion.text && item.type === suggestion.type)) {
      setSelectedItems([...selectedItems, {
        text: suggestion.text,
        type: suggestion.type,
        id: suggestion.id
      }]);
    }
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Add current input as keyword if no suggestions match
  const addCurrentInput = () => {
    if (input.trim() && !selectedItems.some(item => item.text === input.trim())) {
      setSelectedItems([...selectedItems, { text: input.trim(), type: 'keyword' }]);
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Remove item from selected list
  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Group selected items by type
    const keywords = selectedItems.filter(item => item.type === 'keyword').map(item => item.text);
    const authors = selectedItems.filter(item => item.type === 'author').map(item => item.text);
    const papers = selectedItems.filter(item => item.type === 'paper').map(item => item.id || item.text);
    
    const query = { keywords, authors, papers };
    console.log('Submitting query:', query);
    
    const queryString = encodeURIComponent(JSON.stringify(query));
    router.push(`/graph?query=${queryString}`);
  };

  // Handle keyboard navigation
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

  // Get type color
  const getTypeColor = (type: 'keyword' | 'author' | 'paper') => {
    switch (type) {
      case 'keyword': return 'bg-blue-600 text-blue-100';
      case 'author': return 'bg-green-600 text-green-100';
      case 'paper': return 'bg-purple-600 text-purple-100';
    }
  };

  // Get type icon
  const getTypeIcon = (type: 'keyword' | 'author' | 'paper') => {
    switch (type) {
      case 'keyword': return '🏷️';
      case 'author': return '👤';
      case 'paper': return '📄';
    }
  };

  return (
    <div style={{ margin: '0 auto' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 640 }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type keywords, author names, or paper titles..."
            style={{ 
              flex: '0 1 640px', 
              height: 56, 
              minHeight: 56, 
              maxHeight: 56, 
              width: '100%', 
              maxWidth: 640, 
              resize: 'none', 
              padding: '0 16px', 
              borderRadius: 14, 
              border: '1px solid rgba(148,163,184,0.25)', 
              background: 'linear-gradient(180deg, rgba(15,23,42,0.9), rgba(2,6,23,0.9))', 
              color: '#e5e7eb', 
              fontSize: 15, 
              lineHeight: '56px', 
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', 
              overflow: 'hidden' 
            }}
          />
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              marginTop: 4, 
              background: 'rgba(15,23,42,0.95)', 
              border: '1px solid rgba(148,163,184,0.25)', 
              borderRadius: 14, 
              maxHeight: 200, 
              overflowY: 'auto', 
              zIndex: 10,
              backdropFilter: 'blur(10px)'
            }}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.type}-${index}`}
                  onClick={() => addItem(suggestion)}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    borderBottom: index < suggestions.length - 1 ? '1px solid rgba(148,163,184,0.1)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(148,163,184,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ fontSize: 16 }}>{getTypeIcon(suggestion.type)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>
                      {suggestion.text}
                    </div>
                    {suggestion.type === 'paper' && (
                      <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                        {suggestion.authors} • {suggestion.year}
                      </div>
                    )}
                  </div>
                  <span style={{ 
                    color: '#94a3b8', 
                    fontSize: 12, 
                    textTransform: 'capitalize',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(148,163,184,0.1)'
                  }}>
                    {suggestion.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 8, 
            maxWidth: 640, 
            justifyContent: 'center',
            marginTop: 8
          }}>
            {selectedItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                className={getTypeColor(item.type)}
                onClick={() => removeItem(index)}
              >
                <span>{getTypeIcon(item.type)}</span>
                <span>{item.text}</span>
                <span style={{ fontSize: 16, opacity: 0.7 }}>×</span>
              </div>
            ))}
          </div>
        )}

        {/* Generate Graph Button */}
        <button
          type="submit"
          disabled={selectedItems.length === 0 || loading}
          style={{
            marginTop: 16,
            padding: '12px 32px',
            borderRadius: 12,
            border: 'none',
            background: selectedItems.length === 0 || loading 
              ? 'rgba(148,163,184,0.2)' 
              : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: selectedItems.length === 0 || loading ? '#94a3b8' : 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor: selectedItems.length === 0 || loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: selectedItems.length === 0 || loading 
              ? 'none' 
              : '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          {loading ? 'Generating Graph...' : 'Generate Graph'}
        </button>
      </form>
    </div>
  );
}