# Symptom Savior API Documentation

## Overview

This document provides comprehensive documentation for the Symptom Savior API endpoints, including request/response formats, authentication requirements, and usage examples.

## Authentication

All API endpoints require authentication using a JWT token provided by Supabase Auth. The token should be included in the `Authorization` header as a Bearer token:

```
Authorization: Bearer <jwt_token>
```

## Core Endpoints

### Medical Consultation

Endpoint for AI-powered medical consultations with TxAgent.

**URL**: `/api/medical-consultation`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "query": "What could be causing my headache?",
  "context": {
    "user_profile": {
      "full_name": "John Doe",
      "age": 35,
      "gender": "male",
      "blood_group": "A+",
      "height_cm": 180,
      "weight_kg": 75
    },
    "medical_conditions": [...],
    "current_medications": [...],
    "allergies": [...],
    "recent_symptoms": [...],
    "recent_visits": [...]
  },
  "include_voice": false,
  "include_video": false,
  "session_id": "session_1234567890",
  "preferred_agent": "txagent"
}
```

**Response**:
```json
{
  "response": {
    "text": "Headaches can be caused by various factors including...",
    "sources": [
      {
        "title": "Medical Document Title",
        "content": "Excerpt from the document",
        "relevance_score": 0.92
      }
    ],
    "confidence_score": 0.85
  },
  "safety": {
    "emergency_detected": false,
    "disclaimer": "This information is for educational purposes only and is not a substitute for professional medical advice.",
    "urgent_care_recommended": false
  },
  "media": {
    "voice_audio_url": "https://storage.example.com/audio/response-123.mp3",
    "video_url": null
  },
  "processing_time_ms": 1250,
  "session_id": "session_1234567890"
}
```

### Voice Transcription

Endpoint for converting speech to text.

**URL**: `/api/voice/transcribe`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "audio_data": "base64_encoded_audio_data",
  "mime_type": "audio/webm"
}
```

**Response**:
```json
{
  "text": "I've been having a headache for the past two days",
  "confidence": 0.92,
  "duration": 3.5
}
```

### Text-to-Speech

Endpoint for generating speech from text.

**URL**: `/api/voice/tts`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "text": "Headaches can be caused by various factors including stress, dehydration, and lack of sleep.",
  "voice_id": "EXAVITQu4vr4xnSDxMaL",
  "model_id": "eleven_turbo_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": true
  }
}
```

**Response**:
```json
{
  "audio_url": "https://storage.example.com/audio/tts-123.mp3",
  "duration": 12.5
}
```

## Conversation API

### Start Conversation

Initializes a new conversation session.

**URL**: `/api/conversation/start`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "medical_profile": {
    "full_name": "John Doe",
    "age": 35,
    "gender": "male"
  },
  "initial_context": "Patient has a history of migraines"
}
```

**Response**:
```json
{
  "session_id": "conv-1234567890",
  "websocket_url": "wss://api.example.com/api/conversation/stream/conv-1234567890",
  "status": "connected"
}
```

### Send Message

Sends a text message to an active conversation.

**URL**: `/api/conversation/message`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "session_id": "conv-1234567890",
  "message": "I've been having headaches recently"
}
```

**Response**:
```json
{
  "status": "processing",
  "message": "Message received and being processed"
}
```

### End Conversation

Ends an active conversation session.

**URL**: `/api/conversation/end`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "session_id": "conv-1234567890"
}
```

**Response**:
```json
{
  "status": "ended",
  "message": "Conversation session ended successfully"
}
```

## Agent Actions API

### Save Symptom

Endpoint for saving a symptom detected during conversation.

**URL**: `/api/agent-actions/save-symptom`  
**Method**: `POST`  
**Auth Required**: Yes  

**Request Body**:
```json
{
  "symptom_data": {
    "symptom_name": "Headache",
    "severity": 7,
    "description": "Throbbing pain on the left side",
    "triggers": "Stress, lack of sleep",
    "duration_hours": 48,
    "location": "Left temple"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Symptom logged successfully",
  "symptom_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get Symptoms

Endpoint for retrieving symptom history.

**URL**: `/api/agent-actions/get-symptoms`  
**Method**: `GET`  
**Auth Required**: Yes  
**Query Parameters**:
- `limit` (optional): Maximum number of symptoms to return (default: 10)
- `symptom_name` (optional): Filter by symptom name

**Response**:
```json
{
  "symptoms": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "symptom_name": "Headache",
      "severity": 7,
      "description": "Throbbing pain on the left side",
      "created_at": "2025-06-28T15:30:00Z"
    }
  ],
  "count": 1
}
```

## Error Responses

All API endpoints return standard error responses in the following format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

Common error codes:
- `INVALID_REQUEST`: Missing or invalid parameters
- `UNAUTHORIZED`: Authentication required or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Requested resource not found
- `SERVICE_UNAVAILABLE`: Backend service unavailable
- `CONSULTATION_FAILED`: Error during medical consultation