import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          Graphene
        </Link>
        <p className="query-subtitle">Discover and explore academic papers</p>
        <div className="navbar-links">
          {user ? (
            <>
              <Link 
                to="/query" 
                className={`navbar-link ${isActive('/query') ? 'active' : ''}`}
              >
                Query Papers
              </Link>
              <Link 
                to="/personal" 
                className={`navbar-link ${isActive('/personal') ? 'active' : ''}`}
              >
                Personal Dashboard
              </Link>
              <button onClick={signOut} className="navbar-signout">
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-link">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

