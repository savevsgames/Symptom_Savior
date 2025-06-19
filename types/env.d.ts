declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Supabase Configuration
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      
      // AI Integration
      EXPO_PUBLIC_TXAGENT_URL: string;
      
      // Voice Services
      EXPO_PUBLIC_ELEVENLABS_API_KEY: string;
      
      // Video Avatar Services
      EXPO_PUBLIC_TAVUSAI_API_KEY: string;
      EXPO_PUBLIC_TAVUSAI_REPLICA_ID: string;
      
      // Feature Toggles
      EXPO_PUBLIC_ENABLE_VOICE: string;
      EXPO_PUBLIC_ENABLE_EMERGENCY_DETECTION: string;
      EXPO_PUBLIC_ENABLE_VIDEO_AVATAR: string;
      EXPO_PUBLIC_DEBUG: string;
      
      // Emergency Services
      EXPO_PUBLIC_EMERGENCY_WEBHOOK_URL: string;
    }
  }
}

export {};