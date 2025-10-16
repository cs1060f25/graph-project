import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { Paper } from '../lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  selectedPaper: Paper | null;
  onClose: () => void;
}

export function ChatPanel({ selectedPaper, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPaper) {
      setMessages([
        {
          role: 'assistant',
          content: `I'm here to help you understand "${selectedPaper.title}". This paper is about ${selectedPaper.topic.toLowerCase()}. What would you like to know about it?`,
        },
      ]);
    }
  }, [selectedPaper]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedPaper) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    setTimeout(() => {
      const responseContent = generateResponse(userMessage, selectedPaper);
      setMessages((prev) => [...prev, { role: 'assistant', content: responseContent }]);
      setIsLoading(false);
    }, 800);
  };

  const generateResponse = (query: string, paper: Paper): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('summarize') || lowerQuery.includes('summary') || lowerQuery.includes('about')) {
      return `This paper, "${paper.title}", focuses on ${paper.topic}. ${paper.abstract.substring(0, 300)}... The authors (${paper.authors.join(', ')}) published this work on ${new Date(paper.published_date).toLocaleDateString()}.`;
    }

    if (lowerQuery.includes('author')) {
      return `The paper was authored by ${paper.authors.join(', ')}. These researchers contributed to advancing knowledge in ${paper.topic}.`;
    }

    if (lowerQuery.includes('method') || lowerQuery.includes('approach')) {
      return `Based on the abstract, the paper presents novel approaches in ${paper.topic}. The methodology involves ${paper.abstract.split('.')[1] || 'innovative techniques detailed in the full paper'}. For complete methodological details, I recommend reading the full paper.`;
    }

    if (lowerQuery.includes('result') || lowerQuery.includes('finding')) {
      return `The key findings of this research contribute to ${paper.topic}. ${paper.abstract.split('.').slice(-2).join('.')} The results demonstrate significant advances in the field.`;
    }

    if (lowerQuery.includes('application') || lowerQuery.includes('use case')) {
      return `This research in ${paper.topic} has practical applications in various domains. The techniques presented can be applied to real-world problems, as suggested by the scope of the work. The paper discusses both theoretical foundations and potential implementation scenarios.`;
    }

    if (lowerQuery.includes('related') || lowerQuery.includes('similar')) {
      return `Papers related to "${paper.title}" would include other research in ${paper.topic}. You might find the recommended papers in the adjacent topics section relevant. These explore complementary approaches and build upon similar foundations.`;
    }

    return `Regarding "${paper.title}": ${paper.abstract.substring(0, 250)}... This research contributes to ${paper.topic} by advancing our understanding and providing new insights. What specific aspect would you like to explore further?`;
  };

  if (!selectedPaper) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Sparkles size={48} style={{ color: 'var(--accent-blue)', marginBottom: '20px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px' }}>
          AI Research Assistant
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
          Select a paper to start a conversation. I can help you understand the content, explain concepts, and answer questions.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>
            {selectedPaper.title}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {selectedPaper.authors.join(', ')}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor:
                  message.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontSize: '14px',
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question about this paper..."
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            style={{
              padding: '12px 20px',
              backgroundColor: input.trim() && !isLoading ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '8px',
              color: input.trim() && !isLoading ? 'white' : 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (input.trim() && !isLoading) {
                e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
              }
            }}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
