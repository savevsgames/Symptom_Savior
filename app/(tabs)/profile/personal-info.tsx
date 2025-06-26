import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, Calendar, Ruler, Weight, Droplet, Phone } from 'lucide-react-native';
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
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { profile, createOrUpdateProfile, loading } = useProfile();

  const genderOptions = [
    { value: 'female', label: 'Female', emoji: '♀️' },
    { value: 'male', label: 'Male', emoji: '♂️' },
    { value: 'non_binary', label: 'Non-binary', emoji: '⚧️' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '🤐' },
    { value: 'other', label: 'Other', emoji: '🌈' },
  ];

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+', color: theme.colors.error[500] },
    { value: 'A‑', label: 'A-', color: theme.colors.error[400] },
    { value: 'B+', label: 'B+', color: theme.colors.warning[500] },
    { value: 'B‑', label: 'B-', color: theme.colors.warning[400] },
    { value: 'AB+', label: 'AB+', color: theme.colors.primary[500] },
    { value: 'AB‑', label: 'AB-', color: theme.colors.primary[400] },
    { value: 'O+', label: 'O+', color: theme.colors.success[500] },
    { value: 'O‑', label: 'O-', color: theme.colors.success[400] },
    { value: 'unknown', label: 'Unknown', color: theme.colors.neutral[400] },
  ];

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDateOfBirth(profile.date_of_birth || '');
      setGender(profile.gender || '');
      setBloodGroup(profile.blood_type || '');
      setHeightCm(profile.height_cm?.toString() || '');
      setWeightKg(profile.weight_kg?.toString() || '');
      
      // Parse emergency contact if it exists
      if (profile.emergency_contact && typeof profile.emergency_contact === 'object') {
        const contact = profile.emergency_contact as any;
        setEmergencyContactName(contact.name || '');
        setEmergencyContactPhone(contact.phone || '');
      }
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const emergencyContact = emergencyContactName.trim() || emergencyContactPhone.trim() 
        ? {
            name: emergencyContactName.trim(),
            phone: emergencyContactPhone.trim(),
          }
        : {};

      const profileData = {
        full_name: fullName.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        gender: gender || undefined,
        blood_type: bloodGroup || undefined,
        height_cm: heightCm ? parseFloat(heightCm) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined,
        emergency_contact: emergencyContact,
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

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: theme.colors.warning[500] };
    if (bmi < 25) return { category: 'Normal', color: theme.colors.success[500] };
    if (bmi < 30) return { category: 'Overweight', color: theme.colors.warning[500] };
    return { category: 'Obese', color: theme.colors.error[500] };
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
          <View style={styles.sectionHeader}>
            <User size={20} color={theme.colors.primary[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          
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
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
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
          <View style={styles.sectionHeader}>
            <Ruler size={20} color={theme.colors.primary[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Physical Measurements</Text>
          </View>
          
          <View style={styles.measurementRow}>
            <BaseTextInput
              label="Height (cm)"
              placeholder="170"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              leftIcon={<Ruler size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
              containerStyle={styles.measurementInput}
            />

            <BaseTextInput
              label="Weight (kg)"
              placeholder="70"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              leftIcon={<Weight size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
              containerStyle={styles.measurementInput}
            />
          </View>

          {calculateBMI() && (
            <View style={styles.bmiContainer}>
              <View style={styles.bmiHeader}>
                <Text style={styles.calculatedLabel}>BMI: </Text>
                <Text style={styles.calculatedText}>{calculateBMI()}</Text>
              </View>
              {(() => {
                const bmi = parseFloat(calculateBMI()!);
                const { category, color } = getBMICategory(bmi);
                return (
                  <View style={[styles.bmiBadge, { backgroundColor: color }]}>
                    <Text style={styles.bmiCategory}>{category}</Text>
                  </View>
                );
              })()}
            </View>
          )}
        </BaseCard>

        {/* Blood Group */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Droplet size={20} color={theme.colors.error[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Blood Group</Text>
          </View>
          <View style={styles.bloodGroupGrid}>
            {bloodGroupOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.bloodGroupCard,
                  bloodGroup === option.value && [
                    styles.bloodGroupCardSelected,
                    { borderColor: option.color }
                  ]
                ]}
                onPress={() => setBloodGroup(option.value as any)}
              >
                <View style={[styles.bloodGroupDot, { backgroundColor: option.color }]} />
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

        {/* Emergency Contact */}
        <BaseCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Phone size={20} color={theme.colors.warning[500]} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
          </View>
          
          <BaseTextInput
            label="Contact Name"
            placeholder="Emergency contact name"
            value={emergencyContactName}
            onChangeText={setEmergencyContactName}
          />

          <BaseTextInput
            label="Phone Number"
            placeholder="Emergency contact phone"
            value={emergencyContactPhone}
            onChangeText={setEmergencyContactPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />
        </BaseCard>

        {/* Health Summary */}
        {(fullName || calculateAge() || calculateBMI()) && (
          <BaseCard style={[styles.section, styles.summaryCard]}>
            <Text style={styles.summaryTitle}>Health Profile Summary</Text>
            <View style={styles.summaryContent}>
              {fullName && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Name:</Text>
                  <Text style={styles.summaryValue}>{fullName}</Text>
                </View>
              )}
              {calculateAge() && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Age:</Text>
                  <Text style={styles.summaryValue}>{calculateAge()} years</Text>
                </View>
              )}
              {gender && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Gender:</Text>
                  <Text style={styles.summaryValue}>
                    {genderOptions.find(g => g.value === gender)?.label}
                  </Text>
                </View>
              )}
              {calculateBMI() && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>BMI:</Text>
                  <Text style={styles.summaryValue}>{calculateBMI()}</Text>
                </View>
              )}
              {bloodGroup && bloodGroup !== 'unknown' && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Blood Type:</Text>
                  <Text style={styles.summaryValue}>{bloodGroup}</Text>
                </View>
              )}
            </View>
          </BaseCard>
        )}
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
  
  calculatedValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  
  optionCardSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  
  optionEmoji: {
    fontSize: 20,
    marginRight: theme.spacing.md,
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
  
  measurementRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  
  measurementInput: {
    flex: 1,
  },
  
  bmiContainer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  
  bmiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  bmiBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  
  bmiCategory: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
  },
  
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  bloodGroupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minWidth: 80,
  },
  
  bloodGroupCardSelected: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
  },
  
  bloodGroupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  
  bloodGroupText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  
  bloodGroupTextSelected: {
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  
  summaryCard: {
    backgroundColor: theme.colors.success[50],
    borderWidth: 1,
    borderColor: theme.colors.success[200],
  },
  
  summaryTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.success[700],
    marginBottom: theme.spacing.md,
  },
  
  summaryContent: {
    gap: theme.spacing.sm,
  },
  
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  summaryLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success[600],
  },
  
  summaryValue: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success[700],
  },
  
  saveContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});