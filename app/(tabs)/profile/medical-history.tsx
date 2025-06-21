import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Heart, Pill, TriangleAlert as AlertTriangle } from 'lucide-react-native';
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
          <Text style={styles.sectionTitle}>
            <Heart size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Medical Conditions
          </Text>
          
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
                <Text style={styles.itemText}>{condition.condition_name}</Text>
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
          <Text style={styles.sectionTitle}>
            <Pill size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Current Medications
          </Text>
          
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
              <View key={medication.id} style={styles.itemTag}>
                <Text style={styles.itemText}>{medication.medication_name}</Text>
                <TouchableOpacity 
                  onPress={() => handleDeleteMedication(medication.id, medication.medication_name)}
                  style={styles.deleteButton}
                >
                  <X size={16} color={theme.colors.text.secondary} strokeWidth={2} />
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
          <Text style={styles.sectionTitle}>
            <AlertTriangle size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Allergies
          </Text>
          
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
                <Text style={[styles.itemText, styles.allergyText]}>{allergy.allergen}</Text>
                <TouchableOpacity 
                  onPress={() => handleDeleteAllergy(allergy.id, allergy.allergen)}
                  style={styles.deleteButton}
                >
                  <X size={16} color={theme.colors.error[600]} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
            {allergies.length === 0 && (
              <Text style={styles.emptyText}>No allergies added yet</Text>
            )}
          </View>
        </BaseCard>

        {/* Important Note */}
        <BaseCard style={[styles.section, styles.noteCard]}>
          <Text style={styles.noteTitle}>Important Note</Text>
          <Text style={styles.noteText}>
            This information helps provide better health guidance and is especially important for emergency situations. 
            Always consult with your healthcare provider for medical decisions.
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
  
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  itemTag: {
    backgroundColor: theme.colors.primary[50],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  
  allergyTag: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
  },
  
  itemText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    marginRight: theme.spacing.xs,
  },
  
  allergyText: {
    color: theme.colors.error[700],
  },
  
  deleteButton: {
    padding: theme.spacing.xs,
  },
  
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
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