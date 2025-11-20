'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Icon from './Icon';

function isActiveRoute(pathname: string, route: string): boolean {
  return pathname === route;
}

export default function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-[#0a0a0a] border-b border-[#1a1a1a] py-4 sticky top-0 z-[1000] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-semibold text-[#eaeaea] no-underline transition-colors hover:text-white">
          Graphene
        </Link>
        <p className="text-[#888] text-sm hidden md:block">Discover and explore academic papers</p>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/query"
                className={`px-3 py-2 text-[#888] no-underline rounded-lg text-sm font-medium transition-all border border-transparent min-w-[140px] inline-flex items-center justify-center ${
                  isActiveRoute(pathname, '/query')
                    ? 'text-[#3a82ff] bg-[#0f0f10] border-[#3a82ff]'
                    : 'hover:text-[#eaeaea] hover:bg-[#0f0f10] hover:border-[#2a2a2e]'
                }`}
              >
                Query Papers
              </Link>
              <Link
                href="/personal"
                className={`px-3 py-2 text-[#888] no-underline rounded-lg text-sm font-medium transition-all border border-transparent min-w-[140px] inline-flex items-center justify-center ${
                  isActiveRoute(pathname, '/personal')
                    ? 'text-[#3a82ff] bg-[#0f0f10] border-[#3a82ff]'
                    : 'hover:text-[#eaeaea] hover:bg-[#0f0f10] hover:border-[#2a2a2e]'
                }`}
              >
                Personal Dashboard
              </Link>
              <button
                onClick={signOut}
                className="px-3 py-2 bg-[#1a1a1a] text-[#eaeaea] border border-[#1a1a1a] rounded-lg cursor-pointer text-sm font-medium transition-all font-inherit min-w-[140px] inline-flex items-center justify-center hover:bg-[#0a0a0a] hover:border-[rgba(58,130,255,0.08)]"
              >
                <Icon name="lock" size={16} />
                <span style={{ marginLeft: 8 }}>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-2 text-[#888] no-underline rounded-lg text-sm font-medium transition-all border border-transparent min-w-[140px] inline-flex items-center justify-center hover:text-[#eaeaea] hover:bg-[#0f0f10] hover:border-[#2a2a2e]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

