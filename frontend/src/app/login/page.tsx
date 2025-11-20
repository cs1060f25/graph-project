'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { formatAuthError } from '../../lib/utils/authErrors';

function handleEmailAuth(
  email: string,
  password: string,
  isSignUp: boolean,
  signInWithEmail: (email: string, password: string) => Promise<void>,
  signUpWithEmail: (email: string, password: string) => Promise<void>
): Promise<void> {
  if (isSignUp) {
    return signUpWithEmail(email, password);
  } else {
    return signInWithEmail(email, password);
  }
}

async function handleGoogleSignIn(
  signInWithGoogle: () => Promise<void>
): Promise<void> {
  return signInWithGoogle();
}

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await handleEmailAuth(email, password, isSignUp, signInWithEmail, signUpWithEmail);
      router.push('/');
    } catch (err: any) {
      const errorMessage = formatAuthError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await handleGoogleSignIn(signInWithGoogle);
      router.push('/');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in with Google. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f10] text-[#eaeaea] p-6">
        <div className="bg-[#151517] border border-[#2a2a2e] p-12 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] text-center max-w-[400px] w-[90%]">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f10] text-[#eaeaea] p-6">
      <div className="bg-[#151517] border border-[#2a2a2e] p-12 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.4)] text-center max-w-[400px] w-[90%]">
        <h1 className="m-0 mb-2 text-4xl font-semibold text-[#eaeaea]">Graphene</h1>
        <p className="m-0 mb-8 text-[#a0a0a5] text-base">Research Paper Discovery Platform</p>
        
        <form onSubmit={handleEmailSubmit} className="w-full mb-6">
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl text-[#eaeaea] text-base font-inherit transition-all box-border focus:outline-none focus:border-[#4a9eff] focus:bg-[#1e1e20] disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-[#6a6a6e]"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl text-[#eaeaea] text-base font-inherit transition-all box-border focus:outline-none focus:border-[#4a9eff] focus:bg-[#1e1e20] disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-[#6a6a6e]"
              minLength={6}
            />
          </div>
          <button 
            type="submit"
            className="w-full px-6 py-3 bg-[#4a9eff] border-none rounded-xl text-base font-semibold text-white cursor-pointer transition-all font-inherit mt-2 hover:bg-[#3a8eef] hover:shadow-[0_4px_12px_rgba(74,158,255,0.3)] disabled:opacity-60 disabled:cursor-not-allowed" 
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div className="flex items-center text-center my-6 text-[#6a6a6e] text-sm">
          <div className="flex-1 border-b border-[#2a2a2e]"></div>
          <span className="px-4">OR</span>
          <div className="flex-1 border-b border-[#2a2a2e]"></div>
        </div>

        <button 
          className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border border-[#dcdcdc] rounded-xl text-base font-semibold text-[#111111] cursor-pointer transition-all font-inherit hover:brightness-[0.98] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed" 
          onClick={handleGoogleSubmit}
          disabled={loading}
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="bg-transparent border-none text-[#4a9eff] cursor-pointer text-sm font-inherit p-2 transition-colors underline hover:text-[#3a8eef] disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"}
          </button>
        </div>

        {error && <p className="mt-4 text-[#ffb3b3] text-sm bg-[#2a1111] border border-[#5a1a1a] p-3 rounded-lg">{error}</p>}
      </div>
    </div>
  );
}

