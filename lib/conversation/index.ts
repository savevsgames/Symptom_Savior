/**
 * Conversation Module Exports
 * Centralizes access to conversation-related functionality
 */

// WebSocket Service
export { 
  getConversationService,
  WebSocketMessageType,
  type ConversationStartRequest,
  type ConversationStartResponse
} from './ConversationWebSocketService';

// Audio Streaming
export {
  getAudioStreamingService,
  type AudioStreamingOptions,
  type AudioStreamingEvents
} from './AudioStreamingService';

// Voice Activity Detection
export {
  VoiceActivityDetector,
  type VADOptions,
  type VADEvents
} from './VoiceActivityDetector';

// Hooks
export { useConversation, ConversationState } from '@/hooks/useConversation';

// Components
export { ConversationView } from '@/components/conversation/ConversationView';
export { AudioVisualizer } from '@/components/conversation/AudioVisualizer';