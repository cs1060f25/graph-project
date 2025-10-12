import React, { useState } from 'react';
import SavedPage from './pages/SavedPage';
import './App.css'; // global CSS

function App() {
  const [page, setPage] = useState('saved');

  const handleNav = (target) => {
    if (target !== 'saved') {
      alert('Not implemented');
    } else {
      setPage(target);
    }
  };

  return (
    <div className="app">
      <div className="topMenu">
        <button onClick={() => handleNav('query')}>Query</button>
        <button onClick={() => handleNav('saved')}>Saved</button>
        <button onClick={() => handleNav('portfolio')}>Portfolio</button>
      </div>
      {page === 'saved' && <SavedPage />}
    </div>
  );
}

export default App;
