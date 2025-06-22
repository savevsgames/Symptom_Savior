import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Heart, Pill, TriangleAlert as AlertTriangle, Calendar, User } from 'lucide-react-native';
import { BaseButton, BaseTextInput, BaseCard } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { theme } from '@/lib/theme';

export default function MedicalHistory() {
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [saving, setSaving] = useState(false);
  
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
    loading 
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
                  {condition.diagnosed_on && (
                    <View style={styles.itemMeta}>
                      <Calendar size={12} color={theme.colors.text.tertiary} strokeWidth={2} />
                      <Text style={styles.itemMetaText}>
                        {new Date(condition.diagnosed_on).getFullYear()}
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
        </BaseCard>

        {/* Current Medications */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pill size={20} color={theme.colors.primary[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Current Medications</Text>
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
        </BaseCard>

        {/* Allergies */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle size={20} color={theme.colors.warning[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Allergies</Text>
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