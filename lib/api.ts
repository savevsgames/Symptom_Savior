/**
 * API Integration Layer
 * Handles communication with TxAgent and other external services
 */

import { Config } from './config';
import { supabase } from './supabase';
import { logger } from '@/utils/logger';

export interface TxAgentRequest {
  query: string;
  context?: {
    user_profile?: any;
    recent_symptoms?: any[];
    medical_conditions?: any[];
    current_medications?: any[];
    allergies?: any[];
    recent_visits?: any[];
  };
  include_voice?: boolean;
  include_video?: boolean;
  session_id?: string;
}

export interface TxAgentResponse {
  response: {
    text: string;
    sources?: Array<{
      title: string;
      content: string;
      relevance_score: number;
    }>;
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

export interface ConsultationLogEntry {
  user_id: string;
  session_id: string;
  query: string;
  response: string;
  sources?: any;
  voice_audio_url?: string;
  video_url?: string;
  consultation_type: string;
  processing_time: number;
  emergency_detected: boolean;
  context_used?: any;
  confidence_score?: number;
  recommendations?: any;
}

/**
 * Call TxAgent Medical Consultation API
 */
export async function callTxAgent(request: TxAgentRequest): Promise<TxAgentResponse> {
  if (!Config.ai.txAgentUrl) {
    throw new Error('TxAgent URL not configured. Please set EXPO_PUBLIC_TXAGENT_URL in your environment variables.');
  }

  try {
    logger.debug('Calling TxAgent API', { 
      query: request.query.substring(0, 100) + '...',
      hasContext: !!request.context,
      includeVoice: request.include_voice,
      includeVideo: request.include_video
    });

    // Get user session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${Config.ai.txAgentUrl}/api/medical-consultation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'User-Agent': 'SymptomSavior/1.0.0',
      },
      body: JSON.stringify({
        query: request.query,
        context: request.context || {},
        include_voice: request.include_voice || false,
        include_video: request.include_video || false,
        session_id: request.session_id || generateSessionId(),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('TxAgent API error', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText 
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (response.status >= 500) {
        throw new Error('Medical consultation service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Medical consultation failed: ${response.statusText}`);
      }
    }

    const data: TxAgentResponse = await response.json();
    
    logger.info('TxAgent response received', {
      responseLength: data.response.text.length,
      sourcesCount: data.response.sources?.length || 0,
      emergencyDetected: data.safety.emergency_detected,
      processingTime: data.processing_time_ms,
      hasVoice: !!data.media?.voice_audio_url,
      hasVideo: !!data.media?.video_url,
      confidenceScore: data.response.confidence_score,
    });

    return data;
  } catch (error) {
    logger.error('TxAgent API call failed', error);
    
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while processing your medical consultation.');
    }
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log consultation to database
 */
export async function logConsultation(request: TxAgentRequest, response: TxAgentResponse): Promise<void> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    const logEntry: ConsultationLogEntry = {
      user_id: session.user.id,
      session_id: response.session_id,
      query: request.query,
      response: response.response.text,
      sources: response.response.sources,
      voice_audio_url: response.media?.voice_audio_url,
      video_url: response.media?.video_url,
      consultation_type: 'medical_consultation',
      processing_time: response.processing_time_ms,
      emergency_detected: response.safety.emergency_detected,
      context_used: request.context,
      confidence_score: response.response.confidence_score,
      recommendations: response.recommendations,
    };

    // Note: This would require a consultation_logs table in the database
    // For now, we'll just log to console
    logger.info('Consultation logged', { sessionId: response.session_id });
  } catch (error) {
    logger.error('Failed to log consultation', error);
    // Don't throw here as logging failure shouldn't break the main flow
  }
}