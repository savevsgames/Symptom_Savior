import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Camera, MapPin } from 'lucide-react-native';
import { BaseButton, BaseTextInput, BaseCard } from '@/components/ui';
import { theme } from '@/lib/theme';

export default function AddSymptom() {
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState(1);
  const [description, setDescription] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [newTrigger, setNewTrigger] = useState('');

  const commonSymptoms = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Joint Pain',
    'Muscle Pain', 'Fever', 'Cough', 'Shortness of Breath',
    'Chest Pain', 'Abdominal Pain', 'Back Pain', 'Anxiety', 'Insomnia'
  ];

  const commonTriggers = [
    'Stress', 'Weather', 'Food', 'Exercise', 'Lack of Sleep',
    'Screen Time', 'Loud Noises', 'Bright Lights', 'Medication'
  ];

  const severityLabels = ['Minimal', 'Mild', 'Moderate', 'Severe', 'Very Severe'];
  const severityColors = [
    theme.colors.success[500],
    theme.colors.success[400],
    theme.colors.warning[500],
    theme.colors.error[500],
    theme.colors.error[600]
  ];

  const addTrigger = (trigger: string) => {
    if (trigger && !triggers.includes(trigger)) {
      setTriggers([...triggers, trigger]);
      setNewTrigger('');
    }
  };

  const removeTrigger = (triggerToRemove: string) => {
    setTriggers(triggers.filter(trigger => trigger !== triggerToRemove));
  };

  const handleSave = () => {
    const symptomName = selectedSymptom || customSymptom;
    
    if (!symptomName.trim()) {
      Alert.alert('Missing Information', 'Please select or enter a symptom name.');
      return;
    }

    Alert.alert(
      'Symptom Logged',
      `Your ${symptomName.toLowerCase()} has been recorded successfully.`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log New Symptom</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Symptom Selection */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>What symptom are you experiencing?</Text>
          <View style={styles.symptomGrid}>
            {commonSymptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={[
                  styles.symptomChip,
                  selectedSymptom === symptom && styles.symptomChipSelected
                ]}
                onPress={() => {
                  setSelectedSymptom(symptom);
                  setCustomSymptom('');
                }}
              >
                <Text style={[
                  styles.symptomChipText,
                  selectedSymptom === symptom && styles.symptomChipTextSelected
                ]}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.orText}>or enter a custom symptom:</Text>
          <BaseTextInput
            placeholder="Enter symptom name..."
            value={customSymptom}
            onChangeText={(text) => {
              setCustomSymptom(text);
              if (text) setSelectedSymptom('');
            }}
          />
        </BaseCard>

        {/* Severity Selection */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>How severe is this symptom?</Text>
          <View style={styles.severityContainer}>
            {severityLabels.map((label, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.severityButton,
                  severity === index + 1 && { backgroundColor: severityColors[index] }
                ]}
                onPress={() => setSeverity(index + 1)}
              >
                <Text style={[
                  styles.severityNumber,
                  severity === index + 1 && { color: theme.colors.text.inverse }
                ]}>
                  {index + 1}
                </Text>
                <Text style={[
                  styles.severityLabel,
                  severity === index + 1 && { color: theme.colors.text.inverse }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BaseCard>

        {/* Description */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          <BaseTextInput
            placeholder="Describe the symptom in more detail (location, duration, quality, etc.)"
            value={description}
            onChangeText={setDescription}
            multiline
            style={styles.descriptionInput}
          />
        </BaseCard>

        {/* Triggers */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Possible Triggers (Optional)</Text>
          <View style={styles.triggerGrid}>
            {commonTriggers.map((trigger) => (
              <TouchableOpacity
                key={trigger}
                style={[
                  styles.triggerChip,
                  triggers.includes(trigger) && styles.triggerChipSelected
                ]}
                onPress={() => {
                  if (triggers.includes(trigger)) {
                    removeTrigger(trigger);
                  } else {
                    addTrigger(trigger);
                  }
                }}
              >
                <Text style={[
                  styles.triggerChipText,
                  triggers.includes(trigger) && styles.triggerChipTextSelected
                ]}>
                  {trigger}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customTriggerContainer}>
            <BaseTextInput
              placeholder="Add custom trigger..."
              value={newTrigger}
              onChangeText={setNewTrigger}
              containerStyle={styles.customTriggerInput}
            />
            <BaseButton
              title=""
              onPress={() => addTrigger(newTrigger)}
              variant="outline"
              size="md"
              style={styles.addTriggerButton}
            />
          </View>

          {triggers.length > 0 && (
            <View style={styles.selectedTriggers}>
              <Text style={styles.selectedTriggersTitle}>Selected triggers:</Text>
              <View style={styles.selectedTriggersList}>
                {triggers.map((trigger, index) => (
                  <View key={index} style={styles.selectedTriggerTag}>
                    <Text style={styles.selectedTriggerText}>{trigger}</Text>
                    <TouchableOpacity onPress={() => removeTrigger(trigger)}>
                      <X size={16} color={theme.colors.text.secondary} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </BaseCard>

        {/* Additional Options */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          <View style={styles.optionsContainer}>
            <BaseButton
              title="Add Photo"
              onPress={() => {}}
              variant="outline"
              size="md"
              style={styles.optionButton}
            />
            <BaseButton
              title="Add Location"
              onPress={() => {}}
              variant="outline"
              size="md"
              style={styles.optionButton}
            />
          </View>
        </BaseCard>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <BaseButton
          title="Save Symptom"
          onPress={handleSave}
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
  
  section: {
    marginTop: theme.spacing['2xl'],
  },
  
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  
  symptomChip: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius['2xl'],
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    margin: theme.spacing.xs,
  },
  
  symptomChipSelected: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
  },
  
  symptomChipText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  symptomChipTextSelected: {
    color: theme.colors.text.inverse,
  },
  
  orText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  severityButton: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  
  severityNumber: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  severityLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  descriptionInput: {
    minHeight: 80,
  },
  
  triggerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  
  triggerChip: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    margin: theme.spacing.xs,
  },
  
  triggerChipSelected: {
    backgroundColor: theme.colors.warning[500],
    borderColor: theme.colors.warning[500],
  },
  
  triggerChipText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  
  triggerChipTextSelected: {
    color: theme.colors.text.inverse,
  },
  
  customTriggerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  
  customTriggerInput: {
    flex: 1,
    marginRight: theme.spacing.sm,
    marginBottom: 0,
  },
  
  addTriggerButton: {
    width: 48,
    height: 48,
  },
  
  selectedTriggers: {
    marginTop: theme.spacing.sm,
  },
  
  selectedTriggersTitle: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  
  selectedTriggersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  selectedTriggerTag: {
    backgroundColor: theme.colors.warning[100],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  
  selectedTriggerText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning[700],
    marginRight: theme.spacing.xs,
  },
  
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  optionButton: {
    flex: 0.48,
  },
  
  saveContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});