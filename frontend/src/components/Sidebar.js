import React from 'react';
import './Sidebar.css';

export default function Sidebar({ selection, setSelection }) {
  return (
    <div className="sidebar">
      <h3>SAVED</h3>
      <button
        className={selection === 'all' ? 'active' : ''}
        onClick={() => setSelection('all')}
      >
        All
      </button>
      <button
        className={selection === 'folders' ? 'active' : ''}
        onClick={() => setSelection('folders')}
      >
        Folders
      </button>
      <button
        className={selection === 'recent' ? 'active' : ''}
        onClick={() => setSelection('recent')}
      >
        Recent
      </button>
    </div>
  );
}
