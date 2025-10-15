'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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

  // Detect input type and fetch suggestions
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      // Fetch all types of suggestions
      const [keywordsRes, authorsRes, papersRes] = await Promise.all([
        axios.get(`http://localhost:8002/api/autocomplete?q=${encodeURIComponent(query)}&type=keywords`),
        axios.get(`http://localhost:8002/api/autocomplete?q=${encodeURIComponent(query)}&type=authors`),
        axios.get(`http://localhost:8002/api/autocomplete?q=${encodeURIComponent(query)}&type=papers`)
      ]);

      const allSuggestions: Suggestion[] = [
        ...keywordsRes.data.map((text: string) => ({ text, type: 'keyword' as const })),
        ...authorsRes.data.map((text: string) => ({ text, type: 'author' as const })),
        ...papersRes.data.map((paper: any) => ({ 
          text: paper.title, 
          type: 'paper' as const, 
          id: paper.id,
          authors: paper.authors,
          year: paper.year,
          venue: paper.venue
        }))
      ];

      setSuggestions(allSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
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
                    gap: 12
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 16 }}>{getTypeIcon(suggestion.type)}</span>
                  <div>
                    <div style={{ color: '#e5e7eb', fontWeight: 500, fontSize: 14 }}>{suggestion.text}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12, textTransform: 'capitalize' }}>
                      {suggestion.type}
                      {suggestion.type === 'paper' && suggestion.authors && suggestion.year && (
                        <span> • {suggestion.authors} • {suggestion.year}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div style={{ width: '100%', maxWidth: 640, marginBottom: 8 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {selectedItems.map((item, index) => (
                <span
                  key={index}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: 20, 
                    fontSize: 12, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    background: item.type === 'keyword' ? 'rgba(59,130,246,0.2)' : 
                               item.type === 'author' ? 'rgba(34,197,94,0.2)' : 'rgba(168,85,247,0.2)',
                    color: item.type === 'keyword' ? '#60a5fa' : 
                           item.type === 'author' ? '#4ade80' : '#a78bfa',
                    border: `1px solid ${item.type === 'keyword' ? 'rgba(59,130,246,0.3)' : 
                                        item.type === 'author' ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.3)'}`
                  }}
                >
                  <span>{getTypeIcon(item.type)}</span>
                  {item.text}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'inherit', 
                      cursor: 'pointer', 
                      padding: 0, 
                      marginLeft: 4,
                      fontSize: 14
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || selectedItems.length === 0} 
          style={{ 
            padding: '12px 18px', 
            borderRadius: 9999, 
            border: '1px solid rgba(59,130,246,0.5)', 
            background: selectedItems.length === 0 ? 'rgba(75,85,99,0.5)' : 'linear-gradient(180deg, #3b82f6, #1d4ed8)', 
            color: '#fff', 
            cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer', 
            fontWeight: 600, 
            letterSpacing: 0.2, 
            boxShadow: selectedItems.length === 0 ? 'none' : '0 8px 24px rgba(29,78,216,0.45)',
            opacity: selectedItems.length === 0 ? 0.5 : 1
          }}
        >
          {loading ? 'Generating…' : 'Generate Graph'}
        </button>
        <div style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
          Example: "transformer", "Vaswani", "Attention Is All You Need"
        </div>
      </form>
    </div>
  );
}