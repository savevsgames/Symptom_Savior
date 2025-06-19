/**
 * Symptoms Hook
 * Manages symptom data operations with Supabase using dedicated user_symptoms table
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
  duration_hours?: number;
  location?: string;
  user_id: string;
  recorded_at: string;
  created_at: string;
}

interface AddSymptomData {
  symptom: string;
  severity: number;
  description?: string;
  triggers?: string[];
  duration_hours?: number;
  location?: string;
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

      const { data, error: fetchError } = await supabase
        .from('user_symptoms')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform database records to UI format
      const transformedSymptoms: Symptom[] = (data || []).map(record => ({
        id: record.id,
        symptom: record.symptom_name,
        severity: record.severity,
        description: record.description || '',
        date: new Date(record.recorded_at).toLocaleDateString(),
        time: new Date(record.recorded_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        triggers: record.triggers || [],
        duration_hours: record.duration_hours,
        location: record.location,
        user_id: record.user_id,
        recorded_at: record.recorded_at,
        created_at: record.created_at,
      }));

      setSymptoms(transformedSymptoms);
      logger.debug('Symptoms fetched successfully', { count: transformedSymptoms.length });
    } catch (err) {
      logger.error('Error fetching symptoms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch symptoms');
    } finally {
      setLoading(false);
    }
  };

  const addSymptom = async (symptomData: AddSymptomData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('user_symptoms')
        .insert({
          user_id: user.id,
          symptom_name: symptomData.symptom,
          severity: symptomData.severity,
          description: symptomData.description || null,
          triggers: symptomData.triggers || [],
          duration_hours: symptomData.duration_hours || null,
          location: symptomData.location || null,
          recorded_at: new Date().toISOString(),
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

  const updateSymptom = async (symptomId: string, updates: Partial<AddSymptomData>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updateData: any = {};
      
      if (updates.symptom) updateData.symptom_name = updates.symptom;
      if (updates.severity !== undefined) updateData.severity = updates.severity;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.triggers !== undefined) updateData.triggers = updates.triggers;
      if (updates.duration_hours !== undefined) updateData.duration_hours = updates.duration_hours;
      if (updates.location !== undefined) updateData.location = updates.location;

      const { data, error: updateError } = await supabase
        .from('user_symptoms')
        .update(updateData)
        .eq('id', symptomId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      logger.info('Symptom updated successfully', { symptomId });
      
      // Refresh symptoms list
      await fetchSymptoms();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error updating symptom:', err);
      return { data: null, error: err };
    }
  };

  const deleteSymptom = async (symptomId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('user_symptoms')
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

  const getSymptomById = async (symptomId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('user_symptoms')
        .select('*')
        .eq('id', symptomId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Transform to UI format
      const symptom: Symptom = {
        id: data.id,
        symptom: data.symptom_name,
        severity: data.severity,
        description: data.description || '',
        date: new Date(data.recorded_at).toLocaleDateString(),
        time: new Date(data.recorded_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        triggers: data.triggers || [],
        duration_hours: data.duration_hours,
        location: data.location,
        user_id: data.user_id,
        recorded_at: data.recorded_at,
        created_at: data.created_at,
      };

      return { data: symptom, error: null };
    } catch (err) {
      logger.error('Error fetching symptom by ID:', err);
      return { data: null, error: err };
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
    updateSymptom,
    deleteSymptom,
    getSymptomById,
    refetch: fetchSymptoms,
  };
}