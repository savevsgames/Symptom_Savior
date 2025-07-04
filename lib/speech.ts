/**
 * Speech-to-Text Integration
 * Handles audio recording and transcription via secure backend API
 */

import { Platform } from 'react-native';
import { supabase } from './supabase';
import { logger } from '@/utils/logger';
import { Config } from './config';

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
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
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
      logger.error('Failed to initialize Audio module', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
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
        // Check if the browser supports the required APIs
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          logger.error('Web microphone API not supported');
          return false;
        }

        // First, check current permission status without triggering a prompt
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            
            if (permissionStatus.state === 'granted') {
              return true;
            } else if (permissionStatus.state === 'denied') {
              logger.warn('Web microphone permission previously denied');
              return false;
            }
            // If state is 'prompt', we'll need to request permission when actually starting recording
            return true; // Return true to indicate we can attempt to request permission later
          } catch (error) {
            // Fallback if permissions.query is not supported
            logger.debug('Permissions API not supported, will check on recording start');
            return true;
          }
        }

        // If permissions API is not available, assume we can request permission when needed
        return true;
      }

      const Audio = await this.initializeAudio();
      if (!Audio) return false;

      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logger.error('Failed to request microphone permissions', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      return false;
    }
  }

  /**
   * Request microphone permission with user interaction (for web)
   */
  private async requestWebPermissionWithPrompt(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      logger.error('Web microphone permission denied by user', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
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

      if (Platform.OS === 'web') {
        // For web, request permission with user interaction when actually starting recording
        const hasPermission = await this.requestWebPermissionWithPrompt();
        if (!hasPermission) {
          throw new Error('Microphone permission not granted');
        }
        
        // Web implementation using MediaRecorder API
        try {
          // Reset audio chunks
          this.audioChunks = [];
          
          // Get audio stream
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            } 
          });
          
          // Create MediaRecorder with supported MIME type
          const mimeType = this.getSupportedMimeType();
          logger.debug('Using MIME type for recording', { mimeType });
          
          this.mediaRecorder = new MediaRecorder(stream, {
            mimeType,
            audioBitsPerSecond: 128000
          });
          
          // Set up data handler
          this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              this.audioChunks.push(event.data);
            }
          };
          
          // Set up error handler
          this.mediaRecorder.onerror = (event) => {
            logger.error('MediaRecorder error', {
              error: event.error,
              message: event.error.message
            });
            this.isRecording = false;
          };
          
          // Start recording
          this.mediaRecorder.start(100); // Collect data in 100ms chunks
          this.isRecording = true;
          
          logger.info('Web audio recording started', { 
            mimeType,
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
        } catch (webError) {
          logger.error('Web MediaRecorder failed to initialize', {
            error: webError instanceof Error ? {
              name: webError.name,
              message: webError.message,
              stack: webError.stack
            } : webError
          });
          throw new Error('Failed to start recording: ' + (webError instanceof Error ? webError.message : 'Unknown error'));
        }
      } else {
        const Audio = await this.initializeAudio();
        if (!Audio) {
          throw new Error('Audio module not available');
        }

        // Request permissions first for native platforms
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

        logger.info('Native audio recording started', { 
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
      }
    } catch (error) {
      logger.error('Failed to start recording', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        platform: Platform.OS,
        options
      });
      this.isRecording = false;
      throw error;
    }
  }

  /**
   * Get supported MIME type for MediaRecorder
   */
  private getSupportedMimeType(): string {
    // Try different MIME types in order of preference
    const mimeTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    
    // Fallback to default
    logger.warn('No preferred MIME types supported, using browser default');
    return '';
  }

  /**
   * Stop audio recording and return the audio URI
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
          logger.warn('No active web recording to stop');
          return null;
        }
        
        return new Promise((resolve) => {
          this.mediaRecorder!.onstop = async () => {
            try {
              // Create a blob from all the chunks
              const audioBlob = new Blob(this.audioChunks, { 
                type: this.mediaRecorder!.mimeType || 'audio/webm' 
              });
              
              // Create a URL for the blob
              const audioUrl = URL.createObjectURL(audioBlob);
              
              this.isRecording = false;
              this.audioChunks = [];
              
              // Stop all tracks in the stream
              this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
              this.mediaRecorder = null;
              
              logger.info('Web audio recording stopped', { 
                blobSize: audioBlob.size,
                mimeType: audioBlob.type
              });
              
              resolve(audioUrl);
            } catch (error) {
              logger.error('Error processing web audio after stop', {
                error: error instanceof Error ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack
                } : error
              });
              resolve(null);
            }
          };
          
          // Stop the recording
          this.mediaRecorder!.stop();
        });
      } else if (!this.recording || !this.isRecording) {
        logger.warn('No active recording to stop');
        return null;
      } else {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        
        this.recording = null;
        this.isRecording = false;

        logger.info('Native audio recording stopped', { uri });
        return uri;
      }
    } catch (error) {
      logger.error('Failed to stop recording', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      this.isRecording = false;
      return null;
    }
  }

  /**
   * Transcribe audio using secure backend API
   */
  async transcribeAudio(audioUri: string): Promise<TranscriptionResult> {
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    if (!Config.ai.backendUserPortal) {
      logger.error('Backend User Portal URL not configured for transcription', {
        envVar: process.env.EXPO_PUBLIC_BACKEND_USER_PORTAL,
        configValue: Config.ai.backendUserPortal
      });
      throw new Error('Voice transcription service not configured. Please check your settings.');
    }

    try {
      // ADDED: Log the full URL being used for the transcription API call
      const fullUrl = `${Config.ai.backendUserPortal}/api/voice/transcribe`;
      logger.debug('Starting audio transcription via backend API', { 
        audioUri,
        fullUrl,
        rawBackendUrl: process.env.EXPO_PUBLIC_BACKEND_USER_PORTAL,
        configBackendUrl: Config.ai.backendUserPortal
      });

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required for transcription');
      }

      // Convert audio URI to blob
      const audioBlob = await this.uriToBlob(audioUri);
      
      // Convert blob to base64 string
      const base64Audio = await this.blobToBase64(audioBlob);

      // Call our secure backend API with JSON payload instead of FormData
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SymptomSavior/1.0.0',
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          mime_type: audioBlob.type || 'audio/webm'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Backend transcription API error', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText,
          url: fullUrl
        });
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait before trying again.');
        } else if (response.status === 400) {
          throw new Error('Invalid audio format. Please try recording again.');
        } else if (response.status === 404) {
          throw new Error('Voice transcription service not available. Please try again later.');
        } else if (response.status === 503) {
          throw new Error('Voice service temporarily unavailable. Please try again later.');
        } else {
          throw new Error('Transcription failed. Please try again.');
        }
      }

      const result = await response.json();
      
      logger.info('Audio transcription completed via backend', { 
        textLength: result.text?.length || 0,
        confidence: result.confidence 
      });

      return {
        text: result.text || '',
        confidence: result.confidence,
        duration: result.duration,
      };
    } catch (error) {
      logger.error('Audio transcription failed', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        audioUri: audioUri ? `${audioUri.substring(0, 20)}...` : 'null'
      });
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication')) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else {
          throw error; // Re-throw the original error
        }
      }
      
      throw new Error('Failed to transcribe audio. Please try again later.');
    }
  }

  /**
   * Convert Blob to Base64 string
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
      logger.error('Record and transcribe failed', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        options
      });
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
      logger.error('Failed to get recording duration', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      return 0;
    }
  }

  /**
   * Cancel current recording
   */
  async cancelRecording(): Promise<void> {
    if (Platform.OS === 'web' && this.mediaRecorder) {
      try {
        // Stop the MediaRecorder
        this.mediaRecorder.stop();
        
        // Stop all tracks in the stream
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        // Clear resources
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        logger.info('Web recording cancelled');
      } catch (error) {
        logger.error('Failed to cancel web recording', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      }
    } else if (this.recording && this.isRecording) {
      try {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
        this.isRecording = false;
        logger.info('Recording cancelled');
      } catch (error) {
        logger.error('Failed to cancel recording', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      }
    }
  }

  /**
   * Get recording options based on quality setting
   */
  private getRecordingOptions(quality: 'low' | 'medium' | 'high') {
    const baseOptions = {
      android: {
        extension: '.m4a',
        outputFormat: 'DEFAULT' as any,
        audioEncoder: 'DEFAULT' as any,
      },
      ios: {
        extension: '.m4a',
        outputFormat: 'MPEG4AAC' as any,
        audioQuality: 'HIGH' as any,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        // FIXED: Changed from 'audio/wav' to 'audio/webm' for better browser compatibility
        mimeType: 'audio/webm',
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
      logger.error('Failed to convert URI to blob', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        uri: uri ? `${uri.substring(0, 20)}...` : 'null'
      });
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