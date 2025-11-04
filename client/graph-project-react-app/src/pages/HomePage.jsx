import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-content">
        <h1>Graph-Based Research Paper Discovery</h1>
        <p>
          Navigate the frontier of research with intelligent paper recommendations
          powered by graph algorithms and AI.
        </p>
        {user && (
          <div className="quick-actions">
            <div className="action-card" onClick={() => navigate('/query')}>
              <h3>🔍 Query Papers</h3>
              <p>Search and discover research papers</p>
            </div>
            <div className="action-card" onClick={() => navigate('/personal')}>
              <h3>📊 Personal Dashboard</h3>
              <p>Manage your saved papers and preferences</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

