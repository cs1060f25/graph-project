'use client';

import React from 'react';
import Icon from './Icon';

interface QueryHistoryItem {
  id: string;
  query: string;
  type: string;
  resultCount: number;
  timestamp: number;
  createdAt?: string;
}

interface QueryHistoryPanelProps {
  history?: QueryHistoryItem[];
  loading?: boolean;
  error?: string | null;
  isAuthenticated?: boolean;
  onQueryClick?: (query: string) => void;
  onClearHistory?: () => void;
  formatTimestamp: (timestamp: number | string) => string;
  isOpen?: boolean;
  onToggle?: () => void;
}

function handleHistoryClick(
  queryItem: QueryHistoryItem,
  onQueryClick?: (query: string) => void,
  onToggle?: () => void
): void {
  if (onQueryClick) {
    onQueryClick(queryItem.query);
  }
  if (onToggle) {
    onToggle();
  }
}

function handleClearHistory(onClearHistory?: () => void): void {
  if (window.confirm('Are you sure you want to clear all query history?')) {
    onClearHistory?.();
  }
}

export default function QueryHistoryPanel({
  history = [],
  loading = false,
  error = null,
  isAuthenticated = false,
  onQueryClick,
  onClearHistory,
  formatTimestamp,
  isOpen,
  onToggle,
}: QueryHistoryPanelProps) {
  return (
    <div className={`relative w-full bg-[#151517] border border-[#2a2a2e] rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.45)] my-2 overflow-hidden transition-all duration-300 ${
      isOpen ? 'max-h-[400px] opacity-100 my-4' : 'max-h-0 opacity-0'
    }`}>
      {/* Triangle pointer */}
      {isOpen && (
        <div className="absolute -top-[10px] left-[45px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[#2a2a2e]">
          <div className="absolute top-[1px] -left-[9px] w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[9px] border-b-[#151517]"></div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#2a2a2e]">
          <h3 className="text-base font-semibold text-[#eaeaea] m-0">Search History</h3>
          {isAuthenticated && history.length > 0 && (
            <button
              className="bg-[#dc2626] text-white border-none py-1 px-2 rounded text-xs cursor-pointer transition-all hover:brightness-95"
              onClick={() => handleClearHistory(onClearHistory)}
            >
              Clear History
            </button>
          )}
        </div>

        <div className="min-h-[100px]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-[#888]">
              <div className="w-6 h-6 border-2 border-[#2a2a2e] border-t-[#3a82ff] rounded-full animate-spin mb-2"></div>
              <p className="m-0">Loading history...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-[#dc2626] text-center">
              <Icon name="warning" />
              <p className="m-0 mt-2">Failed to load history</p>
            </div>
          )}
          
          {!loading && !error && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-[#888] text-center">
              <Icon name="clipboard" className="text-3xl mb-3" />
              <p className="m-0 mb-1 font-medium">No search history yet</p>
              <small className="text-xs text-[#888]">Your recent searches will appear here</small>
            </div>
          )}
          
          {!loading && !error && history.length > 0 && (
            <div className="flex flex-col gap-2">
              {history.map((item, index) => (
                <div 
                  key={item.id || index}
                  className="p-3 bg-[#1a1a1c] border border-[#2a2a2e] rounded-lg cursor-pointer transition-all hover:bg-[#151517] hover:border-[#2a2a2e] hover:-translate-y-[1px]"
                  onClick={() => handleHistoryClick(item, onQueryClick, onToggle)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-medium text-[#eaeaea] leading-snug flex-1 mr-2">
                      {item.query}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[#888]">
                    <span className="capitalize font-medium">{item.type || 'search'}</span>
                    <span className="italic">{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

