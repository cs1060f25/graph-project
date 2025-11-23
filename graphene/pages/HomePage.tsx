'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/contexts/AuthContext';
import Icon from '../components/Icon';
import '../styles/HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
  const router = useRouter();

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
            <div className="action-card" onClick={() => router.push('/query')}>
              <h3><Icon name="search" ariaLabel="Query papers" /> <span style={{ marginLeft: 8 }}>Query Papers</span></h3>
              <p>Search and discover research papers</p>
            </div>
            <div className="action-card" onClick={() => router.push('/personal')}>
              <h3><Icon name="book" ariaLabel="Personal dashboard" /> <span style={{ marginLeft: 8 }}>Personal Dashboard</span></h3>
              <p>Manage your saved papers and preferences</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;


