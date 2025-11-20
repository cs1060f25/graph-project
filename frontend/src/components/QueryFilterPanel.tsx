'use client';

import React from 'react';

interface QueryGraph {
  id: string;
  label: string;
  fullLabel?: string;
  color: string;
  visible: boolean;
  papers?: any[];
}

interface QueryFilterPanelProps {
  queryGraphs: QueryGraph[];
  onToggleVisibility: (queryId: string) => void;
  onRemoveQuery: (queryId: string) => void;
}

function handleToggleVisibility(
  queryId: string,
  onToggleVisibility: (queryId: string) => void
): void {
  onToggleVisibility(queryId);
}

function handleRemoveQuery(
  queryId: string,
  onRemoveQuery: (queryId: string) => void
): void {
  onRemoveQuery(queryId);
}

export default function QueryFilterPanel({
  queryGraphs,
  onToggleVisibility,
  onRemoveQuery,
}: QueryFilterPanelProps) {
  if (!queryGraphs || queryGraphs.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl p-4 mb-6 max-h-[400px] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#2a2a2e]">
        <h3 className="text-[0.9375rem] font-semibold text-[#eaeaea] m-0">Active Queries</h3>
        <span className="bg-[#2a2a2e] text-[#c9c9ce] py-1 px-2 rounded-xl text-xs font-medium">
          {queryGraphs.length}
        </span>
      </div>
      
      <div className="flex flex-col gap-2">
        {queryGraphs.map((queryGraph) => (
          <div
            key={queryGraph.id}
            className={`bg-[#1a1a1c] border border-[#2a2a2e] rounded-lg p-3 transition-all hover:border-[#3a3a3e] hover:bg-[#1f1f21] ${
              !queryGraph.visible ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded border border-[#2a2a2e] flex-shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                style={{ backgroundColor: queryGraph.color }}
              />
              
              <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={queryGraph.visible}
                  onChange={() => handleToggleVisibility(queryGraph.id, onToggleVisibility)}
                  className="w-[18px] h-[18px] cursor-pointer accent-[#3a82ff]"
                />
                <span
                  className={`text-sm text-[#c9c9ce] overflow-hidden text-ellipsis whitespace-nowrap flex-1 ${
                    !queryGraph.visible ? 'line-through text-[#6b7280]' : ''
                  }`}
                  title={queryGraph.fullLabel || queryGraph.label}
                >
                  {queryGraph.label}
                </span>
              </label>
              
              <button
                className="bg-transparent border-none text-[#6b7280] text-2xl leading-none cursor-pointer p-0 w-6 h-6 flex items-center justify-center rounded transition-all flex-shrink-0 hover:bg-[#2a2a2e] hover:text-[#ff6b6b]"
                onClick={() => handleRemoveQuery(queryGraph.id, onRemoveQuery)}
                title="Remove this query"
                aria-label={`Remove query: ${queryGraph.label}`}
              >
                ×
              </button>
            </div>
            
            <div className="mt-2 pt-2 border-t border-[#2a2a2e]">
              <span className="text-xs text-[#6b7280]">
                {queryGraph.papers?.length || 0} papers
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {queryGraphs.length > 1 && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-[#2a2a2e]">
          <button
            className="flex-1 bg-[#1a1a1c] border border-[#2a2a2e] text-[#c9c9ce] py-2 rounded-md text-xs font-medium cursor-pointer transition-all hover:bg-[#2a2a2e] hover:border-[#3a82ff] hover:text-[#3a82ff]"
            onClick={() => {
              queryGraphs.forEach(qg => {
                if (!qg.visible) onToggleVisibility(qg.id);
              });
            }}
          >
            Show All
          </button>
          <button
            className="flex-1 bg-[#1a1a1c] border border-[#2a2a2e] text-[#c9c9ce] py-2 rounded-md text-xs font-medium cursor-pointer transition-all hover:bg-[#2a2a2e] hover:border-[#6b7280] hover:text-[#a0a0a5]"
            onClick={() => {
              queryGraphs.forEach(qg => {
                if (qg.visible) onToggleVisibility(qg.id);
              });
            }}
          >
            Hide All
          </button>
        </div>
      )}
    </div>
  );
}

