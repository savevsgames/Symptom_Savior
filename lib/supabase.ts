/**
 * Supabase Client Configuration
 * Centralized Supabase client with proper authentication handling and SSR compatibility
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { Config } from './config';

// SSR-safe storage initialization
const getStorage = () => {
  if (typeof window === 'undefined') {
    // Server-side: return a no-op storage
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }

  if (Platform.OS === 'web') {
    // Web: use localStorage
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  }

  // Native: use AsyncStorage (dynamically imported)
  let AsyncStorage: any = null;
  
  const initAsyncStorage = async () => {
    if (!AsyncStorage) {
      try {
        const module = await import('@react-native-async-storage/async-storage');
        AsyncStorage = module.default;
      } catch (error) {
        console.warn('AsyncStorage not available, falling back to memory storage');
        return {
          getItem: () => Promise.resolve(null),
          setItem: () => Promise.resolve(),
          removeItem: () => Promise.resolve(),
        };
      }
    }
    return AsyncStorage;
  };

  return {
    getItem: async (key: string) => {
      const storage = await initAsyncStorage();
      return storage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      const storage = await initAsyncStorage();
      return storage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      const storage = await initAsyncStorage();
      return storage.removeItem(key);
    },
  };
};

// Create Supabase client with SSR-safe configuration
export const supabase = createClient(
  Config.supabase.url,
  Config.supabase.anonKey,
  {
    auth: {
      storage: getStorage(),
      persistSession: typeof window !== 'undefined', // Only persist on client-side
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
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

// Auth helper functions with SSR safety
export const auth = {
  signUp: async (email: string, password: string) => {
    if (typeof window === 'undefined') {
      return { data: null, error: new Error('Auth not available on server') };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    if (typeof window === 'undefined') {
      return { data: null, error: new Error('Auth not available on server') };
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    if (typeof window === 'undefined') {
      return { error: new Error('Auth not available on server') };
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    if (typeof window === 'undefined') {
      return Promise.resolve({ data: { user: null }, error: null });
    }
    
    return supabase.auth.getUser();
  },

  getSession: () => {
    if (typeof window === 'undefined') {
      return Promise.resolve({ data: { session: null }, error: null });
    }
    
    return supabase.auth.getSession();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (typeof window === 'undefined') {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    
    return supabase.auth.onAuthStateChange(callback);
  },
};

export default supabase;