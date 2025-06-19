/**
 * Symptoms Hook
 * Manages symptom data operations with Supabase
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export interface Symptom {
  id: string;
  symptom: string;
  severity: number;
  description?: string;
  date: string;
  time: string;
  triggers?: string[];
  user_id: string;
  created_at: string;
}

export function useSymptoms() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchSymptoms = async () => {
    if (!user) {
      setSymptoms([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Note: The schema shows 'documents' table, but we'll create a symptoms view
      // For now, we'll use a mock implementation that would work with the actual schema
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform documents to symptoms format
      const transformedSymptoms: Symptom[] = (data || []).map(doc => {
        const metadata = doc.metadata || {};
        return {
          id: doc.id,
          symptom: metadata.symptom || doc.filename || 'Unknown Symptom',
          severity: metadata.severity || 1,
          description: doc.content || '',
          date: new Date(doc.created_at).toLocaleDateString(),
          time: new Date(doc.created_at).toLocaleTimeString(),
          triggers: metadata.triggers || [],
          user_id: doc.user_id,
          created_at: doc.created_at,
        };
      });

      setSymptoms(transformedSymptoms);
      logger.debug('Symptoms fetched successfully', { count: transformedSymptoms.length });
    } catch (err) {
      logger.error('Error fetching symptoms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch symptoms');
    } finally {
      setLoading(false);
    }
  };

  const addSymptom = async (symptomData: {
    symptom: string;
    severity: number;
    description?: string;
    triggers?: string[];
  }) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const metadata = {
        symptom: symptomData.symptom,
        severity: symptomData.severity,
        triggers: symptomData.triggers || [],
      };

      const { data, error: insertError } = await supabase
        .from('documents')
        .insert({
          filename: symptomData.symptom,
          content: symptomData.description || '',
          metadata,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      logger.info('Symptom added successfully', { symptom: symptomData.symptom });
      
      // Refresh symptoms list
      await fetchSymptoms();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error adding symptom:', err);
      return { data: null, error: err };
    }
  };

  const deleteSymptom = async (symptomId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', symptomId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info('Symptom deleted successfully', { symptomId });
      
      // Refresh symptoms list
      await fetchSymptoms();
      
      return { error: null };
    } catch (err) {
      logger.error('Error deleting symptom:', err);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchSymptoms();
  }, [user]);

  return {
    symptoms,
    loading,
    error,
    fetchSymptoms,
    addSymptom,
    deleteSymptom,
    refetch: fetchSymptoms,
  };
}