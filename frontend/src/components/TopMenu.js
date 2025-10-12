import React from 'react';
import './TopMenu.css';

export default function TopMenu({ setPage }) {
  const handleNav = (target) => {
    if (target !== 'saved') {
      alert('Not implemented');
    } else {
      setPage(target);
    }
  };

  return (
    <div className="top-menu">
      <button onClick={() => handleNav('query')}>Query</button>
      <button onClick={() => handleNav('saved')}>Saved</button>
      <button onClick={() => handleNav('portfolio')}>Portfolio</button>
    </div>
  );
}
