/**
 * API Route: /api/profile/summarize-medications
 * Summarizes user's medications using TxAgent
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

    // Fetch user's medications
    const { data: medications, error: medicationsError } = await supabase
      .from('profile_medications')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('created_at', { ascending: false });
    
    if (medicationsError) {
      logger.error('Error fetching medications', medicationsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch medications' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!medications || medications.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No medications to summarize',
        summary: 'No medications currently reported.'
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
      const basicSummary = generateBasicMedicationsSummary(medications);
      
      // Save the basic summary
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ medications_summary: basicSummary })
        .eq('id', profileData.id);
      
      if (updateError) {
        logger.error('Failed to update medications summary', updateError);
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
    const prompt = `Please summarize the following medications in a concise paragraph (maximum 200 words).
Focus on the medication names, dosages, frequencies, and key details. This summary will be used as context for future medical consultations.

Medications:
${medications.map(m => {
  let details = `- ${m.medication_name}`;
  if (m.dose) details += `, ${m.dose}`;
  if (m.frequency) details += `, ${m.frequency}`;
  if (m.started_on) details += `, started on ${m.started_on}`;
  if (m.stopped_on) details += `, stopped on ${m.stopped_on}`;
  if (m.prescribing_doctor) details += `, prescribed by ${m.prescribing_doctor}`;
  if (m.is_current === false) details += ` (discontinued)`;
  if (m.notes) details += `: ${m.notes}`;
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
      const basicSummary = generateBasicMedicationsSummary(medications);
      
      // Save the basic summary
      const { error: updateError } = await supabase
        .from('user_medical_profiles')
        .update({ medications_summary: basicSummary })
        .eq('id', profileData.id);
      
      if (updateError) {
        logger.error('Failed to update medications summary', updateError);
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
      .update({ medications_summary: summary })
      .eq('id', profileData.id);
    
    if (updateError) {
      logger.error('Failed to update medications summary', updateError);
      return new Response(JSON.stringify({ error: 'Failed to save summary' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logger.info('Medications summary generated and saved', { 
      userId: user.id,
      medicationsCount: medications.length,
      summaryLength: summary.length
    });

    return new Response(JSON.stringify({ 
      message: 'Medications summary generated successfully',
      summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Error in summarize-medications API', {
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
 * Generate a basic summary of medications without AI
 */
function generateBasicMedicationsSummary(medications: any[]): string {
  if (medications.length === 0) {
    return 'No medications currently reported.';
  }

  const currentMedications = medications.filter(m => m.is_current !== false);
  const discontinuedMedications = medications.filter(m => m.is_current === false);
  
  let summary = '';
  
  if (currentMedications.length > 0) {
    const medicationsList = currentMedications
      .map(m => {
        let details = m.medication_name;
        if (m.dose) details += ` ${m.dose}`;
        if (m.frequency) details += ` ${m.frequency}`;
        return details;
      })
      .join(', ');
    
    summary += `Current medications: ${medicationsList}. `;
  }
  
  if (discontinuedMedications.length > 0) {
    const discontinuedList = discontinuedMedications
      .map(m => m.medication_name)
      .join(', ');
    
    summary += `Previously taken medications: ${discontinuedList}.`;
  }
  
  return summary;
}