import { logger } from '@/utils/logger';

export interface VADOptions {
  silenceThreshold?: number;      // Amplitude threshold for silence (0-255)
  silenceTimeout?: number;        // Time in ms to wait before considering speech ended
  minSpeechDuration?: number;     // Minimum duration in ms to consider as speech
  maxSpeechDuration?: number;     // Maximum duration in ms before forcing end
  adaptiveThreshold?: boolean;    // Whether to adapt threshold based on ambient noise
  debugMode?: boolean;            // Enable debug logging
}

export interface VADEvents {
  onSpeechStart?: () => void;
  onSpeechEnd?: (duration: number) => void;
  onSilence?: (duration: number) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;
}

/**
 * Voice Activity Detector for real-time speech detection
 */
export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyzer: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  
  private isSpeaking = false;
  private silenceStart: number | null = null;
  private speechStart: number | null = null;
  
  private options: Required<VADOptions>;
  private events: VADEvents;
  
  private readonly DEFAULT_OPTIONS: Required<VADOptions> = {
    silenceThreshold: 15,         // Default threshold (0-255)
    silenceTimeout: 1500,         // 1.5 seconds of silence to end speech
    minSpeechDuration: 300,       // 300ms minimum to count as speech
    maxSpeechDuration: 30000,     // 30 seconds maximum speech duration
    adaptiveThreshold: true,      // Adapt to ambient noise
    debugMode: false              // Disable debug logging by default
  };
  
  constructor(options?: VADOptions, events?: VADEvents) {
    this.options = { ...this.DEFAULT_OPTIONS, ...options };
    this.events = events || {};
    
    if (this.options.debugMode) {
      logger.debug('VAD initialized with options', this.options);
    }
  }
  
  /**
   * Start voice activity detection on an audio stream
   */
  async start(stream?: MediaStream): Promise<void> {
    try {
      // Clean up any existing resources
      this.stop();
      
      // Get audio stream if not provided
      if (!stream) {
        stream = await this.getAudioStream();
      }
      
      this.mediaStream = stream;
      
      // Create audio context and analyzer
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.source = this.audioContext.createMediaStreamSource(stream);
      this.analyzer = this.audioContext.createAnalyser();
      
      // Configure analyzer
      this.analyzer.fftSize = 256;
      this.analyzer.smoothingTimeConstant = 0.5;
      this.source.connect(this.analyzer);
      
      // Start processing
      this.startProcessing();
      
      logger.info('Voice activity detection started');
    } catch (error) {
      logger.error('Failed to start voice activity detection', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      if (this.events.onError) {
        this.events.onError(error instanceof Error ? error : new Error('Failed to start VAD'));
      }
      
      throw error;
    }
  }
  
  /**
   * Stop voice activity detection
   */
  stop(): void {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clean up audio resources
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
      this.audioContext = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // Reset state
    this.analyzer = null;
    this.isSpeaking = false;
    this.silenceStart = null;
    this.speechStart = null;
    
    logger.info('Voice activity detection stopped');
  }
  
  /**
   * Get user's audio stream
   */
  private async getAudioStream(): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false
      });
    } catch (error) {
      logger.error('Failed to get audio stream', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      throw new Error('Microphone access denied or not available');
    }
  }
  
  /**
   * Start processing audio for voice activity
   */
  private startProcessing(): void {
    if (!this.analyzer) return;
    
    const bufferLength = this.analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Keep track of ambient noise level for adaptive threshold
    let ambientLevels: number[] = [];
    const ambientSampleSize = 20;
    
    const checkVoiceActivity = () => {
      if (!this.analyzer) return;
      
      // Get audio data
      this.analyzer.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Update ambient noise level if adaptive threshold is enabled
      if (this.options.adaptiveThreshold) {
        if (!this.isSpeaking) {
          ambientLevels.push(average);
          if (ambientLevels.length > ambientSampleSize) {
            ambientLevels.shift();
          }
        }
        
        // Calculate adaptive threshold based on ambient noise
        if (ambientLevels.length > 0) {
          const ambientAverage = ambientLevels.reduce((a, b) => a + b, 0) / ambientLevels.length;
          // Set threshold to ambient + buffer (minimum 10, maximum 50)
          this.options.silenceThreshold = Math.min(50, Math.max(10, ambientAverage * 1.5));
        }
      }
      
      // Emit audio level event
      if (this.events.onAudioLevel) {
        this.events.onAudioLevel(average);
      }
      
      // Determine if speaking based on threshold
      const isSpeakingNow = average > this.options.silenceThreshold;
      
      // Debug logging
      if (this.options.debugMode && Math.random() < 0.05) { // Log only 5% of frames to avoid spam
        logger.debug('VAD levels', { 
          average, 
          threshold: this.options.silenceThreshold,
          isSpeaking: this.isSpeaking,
          isSpeakingNow
        });
      }
      
      const now = Date.now();
      
      // Handle state transitions
      if (!this.isSpeaking && isSpeakingNow) {
        // Transition from silence to speech
        this.silenceStart = null;
        this.speechStart = now;
        this.isSpeaking = true;
        
        if (this.events.onSpeechStart) {
          this.events.onSpeechStart();
        }
        
        logger.debug('Speech started', { threshold: this.options.silenceThreshold, level: average });
      } else if (this.isSpeaking && !isSpeakingNow) {
        // Transition from speech to silence
        if (this.silenceStart === null) {
          this.silenceStart = now;
        }
        
        // Check if silence has lasted long enough to consider speech ended
        if (now - this.silenceStart > this.options.silenceTimeout) {
          // Only count as speech if it lasted longer than minSpeechDuration
          if (this.speechStart && now - this.speechStart > this.options.minSpeechDuration) {
            const speechDuration = now - this.speechStart;
            this.isSpeaking = false;
            
            if (this.events.onSpeechEnd) {
              this.events.onSpeechEnd(speechDuration);
            }
            
            logger.debug('Speech ended', { 
              duration: speechDuration,
              threshold: this.options.silenceThreshold
            });
          } else {
            // Reset if it was too short
            this.isSpeaking = false;
            this.speechStart = null;
            logger.debug('Speech too short, ignored', { 
              threshold: this.options.silenceThreshold,
              duration: this.speechStart ? now - this.speechStart : 0
            });
          }
          
          this.silenceStart = null;
        }
      } else if (this.isSpeaking && isSpeakingNow) {
        // Continuing to speak, reset silence start
        this.silenceStart = null;
        
        // Check if speech has exceeded maximum duration
        if (this.speechStart && now - this.speechStart > this.options.maxSpeechDuration) {
          const speechDuration = now - this.speechStart;
          this.isSpeaking = false;
          
          if (this.events.onSpeechEnd) {
            this.events.onSpeechEnd(speechDuration);
          }
          
          logger.debug('Speech exceeded maximum duration', { 
            maxDuration: this.options.maxSpeechDuration,
            actualDuration: speechDuration
          });
          
          this.speechStart = null;
        }
      } else if (!this.isSpeaking && !isSpeakingNow) {
        // Continuing silence
        if (this.silenceStart === null) {
          this.silenceStart = now;
        }
        
        // Emit silence event periodically
        if (this.events.onSilence && now % 1000 < 20) { // Approximately once per second
          const silenceDuration = this.silenceStart ? now - this.silenceStart : 0;
          this.events.onSilence(silenceDuration);
        }
      }
      
      // Continue processing
      this.animationFrameId = requestAnimationFrame(checkVoiceActivity);
    };
    
    // Start processing
    this.animationFrameId = requestAnimationFrame(checkVoiceActivity);
  }
  
  /**
   * Check if currently detecting speech
   */
  isDetectingSpeech(): boolean {
    return this.isSpeaking;
  }
  
  /**
   * Get current speech duration in ms
   */
  getCurrentSpeechDuration(): number {
    if (!this.isSpeaking || !this.speechStart) return 0;
    return Date.now() - this.speechStart;
  }
  
  /**
   * Get current silence duration in ms
   */
  getCurrentSilenceDuration(): number {
    if (this.isSpeaking || !this.silenceStart) return 0;
    return Date.now() - this.silenceStart;
  }
  
  /**
   * Update VAD options
   */
  updateOptions(options: Partial<VADOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (this.options.debugMode) {
      logger.debug('VAD options updated', this.options);
    }
  }
}