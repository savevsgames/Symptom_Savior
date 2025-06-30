import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Pill, Activity, Dumbbell, Brain, Plus } from 'lucide-react-native';
import { BaseButton, BaseTextInput, BaseCard } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

type TreatmentType = 'medication' | 'supplement' | 'exercise' | 'therapy' | 'other';

interface TreatmentOption {
  type: TreatmentType;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  examples: string[];
}

export default function AddTreatment() {
  const [selectedType, setSelectedType] = useState<TreatmentType | ''>('');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [doctorRecommended, setDoctorRecommended] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const { addTreatment } = useSymptoms();

  const treatmentOptions: TreatmentOption[] = [
    {
      type: 'medication',
      label: 'Medication',
      icon: Pill,
      color: theme.colors.primary[500],
      examples: ['Ibuprofen', 'Acetaminophen', 'Prescription drugs']
    },
    {
      type: 'supplement',
      label: 'Supplement',
      icon: Plus,
      color: theme.colors.success[500],
      examples: ['Vitamin D', 'Magnesium', 'Probiotics']
    },
    {
      type: 'exercise',
      label: 'Exercise',
      icon: Dumbbell,
      color: theme.colors.warning[500],
      examples: ['Walking', 'Yoga', 'Physical therapy exercises']
    },
    {
      type: 'therapy',
      label: 'Therapy',
      icon: Brain,
      color: theme.colors.secondary[500],
      examples: ['Cognitive behavioral therapy', 'Massage therapy', 'Counseling']
    },
    {
      type: 'other',
      label: 'Other',
      icon: Activity,
      color: theme.colors.neutral[500],
      examples: ['Lifestyle changes', 'Home remedies', 'Alternative treatments']
    }
  ];

  const handleSave = async () => {
    if (!selectedType) {
      Alert.alert('Missing Information', 'Please select a treatment type.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a treatment name.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    
    try {
      const treatmentData = {
        treatment_type: selectedType as TreatmentType,
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        duration: duration.trim() || undefined,
        description: description.trim() || undefined,
        doctor_recommended: doctorRecommended,
      };

      const { error } = await addTreatment(treatmentData);

      if (error) {
        Alert.alert('Error', 'Failed to save treatment. Please try again.');
        return;
      }

      // Show success state
      setSaveSuccess(true);
      
      // Show success message with a slight delay to ensure the success UI is visible
      setTimeout(() => {
        Alert.alert(
          'Treatment Added',
          `Your ${selectedType} "${name}" has been recorded successfully.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSelectedOption = () => {
    return treatmentOptions.find(option => option.type === selectedType);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Treatment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Banner - Shows only after successful save */}
        {saveSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Treatment saved successfully!</Text>
          </View>
        )}
        
        {/* Treatment Type Selection */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>What type of treatment is this?</Text>
          <View style={styles.typeGrid}>
            {treatmentOptions.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.typeCard,
                  selectedType === option.type && [
                    styles.typeCardSelected,
                    { borderColor: option.color }
                  ]
                ]}
                onPress={() => setSelectedType(option.type)}
              >
                <View style={[styles.typeIcon, { backgroundColor: option.color }]}>
                  <option.icon size={24} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text style={[
                  styles.typeLabel,
                  selectedType === option.type && styles.typeLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.typeExamples}>
                  {option.examples.slice(0, 2).join(', ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BaseCard>

        {/* Treatment Details */}
        {selectedType && (
          <BaseCard style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment Details</Text>
            
            <BaseTextInput
              label="Treatment Name"
              placeholder={`Enter ${getSelectedOption()?.label.toLowerCase()} name...`}
              value={name}
              onChangeText={setName}
            />

            {(selectedType === 'medication' || selectedType === 'supplement') && (
              <BaseTextInput
                label="Dosage"
                placeholder="e.g., 200mg, 1 tablet, 2 capsules"
                value={dosage}
                onChangeText={setDosage}
              />
            )}

            {selectedType === 'exercise' && (
              <BaseTextInput
                label="Frequency"
                placeholder="e.g., 3 times per week, daily, as needed"
                value={dosage}
                onChangeText={setDosage}
              />
            )}

            {selectedType === 'therapy' && (
              <BaseTextInput
                label="Session Details"
                placeholder="e.g., weekly sessions, 30 minutes"
                value={dosage}
                onChangeText={setDosage}
              />
            )}

            <BaseTextInput
              label="Duration"
              placeholder="e.g., 7 days, 2 weeks, ongoing"
              value={duration}
              onChangeText={setDuration}
            />

            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Additional Notes (Optional)</Text>
              <BaseTextInput
                placeholder="Any additional details about this treatment..."
                value={description}
                onChangeText={setDescription}
                multiline
                style={styles.descriptionInput}
                label=""
              />
            </View>
          </BaseCard>
        )}

        {/* Doctor Recommendation */}
        {selectedType && (
          <BaseCard style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment Source</Text>
            <View style={styles.recommendationContainer}>
              <TouchableOpacity
                style={[
                  styles.recommendationOption,
                  doctorRecommended && styles.recommendationOptionSelected
                ]}
                onPress={() => setDoctorRecommended(true)}
              >
                <View style={[
                  styles.recommendationRadio,
                  doctorRecommended && styles.recommendationRadioSelected
                ]} />
                <View style={styles.recommendationText}>
                  <Text style={styles.recommendationLabel}>Doctor Recommended</Text>
                  <Text style={styles.recommendationSubtext}>
                    Prescribed or recommended by a healthcare provider
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recommendationOption,
                  !doctorRecommended && styles.recommendationOptionSelected
                ]}
                onPress={() => setDoctorRecommended(false)}
              >
                <View style={[
                  styles.recommendationRadio,
                  !doctorRecommended && styles.recommendationRadioSelected
                ]} />
                <View style={styles.recommendationText}>
                  <Text style={styles.recommendationLabel}>Self-Initiated</Text>
                  <Text style={styles.recommendationSubtext}>
                    Started on your own or based on research
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </BaseCard>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <BaseButton
          title={saving ? "Saving Treatment..." : "Save Treatment"}
          onPress={handleSave}
          loading={saving}
          disabled={saving || !selectedType || !name.trim()}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
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
  
  successBanner: {
    backgroundColor: theme.colors.success[100],
    borderWidth: 1,
    borderColor: theme.colors.success[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  successText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.success[700],
    textAlign: 'center',
  },
  
  section: {
    marginTop: theme.spacing['2xl'],
  },
  
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.sm,
  },
  
  typeCard: {
    width: '48%',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    margin: theme.spacing.sm,
    alignItems: 'center',
  },
  
  typeCardSelected: {
    borderWidth: 2,
    backgroundColor: theme.colors.background.secondary,
  },
  
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  typeLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  
  typeLabelSelected: {
    color: theme.colors.primary[600],
  },
  
  typeExamples: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.tight * theme.typography.fontSize.xs,
  },
  
  notesContainer: {
    marginTop: theme.spacing.md,
  },
  
  notesLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  recommendationContainer: {
    gap: theme.spacing.md,
  },
  
  recommendationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
  },
  
  recommendationOptionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  
  recommendationRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    marginRight: theme.spacing.md,
  },
  
  recommendationRadioSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[500],
  },
  
  recommendationText: {
    flex: 1,
  },
  
  recommendationLabel: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  recommendationSubtext: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.xs,
  },
  
  saveContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});