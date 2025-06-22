/**
 * Text-to-Speech Service using ElevenLabs
 * Handles audio generation and playback with security measures
 */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
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
   * Generate speech audio from text using ElevenLabs
   */
  async generateSpeech(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    if (!Config.voice.elevenLabsApiKey) {
      logger.warn('ElevenLabs API key not configured');
      return { error: 'Voice service not configured' };
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
      logger.debug('Generating TTS audio', { textLength: text.length });

      const voiceId = options.voice_id || 'EXAVITQu4vr4xnSDxMaL'; // Default Bella voice
      const modelId = options.model_id || 'eleven_turbo_v2'; // Fast, cost-effective model

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': Config.voice.elevenLabsApiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
            ...options.voice_settings,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('ElevenLabs TTS API error', { 
          status: response.status, 
          error: errorText 
        });
        
        if (response.status === 401) {
          return { error: 'Invalid API key. Please check your ElevenLabs configuration.' };
        } else if (response.status === 429) {
          return { error: 'API rate limit exceeded. Please try again later.' };
        } else if (response.status === 422) {
          return { error: 'Invalid request. Please check the text content.' };
        } else {
          return { error: 'Failed to generate speech. Please try again.' };
        }
      }

      // Convert response to blob and create object URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      logger.info('TTS audio generated successfully', { 
        textLength: text.length,
        audioSize: audioBlob.size 
      });

      return { audioUrl };
    } catch (error) {
      logger.error('TTS generation failed', error);
      return { error: 'Network error. Please check your connection and try again.' };
    }
  }

  /**
   * Play audio from URL
   */
  async playAudio(audioUrl: string): Promise<void> {
    try {
      // Stop any currently playing audio
      await this.stopAudio();

      logger.debug('Playing TTS audio', { audioUrl });

      // Configure audio mode for playback
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      }

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

      logger.info('TTS audio playback started');
    } catch (error) {
      logger.error('Failed to play TTS audio', error);
      this.isPlaying = false;
      throw new Error('Failed to play audio. Please try again.');
    }
  }

  /**
   * Stop currently playing audio
   */
  async stopAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        logger.debug('TTS audio stopped');
      } catch (error) {
        logger.error('Error stopping TTS audio', error);
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
   * Get available voices from ElevenLabs
   */
  async getAvailableVoices(): Promise<any[]> {
    if (!Config.voice.elevenLabsApiKey) {
      return [];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': Config.voice.elevenLabsApiKey,
        },
      });

      if (!response.ok) {
        logger.error('Failed to fetch voices', { status: response.status });
        return [];
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      logger.error('Error fetching voices', error);
      return [];
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
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

export const getAvailableVoices = () => 
  ttsService.getAvailableVoices();