import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Clock, MapPin } from 'lucide-react-native';
import { BaseButton, BaseTextInput, BaseCard } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

export default function AddSymptom() {
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState(1);
  const [description, setDescription] = useState('');
  const [triggers, setTriggers] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { addSymptom } = useSymptoms();

  const commonSymptoms = [
    'Headache', 'Fatigue', 'Nausea', 'Dizziness', 'Joint Pain',
    'Muscle Pain', 'Fever', 'Cough', 'Shortness of Breath',
    'Chest Pain', 'Abdominal Pain', 'Back Pain', 'Anxiety', 'Insomnia'
  ];

  const commonTriggers = [
    'Stress', 'Weather', 'Food', 'Exercise', 'Lack of Sleep',
    'Screen Time', 'Loud Noises', 'Bright Lights', 'Medication'
  ];

  const commonLocations = [
    'Head', 'Neck', 'Chest', 'Back', 'Abdomen', 'Arms', 'Legs', 'Joints'
  ];

  const severityLabels = ['Minimal', 'Mild', 'Moderate', 'Severe', 'Very Severe'];
  const severityColors = [
    theme.colors.success[500],
    theme.colors.success[400],
    theme.colors.warning[500],
    theme.colors.error[500],
    theme.colors.error[600]
  ];

  const handleSave = async () => {
    const symptomName = selectedSymptom || customSymptom;
    
    if (!symptomName.trim()) {
      Alert.alert('Missing Information', 'Please select or enter a symptom name.');
      return;
    }

    if (severity < 1 || severity > 10) {
      Alert.alert('Invalid Severity', 'Please select a severity level between 1 and 10.');
      return;
    }

    setSaving(true);
    
    try {
      const symptomData = {
        symptom_name: symptomName.trim(),
        severity,
        description: description.trim() || undefined,
        triggers: triggers.trim() || undefined,
        duration_hours: duration ? parseInt(duration) : undefined,
        location: location.trim() || undefined,
      };

      const { error } = await addSymptom(symptomData);

      if (error) {
        Alert.alert('Error', 'Failed to save symptom. Please try again.');
        return;
      }

      Alert.alert(
        'Symptom Logged',
        `Your ${symptomName.toLowerCase()} has been recorded successfully.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.sectionTitle}>How severe is this symptom? (1-10)</Text>
          <View style={styles.severityContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityButton,
                  severity === level && { 
                    backgroundColor: level <= 2 ? severityColors[0] :
                                   level <= 4 ? severityColors[1] :
                                   level <= 6 ? severityColors[2] :
                                   level <= 8 ? severityColors[3] : severityColors[4]
                  }
                ]}
                onPress={() => setSeverity(level)}
              >
                <Text style={[
                  styles.severityNumber,
                  severity === level && { color: theme.colors.text.inverse }
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.severityHint}>
            {severity <= 2 ? 'Minimal - barely noticeable' :
             severity <= 4 ? 'Mild - noticeable but manageable' :
             severity <= 6 ? 'Moderate - interferes with activities' :
             severity <= 8 ? 'Severe - difficult to ignore' :
             'Very Severe - overwhelming'}
          </Text>
        </BaseCard>

        {/* Location */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MapPin size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Where is the symptom located? (Optional)
          </Text>
          <View style={styles.locationGrid}>
            {commonLocations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.locationChip,
                  location === loc && styles.locationChipSelected
                ]}
                onPress={() => setLocation(location === loc ? '' : loc)}
              >
                <Text style={[
                  styles.locationChipText,
                  location === loc && styles.locationChipTextSelected
                ]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <BaseTextInput
            placeholder="Or specify custom location..."
            value={location}
            onChangeText={setLocation}
          />
        </BaseCard>

        {/* Duration */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Clock size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}How long have you had this symptom? (Optional)
          </Text>
          <BaseTextInput
            placeholder="Duration in hours (e.g., 2, 24, 72)"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
        </BaseCard>

        {/* Description */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          <BaseTextInput
            placeholder="Describe the symptom in more detail (quality, pattern, what makes it better/worse, etc.)"
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
                    setTriggers(triggers.replace(trigger, '').replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim());
                  } else {
                    setTriggers(triggers ? `${triggers}, ${trigger}` : trigger);
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

          <BaseTextInput
            placeholder="Add custom triggers (comma-separated)..."
            value={triggers}
            onChangeText={setTriggers}
            containerStyle={styles.customTriggerInput}
          />
        </BaseCard>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <BaseButton
          title="Save Symptom"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  
  severityButton: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    width: '18%',
    aspectRatio: 1,
    marginBottom: theme.spacing.xs,
  },
  
  severityNumber: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  
  severityHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  
  locationChip: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    margin: theme.spacing.xs,
  },
  
  locationChipSelected: {
    backgroundColor: theme.colors.secondary[500],
    borderColor: theme.colors.secondary[500],
  },
  
  locationChipText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  locationChipTextSelected: {
    color: theme.colors.text.inverse,
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
  
  customTriggerInput: {
    marginBottom: 0,
  },
  
  saveContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});