import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Heart, Pill, TriangleAlert as AlertTriangle, Calendar, User, FileText } from 'lucide-react-native';
import { BaseButton, BaseTextInput, BaseCard } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export default function MedicalHistory() {
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState<{
    conditions: boolean;
    medications: boolean;
    allergies: boolean;
    familyHistory: boolean;
  }>({
    conditions: false,
    medications: false,
    allergies: false,
    familyHistory: false
  });
  
  const { 
    profile, 
    conditions, 
    medications, 
    allergies, 
    addCondition, 
    addMedication, 
    addAllergy,
    deleteCondition,
    deleteMedication,
    deleteAllergy,
    loading,
    fetchProfile
  } = useProfile();

  const commonConditions = [
    'Diabetes', 'Hypertension', 'Asthma', 'Arthritis', 'Depression',
    'Anxiety', 'High Cholesterol', 'Heart Disease', 'Migraine', 'GERD'
  ];

  const commonMedications = [
    'Ibuprofen', 'Acetaminophen', 'Aspirin', 'Metformin', 'Lisinopril',
    'Atorvastatin', 'Omeprazole', 'Sertraline', 'Metoprolol', 'Amlodipine'
  ];

  const commonAllergies = [
    'Peanuts', 'Shellfish', 'Penicillin', 'Latex', 'Pollen',
    'Dust Mites', 'Pet Dander', 'Eggs', 'Milk', 'Soy'
  ];

  useEffect(() => {
    if (profile) {
      setFamilyHistory(profile.family_history || '');
    }
  }, [profile]);

  const handleAddCondition = async () => {
    if (!newCondition.trim()) return;

    try {
      const { error } = await addCondition({
        condition_name: newCondition.trim(),
      });

      if (error) {
        Alert.alert('Error', 'Failed to add condition. Please try again.');
        return;
      }

      setNewCondition('');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleAddMedication = async () => {
    if (!newMedication.trim()) return;

    try {
      const { error } = await addMedication({
        medication_name: newMedication.trim(),
      });

      if (error) {
        Alert.alert('Error', 'Failed to add medication. Please try again.');
        return;
      }

      setNewMedication('');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;

    try {
      const { error } = await addAllergy({
        allergen: newAllergy.trim(),
      });

      if (error) {
        Alert.alert('Error', 'Failed to add allergy. Please try again.');
        return;
      }

      setNewAllergy('');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleSaveFamilyHistory = async () => {
    if (!profile) return;

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('user_medical_profiles')
        .update({ family_history: familyHistory.trim() || null })
        .eq('id', profile.id);

      if (error) {
        Alert.alert('Error', 'Failed to save family history. Please try again.');
        return;
      }

      Alert.alert('Success', 'Family history saved successfully.');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCondition = async (conditionId: string, conditionName: string) => {
    Alert.alert(
      'Delete Condition',
      `Are you sure you want to remove "${conditionName}" from your medical history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteCondition(conditionId);
            if (error) {
              Alert.alert('Error', 'Failed to delete condition. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteMedication = async (medicationId: string, medicationName: string) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to remove "${medicationName}" from your medication list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteMedication(medicationId);
            if (error) {
              Alert.alert('Error', 'Failed to delete medication. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllergy = async (allergyId: string, allergen: string) => {
    Alert.alert(
      'Delete Allergy',
      `Are you sure you want to remove "${allergen}" from your allergy list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAllergy(allergyId);
            if (error) {
              Alert.alert('Error', 'Failed to delete allergy. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleQuickAdd = (type: 'condition' | 'medication' | 'allergy', item: string) => {
    switch (type) {
      case 'condition':
        setNewCondition(item);
        break;
      case 'medication':
        setNewMedication(item);
        break;
      case 'allergy':
        setNewAllergy(item);
        break;
    }
  };

  const handleSummarizeConditions = async () => {
    if (!profile || conditions.length === 0) {
      Alert.alert('No Data', 'Please add some medical conditions before generating a summary.');
      return;
    }

    try {
      setSummarizing(prev => ({ ...prev, conditions: true }));

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Call the summarize-conditions API
      const response = await fetch('/api/profile/summarize-conditions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize conditions');
      }

      const data = await response.json();
      
      // Refresh profile to get updated summary
      await fetchProfile();
      
      Alert.alert('Success', 'Conditions summary generated successfully.');
    } catch (error) {
      logger.error('Failed to summarize conditions', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      Alert.alert('Error', 'Failed to generate conditions summary. Please try again.');
    } finally {
      setSummarizing(prev => ({ ...prev, conditions: false }));
    }
  };

  const handleSummarizeMedications = async () => {
    if (!profile || medications.length === 0) {
      Alert.alert('No Data', 'Please add some medications before generating a summary.');
      return;
    }

    try {
      setSummarizing(prev => ({ ...prev, medications: true }));

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Call the summarize-medications API
      const response = await fetch('/api/profile/summarize-medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize medications');
      }

      const data = await response.json();
      
      // Refresh profile to get updated summary
      await fetchProfile();
      
      Alert.alert('Success', 'Medications summary generated successfully.');
    } catch (error) {
      logger.error('Failed to summarize medications', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      Alert.alert('Error', 'Failed to generate medications summary. Please try again.');
    } finally {
      setSummarizing(prev => ({ ...prev, medications: false }));
    }
  };

  const handleSummarizeAllergies = async () => {
    if (!profile || allergies.length === 0) {
      Alert.alert('No Data', 'Please add some allergies before generating a summary.');
      return;
    }

    try {
      setSummarizing(prev => ({ ...prev, allergies: true }));

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Call the summarize-allergies API
      const response = await fetch('/api/profile/summarize-allergies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize allergies');
      }

      const data = await response.json();
      
      // Refresh profile to get updated summary
      await fetchProfile();
      
      Alert.alert('Success', 'Allergies summary generated successfully.');
    } catch (error) {
      logger.error('Failed to summarize allergies', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      Alert.alert('Error', 'Failed to generate allergies summary. Please try again.');
    } finally {
      setSummarizing(prev => ({ ...prev, allergies: false }));
    }
  };

  const handleSummarizeFamilyHistory = async () => {
    if (!profile || !familyHistory.trim()) {
      Alert.alert('No Data', 'Please enter family history information before generating a summary.');
      return;
    }

    try {
      setSummarizing(prev => ({ ...prev, familyHistory: true }));

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Call the summarize-family-history API
      const response = await fetch('/api/profile/summarize-family-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          familyHistoryText: familyHistory.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to summarize family history');
      }

      const data = await response.json();
      
      // Update local state with the summarized text
      setFamilyHistory(data.summary);
      
      // Refresh profile to get updated summary
      await fetchProfile();
      
      Alert.alert('Success', 'Family history summarized successfully.');
    } catch (error) {
      logger.error('Failed to summarize family history', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      
      Alert.alert('Error', 'Failed to summarize family history. Please try again.');
    } finally {
      setSummarizing(prev => ({ ...prev, familyHistory: false }));
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical History</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.noProfileContainer}>
          <Text style={styles.noProfileText}>Please complete your personal information first.</Text>
          <BaseButton
            title="Go to Personal Info"
            onPress={() => router.push('/(tabs)/profile/personal-info')}
            variant="primary"
            size="md"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Medical Conditions */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Heart size={20} color={theme.colors.error[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Medical Conditions</Text>
            <BaseButton
              title={summarizing.conditions ? "Summarizing..." : "Generate Summary"}
              onPress={handleSummarizeConditions}
              variant="outline"
              size="sm"
              disabled={summarizing.conditions || conditions.length === 0}
              loading={summarizing.conditions}
              style={styles.summarizeButton}
            />
          </View>
          
          {/* Quick Add Buttons */}
          <View style={styles.quickAddContainer}>
            <Text style={styles.quickAddLabel}>Common conditions:</Text>
            <View style={styles.quickAddGrid}>
              {commonConditions.slice(0, 6).map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={styles.quickAddChip}
                  onPress={() => handleQuickAdd('condition', condition)}
                >
                  <Plus size={12} color={theme.colors.primary[600]} strokeWidth={2} />
                  <Text style={styles.quickAddText}>{condition}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.addItemContainer}>
            <BaseTextInput
              placeholder="Add a medical condition..."
              value={newCondition}
              onChangeText={setNewCondition}
              containerStyle={styles.addItemInput}
              onSubmitEditing={handleAddCondition}
            />
            <BaseButton
              title="Add"
              onPress={handleAddCondition}
              variant="outline"
              size="md"
              style={styles.addButton}
              disabled={!newCondition.trim()}
            />
          </View>

          <View style={styles.itemsList}>
            {conditions.map((condition) => (
              <View key={condition.id} style={styles.itemTag}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemText}>{condition.condition_name}</Text>
                  {condition.diagnosed_at && (
                    <View style={styles.itemMeta}>
                      <Calendar size={12} color={theme.colors.text.tertiary} strokeWidth={2} />
                      <Text style={styles.itemMetaText}>
                        {new Date(condition.diagnosed_at).getFullYear()}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => handleDeleteCondition(condition.id, condition.condition_name)}
                  style={styles.deleteButton}
                >
                  <X size={16} color={theme.colors.text.secondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
            {conditions.length === 0 && (
              <Text style={styles.emptyText}>No medical conditions added yet</Text>
            )}
          </View>

          {/* Conditions Summary */}
          {profile.conditions_summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryLabel}>AI-Generated Summary:</Text>
              <Text style={styles.summaryText}>{profile.conditions_summary}</Text>
            </View>
          )}
        </BaseCard>

        {/* Current Medications */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pill size={20} color={theme.colors.primary[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Current Medications</Text>
            <BaseButton
              title={summarizing.medications ? "Summarizing..." : "Generate Summary"}
              onPress={handleSummarizeMedications}
              variant="outline"
              size="sm"
              disabled={summarizing.medications || medications.length === 0}
              loading={summarizing.medications}
              style={styles.summarizeButton}
            />
          </View>
          
          {/* Quick Add Buttons */}
          <View style={styles.quickAddContainer}>
            <Text style={styles.quickAddLabel}>Common medications:</Text>
            <View style={styles.quickAddGrid}>
              {commonMedications.slice(0, 6).map((medication) => (
                <TouchableOpacity
                  key={medication}
                  style={styles.quickAddChip}
                  onPress={() => handleQuickAdd('medication', medication)}
                >
                  <Plus size={12} color={theme.colors.primary[600]} strokeWidth={2} />
                  <Text style={styles.quickAddText}>{medication}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.addItemContainer}>
            <BaseTextInput
              placeholder="Add a medication..."
              value={newMedication}
              onChangeText={setNewMedication}
              containerStyle={styles.addItemInput}
              onSubmitEditing={handleAddMedication}
            />
            <BaseButton
              title="Add"
              onPress={handleAddMedication}
              variant="outline"
              size="md"
              style={styles.addButton}
              disabled={!newMedication.trim()}
            />
          </View>

          <View style={styles.itemsList}>
            {medications.map((medication) => (
              <View key={medication.id} style={[styles.itemTag, styles.medicationTag]}>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemText, styles.medicationText]}>{medication.medication_name}</Text>
                  {medication.dose && (
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemMetaText}>{medication.dose}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => handleDeleteMedication(medication.id, medication.medication_name)}
                  style={styles.deleteButton}
                >
                  <X size={16} color={theme.colors.primary[600]} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
            {medications.length === 0 && (
              <Text style={styles.emptyText}>No medications added yet</Text>
            )}
          </View>

          {/* Medications Summary */}
          {profile.medications_summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryLabel}>AI-Generated Summary:</Text>
              <Text style={styles.summaryText}>{profile.medications_summary}</Text>
            </View>
          )}
        </BaseCard>

        {/* Allergies */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={theme.colors.warning[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Allergies</Text>
            <BaseButton
              title={summarizing.allergies ? "Summarizing..." : "Generate Summary"}
              onPress={handleSummarizeAllergies}
              variant="outline"
              size="sm"
              disabled={summarizing.allergies || allergies.length === 0}
              loading={summarizing.allergies}
              style={styles.summarizeButton}
            />
          </View>
          
          {/* Quick Add Buttons */}
          <View style={styles.quickAddContainer}>
            <Text style={styles.quickAddLabel}>Common allergies:</Text>
            <View style={styles.quickAddGrid}>
              {commonAllergies.slice(0, 6).map((allergy) => (
                <TouchableOpacity
                  key={allergy}
                  style={styles.quickAddChip}
                  onPress={() => handleQuickAdd('allergy', allergy)}
                >
                  <Plus size={12} color={theme.colors.primary[600]} strokeWidth={2} />
                  <Text style={styles.quickAddText}>{allergy}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.addItemContainer}>
            <BaseTextInput
              placeholder="Add an allergy..."
              value={newAllergy}
              onChangeText={setNewAllergy}
              containerStyle={styles.addItemInput}
              onSubmitEditing={handleAddAllergy}
            />
            <BaseButton
              title="Add"
              onPress={handleAddAllergy}
              variant="outline"
              size="md"
              style={styles.addButton}
              disabled={!newAllergy.trim()}
            />
          </View>

          <View style={styles.itemsList}>
            {allergies.map((allergy) => (
              <View key={allergy.id} style={[styles.itemTag, styles.allergyTag]}>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemText, styles.allergyText]}>{allergy.allergen}</Text>
                  {allergy.reaction && (
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemMetaText}>{allergy.reaction}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={() => handleDeleteAllergy(allergy.id, allergy.allergen)}
                  style={styles.deleteButton}
                >
                  <X size={16} color={theme.colors.warning[600]} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
            {allergies.length === 0 && (
              <Text style={styles.emptyText}>No allergies added yet</Text>
            )}
          </View>

          {/* Allergies Summary */}
          {profile.allergies_summary && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryLabel}>AI-Generated Summary:</Text>
              <Text style={styles.summaryText}>{profile.allergies_summary}</Text>
            </View>
          )}
        </BaseCard>

        {/* Family History */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={theme.colors.secondary[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Family Medical History</Text>
            <BaseButton
              title={summarizing.familyHistory ? "Summarizing..." : "Summarize"}
              onPress={handleSummarizeFamilyHistory}
              variant="outline"
              size="sm"
              disabled={summarizing.familyHistory || !familyHistory.trim()}
              loading={summarizing.familyHistory}
              style={styles.summarizeButton}
            />
          </View>
          
          <Text style={styles.familyHistoryLabel}>
            Enter information about family medical conditions, hereditary diseases, or relevant health history:
          </Text>
          
          <BaseTextInput
            placeholder="Example: Mother has diabetes, father had heart disease, maternal grandmother had breast cancer..."
            value={familyHistory}
            onChangeText={setFamilyHistory}
            multiline
            style={styles.familyHistoryInput}
          />
          
          <BaseButton
            title={saving ? "Saving..." : "Save Family History"}
            onPress={handleSaveFamilyHistory}
            variant="outline"
            size="md"
            disabled={saving}
            loading={saving}
            style={styles.saveButton}
          />
        </BaseCard>

        {/* Medical Summary */}
        {(conditions.length > 0 || medications.length > 0 || allergies.length > 0) && (
          <BaseCard style={[styles.section, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>Medical History Summary</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Heart size={16} color={theme.colors.error[500]} strokeWidth={2} />
                <Text style={styles.summaryStatNumber}>{conditions.length}</Text>
                <Text style={styles.summaryStatLabel}>Conditions</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Pill size={16} color={theme.colors.primary[500]} strokeWidth={2} />
                <Text style={styles.summaryStatNumber}>{medications.length}</Text>
                <Text style={styles.summaryStatLabel}>Medications</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <AlertTriangle size={16} color={theme.colors.warning[500]} strokeWidth={2} />
                <Text style={styles.summaryStatNumber}>{allergies.length}</Text>
                <Text style={styles.summaryStatLabel}>Allergies</Text>
              </View>
            </View>
          </BaseCard>
        )}

        {/* Important Note */}
        <BaseCard style={[styles.section, styles.noteCard]}>
          <Text style={styles.noteTitle}>Important Note</Text>
          <Text style={styles.noteText}>
            This information helps provide better health guidance and is especially important for emergency situations. 
            Always consult with your healthcare provider for medical decisions and keep this information up to date.
          </Text>
        </BaseCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  
  backButton: {
    padding: theme.spacing.sm,
  },
  
  headerTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  headerSpacer: {
    width: 40,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
  },
  
  section: {
    marginTop: theme.spacing['2xl'],
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  
  summarizeButton: {
    marginLeft: theme.spacing.sm,
  },
  
  quickAddContainer: {
    marginBottom: theme.spacing.lg,
  },
  
  quickAddLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  
  quickAddGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  
  quickAddText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
    marginLeft: theme.spacing.xs,
  },
  
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  
  addItemInput: {
    flex: 1,
    marginRight: theme.spacing.sm,
    marginBottom: 0,
  },
  
  addButton: {
    height: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  
  itemsList: {
    gap: theme.spacing.sm,
  },
  
  itemTag: {
    backgroundColor: theme.colors.error[50],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error[200],
  },
  
  medicationTag: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  
  allergyTag: {
    backgroundColor: theme.colors.warning[50],
    borderColor: theme.colors.warning[200],
  },
  
  itemContent: {
    flex: 1,
  },
  
  itemText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error[700],
  },
  
  medicationText: {
    color: theme.colors.primary[700],
  },
  
  allergyText: {
    color: theme.colors.warning[700],
  },
  
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  
  itemMetaText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
  },
  
  deleteButton: {
    padding: theme.spacing.xs,
  },
  
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  
  summaryContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[500],
  },
  
  summaryLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  summaryText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  
  familyHistoryLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  
  familyHistoryInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  
  saveButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-end',
  },
  
  summaryCard: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  
  summaryTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  summaryStatItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  
  summaryStatNumber: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  
  summaryStatLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  
  noteCard: {
    backgroundColor: theme.colors.warning[50],
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
  },
  
  noteTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning[700],
    marginBottom: theme.spacing.sm,
  },
  
  noteText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning[700],
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
  },
  
  noProfileText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});