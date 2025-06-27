/**
 * API Route: /api/conversation/start
 * Initializes a new conversation session and returns WebSocket connection details
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { Config } from '@/lib/config';

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // Parse request body
    const { medical_profile, initial_context } = await request.json();
    
    // Generate session ID
    const sessionId = `conv-${Date.now()}-${user.id.substring(0, 8)}`;
    
    // Create conversation session in database
    const { error: insertError } = await supabase
      .from('conversation_sessions')
      .insert({
        id: sessionId,
        user_id: user.id,
        medical_profile,
        status: 'active',
        session_metadata: {
          initial_context,
          client_info: {
            user_agent: request.headers.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        }
      });
    
    if (insertError) {
      logger.error('Failed to create conversation session', {
        error: insertError,
        userId: user.id
      });
      
      return new Response(JSON.stringify({ error: 'Failed to create conversation session' }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Generate WebSocket URL
    // In a real implementation, this would be a secure WebSocket endpoint
    // For now, we'll use a placeholder that the frontend can connect to
    const websocketUrl = `${Config.ai.backendUserPortal?.replace('http', 'ws')}/api/conversation/stream/${sessionId}`;
    
    logger.info('Conversation session created', {
      sessionId,
      userId: user.id
    });
    
    return new Response(JSON.stringify({
      session_id: sessionId,
      websocket_url: websocketUrl,
      status: 'connected'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    logger.error('Error in conversation start API', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}