/**
 * Speech-to-Text Integration
 * Handles audio recording and transcription with ElevenLabs integration
 */

import { Platform } from 'react-native';
import { Config } from './config';
import { logger } from '@/utils/logger';

export interface TranscriptionResult {
  text: string;
  confidence?: number;
  duration?: number;
}

export interface RecordingOptions {
  maxDuration?: number; // in milliseconds
  quality?: 'low' | 'medium' | 'high';
}

class SpeechService {
  private recording: any = null;
  private isRecording = false;
  private Audio: any = null;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT = 15; // Max 15 STT requests per minute
  private readonly RATE_WINDOW = 60000; // 1 minute

  /**
   * Initialize Audio module only when needed and in browser environment
   */
  private async initializeAudio() {
    if (this.Audio || typeof window === 'undefined') {
      return this.Audio;
    }

    try {
      // Dynamically import expo-av only in browser environment
      const { Audio } = await import('expo-av');
      this.Audio = Audio;
      return Audio;
    } catch (error) {
      logger.error('Failed to initialize Audio module', error);
      return null;
    }
  }

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
      logger.warn('STT rate limit exceeded');
      return false;
    }
    
    this.requestCount++;
    return true;
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web permissions are handled by the browser
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately, we just needed to check permissions
            stream.getTracks().forEach(track => track.stop());
            return true;
          } catch (error) {
            logger.error('Web microphone permission denied', error);
            return false;
          }
        }
        return false;
      }

      const Audio = await this.initializeAudio();
      if (!Audio) return false;

      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logger.error('Failed to request microphone permissions', error);
      return false;
    }
  }

  /**
   * Start audio recording
   */
  async startRecording(options: RecordingOptions = {}): Promise<void> {
    try {
      if (this.isRecording) {
        logger.warn('Recording already in progress');
        return;
      }

      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Audio recording is not available in server environment');
      }

      const Audio = await this.initializeAudio();
      if (!Audio) {
        throw new Error('Audio module not available');
      }

      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Set recording options based on quality
      const recordingOptions = this.getRecordingOptions(options.quality || 'high');

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;
      this.isRecording = true;

      logger.info('Audio recording started', { 
        quality: options.quality,
        maxDuration: options.maxDuration 
      });

      // Auto-stop after max duration if specified
      if (options.maxDuration) {
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, options.maxDuration);
      }
    } catch (error) {
      logger.error('Failed to start recording', error);
      this.isRecording = false;
      throw error;
    }
  }

  /**
   * Stop audio recording and return the audio URI
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording || !this.isRecording) {
        logger.warn('No active recording to stop');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      this.recording = null;
      this.isRecording = false;

      logger.info('Audio recording stopped', { uri });
      return uri;
    } catch (error) {
      logger.error('Failed to stop recording', error);
      this.isRecording = false;
      return null;
    }
  }

  /**
   * Transcribe audio using ElevenLabs API
   */
  async transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
    if (!Config.voice.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    try {
      logger.debug('Starting audio transcription', { audioUri });

      // Convert audio URI to blob
      const audioBlob = await this.uriToBlob(audioUri);

      // Prepare form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('model', 'whisper-1');

      // Call ElevenLabs Speech-to-Text API
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': Config.voice.elevenLabsApiKey,
          // Don't set Content-Type for FormData - let the browser set it
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('ElevenLabs STT API error', { 
          status: response.status, 
          error: errorText 
        });
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your ElevenLabs configuration.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        } else if (response.status === 422) {
          throw new Error('Invalid audio format. Please try recording again.');
        } else {
          throw new Error(`Transcription failed: ${response.statusText}`);
        }
      }

      const result = await response.json();
      
      logger.info('Audio transcription completed', { 
        textLength: result.text?.length || 0,
        confidence: result.confidence 
      });

      return {
        text: result.text || '',
        confidence: result.confidence,
        duration: result.duration,
      };
    } catch (error) {
      logger.error('Audio transcription failed', error);
      throw new Error('Failed to transcribe audio. Please try again.');
    }
  }

  /**
   * Record and transcribe audio in one call
   */
  async recordAndTranscribe(options: RecordingOptions = {}): Promise<TranscriptionResult> {
    try {
      await this.startRecording(options);
      
      // Return a promise that resolves when recording is manually stopped
      return new Promise((resolve, reject) => {
        const checkRecording = async () => {
          if (!this.isRecording) {
            try {
              const audioUri = await this.stopRecording();
              if (audioUri) {
                const result = await this.transcribeAudio(audioUri);
                resolve(result);
              } else {
                reject(new Error('No audio recorded'));
              }
            } catch (error) {
              reject(error);
            }
          } else {
            // Check again in 100ms
            setTimeout(checkRecording, 100);
          }
        };
        
        checkRecording();
      });
    } catch (error) {
      logger.error('Record and transcribe failed', error);
      throw error;
    }
  }

  /**
   * Check if currently recording
   */
  get isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get recording duration in milliseconds
   */
  async getRecordingDuration(): Promise<number> {
    if (!this.recording) return 0;
    
    try {
      const status = await this.recording.getStatusAsync();
      return status.isLoaded ? status.durationMillis || 0 : 0;
    } catch (error) {
      logger.error('Failed to get recording duration', error);
      return 0;
    }
  }

  /**
   * Cancel current recording
   */
  async cancelRecording(): Promise<void> {
    if (this.recording && this.isRecording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;
        logger.info('Recording cancelled');
      } catch (error) {
        logger.error('Failed to cancel recording', error);
      }
    }
  }

  /**
   * Get recording options based on quality setting
   */
  private getRecordingOptions(quality: 'low' | 'medium' | 'high') {
    const baseOptions = {
      android: {
        extension: '.wav',
        outputFormat: 'DEFAULT' as any,
        audioEncoder: 'DEFAULT' as any,
      },
      ios: {
        extension: '.wav',
        outputFormat: 'LINEARPCM' as any,
        audioQuality: 'HIGH' as any,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/wav',
        bitsPerSecond: 128000,
      },
    };

    // Adjust quality settings
    switch (quality) {
      case 'low':
        if (baseOptions.ios) {
          baseOptions.ios.sampleRate = 22050;
          baseOptions.ios.bitRate = 64000;
        }
        if (baseOptions.web) {
          baseOptions.web.bitsPerSecond = 64000;
        }
        break;
      case 'medium':
        if (baseOptions.ios) {
          baseOptions.ios.sampleRate = 32000;
          baseOptions.ios.bitRate = 96000;
        }
        if (baseOptions.web) {
          baseOptions.web.bitsPerSecond = 96000;
        }
        break;
      case 'high':
      default:
        // Use default high quality settings
        break;
    }

    return baseOptions;
  }

  /**
   * Convert URI to Blob for API upload
   */
  private async uriToBlob(uri: string): Promise<Blob> {
    try {
      const response = await fetch(uri);
      return await response.blob();
    } catch (error) {
      logger.error('Failed to convert URI to blob', error);
      throw new Error('Failed to process audio file');
    }
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

// Create singleton instance only in browser environment
let speechServiceInstance: SpeechService | null = null;

const getSpeechService = (): SpeechService => {
  if (!speechServiceInstance) {
    speechServiceInstance = new SpeechService();
  }
  return speechServiceInstance;
};

// Export singleton instance getter
export const speechService = typeof window !== 'undefined' ? getSpeechService() : null;

// Export convenience methods with null checks
export const requestPermissions = async (): Promise<boolean> => {
  if (!speechService) return false;
  return speechService.requestPermissions();
};

export const startRecording = async (options?: RecordingOptions): Promise<void> => {
  if (!speechService) throw new Error('Speech service not available');
  return speechService.startRecording(options);
};

export const stopRecording = async (): Promise<string | null> => {
  if (!speechService) return null;
  return speechService.stopRecording();
};

export const transcribeAudio = async (audioUri: string): Promise<TranscriptionResult> => {
  if (!speechService) throw new Error('Speech service not available');
  return speechService.transcribeAudio(audioUri);
};

export const recordAndTranscribe = async (options?: RecordingOptions): Promise<TranscriptionResult> => {
  if (!speechService) throw new Error('Speech service not available');
  return speechService.recordAndTranscribe(options);
};

export const cancelRecording = async (): Promise<void> => {
  if (!speechService) return;
  return speechService.cancelRecording();
};