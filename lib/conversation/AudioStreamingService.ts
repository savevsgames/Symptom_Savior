import { logger } from '@/utils/logger';
import { VoiceActivityDetector, VADOptions, VADEvents } from './VoiceActivityDetector';
import { getConversationService, WebSocketMessageType } from './ConversationWebSocketService';

export interface AudioStreamingOptions {
  vadOptions?: VADOptions;
  audioConfig?: {
    sampleRate?: number;
    channels?: number;
    bitsPerSecond?: number;
    mimeType?: string;
    chunkDuration?: number; // ms
  };
}

export interface AudioStreamingEvents {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onAudioLevel?: (level: number) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: (duration: number, finalAudio?: Blob) => void;
  onTranscriptReceived?: (transcript: string, isFinal: boolean) => void;
  onAIResponseStart?: () => void;
  onAIResponseEnd?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Service for streaming audio to the conversation API
 */
export class AudioStreamingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private vad: VoiceActivityDetector | null = null;
  private isRecording = false;
  private audioChunks: Blob[] = [];
  private recordingStartTime: number | null = null;
  private conversationService = getConversationService();
  
  private options: Required<AudioStreamingOptions>;
  private events: AudioStreamingEvents;
  
  private readonly DEFAULT_OPTIONS: Required<AudioStreamingOptions> = {
    vadOptions: {
      silenceThreshold: 15,
      silenceTimeout: 1500,
      minSpeechDuration: 300,
      maxSpeechDuration: 30000,
      adaptiveThreshold: true,
      debugMode: false
    },
    audioConfig: {
      sampleRate: 16000,
      channels: 1,
      bitsPerSecond: 128000,
      mimeType: 'audio/webm',
      chunkDuration: 200 // 200ms chunks
    }
  };
  
  constructor(options?: AudioStreamingOptions, events?: AudioStreamingEvents) {
    this.options = {
      vadOptions: { ...this.DEFAULT_OPTIONS.vadOptions, ...options?.vadOptions },
      audioConfig: { ...this.DEFAULT_OPTIONS.audioConfig, ...options?.audioConfig }
    };
    
    this.events = events || {};
    
    // Set up conversation service event listeners
    this.conversationService.on(WebSocketMessageType.TRANSCRIPT_PARTIAL, (payload) => {
      if (this.events.onTranscriptReceived) {
        this.events.onTranscriptReceived(payload.text, false);
      }
    });
    
    this.conversationService.on(WebSocketMessageType.TRANSCRIPT_FINAL, (payload) => {
      if (this.events.onTranscriptReceived) {
        this.events.onTranscriptReceived(payload.text, true);
      }
    });
    
    this.conversationService.on(WebSocketMessageType.AI_SPEAKING, () => {
      if (this.events.onAIResponseStart) {
        this.events.onAIResponseStart();
      }
    });
    
    this.conversationService.on(WebSocketMessageType.AI_RESPONSE_COMPLETE, () => {
      if (this.events.onAIResponseEnd) {
        this.events.onAIResponseEnd();
      }
    });
  }
  
  /**
   * Start audio streaming with VAD
   */
  async startStreaming(): Promise<void> {
    try {
      if (this.isRecording) {
        logger.warn('Already recording, stopping current recording first');
        await this.stopStreaming();
      }
      
      // Get audio stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.options.audioConfig.sampleRate,
          channelCount: this.options.audioConfig.channels
        },
        video: false
      });
      
      // Set up VAD
      this.vad = new VoiceActivityDetector(this.options.vadOptions, {
        onSpeechStart: () => {
          logger.debug('VAD detected speech start');
          
          // Clear any existing audio chunks when speech starts
          this.audioChunks = [];
          
          if (this.events.onSpeechStart) {
            this.events.onSpeechStart();
          }
        },
        onSpeechEnd: async (duration) => {
          logger.debug('VAD detected speech end', { duration });
          
          // Create a single blob from all chunks
          if (this.audioChunks.length > 0) {
            const finalAudio = new Blob(this.audioChunks, { 
              type: this.options.audioConfig.mimeType 
            });
            
            // Send the final audio chunk
            await this.conversationService.sendAudioChunk(finalAudio, true);
            
            if (this.events.onSpeechEnd) {
              this.events.onSpeechEnd(duration, finalAudio);
            }
          } else {
            logger.warn('Speech ended but no audio chunks collected');
            
            if (this.events.onSpeechEnd) {
              this.events.onSpeechEnd(duration);
            }
          }
          
          // Clear chunks after sending
          this.audioChunks = [];
        },
        onAudioLevel: (level) => {
          if (this.events.onAudioLevel) {
            this.events.onAudioLevel(level);
          }
        },
        onError: (error) => {
          logger.error('VAD error', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          });
          
          if (this.events.onError) {
            this.events.onError(error);
          }
        }
      });
      
      // Start VAD
      await this.vad.start(this.mediaStream);
      
      // Set up MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType,
        audioBitsPerSecond: this.options.audioConfig.bitsPerSecond
      });
      
      // Set up data handler
      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Add to local chunks
          this.audioChunks.push(event.data);
          
          // Only send to server if VAD detects speech
          if (this.vad?.isDetectingSpeech()) {
            await this.conversationService.sendAudioChunk(event.data, false);
          }
        }
      };
      
      // Set up error handler
      this.mediaRecorder.onerror = (event) => {
        logger.error('MediaRecorder error', {
          error: event.error
        });
        
        if (this.events.onError) {
          this.events.onError(event.error);
        }
      };
      
      // Start recording
      this.mediaRecorder.start(this.options.audioConfig.chunkDuration);
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      if (this.events.onRecordingStart) {
        this.events.onRecordingStart();
      }
      
      logger.info('Audio streaming started', { 
        mimeType,
        chunkDuration: this.options.audioConfig.chunkDuration,
        sampleRate: this.options.audioConfig.sampleRate
      });
    } catch (error) {
      logger.error('Failed to start audio streaming', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      // Clean up any resources
      this.stopStreaming();
      
      if (this.events.onError) {
        this.events.onError(error instanceof Error ? error : new Error('Failed to start audio streaming'));
      }
      
      throw error;
    }
  }
  
  /**
   * Stop audio streaming
   */
  async stopStreaming(): Promise<void> {
    try {
      // Stop MediaRecorder
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
        this.isRecording = false;
      }
      
      // Stop VAD
      if (this.vad) {
        this.vad.stop();
        this.vad = null;
      }
      
      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      // Clear resources
      this.mediaRecorder = null;
      this.audioChunks = [];
      
      if (this.events.onRecordingStop) {
        this.events.onRecordingStop();
      }
      
      logger.info('Audio streaming stopped', {
        duration: this.recordingStartTime ? Date.now() - this.recordingStartTime : 0
      });
      
      this.recordingStartTime = null;
    } catch (error) {
      logger.error('Error stopping audio streaming', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      if (this.events.onError) {
        this.events.onError(error instanceof Error ? error : new Error('Failed to stop audio streaming'));
      }
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
   * Check if currently streaming
   */
  isStreaming(): boolean {
    return this.isRecording;
  }
  
  /**
   * Get recording duration in ms
   */
  getRecordingDuration(): number {
    if (!this.recordingStartTime) return 0;
    return Date.now() - this.recordingStartTime;
  }
  
  /**
   * Check if speech is currently detected
   */
  isSpeechDetected(): boolean {
    return this.vad?.isDetectingSpeech() || false;
  }
  
  /**
   * Update streaming options
   */
  updateOptions(options: Partial<AudioStreamingOptions>): void {
    if (options.vadOptions) {
      this.options.vadOptions = { ...this.options.vadOptions, ...options.vadOptions };
      
      // Update VAD options if active
      if (this.vad) {
        this.vad.updateOptions(this.options.vadOptions);
      }
    }
    
    if (options.audioConfig) {
      this.options.audioConfig = { ...this.options.audioConfig, ...options.audioConfig };
      
      // Note: Changes to audio config require restarting the stream
      if (this.isRecording) {
        logger.warn('Audio config changed, restart streaming to apply changes');
      }
    }
  }
}

// Create singleton instance
let audioStreamingServiceInstance: AudioStreamingService | null = null;

export const getAudioStreamingService = (
  options?: AudioStreamingOptions, 
  events?: AudioStreamingEvents
): AudioStreamingService => {
  if (!audioStreamingServiceInstance) {
    audioStreamingServiceInstance = new AudioStreamingService(options, events);
  } else if (options || events) {
    // Update options and events if provided
    if (options) {
      audioStreamingServiceInstance.updateOptions(options);
    }
    
    // Note: Events can't be updated after creation currently
    // Would need to add an updateEvents method if needed
  }
  
  return audioStreamingServiceInstance;
};