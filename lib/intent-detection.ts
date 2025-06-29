import { logger } from '@/utils/logger';

export interface ExtractedSymptomData {
  symptom_name?: string;
  severity?: number;
  description?: string;
  triggers?: string;
  duration_hours?: number;
  location?: string;
  confidence?: number;
}

export interface IntentDetectionResult {
  intent: 'symptom_logging' | 'symptom_query' | 'symptom_history' | 'general_question' | 'unknown';
  confidence: number;
  extractedData?: ExtractedSymptomData;
  symptomName?: string; // For symptom history queries
}

/**
 * Detect if the user is trying to log a symptom
 */
export function detectSymptomLoggingIntent(query: string): IntentDetectionResult {
  // Normalize the query
  const normalizedQuery = query.toLowerCase().trim();
  
  // Symptom logging patterns
  const symptomLoggingPatterns = [
    /log (a|my|this) symptom/i,
    /record (a|my|this) symptom/i,
    /add (a|my|this) symptom/i,
    /save (a|my|this) symptom/i,
    /i('ve| have) been (having|experiencing)/i,
    /i('m| am) having (a|an)/i,
    /i('m| am) feeling/i,
    /i('ve| have) got (a|an)/i,
    /track (my|this) (.*?)/i,
    /note (down|that) (i|my) (have|has|am experiencing)/i,
    /please (record|log|note|save) (that|this)/i,
  ];
  
  // Check for direct matches
  for (const pattern of symptomLoggingPatterns) {
    if (pattern.test(normalizedQuery)) {
      const extractedData = extractSymptomDetails(query);
      const confidence = calculateConfidence(extractedData);
      
      logger.debug('Symptom logging intent detected', { 
        confidence,
        extractedData
      });
      
      return {
        intent: 'symptom_logging',
        confidence,
        extractedData
      };
    }
  }
  
  // Symptom history patterns
  const symptomHistoryPatterns = [
    /show (me|my) (.*?) (history|log|records)/i,
    /view (my|all) (.*?) (symptoms|entries)/i,
    /how many times (have|has) i (had|experienced|logged) (.*?)/i,
    /when (did|was) (my|the) last (.*?)/i,
    /list (all|my|recent) (.*?) (symptoms|episodes|occurrences)/i,
  ];
  
  for (const pattern of symptomHistoryPatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      // Try to extract the symptom name from the pattern
      let symptomName = '';
      if (match[2] && !['me', 'my', 'all'].includes(match[2].trim())) {
        symptomName = match[2].trim();
      } else if (match[3] && !['history', 'log', 'records', 'symptoms', 'entries'].includes(match[3].trim())) {
        symptomName = match[3].trim();
      }
      
      return {
        intent: 'symptom_history',
        confidence: 0.8,
        symptomName: symptomName || undefined
      };
    }
  }
  
  // Symptom query patterns (asking about symptoms)
  const symptomQueryPatterns = [
    /what (causes|could cause) (.*?)\?/i,
    /why (do|am) i (have|having|get|getting) (.*?)\?/i,
    /how (can|do) i (treat|manage|handle) (my|this) (.*?)\?/i,
    /is (.*?) a symptom of/i,
    /should i be worried about (my|this) (.*?)\?/i,
  ];
  
  for (const pattern of symptomQueryPatterns) {
    if (pattern.test(normalizedQuery)) {
      return {
        intent: 'symptom_query',
        confidence: 0.8,
      };
    }
  }
  
  // Check if it might be a symptom mention without explicit logging intent
  const possibleSymptomData = extractSymptomDetails(query);
  if (possibleSymptomData.symptom_name && possibleSymptomData.confidence && possibleSymptomData.confidence > 0.6) {
    return {
      intent: 'symptom_logging',
      confidence: possibleSymptomData.confidence * 0.7, // Lower confidence since intent wasn't explicit
      extractedData: possibleSymptomData
    };
  }
  
  // Default to general question
  return {
    intent: 'general_question',
    confidence: 0.5
  };
}

/**
 * Extract symptom details from the conversation
 */
export function extractSymptomDetails(query: string): ExtractedSymptomData {
  const result: ExtractedSymptomData = {
    confidence: 0
  };
  let confidencePoints = 0;
  let totalPoints = 0;
  
  // Extract symptom name
  const symptomNamePatterns = [
    { pattern: /experiencing (a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /having (a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /suffering from (a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /log my ([a-z\s]+)/i, group: 1 },
    { pattern: /i have (a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /i('m| am) feeling ([a-z\s]+)/i, group: 2 },
    { pattern: /i('ve| have) got (a|an) ([a-z\s]+)/i, group: 3 },
    { pattern: /record (my|a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /add (my|a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /save (my|a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /note (my|a|an) ([a-z\s]+)/i, group: 2 },
    { pattern: /with (a|an) ([a-z\s]+)/i, group: 2 },
  ];
  
  totalPoints += 3; // Symptom name is important
  for (const { pattern, group } of symptomNamePatterns) {
    const match = query.match(pattern);
    if (match && match[group]) {
      let symptomName = match[group].trim();
      
      // Clean up common words that might be captured but aren't part of the symptom
      symptomName = symptomName
        .replace(/^(bad|severe|mild|slight|terrible|awful|horrible)\s+/i, '')
        .replace(/\s+(now|today|yesterday|lately|recently|again)$/i, '');
      
      result.symptom_name = symptomName;
      confidencePoints += 3;
      break;
    }
  }
  
  // If no symptom name found yet, try to find common symptoms directly
  if (!result.symptom_name) {
    const commonSymptoms = [
      'headache', 'migraine', 'nausea', 'fever', 'cough', 'sore throat',
      'back pain', 'stomach ache', 'dizziness', 'fatigue', 'chest pain',
      'shortness of breath', 'rash', 'joint pain', 'muscle pain', 'anxiety',
      'depression', 'insomnia', 'diarrhea', 'constipation', 'vomiting'
    ];
    
    for (const symptom of commonSymptoms) {
      if (query.toLowerCase().includes(symptom)) {
        result.symptom_name = symptom;
        confidencePoints += 2; // Lower confidence than pattern match
        break;
      }
    }
  }
  
  // Extract severity
  const severityPatterns = [
    { pattern: /severity (of|is) (\d+)/i, group: 2 },
    { pattern: /rated? (\d+)\/10/i, group: 1 },
    { pattern: /(\d+) out of 10/i, group: 1 },
    { pattern: /scale of (\d+)/i, group: 1 },
    { pattern: /(\d+) on a scale/i, group: 1 },
    { pattern: /pain (?:level|score) (?:of|is) (\d+)/i, group: 1 },
    { pattern: /intensity (?:of|is) (\d+)/i, group: 1 },
  ];
  
  totalPoints += 2; // Severity is somewhat important
  for (const { pattern, group } of severityPatterns) {
    const match = query.match(pattern);
    if (match && match[group]) {
      const severity = parseInt(match[group], 10);
      if (severity >= 1 && severity <= 10) {
        result.severity = severity;
        confidencePoints += 2;
        break;
      }
    }
  }
  
  // Extract qualitative severity if no numeric value found
  if (!result.severity) {
    const severityWords = {
      'mild': 2,
      'slight': 2,
      'minor': 2,
      'moderate': 5,
      'medium': 5,
      'bad': 7,
      'severe': 8,
      'intense': 8,
      'extreme': 9,
      'worst': 10,
      'terrible': 9,
      'unbearable': 10,
      'excruciating': 10
    };
    
    for (const [word, value] of Object.entries(severityWords)) {
      if (new RegExp(`\\b${word}\\b`, 'i').test(query)) {
        result.severity = value;
        confidencePoints += 1; // Lower confidence for qualitative severity
        break;
      }
    }
  }
  
  // Extract location
  const locationPatterns = [
    { pattern: /in my ([a-z\s]+)/i, group: 1 },
    { pattern: /on my ([a-z\s]+)/i, group: 1 },
    { pattern: /location is ([a-z\s]+)/i, group: 1 },
    { pattern: /located (in|on) my ([a-z\s]+)/i, group: 2 },
    { pattern: /my ([a-z\s]+) (hurts|aches|is sore)/i, group: 1 },
    { pattern: /pain in (?:my|the) ([a-z\s]+)/i, group: 1 },
  ];
  
  totalPoints += 1; // Location is less important
  for (const { pattern, group } of locationPatterns) {
    const match = query.match(pattern);
    if (match && match[group]) {
      result.location = match[group].trim();
      confidencePoints += 1;
      break;
    }
  }
  
  // Extract duration
  const durationPatterns = [
    { pattern: /for (\d+) hours?/i, group: 1, unit: 1 },
    { pattern: /for (\d+) days?/i, group: 1, unit: 24 },
    { pattern: /for (\d+) weeks?/i, group: 1, unit: 168 },
    { pattern: /since (\d+) hours? ago/i, group: 1, unit: 1 },
    { pattern: /started (\d+) hours? ago/i, group: 1, unit: 1 },
    { pattern: /last (\d+) hours?/i, group: 1, unit: 1 },
    { pattern: /past (\d+) hours?/i, group: 1, unit: 1 },
  ];
  
  totalPoints += 1; // Duration is less important
  for (const { pattern, group, unit } of durationPatterns) {
    const match = query.match(pattern);
    if (match && match[group]) {
      const value = parseInt(match[group], 10);
      result.duration_hours = value * unit;
      confidencePoints += 1;
      break;
    }
  }
  
  // Extract triggers
  const triggerPatterns = [
    { pattern: /triggered by ([a-z\s,]+)/i, group: 1 },
    { pattern: /after ([a-z\s,]+)/i, group: 1 },
    { pattern: /when i ([a-z\s,]+)/i, group: 1 },
    { pattern: /happens (when|after) ([a-z\s,]+)/i, group: 2 },
    { pattern: /caused by ([a-z\s,]+)/i, group: 1 },
    { pattern: /due to ([a-z\s,]+)/i, group: 1 },
    { pattern: /because of ([a-z\s,]+)/i, group: 1 },
  ];
  
  totalPoints += 1; // Triggers are less important
  for (const { pattern, group } of triggerPatterns) {
    const match = query.match(pattern);
    if (match && match[group]) {
      result.triggers = match[group].trim();
      confidencePoints += 1;
      break;
    }
  }
  
  // Extract description (anything that provides more context)
  const descriptionPatterns = [
    { pattern: /it feels like ([a-z\s,\.]+)/i, group: 1 },
    { pattern: /it's like ([a-z\s,\.]+)/i, group: 1 },
    { pattern: /described as ([a-z\s,\.]+)/i, group: 1 },
    { pattern: /feels like ([a-z\s,\.]+)/i, group: 1 },
    { pattern: /sensation of ([a-z\s,\.]+)/i, group: 1 },
  ];
  
  totalPoints += 1; // Description is less important
  for (const { pattern, group } of descriptionPatterns) {
    const match = query.match(pattern);
    if (match && match[group]) {
      result.description = match[group].trim();
      confidencePoints += 1;
      break;
    }
  }
  
  // Calculate overall confidence
  result.confidence = totalPoints > 0 ? confidencePoints / totalPoints : 0;
  
  return result;
}

/**
 * Calculate confidence based on extracted data
 */
function calculateConfidence(data: ExtractedSymptomData): number {
  if (!data.symptom_name) {
    return 0.1; // Very low confidence without a symptom name
  }
  
  let confidence = 0.6; // Base confidence with symptom name
  
  // Increase confidence based on additional fields
  if (data.severity !== undefined) confidence += 0.1;
  if (data.location) confidence += 0.1;
  if (data.duration_hours) confidence += 0.1;
  if (data.triggers) confidence += 0.05;
  if (data.description) confidence += 0.05;
  
  return Math.min(confidence, 1.0); // Cap at 1.0
}

/**
 * Format extracted symptom data into a human-readable string
 */
export function formatSymptomData(data: ExtractedSymptomData): string {
  const parts = [];
  
  if (data.symptom_name) {
    parts.push(`Symptom: ${data.symptom_name}`);
  }
  
  if (data.severity) {
    parts.push(`Severity: ${data.severity}/10`);
  }
  
  if (data.location) {
    parts.push(`Location: ${data.location}`);
  }
  
  if (data.duration_hours) {
    const days = Math.floor(data.duration_hours / 24);
    const hours = data.duration_hours % 24;
    
    if (days > 0 && hours > 0) {
      parts.push(`Duration: ${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`);
    } else if (days > 0) {
      parts.push(`Duration: ${days} day${days !== 1 ? 's' : ''}`);
    } else {
      parts.push(`Duration: ${hours} hour${hours !== 1 ? 's' : ''}`);
    }
  }
  
  if (data.triggers) {
    parts.push(`Triggers: ${data.triggers}`);
  }
  
  if (data.description) {
    parts.push(`Description: ${data.description}`);
  }
  
  return parts.join('\n');
}