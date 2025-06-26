/**
 * API Route: /api/profile/summarize-conditions
 * Summarizes user's medical conditions using TxAgent
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

    // Get user's profile ID
    const { data: profileData, error: profileError } = await supabase
      .from('user_medical_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (profileError || !profileData) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch user's conditions
    const { data: conditions, error: conditionsError } = await supabase
      .from('profile_conditions')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('created_at', { ascending: false });
    
    if (conditionsError) {
      logger.error('Error fetching conditions', conditionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch conditions' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!conditions || conditions.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No conditions to summarize',
        summary: 'No medical conditions reported.'
      }), {
        status: 200,
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
      
      // Generate a basic summary without AI
      const basicSummary = generateBasicConditionsSummary(conditions);
      
      // Save the basic summary
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ conditions_summary: basicSummary })
        .eq('id', profileData.id);
      
      if (updateError) {
        logger.error('Failed to update conditions summary', updateError);
        return new Response(JSON.stringify({ error: 'Failed to save summary' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Basic summary generated (AI unavailable)',
        summary: basicSummary
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prepare prompt for TxAgent
    const prompt = `Please summarize the following medical conditions in a concise paragraph (maximum 200 words). 
Focus on the names, severity, and key details. This summary will be used as context for future medical consultations.

Medical Conditions:
${conditions.map(c => `- ${c.condition_name}${c.severity ? ` (Severity: ${c.severity}/10)` : ''}${c.diagnosed_at ? ` diagnosed on ${c.diagnosed_at}` : ''}${c.ongoing === false ? ' (resolved)' : ' (ongoing)'}${c.notes ? `: ${c.notes}` : ''}`).join('\n')}

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
      
      // Generate a basic summary as fallback
      const basicSummary = generateBasicConditionsSummary(conditions);
      
      // Save the basic summary
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ conditions_summary: basicSummary })
        .eq('id', profileData.id);
      
      if (updateError) {
        logger.error('Failed to update conditions summary', updateError);
        return new Response(JSON.stringify({ error: 'Failed to save summary' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        message: 'Basic summary generated (AI error)',
        summary: basicSummary
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
      .update({ conditions_summary: summary })
      .eq('id', profileData.id);
    
    if (updateError) {
      logger.error('Failed to update conditions summary', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save summary' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logger.info('Conditions summary generated and saved', { 
      userId: user.id,
      conditionsCount: conditions.length,
      summaryLength: summary.length
    });

    return new Response(JSON.stringify({ 
      message: 'Conditions summary generated successfully',
      summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Error in summarize-conditions API', {
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

/**
 * Generate a basic summary of conditions without AI
 */
function generateBasicConditionsSummary(conditions: any[]): string {
  if (conditions.length === 0) {
    return 'No medical conditions reported.';
  }

  const ongoingConditions = conditions.filter(c => c.ongoing !== false);
  const resolvedConditions = conditions.filter(c => c.ongoing === false);
  
  let summary = '';
  
  if (ongoingConditions.length > 0) {
    const conditionsList = ongoingConditions
      .map(c => c.condition_name + (c.severity ? ` (Severity: ${c.severity}/10)` : ''))
      .join(', ');
    
    summary += `Current medical conditions: ${conditionsList}. `;
  }
  
  if (resolvedConditions.length > 0) {
    const resolvedList = resolvedConditions
      .map(c => c.condition_name)
      .join(', ');
    
    summary += `Past medical conditions: ${resolvedList}.`;
  }
  
  return summary;
}