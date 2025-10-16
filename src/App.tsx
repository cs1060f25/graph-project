import { useEffect, useState } from 'react';
import { BookMarked, Compass, TrendingUp } from 'lucide-react';
import { supabase, Paper } from './lib/supabase';
import { PaperCard } from './components/PaperCard';
import { ChatPanel } from './components/ChatPanel';

function App() {
  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [recommendations, setRecommendations] = useState<Paper[]>([]);
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      const { data, error } = await supabase
        .from('papers')
        .select('*')
        .order('published_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setAllPapers(data);
        const saved = data.filter((p) => p.is_saved);
        setSavedPapers(saved);

        const savedTopics = new Set(saved.map((p) => p.topic));
        const recommended = data.filter((p) => !p.is_saved && !savedTopics.has(p.topic));
        setRecommendations(recommended.slice(0, 6));
      }
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
          Loading papers...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <header
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '20px 0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookMarked size={32} style={{ color: 'var(--accent-blue)' }} />
            <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Research Discovery</h1>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {savedPapers.length} papers saved
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '32px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          <div>
            <section style={{ marginBottom: '48px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <BookMarked size={24} style={{ color: 'var(--accent-teal)' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Your Saved Papers</h2>
                <div
                  style={{
                    padding: '4px 12px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {savedPapers.length}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '20px',
                }}
              >
                {savedPapers.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} onSelect={setSelectedPaper} />
                ))}
              </div>
            </section>

            <section style={{ marginBottom: '48px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <Compass size={24} style={{ color: 'var(--accent-amber)' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
                  Explore Adjacent Topics
                </h2>
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  marginBottom: '20px',
                  lineHeight: '1.6',
                }}
              >
                Based on your saved papers, here are recommendations from related research areas you haven't explored yet.
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '20px',
                }}
              >
                {recommendations.map((paper) => (
                  <PaperCard key={paper.id} paper={paper} onSelect={setSelectedPaper} />
                ))}
              </div>
            </section>

            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <TrendingUp size={24} style={{ color: 'var(--accent-emerald)' }} />
                <h2 style={{ fontSize: '20px', fontWeight: '600' }}>All Topics</h2>
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Array.from(new Set(allPapers.map((p) => p.topic))).map((topic) => {
                  const topicColors: Record<string, string> = {
                    'Machine Learning': 'var(--accent-blue)',
                    'Computer Vision': 'var(--accent-teal)',
                    'Natural Language Processing': 'var(--accent-emerald)',
                    'Quantum Computing': 'var(--accent-amber)',
                    'Bioinformatics': 'var(--accent-rose)',
                  };

                  const count = allPapers.filter((p) => p.topic === topic).length;

                  return (
                    <div
                      key={topic}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: `1px solid ${topicColors[topic] || 'var(--border-color)'}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: topicColors[topic] || 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {topic}
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: 'var(--bg-tertiary)',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
            <ChatPanel selectedPaper={selectedPaper} onClose={() => setSelectedPaper(null)} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
