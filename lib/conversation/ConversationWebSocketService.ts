import { Config } from '../config';
import { supabase } from '../supabase';
import { logger } from '@/utils/logger';
import { UserMedicalProfile } from '@/hooks/useProfile';

export enum WebSocketMessageType {
  AUDIO_CHUNK = 'audio_chunk',
  TRANSCRIPT_PARTIAL = 'transcript_partial',
  TRANSCRIPT_FINAL = 'transcript_final',
  AI_THINKING = 'ai_thinking',
  AI_SPEAKING = 'ai_speaking',
  AI_RESPONSE_COMPLETE = 'ai_response_complete',
  CONTEXTUAL_UPDATE = 'contextual_update',
  EMERGENCY_DETECTED = 'emergency_detected',
  CONVERSATION_END = 'conversation_end'
}

export interface ConversationStartRequest {
  user_id: string;
  medical_profile: UserMedicalProfile;
  initial_context?: string;
  voice_settings?: {
    voice_id: string;
    model_id: string;
  };
}

export interface ConversationStartResponse {
  session_id: string;
  websocket_url: string;
  status: 'connected' | 'error';
  error?: string;
}

export class ConversationWebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1s delay
  private isConnecting = false;
  private messageQueue: any[] = [];
  private eventListeners: Record<string, Function[]> = {};
  
  constructor() {
    // Initialize event listeners map
    Object.values(WebSocketMessageType).forEach(type => {
      this.eventListeners[type] = [];
    });
    
    // Add custom event types
    this.eventListeners['connection_established'] = [];
    this.eventListeners['connection_error'] = [];
    this.eventListeners['connection_closed'] = [];
  }
  
  /**
   * Start a new conversation session
   */
  async startConversation(profile: UserMedicalProfile): Promise<ConversationStartResponse> {
    try {
      if (!Config.ai.backendUserPortal) {
        throw new Error('Backend User Portal URL not configured');
      }
      
      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required for conversation');
      }
      
      // Initialize conversation session via REST
      const response = await fetch(`${Config.ai.backendUserPortal}/api/conversation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          medical_profile: profile,
          initial_context: this.buildInitialContext(profile)
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start conversation: ${response.status} ${errorText}`);
      }
      
      const { session_id, websocket_url } = await response.json();
      this.sessionId = session_id;
      
      // Connect to WebSocket
      await this.connectWebSocket(websocket_url);
      
      logger.info('Conversation session started', { 
        sessionId: session_id,
        websocketUrl: websocket_url.substring(0, 30) + '...' // Truncate for privacy
      });
      
      return {
        session_id,
        websocket_url,
        status: 'connected'
      };
    } catch (error) {
      logger.error('Failed to start conversation', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      return {
        session_id: '',
        websocket_url: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Connect to the WebSocket server
   */
  private async connectWebSocket(url: string): Promise<void> {
    if (this.isConnecting) return;
    
    try {
      this.isConnecting = true;
      
      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      logger.debug('Connecting to WebSocket', { url: url.substring(0, 30) + '...' });
      
      return new Promise((resolve, reject) => {
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.onConnectionEstablished();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          this.handleWebSocketMessage(JSON.parse(event.data));
        };
        
        this.ws.onerror = (error) => {
          logger.error('WebSocket error', { error });
          this.isConnecting = false;
          this.triggerEvent('connection_error', error);
          reject(error);
        };
        
        this.ws.onclose = () => {
          this.isConnecting = false;
          this.handleDisconnection();
        };
        
        // Set connection timeout
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10s timeout
      });
    } catch (error) {
      this.isConnecting = false;
      logger.error('WebSocket connection failed', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      throw error;
    }
  }
  
  /**
   * Send an audio chunk to the conversation
   */
  async sendAudioChunk(audioChunk: Blob, isFinal: boolean = false): Promise<boolean> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue the message if not connected
      this.messageQueue.push({
        type: WebSocketMessageType.AUDIO_CHUNK,
        payload: { audio: audioChunk, isFinal }
      });
      
      logger.debug('Audio chunk queued, WebSocket not ready', { 
        readyState: this.ws?.readyState,
        queueLength: this.messageQueue.length
      });
      
      return false;
    }
    
    try {
      // Convert blob to base64 for transmission
      const arrayBuffer = await audioChunk.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(arrayBuffer);
      
      const message = {
        type: WebSocketMessageType.AUDIO_CHUNK,
        payload: {
          audio: base64Audio,
          isFinal
        },
        timestamp: Date.now(),
        session_id: this.sessionId
      };
      
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Failed to send audio chunk', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        isFinal
      });
      return false;
    }
  }
  
  /**
   * End the conversation
   */
  async endConversation(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot end conversation, WebSocket not connected');
      return;
    }
    
    try {
      const message = {
        type: WebSocketMessageType.CONVERSATION_END,
        payload: {},
        timestamp: Date.now(),
        session_id: this.sessionId
      };
      
      this.ws.send(JSON.stringify(message));
      logger.info('Conversation end message sent', { sessionId: this.sessionId });
      
      // Close the WebSocket after a short delay to ensure the message is sent
      setTimeout(() => {
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
      }, 500);
    } catch (error) {
      logger.error('Failed to end conversation', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
    }
  }
  
  /**
   * Register event listener
   */
  on(eventType: WebSocketMessageType | 'connection_established' | 'connection_error' | 'connection_closed', callback: Function): void {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].push(callback);
    }
  }
  
  /**
   * Remove event listener
   */
  off(eventType: WebSocketMessageType | 'connection_established' | 'connection_error' | 'connection_closed', callback: Function): void {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType] = this.eventListeners[eventType].filter(cb => cb !== callback);
    }
  }
  
  /**
   * Trigger event listeners
   */
  private triggerEvent(eventType: string, data: any): void {
    if (this.eventListeners[eventType]) {
      this.eventListeners[eventType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in ${eventType} event listener`, {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error
          });
        }
      });
    }
  }
  
  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(message: any): void {
    try {
      const { type, payload } = message;
      
      logger.debug('WebSocket message received', { 
        type, 
        payloadSize: JSON.stringify(payload).length
      });
      
      // Trigger event for this message type
      this.triggerEvent(type, payload);
      
      // Special handling for certain message types
      switch (type) {
        case WebSocketMessageType.EMERGENCY_DETECTED:
          // Handle emergency detection with high priority
          logger.warn('Emergency detected in conversation', { 
            payload,
            sessionId: this.sessionId
          });
          break;
          
        case WebSocketMessageType.CONVERSATION_END:
          // Close the connection when the conversation ends
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
          break;
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        message
      });
    }
  }
  
  /**
   * Handle WebSocket connection established
   */
  private onConnectionEstablished(): void {
    logger.info('WebSocket connection established', { sessionId: this.sessionId });
    
    // Process any queued messages
    if (this.messageQueue.length > 0) {
      logger.debug('Processing queued messages', { count: this.messageQueue.length });
      
      const queue = [...this.messageQueue];
      this.messageQueue = [];
      
      queue.forEach(message => {
        if (message.type === WebSocketMessageType.AUDIO_CHUNK) {
          this.sendAudioChunk(message.payload.audio, message.payload.isFinal);
        } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(message));
        }
      });
    }
    
    // Trigger connection established event
    this.triggerEvent('connection_established', { sessionId: this.sessionId });
  }
  
  /**
   * Handle WebSocket disconnection
   */
  private handleDisconnection(): void {
    logger.warn('WebSocket disconnected', { 
      sessionId: this.sessionId,
      reconnectAttempts: this.reconnectAttempts
    });
    
    // Trigger connection closed event
    this.triggerEvent('connection_closed', { 
      sessionId: this.sessionId,
      willReconnect: this.reconnectAttempts < this.maxReconnectAttempts
    });
    
    // Attempt to reconnect if not manually closed
    if (this.sessionId && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      // Exponential backoff for reconnection
      const delay = Math.min(30000, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
      
      logger.info('Attempting to reconnect', { 
        attempt: this.reconnectAttempts, 
        delay,
        sessionId: this.sessionId
      });
      
      setTimeout(async () => {
        try {
          // Get current session for authentication
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            throw new Error('Authentication required for reconnection');
          }
          
          // Reconnect to the WebSocket
          const response = await fetch(`${Config.ai.backendUserPortal}/api/conversation/reconnect`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              session_id: this.sessionId
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to reconnect: ${response.status}`);
          }
          
          const { websocket_url } = await response.json();
          await this.connectWebSocket(websocket_url);
        } catch (error) {
          logger.error('Reconnection failed', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack
            } : error,
            sessionId: this.sessionId,
            attempt: this.reconnectAttempts
          });
          
          // Try again with the next backoff if we haven't reached max attempts
          this.handleDisconnection();
        }
      }, delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached, giving up', {
        sessionId: this.sessionId,
        maxAttempts: this.maxReconnectAttempts
      });
      
      // Reset state
      this.sessionId = null;
      this.ws = null;
      this.reconnectAttempts = 0;
    }
  }
  
  /**
   * Build initial context for the conversation
   */
  private buildInitialContext(profile: UserMedicalProfile): string {
    if (!profile) return '';
    
    let context = '';
    
    // Add basic profile information
    if (profile.full_name) {
      context += `Patient name: ${profile.full_name}. `;
    }
    
    if (profile.date_of_birth) {
      // Calculate age from date of birth
      const today = new Date();
      const birthDate = new Date(profile.date_of_birth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      context += `Age: ${age} years. `;
    }
    
    if (profile.gender) {
      context += `Gender: ${profile.gender}. `;
    }
    
    // Add medical conditions if available
    if (profile.chronic_conditions && profile.chronic_conditions.length > 0) {
      context += `Medical conditions: ${profile.chronic_conditions.join(', ')}. `;
    }
    
    // Add medications if available
    if (profile.medications && profile.medications.length > 0) {
      context += `Current medications: ${profile.medications.join(', ')}. `;
    }
    
    // Add allergies if available
    if (profile.allergies && profile.allergies.length > 0) {
      context += `Allergies: ${profile.allergies.join(', ')}. `;
    }
    
    return context;
  }
  
  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }
  
  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
  
  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
let conversationServiceInstance: ConversationWebSocketService | null = null;

export const getConversationService = (): ConversationWebSocketService => {
  if (!conversationServiceInstance) {
    conversationServiceInstance = new ConversationWebSocketService();
  }
  return conversationServiceInstance;
};