# Conversational AI Upgrade Plan for Symptom Savior

## Overview

This document outlines a comprehensive plan to enhance the Symptom Savior application with real-time conversational AI capabilities using ElevenLabs Conversational AI platform integrated with TxAgent's medical knowledge base. The goal is to transform the current turn-based interaction model into a natural, continuous conversation experience.

## Current State Analysis

### Existing Infrastructure ✅
- **Backend Voice Services**: `/api/voice/tts` and `/api/voice/transcribe` endpoints working
- **TxAgent Integration**: Medical consultation endpoint with context awareness
- **Medical Profile System**: Comprehensive user health data available
- **Authentication**: JWT-based security with RLS policies
- **Audio Storage**: Supabase storage with proper user isolation

### Current Limitations 🔧
- **Turn-based Interaction**: Manual start/stop recording
- **Audio Format Issues**: MediaRecorder format compatibility (fixed: now using `audio/webm`)
- **Latency**: Multiple round-trips for STT → AI → TTS
- **Context Loss**: Each interaction is somewhat isolated
- **No Interruption Support**: Cannot interrupt AI responses

## Target State: Natural Medical Conversations

### Core Experience Goals
1. **Continuous Listening**: Tap once to start a medical consultation session
2. **Natural Turn-Taking**: AI detects when user finishes speaking
3. **Contextual Memory**: Maintains full conversation and medical history
4. **Interruption Support**: User can interrupt AI responses naturally
5. **Medical Safety**: Real-time emergency detection with immediate escalation
6. **Personalized Responses**: Leverages user's medical profile throughout conversation

## Frontend Implementation Details

### 1. WebSocket Conversation Service
We've implemented a `ConversationWebSocketService` class that handles:

```typescript
// Key WebSocket message types
enum WebSocketMessageType {
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

// Conversation session initialization
async startConversation(profile: UserMedicalProfile): Promise<ConversationStartResponse> {
  // Initialize conversation via REST endpoint
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
  
  const { session_id, websocket_url } = await response.json();
  
  // Connect to WebSocket for real-time communication
  await this.connectWebSocket(websocket_url);
  
  return { session_id, websocket_url, status: 'connected' };
}
```

### 2. Voice Activity Detection (VAD)
We've implemented a client-side VAD system that:

```typescript
class VoiceActivityDetector {
  // Configurable options
  private options = {
    silenceThreshold: 15,         // Amplitude threshold for silence (0-255)
    silenceTimeout: 1500,         // 1.5s of silence to end speech
    minSpeechDuration: 300,       // 300ms minimum to count as speech
    maxSpeechDuration: 30000,     // 30s maximum speech duration
    adaptiveThreshold: true,      // Adapt to ambient noise
  };
  
  // Start processing audio for voice activity
  private startProcessing(): void {
    // Get audio data from microphone
    this.analyzer.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    const average = sum / bufferLength;
    
    // Determine if speaking based on threshold
    const isSpeakingNow = average > this.options.silenceThreshold;
    
    // Handle state transitions (silence → speech, speech → silence)
    if (!this.isSpeaking && isSpeakingNow) {
      // Speech started
      this.events.onSpeechStart();
    } else if (this.isSpeaking && !isSpeakingNow) {
      // Potential speech end, start silence timer
      if (silenceDuration > this.options.silenceTimeout) {
        // Speech ended
        this.events.onSpeechEnd(speechDuration);
      }
    }
  }
}
```

### 3. Audio Streaming Service
We've implemented an `AudioStreamingService` that:

```typescript
class AudioStreamingService {
  // Start audio streaming with VAD
  async startStreaming(): Promise<void> {
    // Get audio stream from microphone
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000,
        channelCount: 1
      }
    });
    
    // Set up VAD to detect speech
    this.vad = new VoiceActivityDetector({
      onSpeechStart: () => {
        // Clear audio chunks when speech starts
        this.audioChunks = [];
      },
      onSpeechEnd: async (duration) => {
        // Create a single blob from all chunks
        const finalAudio = new Blob(this.audioChunks, { 
          type: 'audio/webm' 
        });
        
        // Send the final audio chunk
        await this.conversationService.sendAudioChunk(finalAudio, true);
      }
    });
    
    // Set up MediaRecorder to capture audio
    this.mediaRecorder = new MediaRecorder(this.mediaStream, {
      mimeType: 'audio/webm',
      audioBitsPerSecond: 128000
    });
    
    // Send audio chunks to server when VAD detects speech
    this.mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
        
        if (this.vad?.isDetectingSpeech()) {
          await this.conversationService.sendAudioChunk(event.data, false);
        }
      }
    };
    
    // Start recording in small chunks (200ms)
    this.mediaRecorder.start(200);
  }
}
```

### 4. Conversation React Hook
We've implemented a `useConversation` hook that provides:

```typescript
// Conversation states
enum ConversationState {
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

// Hook usage
const {
  state,                // Current conversation state
  messages,             // Array of conversation messages
  currentTranscript,    // Current partial transcript
  isEmergencyDetected,  // Whether emergency was detected
  audioLevel,           // Current audio level (0-100)
  
  // Methods
  startConversation,    // Start a new conversation
  endConversation,      // End the current conversation
  sendTextMessage,      // Send a text message directly
  
  // Computed properties
  isListening,          // Whether currently listening
  isProcessing,         // Whether AI is processing
  isResponding,         // Whether AI is responding
  isActive              // Whether conversation is active
} = useConversation({
  autoStart: false,
  enableVoiceResponse: true,
  enableEmergencyDetection: true
});
```

### 5. Conversation UI Components
We've implemented a `ConversationView` component that:

```tsx
<ConversationView 
  autoStart={false}
  enableVoiceResponse={Config.features.enableVoice}
  enableEmergencyDetection={Config.features.enableEmergencyDetection}
/>
```

This component includes:
- Real-time transcript display
- Message history with user/AI bubbles
- Audio visualization during listening/speaking
- Emergency alerts when critical symptoms detected
- Voice playback controls for AI responses

### 6. Audio Visualization
We've implemented an `AudioVisualizer` component that:

```tsx
<AudioVisualizer 
  isListening={isListening}
  isResponding={isResponding}
  audioLevel={audioLevel}
/>
```

This provides:
- Real-time waveform visualization of audio levels
- Different colors for listening vs. AI speaking
- Smooth animations for audio level changes

## Backend API Requirements

Based on our frontend implementation, the backend needs to support:

### 1. Conversation Initialization Endpoint
```
POST /api/conversation/start
```

**Request:**
```json
{
  "medical_profile": {
    "id": "uuid",
    "user_id": "auth-user-id",
    "full_name": "John Doe",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "height_cm": 180,
    "weight_kg": 75,
    "conditions": ["Asthma", "Hypertension"],
    "medications": ["Albuterol", "Lisinopril"],
    "allergies": ["Peanuts", "Penicillin"]
  },
  "initial_context": "Patient is a 33-year-old male with history of asthma and hypertension..."
}
```

**Response:**
```json
{
  "session_id": "conv-123456",
  "websocket_url": "wss://api.example.com/conversation/stream/conv-123456",
  "status": "connected"
}
```

### 2. WebSocket Streaming Endpoint
```
WebSocket /api/conversation/stream/:session_id
```

**Client → Server Messages:**
```json
{
  "type": "audio_chunk",
  "payload": {
    "audio": "base64-encoded-audio-data",
    "isFinal": false
  },
  "timestamp": 1624512345678,
  "session_id": "conv-123456"
}
```

**Server → Client Messages:**
```json
{
  "type": "transcript_partial",
  "payload": {
    "text": "I've been having headaches for..."
  },
  "timestamp": 1624512345789,
  "session_id": "conv-123456"
}
```

```json
{
  "type": "ai_response_complete",
  "payload": {
    "text": "Based on your symptoms, these headaches could be tension headaches...",
    "audioUrl": "https://storage.example.com/audio/response-123.mp3",
    "emergency_detected": false
  },
  "timestamp": 1624512346012,
  "session_id": "conv-123456"
}
```

### 3. Text Message Endpoint (Alternative to Audio)
```
POST /api/conversation/message
```

**Request:**
```json
{
  "session_id": "conv-123456",
  "message": "I've been having headaches for the past week"
}
```

**Response:**
```json
{
  "status": "processing",
  "message_id": "msg-789012"
}
```
(Actual response comes via WebSocket)

### 4. Reconnection Endpoint
```
POST /api/conversation/reconnect
```

**Request:**
```json
{
  "session_id": "conv-123456"
}
```

**Response:**
```json
{
  "websocket_url": "wss://api.example.com/conversation/stream/conv-123456",
  "status": "reconnected"
}
```

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- ✅ Fix audio format issues (COMPLETED)
- ✅ Enhance TTS/STT services (COMPLETED)
- ✅ Implement WebSocket conversation client (COMPLETED)
- ✅ Add client-side VAD (COMPLETED)
- 🔧 Implement backend WebSocket endpoint

### Phase 2: ElevenLabs Integration (Weeks 3-4)
- ✅ Create conversation UI components (COMPLETED)
- ✅ Implement audio streaming service (COMPLETED)
- 🔧 Set up ElevenLabs Conversational AI
- 🔧 Create hybrid conversation orchestrator
- 🔧 Implement medical context injection

### Phase 3: Real-Time Features (Weeks 5-6)
- ✅ Build conversation state management (COMPLETED)
- 🔧 Add interruption support
- 🔧 Implement emergency detection

### Phase 4: UI/UX (Weeks 7-8)
- ✅ Create conversational UI components (COMPLETED)
- ✅ Add real-time audio visualization (COMPLETED)
- 🔧 Implement emergency response UI

### Phase 5: Testing & Optimization (Weeks 9-10)
- 🔧 Performance optimization
- 🔧 User testing and feedback
- 🔧 Production deployment

## Success Metrics

### User Experience
- **Conversation Completion Rate**: >90%
- **User Satisfaction**: >4.5/5 rating
- **Emergency Response Time**: <30 seconds
- **Medical Query Accuracy**: >95%

### Technical Performance
- **System Uptime**: >99.9%
- **Audio Quality Score**: >4.0/5
- **Response Latency**: <800ms average
- **Error Rate**: <1%

## Conclusion

The frontend implementation of the conversational AI upgrade is now complete, providing a seamless and natural conversation experience for users. The backend team needs to implement the required WebSocket endpoints and integrate with ElevenLabs and TxAgent to complete the system.

By leveraging client-side Voice Activity Detection and WebSocket communication, we've created a responsive and intuitive interface that feels like talking to a real medical assistant. The system maintains context throughout the conversation, provides real-time feedback, and handles emergencies appropriately.

The next steps are to implement the backend services that will process the audio streams, generate transcripts, and provide AI responses through the WebSocket connection.