import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { getConversationService, WebSocketMessageType } from '@/lib/conversation/ConversationWebSocketService';
import { getAudioStreamingService } from '@/lib/conversation/AudioStreamingService';
import { useProfile } from './useProfile';
import { useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { Config } from '@/lib/config';
import { Audio } from 'expo-av';

export enum ConversationState {
  IDLE = 'idle',               // No active conversation
  CONNECTING = 'connecting',   // Establishing connection
  LISTENING = 'listening',     // User is speaking
  PROCESSING = 'processing',   // AI is thinking
  RESPONDING = 'responding',   // AI is speaking
  WAITING = 'waiting',         // Waiting for user input
  EMERGENCY = 'emergency',     // Emergency detected
  ERROR = 'error',             // Error state
  ENDED = 'ended'              // Conversation ended
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isFinal: boolean;
  audioUrl?: string;
  isEmergency?: boolean;
}

export interface ConversationOptions {
  autoStart?: boolean;         // Auto-start conversation on mount
  enableVoiceResponse?: boolean; // Enable AI voice responses
  enableEmergencyDetection?: boolean; // Enable emergency detection
}

export function useConversation(options?: ConversationOptions) {
  const [state, setState] = useState<ConversationState>(ConversationState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isEmergencyDetected, setIsEmergencyDetected] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const { profile } = useProfile();
  const { user } = useAuthContext();
  
  const conversationService = getConversationService();
  const audioStreamingService = getAudioStreamingService(
    undefined, // Use default options
    {
      onAudioLevel: (level) => setAudioLevel(level),
      onSpeechStart: () => {
        logger.debug('Speech started');
        setState(ConversationState.LISTENING);
      },
      onSpeechEnd: (duration, finalAudio) => {
        logger.debug('Speech ended', { duration });
        setState(ConversationState.PROCESSING);
      },
      onTranscriptReceived: (transcript, isFinal) => {
        if (isFinal) {
          // Add user message when transcript is final
          addMessage(transcript, true, true);
          setCurrentTranscript('');
          setState(ConversationState.PROCESSING);
        } else {
          // Update current transcript for display
          setCurrentTranscript(transcript);
        }
      },
      onAIResponseStart: () => {
        setState(ConversationState.RESPONDING);
      },
      onAIResponseEnd: () => {
        setState(ConversationState.WAITING);
      },
      onError: (error) => {
        logger.error('Audio streaming error', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
        
        setError(error.message);
        setState(ConversationState.ERROR);
      }
    }
  );
  
  // Sound for AI responses
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      endConversation();
      
      // Clean up any playing audio
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);
  
  // Auto-start conversation if enabled
  useEffect(() => {
    if (options?.autoStart && user && profile) {
      startConversation();
    }
  }, [options?.autoStart, user, profile]);
  
  // Set up conversation service event listeners
  useEffect(() => {
    // Handle AI responses
    const handleAIResponse = (payload: any) => {
      addMessage(payload.text, false, true, payload.audioUrl);
      
      // Check for emergency
      if (payload.emergency_detected) {
        setIsEmergencyDetected(true);
        setState(ConversationState.EMERGENCY);
        
        // Show emergency alert
        Alert.alert(
          '🚨 Emergency Detected',
          'Your symptoms may require immediate medical attention. If this is a medical emergency, please call emergency services immediately.',
          [
            { text: 'I understand', style: 'default' },
            { 
              text: 'Call Emergency Services', 
              style: 'destructive',
              onPress: () => {
                // Platform-specific emergency calling
                if (Platform.OS !== 'web') {
                  // On mobile, this would open the phone dialer
                  // Linking.openURL('tel:911');
                }
              }
            }
          ]
        );
      }
      
      // Play audio response if available and enabled
      if (payload.audioUrl && options?.enableVoiceResponse) {
        playAudioResponse(payload.audioUrl);
      }
    };
    
    // Set up event listeners
    conversationService.on(WebSocketMessageType.AI_RESPONSE_COMPLETE, handleAIResponse);
    conversationService.on(WebSocketMessageType.EMERGENCY_DETECTED, (payload) => {
      setIsEmergencyDetected(true);
      setState(ConversationState.EMERGENCY);
    });
    
    // Clean up event listeners
    return () => {
      conversationService.off(WebSocketMessageType.AI_RESPONSE_COMPLETE, handleAIResponse);
      conversationService.off(WebSocketMessageType.EMERGENCY_DETECTED, () => {});
    };
  }, [options?.enableVoiceResponse]);
  
  /**
   * Start a new conversation
   */
  const startConversation = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      setState(ConversationState.CONNECTING);
      setError(null);
      
      // Start conversation session
      const response = await conversationService.startConversation(profile);
      
      if (response.status === 'error') {
        throw new Error(response.error || 'Failed to start conversation');
      }
      
      // Add welcome message
      addMessage(
        "Hello! I'm your Symptom Savior AI Assistant. I'm here to help you track your symptoms, understand your health patterns, and provide evidence-based medical guidance. How are you feeling today?",
        false,
        true
      );
      
      // Start audio streaming
      await audioStreamingService.startStreaming();
      
      setState(ConversationState.WAITING);
      
      logger.info('Conversation started successfully', { sessionId: response.session_id });
    } catch (error) {
      logger.error('Failed to start conversation', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      setError(error instanceof Error ? error.message : 'Failed to start conversation');
      setState(ConversationState.ERROR);
    }
  };
  
  /**
   * End the current conversation
   */
  const endConversation = async () => {
    try {
      // Stop audio streaming
      await audioStreamingService.stopStreaming();
      
      // End conversation session
      await conversationService.endConversation();
      
      setState(ConversationState.ENDED);
      
      logger.info('Conversation ended');
    } catch (error) {
      logger.error('Error ending conversation', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
    }
  };
  
  /**
   * Add a message to the conversation
   */
  const addMessage = (text: string, isUser: boolean, isFinal: boolean, audioUrl?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      isFinal,
      audioUrl,
      isEmergency: !isUser && isEmergencyDetected
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    return newMessage;
  };
  
  /**
   * Play audio response
   */
  const playAudioResponse = async (audioUrl: string) => {
    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }
      
      // Load and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      // Set up playback status listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          // Sound finished playing
          newSound.unloadAsync();
        }
      });
    } catch (error) {
      logger.error('Failed to play audio response', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        audioUrl
      });
    }
  };
  
  /**
   * Stop audio playback
   */
  const stopAudioPlayback = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        logger.error('Failed to stop audio playback', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      }
    }
  };
  
  /**
   * Send a text message directly (without voice)
   */
  const sendTextMessage = async (text: string) => {
    if (state === ConversationState.IDLE || state === ConversationState.ENDED) {
      // Start a new conversation if none is active
      await startConversation();
    }
    
    // Add user message
    addMessage(text, true, true);
    
    // Set state to processing
    setState(ConversationState.PROCESSING);
    
    try {
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required for conversation');
      }
      
      // Send text message to backend
      const response = await fetch(`${Config.ai.backendUserPortal}/api/conversation/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          session_id: conversationService.getSessionId(),
          message: text
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      // Response will come through WebSocket
    } catch (error) {
      logger.error('Failed to send text message', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        text
      });
      
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setState(ConversationState.ERROR);
    }
  };
  
  return {
    state,
    messages,
    currentTranscript,
    isEmergencyDetected,
    audioLevel,
    error,
    
    // Methods
    startConversation,
    endConversation,
    sendTextMessage,
    stopAudioPlayback,
    
    // Computed properties
    isListening: state === ConversationState.LISTENING,
    isProcessing: state === ConversationState.PROCESSING,
    isResponding: state === ConversationState.RESPONDING,
    isActive: [
      ConversationState.CONNECTING,
      ConversationState.LISTENING,
      ConversationState.PROCESSING,
      ConversationState.RESPONDING,
      ConversationState.WAITING
    ].includes(state)
  };
}