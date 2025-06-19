import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Plus, X, Camera, MapPin } from 'lucide-react-native';

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
  const severityColors = ['#10B981', '#22C55E', '#F59E0B', '#EF4444', '#DC2626'];

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

    // Here you would typically save to your data store
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
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log New Symptom</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Symptom Selection */}
        <View style={styles.section}>
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
          <TextInput
            style={styles.customInput}
            placeholder="Enter symptom name..."
            value={customSymptom}
            onChangeText={(text) => {
              setCustomSymptom(text);
              if (text) setSelectedSymptom('');
            }}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Severity Selection */}
        <View style={styles.section}>
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
                  severity === index + 1 && { color: '#FFFFFF' }
                ]}>
                  {index + 1}
                </Text>
                <Text style={[
                  styles.severityLabel,
                  severity === index + 1 && { color: '#FFFFFF' }
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe the symptom in more detail (location, duration, quality, etc.)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Triggers */}
        <View style={styles.section}>
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
            <TextInput
              style={styles.customTriggerInput}
              placeholder="Add custom trigger..."
              value={newTrigger}
              onChangeText={setNewTrigger}
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity
              style={styles.addTriggerButton}
              onPress={() => addTrigger(newTrigger)}
            >
              <Plus size={20} color="#0066CC" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {triggers.length > 0 && (
            <View style={styles.selectedTriggers}>
              <Text style={styles.selectedTriggersTitle}>Selected triggers:</Text>
              <View style={styles.selectedTriggersList}>
                {triggers.map((trigger, index) => (
                  <View key={index} style={styles.selectedTriggerTag}>
                    <Text style={styles.selectedTriggerText}>{trigger}</Text>
                    <TouchableOpacity onPress={() => removeTrigger(trigger)}>
                      <X size={16} color="#64748B" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Options</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionButton}>
              <Camera size={20} color="#0066CC" strokeWidth={2} />
              <Text style={styles.optionButtonText}>Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton}>
              <MapPin size={20} color="#0066CC" strokeWidth={2} />
              <Text style={styles.optionButtonText}>Add Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Symptom</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  symptomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  symptomChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: 4,
  },
  symptomChipSelected: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  symptomChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  symptomChipTextSelected: {
    color: '#FFFFFF',
  },
  orText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 16,
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1E293B',
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  severityNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 4,
  },
  severityLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },
  descriptionInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  triggerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  triggerChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: 4,
  },
  triggerChipSelected: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  triggerChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  triggerChipTextSelected: {
    color: '#FFFFFF',
  },
  customTriggerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customTriggerInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1E293B',
    marginRight: 8,
  },
  addTriggerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0066CC',
    borderRadius: 8,
    padding: 12,
  },
  selectedTriggers: {
    marginTop: 8,
  },
  selectedTriggersTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  selectedTriggersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedTriggerTag: {
    backgroundColor: '#FEF3C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  selectedTriggerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#92400E',
    marginRight: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 0.48,
  },
  optionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 6,
  },
  saveContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});