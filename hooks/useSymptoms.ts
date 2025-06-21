/**
 * Symptoms Hook
 * Manages symptom data operations with enhanced Supabase schema
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
  triggers?: string;
  duration_hours?: number;
  location?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  treatment_type: 'medication' | 'supplement' | 'exercise' | 'therapy' | 'other';
  name: string;
  dosage?: string;
  duration?: string;
  description?: string;
  doctor_recommended: boolean;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorVisit {
  id: string;
  visit_ts: string;
  doctor_name?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  visit_prep?: string;
  visit_summary?: string;
  follow_up_required: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface AddSymptomData {
  symptom_name: string;
  severity: number;
  description?: string;
  triggers?: string;
  duration_hours?: number;
  location?: string;
}

interface AddTreatmentData {
  treatment_type: 'medication' | 'supplement' | 'exercise' | 'therapy' | 'other';
  name: string;
  dosage?: string;
  duration?: string;
  description?: string;
  doctor_recommended?: boolean;
}

interface AddDoctorVisitData {
  visit_ts: string;
  doctor_name?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  visit_prep?: string;
  visit_summary?: string;
  follow_up_required?: boolean;
}

export function useSymptoms() {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>([]);
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
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Transform database records to UI format
      const transformedSymptoms: Symptom[] = (data || []).map(record => ({
        id: record.id,
        symptom: record.symptom_name,
        severity: record.severity,
        description: record.description || '',
        date: new Date(record.created_at).toLocaleDateString(),
        time: new Date(record.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        triggers: record.triggers || '',
        duration_hours: record.duration_hours,
        location: record.location,
        user_id: record.user_id,
        created_at: record.created_at,
        updated_at: record.updated_at,
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

  const fetchTreatments = async () => {
    if (!user) {
      setTreatments([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('treatments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTreatments(data || []);
      logger.debug('Treatments fetched successfully', { count: data?.length || 0 });
    } catch (err) {
      logger.error('Error fetching treatments:', err);
    }
  };

  const fetchDoctorVisits = async () => {
    if (!user) {
      setDoctorVisits([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('doctor_visits')
        .select('*')
        .eq('user_id', user.id)
        .order('visit_ts', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setDoctorVisits(data || []);
      logger.debug('Doctor visits fetched successfully', { count: data?.length || 0 });
    } catch (err) {
      logger.error('Error fetching doctor visits:', err);
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
          symptom_name: symptomData.symptom_name,
          severity: symptomData.severity,
          description: symptomData.description || null,
          triggers: symptomData.triggers || null,
          duration_hours: symptomData.duration_hours || null,
          location: symptomData.location || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      logger.info('Symptom added successfully', { symptom: symptomData.symptom_name });
      
      // Refresh symptoms list
      await fetchSymptoms();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error adding symptom:', err);
      return { data: null, error: err };
    }
  };

  const addTreatment = async (treatmentData: AddTreatmentData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('treatments')
        .insert({
          user_id: user.id,
          treatment_type: treatmentData.treatment_type,
          name: treatmentData.name,
          dosage: treatmentData.dosage || null,
          duration: treatmentData.duration || null,
          description: treatmentData.description || null,
          doctor_recommended: treatmentData.doctor_recommended || false,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      logger.info('Treatment added successfully', { treatment: treatmentData.name });
      
      // Refresh treatments list
      await fetchTreatments();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error adding treatment:', err);
      return { data: null, error: err };
    }
  };

  const addDoctorVisit = async (visitData: AddDoctorVisitData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('doctor_visits')
        .insert({
          user_id: user.id,
          visit_ts: visitData.visit_ts,
          doctor_name: visitData.doctor_name || null,
          location: visitData.location || null,
          contact_phone: visitData.contact_phone || null,
          contact_email: visitData.contact_email || null,
          visit_prep: visitData.visit_prep || null,
          visit_summary: visitData.visit_summary || null,
          follow_up_required: visitData.follow_up_required || false,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      logger.info('Doctor visit added successfully', { doctor: visitData.doctor_name });
      
      // Refresh doctor visits list
      await fetchDoctorVisits();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error adding doctor visit:', err);
      return { data: null, error: err };
    }
  };

  const linkSymptomToTreatment = async (symptomId: string, treatmentId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: insertError } = await supabase
        .from('symptom_treatments')
        .insert({
          symptom_id: symptomId,
          treatment_id: treatmentId,
        });

      if (insertError) {
        throw insertError;
      }

      logger.info('Symptom linked to treatment successfully', { symptomId, treatmentId });
      return { error: null };
    } catch (err) {
      logger.error('Error linking symptom to treatment:', err);
      return { error: err };
    }
  };

  const updateSymptom = async (symptomId: string, updates: Partial<AddSymptomData>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updateData: any = {};
      
      if (updates.symptom_name) updateData.symptom_name = updates.symptom_name;
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
        date: new Date(data.created_at).toLocaleDateString(),
        time: new Date(data.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        triggers: data.triggers || '',
        duration_hours: data.duration_hours,
        location: data.location,
        user_id: data.user_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return { data: symptom, error: null };
    } catch (err) {
      logger.error('Error fetching symptom by ID:', err);
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    if (user) {
      fetchSymptoms();
      fetchTreatments();
      fetchDoctorVisits();
    }
  }, [user]);

  return {
    // Symptoms
    symptoms,
    loading,
    error,
    fetchSymptoms,
    addSymptom,
    updateSymptom,
    deleteSymptom,
    getSymptomById,
    
    // Treatments
    treatments,
    fetchTreatments,
    addTreatment,
    
    // Doctor Visits
    doctorVisits,
    fetchDoctorVisits,
    addDoctorVisit,
    
    // Relationships
    linkSymptomToTreatment,
    
    // Utility
    refetch: fetchSymptoms,
  };
}