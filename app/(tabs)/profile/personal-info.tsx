import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Calendar, Ruler, Weight, Droplet } from 'lucide-react-native';
import { BaseButton, BaseTextInput, BaseCard } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { theme } from '@/lib/theme';

export default function PersonalInfo() {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'other' | ''>('');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A‑' | 'B+' | 'B‑' | 'AB+' | 'AB‑' | 'O+' | 'O‑' | 'unknown' | ''>('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { profile, createOrUpdateProfile, loading } = useProfile();

  const genderOptions = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'non_binary', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    { value: 'other', label: 'Other' },
  ];

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A‑', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B‑', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB‑', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O‑', label: 'O-' },
    { value: 'unknown', label: 'Unknown' },
  ];

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDateOfBirth(profile.date_of_birth || '');
      setGender(profile.gender || '');
      setBloodGroup(profile.blood_group || '');
      setHeightCm(profile.height_cm?.toString() || '');
      setWeightKg(profile.weight_kg?.toString() || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const profileData = {
        full_name: fullName.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender: gender || undefined,
        blood_group: bloodGroup || undefined,
        height_cm: heightCm ? parseFloat(heightCm) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
      };

      const { error } = await createOrUpdateProfile(profileData);

      if (error) {
        Alert.alert('Error', 'Failed to save personal information. Please try again.');
        return;
      }

      Alert.alert(
        'Profile Updated',
        'Your personal information has been saved successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateAge = () => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = () => {
    if (!heightCm || !weightKg) return null;
    const height = parseFloat(heightCm) / 100; // Convert cm to meters
    const weight = parseFloat(weightKg);
    const bmi = weight / (height * height);
    return bmi.toFixed(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            <User size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Basic Information
          </Text>
          
          <BaseTextInput
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
          />

          <BaseTextInput
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            leftIcon={<Calendar size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />

          {calculateAge() && (
            <View style={styles.calculatedValue}>
              <Text style={styles.calculatedLabel}>Age: </Text>
              <Text style={styles.calculatedText}>{calculateAge()} years old</Text>
            </View>
          )}
        </BaseCard>

        {/* Gender Selection */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.optionsGrid}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  gender === option.value && styles.optionCardSelected
                ]}
                onPress={() => setGender(option.value as any)}
              >
                <Text style={[
                  styles.optionText,
                  gender === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BaseCard>

        {/* Physical Measurements */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Measurements</Text>
          
          <BaseTextInput
            label="Height (cm)"
            placeholder="170"
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="numeric"
            leftIcon={<Ruler size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />

          <BaseTextInput
            label="Weight (kg)"
            placeholder="70"
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="numeric"
            leftIcon={<Weight size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />

          {calculateBMI() && (
            <View style={styles.calculatedValue}>
              <Text style={styles.calculatedLabel}>BMI: </Text>
              <Text style={styles.calculatedText}>{calculateBMI()}</Text>
            </View>
          )}
        </BaseCard>

        {/* Blood Group */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Droplet size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Blood Group
          </Text>
          <View style={styles.bloodGroupGrid}>
            {bloodGroupOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.bloodGroupCard,
                  bloodGroup === option.value && styles.bloodGroupCardSelected
                ]}
                onPress={() => setBloodGroup(option.value as any)}
              >
                <Text style={[
                  styles.bloodGroupText,
                  bloodGroup === option.value && styles.bloodGroupTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BaseCard>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <BaseButton
          title="Save Personal Information"
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
  
  calculatedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  
  calculatedLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  calculatedText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
  },
  
  optionsGrid: {
    gap: theme.spacing.sm,
  },
  
  optionCard: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  
  optionCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  
  optionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  
  optionTextSelected: {
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.primary[600],
  },
  
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  bloodGroupCard: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    minWidth: 60,
  },
  
  bloodGroupCardSelected: {
    borderColor: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
  },
  
  bloodGroupText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  
  bloodGroupTextSelected: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.error[600],
  },
  
  saveContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});