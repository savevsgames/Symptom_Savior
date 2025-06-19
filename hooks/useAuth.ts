/**
 * Authentication Hook
 * Manages user authentication state and provides auth methods
 */

import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { auth } from '@/lib/supabase';
import { logger } from '@/utils/logger';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await auth.getSession();
        
        if (error) {
          logger.error('Error getting initial session:', error);
        }

        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          });
        }
      } catch (error) {
        logger.error('Error in getInitialSession:', error);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            initialized: true,
          }));
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(
      async (event, session) => {
        logger.debug('Auth state changed:', { event, session: !!session });
        
        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        logger.error('Sign in error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { error };
      }

      logger.info('User signed in successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('Sign in exception:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { data, error } = await auth.signUp(email, password);
      
      if (error) {
        logger.error('Sign up error:', error);
        setAuthState(prev => ({ ...prev, loading: false }));
        return { error };
      }

      logger.info('User signed up successfully');
      return { data, error: null };
    } catch (error) {
      logger.error('Sign up exception:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await auth.signOut();
      
      if (error) {
        logger.error('Sign out error:', error);
        return { error };
      }

      logger.info('User signed out successfully');
      return { error: null };
    } catch (error) {
      logger.error('Sign out exception:', error);
      return { error };
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!authState.user,
  };
}