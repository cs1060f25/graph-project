'use client';

/**
 * Client-side providers wrapper
 * Used in App Router layout since providers need to be client components
 */

import React from 'react';
import { AuthProvider } from '../lib/contexts/AuthContext';

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}


