/**
 * Supabase Client Configuration
 * Centralized Supabase client with proper authentication handling
 */

import { createClient } from '@supabase/supabase-js';
import { Config } from './config';

// Create Supabase client
export const supabase = createClient(
  Config.supabase.url,
  Config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Database types based on the schema
export interface Document {
  id: string;
  filename: string | null;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, any>;
  user_id: string;
  created_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  status: string;
  session_data: Record<string, any>;
  created_at: string;
  last_active: string;
  terminated_at: string | null;
}

export interface EmbeddingJob {
  id: string;
  file_path: string;
  status: string;
  metadata: Record<string, any>;
  chunk_count: number;
  error: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Auth helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  getSession: () => {
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabase;