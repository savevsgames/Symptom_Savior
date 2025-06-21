/**
 * Application Configuration
 * Centralized access to environment variables with type safety and validation
 */

interface AppConfig {
  // Supabase
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // AI Services
  ai: {
    txAgentUrl: string | undefined;
  };
  
  // Voice Services
  voice: {
    elevenLabsApiKey: string;
  };
  
  // Video Services
  video: {
    tavusApiKey: string;
    tavusReplicaId: string;
  };
  
  // Feature Flags
  features: {
    enableVoice: boolean;
    enableEmergencyDetection: boolean;
    enableVideoAvatar: boolean;
    debug: boolean;
  };
  
  // Emergency
  emergency: {
    webhookUrl: string;
  };
}

/**
 * Parse string environment variable to boolean
 */
const parseBoolean = (value: string | undefined): boolean => {
  return value?.toLowerCase() === 'true';
};

/**
 * Validate required environment variable with fallback for SSR
 */
const requireEnv = (key: string, value: string | undefined): string => {
  if (!value) {
    // During SSR/build, provide fallback values to prevent build failures
    if (typeof window === 'undefined') {
      console.warn(`Missing environment variable: ${key} - using fallback for SSR`);
      return key === 'EXPO_PUBLIC_SUPABASE_URL' ? 'https://placeholder.supabase.co' : 'placeholder-key';
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Application configuration object
 * Validates and provides typed access to environment variables
 */
export const Config: AppConfig = {
  supabase: {
    url: requireEnv('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
    anonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  },
  
  ai: {
    // TxAgent URL is optional - app works in offline mode without it
    txAgentUrl: process.env.EXPO_PUBLIC_TXAGENT_URL,
  },
  
  voice: {
    elevenLabsApiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
  },
  
  video: {
    tavusApiKey: process.env.EXPO_PUBLIC_TAVUSAI_API_KEY || '',
    tavusReplicaId: process.env.EXPO_PUBLIC_TAVUSAI_REPLICA_ID || '',
  },
  
  features: {
    enableVoice: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_VOICE),
    enableEmergencyDetection: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_EMERGENCY_DETECTION),
    enableVideoAvatar: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_VIDEO_AVATAR),
    debug: parseBoolean(process.env.EXPO_PUBLIC_DEBUG),
  },
  
  emergency: {
    webhookUrl: process.env.EXPO_PUBLIC_EMERGENCY_WEBHOOK_URL || '',
  },
};

/**
 * Development helper to log configuration (only in debug mode)
 */
if (Config.features.debug && typeof window !== 'undefined' && __DEV__) {
  console.log('🔧 App Configuration Loaded:', {
    supabase: {
      url: Config.supabase.url ? '✅ Set' : '❌ Missing',
      anonKey: Config.supabase.anonKey ? '✅ Set' : '❌ Missing',
    },
    features: Config.features,
    ai: {
      txAgentUrl: Config.ai.txAgentUrl ? '✅ Set' : '❌ Missing (offline mode)',
    },
    voice: {
      elevenLabsApiKey: Config.voice.elevenLabsApiKey ? '✅ Set' : '❌ Missing',
    },
    video: {
      tavusApiKey: Config.video.tavusApiKey ? '✅ Set' : '❌ Missing',
      tavusReplicaId: Config.video.tavusReplicaId ? '✅ Set' : '❌ Missing',
    },
  });
}

export default Config;