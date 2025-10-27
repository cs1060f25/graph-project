import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './QueryPage.css';

const QueryPage = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="query-page">
      <div className="query-header">
        <h1>Query Papers</h1>
        <div className="user-info">
          <span>Welcome, {user?.displayName || user?.email}</span>
          <button onClick={signOut} className="signout-button">Sign Out</button>
        </div>
      </div>
      <div className="query-content">
        <p>This is where users will search for and query research papers.</p>
        <p>Coming soon...</p>
      </div>
    </div>
  );
};

export default QueryPage;

