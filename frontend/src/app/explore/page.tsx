'use client';

import React, { useState } from 'react';
import Icon from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { queryPapers, type Paper as QueryPaper } from '../../lib/api/query';

const LUCKY_TOPICS = [
  'Machine Learning',
  'Artificial Intelligence',
  'Quantum Computing',
  'Natural Language Processing',
  'Robotics',
  'Computer Vision',
];

function handleTopicSelect(
  topic: string,
  setSelectedTopic: (topic: string) => void,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  executeQuery: (topic: string) => Promise<void>
): void {
  setSelectedTopic(topic);
  setError(null);
  setLoading(true);
  executeQuery(topic);
}

function handleFeelingLucky(
  luckyTopics: string[],
  handleSelectTopic: (topic: string) => void
): void {
  const randomTopic = luckyTopics[Math.floor(Math.random() * luckyTopics.length)];
  handleSelectTopic(randomTopic);
}

function handleSaveTopic(
  selectedTopic: string | null,
  savedTopics: string[],
  setSavedTopics: (topics: string[]) => void
): void {
  if (!selectedTopic) return;
  if (!savedTopics.includes(selectedTopic)) {
    setSavedTopics([...savedTopics, selectedTopic]);
  }
}

function handleRefreshTopic(
  selectedTopic: string | null,
  handleSelectTopic: (topic: string) => void
): void {
  if (selectedTopic) {
    handleSelectTopic(selectedTopic);
  }
}

export default function ExplorationPage() {
  const { token } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [papers, setPapers] = useState<QueryPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTopics, setSavedTopics] = useState<string[]>([]);

  async function executeQuery(topic: string) {
    try {
      setLoading(true);
      setError(null);
      const results = await queryPapers(topic, 'topic', token || undefined);
      setPapers(results || []);
    } catch (err: any) {
      console.error('Error fetching papers:', err);
      setError(err.message || 'Failed to fetch papers. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectTopic = (topic: string) => {
    handleTopicSelect(topic, setSelectedTopic, setError, setLoading, executeQuery);
  };

  const handleFeelingLuckyClick = () => {
    handleFeelingLucky(LUCKY_TOPICS, handleSelectTopic);
  };

  const handleSaveTopicClick = () => {
    handleSaveTopic(selectedTopic, savedTopics, setSavedTopics);
  };

  const handleRefreshTopicClick = () => {
    handleRefreshTopic(selectedTopic, handleSelectTopic);
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-[#eaeaea]">
      <header className="bg-[#0f0f10] border-b border-[#2a2a2e] py-4">
        <div className="max-w-[1400px] mx-auto px-4">
          <h1 className="text-3xl font-semibold text-[#eaeaea] m-0 mb-2">Explore Topics</h1>
          <p className="text-base text-[#888] m-0">
            Browse papers by topic or discover something randomly
          </p>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-[280px_1fr] gap-6">
        <aside className="bg-[#151517] rounded-xl p-5 h-fit border border-[#2a2a2e] sticky top-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wide m-0 mb-3">I'm Feeling Lucky</h3>
            <button
              className="w-full flex items-center gap-3 py-2.5 px-3 bg-transparent border-none rounded-lg cursor-pointer text-[0.9375rem] text-[#eaeaea] transition-all mb-1 text-left hover:bg-[#1a1a1c]"
              onClick={handleFeelingLuckyClick}
            >
              <Icon name="dice" ariaLabel="Pick a random topic" />
              <span>Pick a Random Topic</span>
            </button>
          </div>

          <div className="mb-0">
            <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wide m-0 mb-3">Saved Topics</h3>
            {savedTopics.length === 0 ? (
              <p className="text-sm text-[#888] text-center py-3">No topics saved yet</p>
            ) : (
              <div>
                {savedTopics.map(topic => (
                  <button
                    key={topic}
                    className="w-full flex items-center gap-3 py-2.5 px-3 bg-transparent border-none rounded-lg cursor-pointer text-[0.9375rem] text-[#eaeaea] transition-all mb-1 text-left hover:bg-[#1a1a1c]"
                    onClick={() => handleSelectTopic(topic)}
                  >
                    <Icon name="bookmark" ariaLabel={`Saved topic ${topic}`} />
                    <span>{topic}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="min-h-[400px]">
          {selectedTopic && papers.length > 0 && (
            <div className="flex items-center mb-5 gap-3">
              <h2 className="m-0 text-2xl font-semibold text-[#eaeaea]">{selectedTopic}</h2>
              <button
                className="py-2.5 px-5 border-none rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all bg-[#3a82ff] text-white hover:brightness-95 flex items-center gap-2"
                onClick={handleSaveTopicClick}
              >
                <Icon name="save" ariaLabel="Save topic" />
                <span>Save Topic</span>
              </button>
              <button
                className="py-2.5 px-5 border-none rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all bg-[#1a1a1c] text-[#eaeaea] hover:brightness-95 flex items-center gap-2"
                onClick={handleRefreshTopicClick}
              >
                <Icon name="refresh" ariaLabel="Refresh" />
                <span>Refresh</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <div className="w-10 h-10 border-4 border-[#2a2a2e] border-t-[#3a82ff] rounded-full animate-spin"></div>
              <p className="text-[#888] text-base">Loading papers for "{selectedTopic}"...</p>
            </div>
          ) : error ? (
            <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl py-16 px-10 text-center">
              <div className="text-6xl mb-4"><Icon name="warning" ariaLabel="Error" /></div>
              <h2 className="text-2xl font-semibold text-[#eaeaea] m-0 mb-2">{error}</h2>
            </div>
          ) : !selectedTopic ? (
            <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl py-16 px-10 text-center">
              <div className="text-6xl mb-4"><Icon name="dice" ariaLabel="Feeling lucky" /></div>
              <h2 className="text-2xl font-semibold text-[#eaeaea] m-0 mb-2">Pick a topic or feel lucky!</h2>
              <p className="text-base text-[#888] m-0">Click a topic on the left or press "I'm Feeling Lucky" to explore papers.</p>
            </div>
          ) : papers.length === 0 ? (
            <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl py-16 px-10 text-center">
              <div className="text-6xl mb-4"><Icon name="book" ariaLabel="No papers" /></div>
              <h2 className="text-2xl font-semibold text-[#eaeaea] m-0 mb-2">No papers found</h2>
              <p className="text-base text-[#888] m-0">Try selecting another topic</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {papers.map((paper) => (
                <div key={paper.id} className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-6 mb-4 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:border-[#3a3a3e]">
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="flex-1 text-lg font-semibold text-[#eaeaea] m-0 leading-snug">
                      {paper.title}
                    </h3>
                  </div>
                  {paper.authors && (
                    <div className="text-sm text-[#a0a0a5] mb-3 italic">
                      {paper.authors.join(', ')}
                    </div>
                  )}
                  {paper.summary && (
                    <p className="text-[0.9375rem] text-[#c9c9ce] leading-relaxed m-0 mb-4">
                      {paper.summary}
                    </p>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-[#2a2a2e]">
                    <span className="text-xs text-[#6b7280] font-medium">
                      {paper.published ? new Date(paper.published).getFullYear() : 'Unknown year'}
                    </span>
                    {paper.link && (
                      <a
                        href={paper.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3a82ff] no-underline text-sm font-medium transition-colors hover:text-[#60a5fa]"
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

