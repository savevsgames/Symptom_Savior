/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.initialized) return;

    // Handle navigation based on auth state
    if (auth.isAuthenticated) {
      // User is authenticated, ensure they're on the main app
      const currentPath = window.location.pathname;
      if (currentPath.includes('/(auth)') || currentPath === '/') {
        router.replace('/(tabs)');
      }
    } else {
      // User is not authenticated, ensure they're on auth screens
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/(auth)')) {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [auth.isAuthenticated, auth.initialized]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}