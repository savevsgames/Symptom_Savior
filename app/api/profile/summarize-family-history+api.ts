/**
 * API Route: /api/profile/summarize-family-history
 * Summarizes user's family history using TxAgent
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export async function POST(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const { familyHistoryText } = await request.json();
    
    if (!familyHistoryText || typeof familyHistoryText !== 'string') {
      return new Response(JSON.stringify({ error: 'Family history text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('user_medical_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get active agent for TxAgent communication
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('last_active', { ascending: false })
      .limit(1)
      .single();
    
    if (agentError || !agent || !agent.session_data?.runpod_endpoint) {
      logger.error('No active TxAgent found', { agentError, hasAgent: !!agent });
      
      // Save the raw text as is without AI processing
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ family_history: familyHistoryText })
        .eq('id', profile.id);
      
      if (updateError) {
        logger.error('Failed to update family history', updateError);
        return new Response(JSON.stringify({ error: 'Failed to save family history' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Family history saved (AI unavailable)',
        summary: familyHistoryText
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare prompt for TxAgent
    const prompt = `Please summarize and structure the following family medical history in a concise paragraph (maximum 200 words).
Focus on hereditary conditions, patterns across generations, and medically relevant information. This summary will be used as context for future medical consultations.

Family History:
${familyHistoryText}

Please format your response as a single paragraph without any introductory text or conclusion.`;

    // Call TxAgent
    const txAgentUrl = `${agent.session_data.runpod_endpoint}/chat`;
    const txAgentResponse = await fetch(txAgentUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: prompt,
        temperature: 0.3, // Lower temperature for more consistent summaries
        stream: false
      })
    });

    if (!txAgentResponse.ok) {
      logger.error('TxAgent responded with error', { 
        status: txAgentResponse.status,
        statusText: txAgentResponse.statusText
      });
      
      // Save the raw text as is without AI processing
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ family_history: familyHistoryText })
        .eq('id', profile.id);
      
      if (updateError) {
        logger.error('Failed to update family history', updateError);
        return new Response(JSON.stringify({ error: 'Failed to save family history' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Family history saved (AI error)',
        summary: familyHistoryText
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const txAgentData = await txAgentResponse.json();
    const summary = txAgentData.response;

    // Save the AI-generated summary
    const { error: updateError } = await supabase
      .from('user_medical_profiles')
      .update({ family_history: summary })
      .eq('id', profile.id);
    
    if (updateError) {
      logger.error('Failed to update family history', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save family history' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logger.info('Family history summarized and saved', { 
      userId: user.id,
      inputLength: familyHistoryText.length,
      summaryLength: summary.length
    });

    return new Response(JSON.stringify({ 
      message: 'Family history summarized successfully',
      summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Error in summarize-family-history API', {
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
      headers: { 'Content-Type': 'application/json' }
    });
  }
}