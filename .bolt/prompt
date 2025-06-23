# Symptom Savior API Integration Fixes

## Current State Analysis

### Application Architecture

The Symptom Savior application is a React Native (Expo) mobile app with a Node.js/Express backend. The app allows users to:

1. Track symptoms and health data
2. Interact with an AI assistant for medical guidance
3. Manage personal health profiles
4. View health trends and insights

The AI functionality is powered by TxAgent, a specialized medical RAG (Retrieval Augmented Generation) system that provides evidence-based health information.

### Current Chat Implementation

Based on the assessment, there's a critical routing issue in the AI chat implementation:

#### What's Working
- The frontend UI for the chat interface is fully implemented
- User authentication with Supabase is functioning correctly
- The backend has a properly implemented `/api/medical-consultation` endpoint with:
  - Emergency detection
  - JWT authentication
  - TxAgent availability checking
  - Proper error handling
  - Consultation logging to the database

#### What's Not Working
- The frontend is **bypassing the backend** and calling the TxAgent container directly
- Instead of using `/api/medical-consultation`, the app is using `EXPO_PUBLIC_TXAGENT_URL` to construct direct API calls
- This bypasses critical safety features like emergency detection and proper error handling
- Consultation logging to the database is not happening
- The app lacks graceful fallback behavior when TxAgent is unavailable

## Required Changes

### 1. Frontend API Call Modification

The most critical change needed is to modify how the frontend makes AI consultation requests:

**Current Implementation (Problematic):**
```typescript
// In lib/api.ts or similar
export async function callTxAgent(request: TxAgentRequest): Promise<TxAgentResponse> {
  // Direct call to TxAgent container
  const response = await fetch(`${Config.ai.backendUserPortal}/api/medical-consultation`, {
    // ...request configuration
  });
  // ...process response
}
```

**Required Change:**
Update the API call to use the backend endpoint instead of calling TxAgent directly:

```typescript
// In lib/api.ts or similar
export async function callTxAgent(request: TxAgentRequest): Promise<TxAgentResponse> {
  if (!Config.ai.backendUserPortal) {
    throw new Error('Backend User Portal URL not configured');
  }

  // Call our backend endpoint instead of TxAgent directly
  const response = await fetch(`${Config.ai.backendUserPortal}/api/medical-consultation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      query: request.query,
      context: request.context || {},
      include_voice: request.include_voice || false,
      include_video: request.include_video || false,
      session_id: request.session_id || generateSessionId(),
      preferred_agent: request.preferred_agent || 'txagent', // New parameter
    }),
  });

  // ...process response
}
```

### 2. Environment Variable Configuration

Update the environment variable usage:

**Current (Problematic):**
- Using `EXPO_PUBLIC_TXAGENT_URL` directly for API calls

**Required Change:**
- Use `EXPO_PUBLIC_BACKEND_USER_PORTAL` for all API calls
- This should point to the backend server URL, not the TxAgent container
- Update `.env.example` to clarify this distinction

### 3. Backend Endpoint Enhancement

The backend `/api/medical-consultation` endpoint needs to be updated to handle the new `preferred_agent` parameter:

```javascript
// In backend/routes/medicalConsultation.js
router.post('/medical-consultation', async (req, res) => {
  const startTime = Date.now();
  let userId = req.userId;

  try {
    const { query, context, session_id, preferred_agent = 'txagent' } = req.body;

    // Existing emergency detection logic...

    // Handle agent selection based on preferred_agent parameter
    if (preferred_agent === 'openai') {
      // Call OpenAI API
      // This is new functionality to implement
      const openAIResponse = await callOpenAI(query, context);
      
      // Process and return OpenAI response...
      // Log consultation to database...
      
      return res.json({
        response: {
          text: openAIResponse.text,
          sources: [],
          confidence_score: openAIResponse.confidence || 0.7
        },
        safety: {
          emergency_detected: false,
          disclaimer: 'This information is for educational purposes only and is not a substitute for professional medical advice.',
          urgent_care_recommended: false
        },
        // Other response fields...
      });
    } else {
      // Default to TxAgent (existing logic)
      // Get active agent for TxAgent communication
      const agent = await agentService.getActiveAgent(userId);
      
      if (!agent || !agent.session_data?.runpod_endpoint) {
        // TxAgent unavailable handling...
      }
      
      // Existing TxAgent call logic...
    }

    // Existing response handling...

  } catch (error) {
    // Existing error handling...
  }
});
```

### 4. Error Handling Improvements

Enhance the frontend to properly handle backend error responses:

```typescript
// In the chat component
try {
  const response = await callTxAgent(request);
  // Process successful response...
} catch (error) {
  // Check for specific error types
  if (error.code === 'SERVICE_UNAVAILABLE') {
    // Show user-friendly message for unavailable service
    setErrorMessage('The AI assistant is temporarily unavailable. Please try again later.');
  } else if (error.code === 'CONSULTATION_FAILED') {
    // Show general error message
    setErrorMessage('Failed to get a response. Please try again.');
  } else {
    // Handle other errors
    setErrorMessage('An unexpected error occurred. Please try again.');
  }
  
  // Add fallback behavior
  setIsTyping(false);
  // Possibly add a retry button or suggestion
}
```

### 5. Fallback Response Implementation

Implement a fallback response generator for when the backend is unavailable:

```typescript
// In lib/api.ts
export function generateFallbackResponse(query: string): TxAgentResponse {
  const sessionId = generateSessionId();
  
  return {
    response: {
      text: "I'm currently experiencing technical difficulties connecting to the medical consultation service. While I work to resolve this, please remember that if you're experiencing a medical emergency, contact emergency services immediately. For non-urgent concerns, consider consulting with your healthcare provider. You can continue to log your symptoms in the app for tracking purposes.",
      confidence_score: 0.5,
    },
    safety: {
      emergency_detected: detectEmergencyKeywords(query),
      disclaimer: "This is an automated fallback response. For medical emergencies, call emergency services immediately. This app is not a substitute for professional medical advice.",
      urgent_care_recommended: detectEmergencyKeywords(query),
    },
    processing_time_ms: 100,
    session_id: sessionId,
  };
}

// Use this in the chat component when backend calls fail
try {
  const response = await callTxAgent(request);
  // Process successful response...
} catch (error) {
  logger.error('Backend call failed, using fallback', error);
  
  // Use fallback response
  const fallbackResponse = generateFallbackResponse(request.query);
  
  // Process fallback response as if it came from the backend
  // Show user-friendly error message
  Alert.alert(
    'Connection Issue',
    'Having trouble connecting to the medical consultation service. Using offline guidance for now.',
    [{ text: 'OK' }]
  );
}
```

## Implementation Plan

### Phase 1: Frontend Routing Fix

1. Update `lib/api.ts` to route all requests through the backend
2. Implement proper error handling for backend responses
3. Add fallback response generation for offline scenarios
4. Update environment variable usage to clarify backend vs. TxAgent URLs

### Phase 2: Backend Enhancement

1. Update the `/api/medical-consultation` endpoint to handle the `preferred_agent` parameter
2. Implement OpenAI integration as an alternative to TxAgent
3. Enhance error handling and response formatting
4. Ensure proper logging of all consultations regardless of agent used

### Phase 3: Testing & Validation

1. Test the complete flow with TxAgent available
2. Test fallback behavior when TxAgent is unavailable
3. Test emergency detection and response
4. Verify consultation logging to the database
5. Test OpenAI fallback when selected as preferred agent

## Benefits of These Changes

1. **Improved Safety**: All queries will be properly screened for emergencies
2. **Better Error Handling**: Users will see helpful messages instead of cryptic errors
3. **Consistent Logging**: All consultations will be properly recorded
4. **Graceful Degradation**: The app will function even when TxAgent is unavailable
5. **Flexibility**: Support for multiple AI providers (TxAgent and OpenAI)
6. **Maintainability**: Proper separation of concerns between frontend and backend

## Conclusion

The current implementation bypasses critical backend safety features by directly calling the TxAgent container. By routing all AI consultation requests through the backend's `/api/medical-consultation` endpoint, we can restore these safety features, improve error handling, and ensure proper consultation logging. This change will significantly improve the robustness and reliability of the AI chat feature.