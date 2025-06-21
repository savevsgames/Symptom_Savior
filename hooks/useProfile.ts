/**
 * Profile Hook
 * Manages user medical profile data operations
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export interface UserMedicalProfile {
  id: string;
  user_id: string;
  full_name?: string;
  date_of_birth?: string;
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'other';
  blood_group?: 'A+' | 'A‑' | 'B+' | 'B‑' | 'AB+' | 'AB‑' | 'O+' | 'O‑' | 'unknown';
  height_cm?: number;
  weight_kg?: number;
  emergency_contact?: any;
  medications?: string[];
  chronic_conditions?: string[];
  allergies?: string[];
  preferred_language?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileCondition {
  id: string;
  user_id: string;
  profile_id: string;
  condition_name: string;
  diagnosed_on?: string;
  resolved_on?: string;
  severity?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileMedication {
  id: string;
  user_id: string;
  profile_id: string;
  medication_name: string;
  dose?: string;
  frequency?: string;
  started_on?: string;
  stopped_on?: string;
  prescribing_doctor?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileAllergy {
  id: string;
  user_id: string;
  profile_id: string;
  allergen: string;
  reaction?: string;
  severity?: number;
  discovered_on?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateProfileData {
  full_name?: string;
  date_of_birth?: string;
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'other';
  blood_group?: 'A+' | 'A‑' | 'B+' | 'B‑' | 'AB+' | 'AB‑' | 'O+' | 'O‑' | 'unknown';
  height_cm?: number;
  weight_kg?: number;
  emergency_contact?: any;
  medications?: string[];
  chronic_conditions?: string[];
  allergies?: string[];
  preferred_language?: string;
}

interface CreateConditionData {
  condition_name: string;
  diagnosed_on?: string;
  resolved_on?: string;
  severity?: number;
  notes?: string;
}

interface CreateMedicationData {
  medication_name: string;
  dose?: string;
  frequency?: string;
  started_on?: string;
  stopped_on?: string;
  prescribing_doctor?: string;
  notes?: string;
}

interface CreateAllergyData {
  allergen: string;
  reaction?: string;
  severity?: number;
  discovered_on?: string;
  notes?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<UserMedicalProfile | null>(null);
  const [conditions, setConditions] = useState<ProfileCondition[]>([]);
  const [medications, setMedications] = useState<ProfileMedication[]>([]);
  const [allergies, setAllergies] = useState<ProfileAllergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_medical_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      setProfile(data || null);
      logger.debug('Profile fetched successfully', { hasProfile: !!data });
    } catch (err) {
      logger.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchConditions = async () => {
    if (!user || !profile) {
      setConditions([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profile_conditions')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setConditions(data || []);
      logger.debug('Conditions fetched successfully', { count: data?.length || 0 });
    } catch (err) {
      logger.error('Error fetching conditions:', err);
    }
  };

  const fetchMedications = async () => {
    if (!user || !profile) {
      setMedications([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profile_medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setMedications(data || []);
      logger.debug('Medications fetched successfully', { count: data?.length || 0 });
    } catch (err) {
      logger.error('Error fetching medications:', err);
    }
  };

  const fetchAllergies = async () => {
    if (!user || !profile) {
      setAllergies([]);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('profile_allergies')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAllergies(data || []);
      logger.debug('Allergies fetched successfully', { count: data?.length || 0 });
    } catch (err) {
      logger.error('Error fetching allergies:', err);
    }
  };

  const createOrUpdateProfile = async (profileData: CreateProfileData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error: upsertError } = await supabase
        .from('user_medical_profiles')
        .upsert({
          user_id: user.id,
          ...profileData,
        })
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      logger.info('Profile saved successfully');
      
      // Refresh profile
      await fetchProfile();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error saving profile:', err);
      return { data: null, error: err };
    }
  };

  const addCondition = async (conditionData: CreateConditionData) => {
    if (!user || !profile) {
      throw new Error('User not authenticated or profile not found');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('profile_conditions')
        .insert({
          user_id: user.id,
          profile_id: profile.id,
          ...conditionData,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      logger.info('Condition added successfully', { condition: conditionData.condition_name });
      
      // Refresh conditions
      await fetchConditions();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error adding condition:', err);
      return { data: null, error: err };
    }
  };

  const addMedication = async (medicationData: CreateMedicationData) => {
    if (!user || !profile) {
      throw new Error('User not authenticated or profile not found');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('profile_medications')
        .insert({
          user_id: user.id,
          profile_id: profile.id,
          ...medicationData,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      logger.info('Medication added successfully', { medication: medicationData.medication_name });
      
      // Refresh medications
      await fetchMedications();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error adding medication:', err);
      return { data: null, error: err };
    }
  };

  const addAllergy = async (allergyData: CreateAllergyData) => {
    if (!user || !profile) {
      throw new Error('User not authenticated or profile not found');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('profile_allergies')
        .insert({
          user_id: user.id,
          profile_id: profile.id,
          ...allergyData,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      logger.info('Allergy added successfully', { allergen: allergyData.allergen });
      
      // Refresh allergies
      await fetchAllergies();
      
      return { data, error: null };
    } catch (err) {
      logger.error('Error adding allergy:', err);
      return { data: null, error: err };
    }
  };

  const deleteCondition = async (conditionId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('profile_conditions')
        .delete()
        .eq('id', conditionId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info('Condition deleted successfully', { conditionId });
      
      // Refresh conditions
      await fetchConditions();
      
      return { error: null };
    } catch (err) {
      logger.error('Error deleting condition:', err);
      return { error: err };
    }
  };

  const deleteMedication = async (medicationId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('profile_medications')
        .delete()
        .eq('id', medicationId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info('Medication deleted successfully', { medicationId });
      
      // Refresh medications
      await fetchMedications();
      
      return { error: null };
    } catch (err) {
      logger.error('Error deleting medication:', err);
      return { error: err };
    }
  };

  const deleteAllergy = async (allergyId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error: deleteError } = await supabase
        .from('profile_allergies')
        .delete()
        .eq('id', allergyId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      logger.info('Allergy deleted successfully', { allergyId });
      
      // Refresh allergies
      await fetchAllergies();
      
      return { error: null };
    } catch (err) {
      logger.error('Error deleting allergy:', err);
      return { error: err };
    }
  };

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.full_name,
      profile.date_of_birth,
      profile.gender,
      profile.height_cm,
      profile.weight_kg,
    ];
    
    const completedFields = fields.filter(field => field !== null && field !== undefined && field !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchConditions();
      fetchMedications();
      fetchAllergies();
    }
  }, [profile]);

  return {
    // Profile data
    profile,
    conditions,
    medications,
    allergies,
    loading,
    error,
    
    // Profile operations
    fetchProfile,
    createOrUpdateProfile,
    
    // Conditions operations
    fetchConditions,
    addCondition,
    deleteCondition,
    
    // Medications operations
    fetchMedications,
    addMedication,
    deleteMedication,
    
    // Allergies operations
    fetchAllergies,
    addAllergy,
    deleteAllergy,
    
    // Utility
    getProfileCompletionPercentage,
    refetch: fetchProfile,
  };
}