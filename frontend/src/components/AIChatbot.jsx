import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

function AIChatbot({ isOpen, onClose, selectedPaper }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedPaper && isOpen) {
      setMessages([{
        type: 'assistant',
        content: `I'm ready to help you understand "${selectedPaper.title}". What would you like to know?`,
        timestamp: new Date()
      }]);
    }
  }, [selectedPaper, isOpen]);

  const handleSummarize = async () => {
    if (!selectedPaper) return;

    const userMessage = {
      type: 'user',
      content: 'Please summarize this paper for me',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.chatSummarize(selectedPaper.id, 'summarize');
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedPaper) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chatSummarize(selectedPaper.id, input);
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: response.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
      <div className="chatbot-header">
        <div className="chatbot-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>AI Research Assistant</span>
        </div>
        <button 
          className="chatbot-close"
          onClick={onClose}
          aria-label="Close chatbot"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {selectedPaper && (
        <div className="chatbot-paper-info">
          <div className="paper-info-title">{selectedPaper.title}</div>
          <div className="paper-info-meta">
            {selectedPaper.category} • {selectedPaper.authors[0]}
            {selectedPaper.authors.length > 1 && ` +${selectedPaper.authors.length - 1}`}
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={handleSummarize}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
            Summarize Paper
          </button>
        </div>
      )}

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message message-${message.type}`}>
            <div className="message-content">{message.content}</div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message message-assistant">
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about this paper..."
          rows="1"
          disabled={loading || !selectedPaper}
          className="chatbot-textarea"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !input.trim() || !selectedPaper}
          className="btn btn-primary btn-icon"
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default AIChatbot;