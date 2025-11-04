import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PersonalPage.css';

const PersonalPage = () => {
  const { user } = useAuth();

  return (
    <div className="personal-page">
      <div className="personal-content">
        <h1>Personal Dashboard</h1>
        <div className="user-card">
          <h2>Your Profile</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.displayName || 'Not set'}</p>
        </div>
        <div className="coming-soon">
          <p>Coming soon...</p>
          <p>This is where users will manage their saved papers and preferences.</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalPage;

