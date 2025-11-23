'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/contexts/AuthContext';
import Icon from './Icon';
import './Navbar.css';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link href="/" className="navbar-brand">
          Graphene
        </Link>
        <p className="query-subtitle">Discover and explore academic papers</p>
        <div className="navbar-links">
          {user ? (
            <>
              <Link 
                href="/query" 
                className={`navbar-link ${isActive('/query') ? 'active' : ''}`}
              >
                Query Papers
              </Link>
              <Link 
                href="/personal" 
                className={`navbar-link ${isActive('/personal') ? 'active' : ''}`}
              >
                Personal Dashboard
              </Link>
              <button onClick={signOut} className="navbar-signout">
                <Icon name="lock" size={16} />
                <span style={{ marginLeft: 8 }}>Sign Out</span>
              </button>
            </>
          ) : (
            <Link href="/login" className="navbar-link">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


