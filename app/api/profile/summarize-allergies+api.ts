/**
 * API Route: /api/profile/summarize-allergies
 * Summarizes user's allergies using TxAgent
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

    // Fetch user's allergies
    const { data: allergies, error: allergiesError } = await supabase
      .from('profile_allergies')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('created_at', { ascending: false });
    
    if (allergiesError) {
      logger.error('Error fetching allergies', allergiesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch allergies' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!allergies || allergies.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No allergies to summarize',
        summary: 'No known allergies reported.'
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
      const basicSummary = generateBasicAllergiesSummary(allergies);
      
      // Save the basic summary
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ allergies_summary: basicSummary })
        .eq('id', profileData.id);
      
      if (updateError) {
        logger.error('Failed to update allergies summary', updateError);
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
    const prompt = `Please summarize the following allergies in a concise paragraph (maximum 200 words).
Focus on the allergens, reactions, severity, and key details. This summary will be used as context for future medical consultations.

Allergies:
${allergies.map(a => {
  let details = `- ${a.allergen}`;
  if (a.reaction) details += `, Reaction: ${a.reaction}`;
  if (a.severity) details += `, Severity: ${a.severity}/10`;
  if (a.discovered_on) details += `, discovered on ${a.discovered_on}`;
  if (a.notes) details += `: ${a.notes}`;
  return details;
}).join('\n')}

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
      const basicSummary = generateBasicAllergiesSummary(allergies);
      
      // Save the basic summary
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ allergies_summary: basicSummary })
        .eq('id', profileData.id);
      
      if (updateError) {
        logger.error('Failed to update allergies summary', updateError);
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
      .update({ allergies_summary: summary })
      .eq('id', profileData.id);
    
    if (updateError) {
      logger.error('Failed to update allergies summary', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save summary' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logger.info('Allergies summary generated and saved', { 
      userId: user.id,
      allergiesCount: allergies.length,
      summaryLength: summary.length
    });

    return new Response(JSON.stringify({ 
      message: 'Allergies summary generated successfully',
      summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Error in summarize-allergies API', {
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
 * Generate a basic summary of allergies without AI
 */
function generateBasicAllergiesSummary(allergies: any[]): string {
  if (allergies.length === 0) {
    return 'No known allergies reported.';
  }

  const severeAllergies = allergies.filter(a => a.severity && a.severity >= 7);
  const moderateAllergies = allergies.filter(a => a.severity && a.severity >= 4 && a.severity < 7);
  const mildAllergies = allergies.filter(a => !a.severity || a.severity < 4);
  
  let summary = '';
  
  if (severeAllergies.length > 0) {
    const severeList = severeAllergies
      .map(a => {
        let details = a.allergen;
        if (a.reaction) details += ` (${a.reaction})`;
        return details;
      })
      .join(', ');
    
    summary += `Severe allergies: ${severeList}. `;
  }
  
  if (moderateAllergies.length > 0) {
    const moderateList = moderateAllergies
      .map(a => {
        let details = a.allergen;
        if (a.reaction) details += ` (${a.reaction})`;
        return details;
      })
      .join(', ');
    
    summary += `Moderate allergies: ${moderateList}. `;
  }
  
  if (mildAllergies.length > 0) {
    const mildList = mildAllergies
      .map(a => a.allergen)
      .join(', ');
    
    summary += `Mild allergies: ${mildList}.`;
  }
  
  return summary;
}