/**
 * Text-to-Speech Service
 * Handles audio generation and playback via secure backend API
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Config } from './config';
import { logger } from '@/utils/logger';

export interface TTSOptions {
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface TTSResult {
  audioUrl?: string;
  duration?: number;
  error?: string;
}

class TTSService {
  private sound: Audio.Sound | null = null;
  private webAudio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT = 10; // Max 10 requests per minute
  private readonly RATE_WINDOW = 60000; // 1 minute

  /**
   * Check rate limiting to prevent API abuse
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.lastRequestTime > this.RATE_WINDOW) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    if (this.requestCount >= this.RATE_LIMIT) {
      logger.warn('TTS rate limit exceeded');
      return false;
    }
    
    this.requestCount++;
    return true;
  }

  /**
   * Generate speech audio from text using secure backend API
   */
  async generateSpeech(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    if (!Config.features.enableVoice) {
      logger.warn('Voice features are disabled in configuration', {
        enableVoice: Config.features.enableVoice,
        envValue: process.env.EXPO_PUBLIC_ENABLE_VOICE
      });
      return { error: 'Voice features are disabled' };
    }

    if (!Config.ai.backendUserPortal) {
      logger.error('Backend User Portal URL not configured for TTS', {
        envVar: process.env.EXPO_PUBLIC_BACKEND_USER_PORTAL,
        configValue: Config.ai.backendUserPortal
      });
      return { error: 'Voice service not configured. Please check your settings.' };
    }

    if (!this.checkRateLimit()) {
      return { error: 'Rate limit exceeded. Please wait before making more requests.' };
    }

    if (!text.trim()) {
      return { error: 'No text provided for speech generation' };
    }

    // Limit text length to prevent excessive costs
    if (text.length > 2000) {
      text = text.substring(0, 2000) + '...';
      logger.warn('Text truncated for TTS to prevent excessive costs');
    }

    try {
      // ADDED: Log the full URL being used for the TTS API call
      const fullUrl = `${Config.ai.backendUserPortal}/api/voice/tts`;
      logger.debug('Generating TTS audio via backend API', { 
        textLength: text.length,
        fullUrl,
        rawBackendUrl: process.env.EXPO_PUBLIC_BACKEND_USER_PORTAL,
        configBackendUrl: Config.ai.backendUserPortal
      });

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required for text-to-speech');
      }

      // Call our secure backend API using the configured backend user portal URL
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'User-Agent': 'SymptomSavior/1.0.0',
        },
        body: JSON.stringify({
          text,
          voice_id: options.voice_id || 'EXAVITQu4vr4xnSDxMaL', // Default Bella voice
          model_id: options.model_id || 'eleven_turbo_v2', // Fast, cost-effective model
          voice_settings: options.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Backend TTS API error', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText,
          url: fullUrl
        });
        
        if (response.status === 401) {
          return { error: 'Authentication failed. Please sign in again.' };
        } else if (response.status === 429) {
          return { error: 'Too many requests. Please wait before trying again.' };
        } else if (response.status === 400) {
          return { error: 'Invalid text content. Please try again with different text.' };
        } else if (response.status === 404) {
          return { error: 'Voice service not available. Please try again later.' };
        } else if (response.status === 503) {
          return { error: 'Voice service temporarily unavailable. Please try again later.' };
        } else {
          return { error: 'Failed to generate speech. Please try again.' };
        }
      }

      // Get the audio URL directly from the response
      // The backend should return a JSON object with an audio_url field
      const result = await response.json();
      const audioUrl = result.audio_url;

      if (!audioUrl) {
        logger.error('TTS API response missing audio URL', { result });
        return { error: 'Invalid response from voice service' };
      }

      logger.info('TTS audio generated successfully via backend', { 
        textLength: text.length,
        audioUrl: audioUrl.substring(0, 50) + '...' // Log partial URL for privacy
      });

      return { audioUrl };
    } catch (error) {
      // Enhanced error logging with full details
      logger.error('TTS generation failed', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        text: text.substring(0, 50) + '...',
        options
      });
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          return { error: 'Authentication failed. Please sign in again.' };
        } else if (error.message.includes('fetch')) {
          return { error: 'Network error. Please check your connection and try again.' };
        }
      }
      
      return { error: 'Network error. Please check your connection and try again.' };
    }
  }

  /**
   * Play audio from URL with platform-specific implementation
   */
  async playAudio(audioUrl: string): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopAudio();

      logger.debug('Playing TTS audio', { audioUrl });

      // Platform-specific audio playback
      if (Platform.OS === 'web') {
        // Web implementation using HTML5 Audio API
        // FIXED: Use window.Audio instead of Audio to ensure correct constructor reference
        this.webAudio = new window.Audio(audioUrl);
        
        // Set up event listeners
        this.webAudio.onended = () => {
          logger.debug('Web audio playback ended');
          this.isPlaying = false;
          this.cleanup();
        };
        
        this.webAudio.onerror = (e) => {
          logger.error('Web audio playback error', { 
            error: e,
            audioUrl
          });
          this.isPlaying = false;
          this.cleanup();
        };
        
        // Start playback
        try {
          await this.webAudio.play();
          this.isPlaying = true;
          logger.info('Web audio playback started');
        } catch (playError) {
          logger.error('Web audio play() failed', {
            error: playError instanceof Error ? {
              name: playError.name,
              message: playError.message,
              stack: playError.stack
            } : playError,
            audioUrl
          });
          throw new Error('Failed to play audio. Please try again.');
        }
      } else {
        // Native implementation using expo-av
        // Configure audio mode for playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Create and play sound
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, volume: 1.0 }
        );

        this.sound = sound;
        this.isPlaying = true;

        // Set up playback status listener
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              this.isPlaying = false;
              this.cleanup();
            }
          }
        });

        logger.info('Native audio playback started');
      }
    } catch (error) {
      logger.error('Failed to play TTS audio', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        audioUrl
      });
      this.isPlaying = false;
      throw new Error('Failed to play audio. Please try again.');
    }
  }

  /**
   * Stop currently playing audio
   */
  async stopAudio(): Promise<void> {
    if (Platform.OS === 'web' && this.webAudio) {
      try {
        // Web implementation
        this.webAudio.pause();
        this.webAudio.currentTime = 0;
        logger.debug('Web audio stopped');
      } catch (error) {
        logger.error('Error stopping web audio', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      } finally {
        this.cleanup();
      }
    } else if (this.sound) {
      try {
        // Native implementation
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        logger.debug('Native audio stopped');
      } catch (error) {
        logger.error('Error stopping native audio', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      } finally {
        this.cleanup();
      }
    }
  }

  /**
   * Check if audio is currently playing
   */
  get isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Generate and immediately play speech
   */
  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    const result = await this.generateSpeech(text, options);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (result.audioUrl) {
      await this.playAudio(result.audioUrl);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (Platform.OS === 'web' && this.webAudio) {
      // Remove event listeners
      this.webAudio.onended = null;
      this.webAudio.onerror = null;
      
      // Release resources
      this.webAudio.src = '';
      this.webAudio = null;
    }
    
    this.sound = null;
    this.isPlaying = false;
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimitRemaining: Math.max(0, this.RATE_LIMIT - this.requestCount),
    };
  }
}

// Export singleton instance
export const ttsService = new TTSService();

// Export convenience methods
export const generateSpeech = (text: string, options?: TTSOptions) => 
  ttsService.generateSpeech(text, options);

export const playAudio = (audioUrl: string) => 
  ttsService.playAudio(audioUrl);

export const speak = (text: string, options?: TTSOptions) => 
  ttsService.speak(text, options);

export const stopAudio = () => 
  ttsService.stopAudio();

export const isAudioPlaying = () => 
  ttsService.isAudioPlaying;