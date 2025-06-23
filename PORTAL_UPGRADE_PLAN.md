# Portal Upgrade Plan - Backend Integration & API Consolidation

## Overview

This plan outlines the integration of the Symptom Savior mobile app with the existing backend doctor's portal, consolidating APIs and ensuring seamless data flow between patient and provider interfaces.

## Current State Analysis

### Existing Backend Infrastructure
- **Doctor's Portal**: Node.js backend with established routes and TxAgent integration
- **Document Processing**: Existing `/upload` endpoint in `backend/routes/documents.js`
- **Database**: Shared Supabase instance with comprehensive health tracking schema
- **AI Integration**: TxAgent medical RAG system already integrated in doctor's portal

### Mobile App Current State
- **Frontend**: React Native (Expo) with TypeScript
- **Database**: Direct Supabase client integration
- **AI**: Placeholder for TxAgent integration
- **Authentication**: Supabase Auth with JWT

## Integration Strategy

### Phase 1: API Endpoint Consolidation

#### 1.1 Medical Consultation Endpoint
**Endpoint**: `POST /api/medical-consultation`
**Purpose**: Unified AI consultation handling for both mobile app and doctor portal

**Request Body**:
```typescript
{
  query: string;
  context?: {
    user_profile?: UserProfile;
    recent_symptoms?: Symptom[];
    medical_conditions?: Condition[];
    current_medications?: Medication[];
    allergies?: Allergy[];
    recent_visits?: DoctorVisit[];
  };
  include_voice?: boolean;
  include_video?: boolean;
  session_id?: string;
  consultation_type?: 'patient_query' | 'doctor_analysis';
}
```

**Response**:
```typescript
{
  response: {
    text: string;
    sources?: Source[];
    confidence_score?: number;
  };
  safety: {
    emergency_detected: boolean;
    disclaimer: string;
    urgent_care_recommended?: boolean;
  };
  media?: {
    voice_audio_url?: string;
    video_url?: string;
  };
  recommendations?: {
    suggested_action?: string;
    follow_up_questions?: string[];
  };
  processing_time_ms: number;
  session_id: string;
}
```

#### 1.2 Document Processing Endpoint Enhancement
**Current**: `/upload` endpoint in `backend/routes/documents.js`
**Enhancement**: Extend existing endpoint to support mobile app uploads

**Updated Request Handling**:
```typescript
// Enhanced existing /upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { user_id, source = 'mobile_app' } = req.body;
    
    // Existing file upload logic
    const uploadResult = await uploadToSupabaseStorage(file);
    
    // Enhanced: Support different processing modes
    const processingMode = req.body.processing_mode || 'immediate';
    
    if (processingMode === 'immediate') {
      // Existing immediate processing
      await triggerTxAgentProcessing(uploadResult.path);
    } else if (processingMode === 'queued') {
      // New: Queue for batch processing
      await queueDocumentProcessing(uploadResult.path, user_id);
    }
    
    res.json({
      document_id: uploadResult.id,
      status: processingMode === 'immediate' ? 'processing' : 'queued',
      file_path: uploadResult.path
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 1.3 Voice Processing Endpoints
**New Endpoints**: Secure voice processing through backend

**POST /api/voice/transcribe**:
```typescript
// Request: multipart/form-data with audio file
// Response: { text: string, confidence?: number, duration?: number }

app.post('/api/voice/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const { file } = req;
    const userId = req.user.id; // From JWT
    
    // Rate limiting check
    if (!checkRateLimit(userId, 'transcription')) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    // Forward to ElevenLabs with server-side API key
    const transcription = await elevenLabsTranscribe(file);
    
    res.json({
      text: transcription.text,
      confidence: transcription.confidence,
      duration: transcription.duration
    });
  } catch (error) {
    res.status(500).json({ error: 'Transcription failed' });
  }
});
```

**POST /api/voice/tts**:
```typescript
// Request: { text: string, voice_id?: string, voice_settings?: object }
// Response: Audio blob

app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, voice_id, voice_settings } = req.body;
    const userId = req.user.id;
    
    // Rate limiting and text length validation
    if (!checkRateLimit(userId, 'tts') || text.length > 2000) {
      return res.status(429).json({ error: 'Request limit exceeded' });
    }
    
    // Generate speech using ElevenLabs
    const audioBuffer = await elevenLabsGenerate(text, voice_id, voice_settings);
    
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length
    });
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ error: 'TTS generation failed' });
  }
});
```

### Phase 2: Database Schema Enhancements

#### 2.1 User Medical Profiles Table Updates
**Issue**: Potential overlap between proposed TEXT[] fields and existing detailed tables

**Resolution**: Use existing detailed tables as primary source, add summary fields for quick access

**Enhanced Schema**:
```sql
-- Keep existing detailed tables as primary source
-- Add computed summary fields to user_medical_profiles for quick access

ALTER TABLE user_medical_profiles 
ADD COLUMN conditions_summary TEXT GENERATED ALWAYS AS (
  (SELECT string_agg(condition_name, ', ') 
   FROM profile_conditions 
   WHERE profile_id = user_medical_profiles.id 
   AND resolved_on IS NULL)
) STORED;

ALTER TABLE user_medical_profiles 
ADD COLUMN medications_summary TEXT GENERATED ALWAYS AS (
  (SELECT string_agg(medication_name || COALESCE(' (' || dose || ')', ''), ', ') 
   FROM profile_medications 
   WHERE profile_id = user_medical_profiles.id 
   AND stopped_on IS NULL)
) STORED;

ALTER TABLE user_medical_profiles 
ADD COLUMN allergies_summary TEXT GENERATED ALWAYS AS (
  (SELECT string_agg(allergen, ', ') 
   FROM profile_allergies 
   WHERE profile_id = user_medical_profiles.id)
) STORED;
```

#### 2.2 Medical Consultations Table Enhancement
**Issue**: session_id type consistency

**Resolution**: Ensure UUID consistency for session linking

```sql
-- Update medical_consultations to use UUID for session_id
ALTER TABLE medical_consultations 
ALTER COLUMN session_id TYPE UUID USING session_id::UUID;

-- Add foreign key relationship to agents table
ALTER TABLE medical_consultations 
ADD CONSTRAINT fk_consultation_agent 
FOREIGN KEY (session_id) REFERENCES agents(id) ON DELETE SET NULL;

-- Add consultation source tracking
ALTER TABLE medical_consultations 
ADD COLUMN consultation_source VARCHAR(20) DEFAULT 'mobile_app' 
CHECK (consultation_source IN ('mobile_app', 'doctor_portal', 'api'));

-- Add indexes for performance
CREATE INDEX idx_consultations_session_id ON medical_consultations(session_id);
CREATE INDEX idx_consultations_source ON medical_consultations(consultation_source);
```

### Phase 3: Mobile App Backend Integration

#### 3.1 API Client Configuration
**Update mobile app to use backend endpoints instead of direct integrations**

```typescript
// lib/config.ts - Updated configuration
export const Config = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_BACKEND_USER_PORTAL,
    timeout: 30000,
  },
  features: {
    enableVoice: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_VOICE),
    enableEmergencyDetection: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_EMERGENCY_DETECTION),
    enableVideoAvatar: parseBoolean(process.env.EXPO_PUBLIC_ENABLE_VIDEO_AVATAR),
  }
};
```

#### 3.2 Secure API Integration
**Remove client-side API keys, use backend proxy**

```typescript
// lib/api.ts - Updated to use backend endpoints
export async function callMedicalConsultation(request: ConsultationRequest): Promise<ConsultationResponse> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${Config.api.baseUrl}/api/medical-consultation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Consultation failed: ${response.statusText}`);
  }

  return response.json();
}

// Voice processing through backend
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');

  const response = await fetch(`${Config.api.baseUrl}/api/voice/transcribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  return response.json();
}
```

### Phase 4: Security & Performance Enhancements

#### 4.1 Rate Limiting Implementation
```typescript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const createRateLimiter = (windowMs, max, keyGenerator) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
    }),
    windowMs,
    max,
    keyGenerator,
    message: { error: 'Too many requests, please try again later' },
  });
};

// Different limits for different endpoints
const consultationLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 requests per window
  (req) => `consultation:${req.user.id}`
);

const voiceLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // 5 requests per minute
  (req) => `voice:${req.user.id}`
);
```

#### 4.2 Caching Strategy
```typescript
// backend/middleware/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minute default

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = `${req.method}:${req.originalUrl}:${req.user.id}`;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};
```

### Phase 5: Deployment & Monitoring

#### 5.1 Environment Configuration
```bash
# Backend environment variables
NODE_ENV=production
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
ELEVENLABS_API_KEY=...
TAVUS_API_KEY=...
REDIS_URL=redis://...

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# Security
JWT_SECRET=...
CORS_ORIGIN=https://symptomsavior.com
```

#### 5.2 Health Checks & Monitoring
```typescript
// backend/routes/health.js
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    supabase: await checkSupabase(),
    elevenlabs: await checkElevenLabs(),
    txagent: await checkTxAgent(),
  };
  
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
  });
});
```

## Implementation Timeline

### Week 1: Backend API Consolidation
- [ ] Enhance existing `/upload` endpoint for mobile app compatibility
- [ ] Implement `/api/medical-consultation` endpoint
- [ ] Create secure voice processing endpoints
- [ ] Add rate limiting and security middleware

### Week 2: Database Schema Updates
- [ ] Update `medical_consultations` table with UUID session_id
- [ ] Add computed summary fields to `user_medical_profiles`
- [ ] Create necessary indexes and constraints
- [ ] Test data migration scripts

### Week 3: Mobile App Integration
- [ ] Update mobile app configuration to use backend endpoints
- [ ] Remove client-side API keys and implement backend proxy calls
- [ ] Update authentication flow to work with backend
- [ ] Implement error handling and retry logic

### Week 4: Testing & Deployment
- [ ] End-to-end testing of integrated system
- [ ] Performance testing and optimization
- [ ] Security audit and penetration testing
- [ ] Production deployment and monitoring setup

## Risk Mitigation

### Data Consistency
- Implement database transactions for multi-table operations
- Add data validation at API layer
- Create backup and rollback procedures

### Performance
- Implement caching for frequently accessed data
- Add database query optimization
- Monitor API response times and set alerts

### Security
- Regular security audits of API endpoints
- Implement proper CORS policies
- Add request logging and monitoring
- Use environment-specific configurations

## Success Metrics

### Technical Metrics
- API response time < 500ms for 95% of requests
- Database query performance < 100ms average
- Zero data loss during migration
- 99.9% uptime for critical endpoints

### User Experience Metrics
- Mobile app crash rate < 0.1%
- Voice transcription accuracy > 95%
- AI consultation response time < 5 seconds
- User session success rate > 99%

## Post-Implementation Monitoring

### Daily Monitoring
- API endpoint health and response times
- Database performance and connection pool status
- Error rates and exception tracking
- User authentication success rates

### Weekly Reviews
- Performance trend analysis
- Security log review
- User feedback analysis
- Capacity planning assessment

### Monthly Assessments
- Full security audit
- Performance optimization review
- Cost analysis and optimization
- Feature usage analytics

This plan provides a comprehensive approach to integrating the mobile app with the existing backend infrastructure while maintaining data integrity, security, and performance standards.