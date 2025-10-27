import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './PersonalPage.css';

const PersonalPage = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="personal-page">
      <div className="personal-header">
        <h1>Personal Dashboard</h1>
        <button onClick={signOut} className="signout-button">Sign Out</button>
      </div>
      <div className="personal-content">
        <div className="user-card">
          <h2>Your Profile</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.displayName || 'Not set'}</p>
        </div>
        <p>Coming soon...</p>
        <p>This is where users will manage their saved papers and preferences.</p>
      </div>
    </div>
  );
};

export default PersonalPage;

