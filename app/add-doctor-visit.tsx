import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Phone, Mail, FileText, Clock } from 'lucide-react-native';
import { BaseButton, BaseTextInput, BaseCard } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

export default function AddDoctorVisit() {
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [visitPrep, setVisitPrep] = useState('');
  const [visitSummary, setVisitSummary] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { addDoctorVisit } = useSymptoms();

  const handleSave = async () => {
    if (!visitDate.trim()) {
      Alert.alert('Missing Information', 'Please enter the visit date.');
      return;
    }

    if (!doctorName.trim()) {
      Alert.alert('Missing Information', 'Please enter the doctor\'s name.');
      return;
    }

    setSaving(true);
    
    try {
      // Combine date and time into ISO string
      let visitDateTime = visitDate;
      if (visitTime) {
        visitDateTime = `${visitDate}T${visitTime}:00`;
      } else {
        visitDateTime = `${visitDate}T12:00:00`;
      }

      const visitData = {
        visit_ts: new Date(visitDateTime).toISOString(),
        doctor_name: doctorName.trim(),
        location: location.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        contact_email: contactEmail.trim() || undefined,
        visit_prep: visitPrep.trim() || undefined,
        visit_summary: visitSummary.trim() || undefined,
        follow_up_required: followUpRequired,
      };

      const { error } = await addDoctorVisit(visitData);

      if (error) {
        Alert.alert('Error', 'Failed to save doctor visit. Please try again.');
        return;
      }

      Alert.alert(
        'Visit Recorded',
        `Your visit with Dr. ${doctorName} has been recorded successfully.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM format
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Doctor Visit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Visit Details */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Calendar size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Visit Information
          </Text>
          
          <BaseTextInput
            label="Visit Date"
            placeholder="YYYY-MM-DD"
            value={visitDate}
            onChangeText={setVisitDate}
            leftIcon={<Calendar size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />

          <BaseTextInput
            label="Visit Time (Optional)"
            placeholder="HH:MM (24-hour format)"
            value={visitTime}
            onChangeText={setVisitTime}
            leftIcon={<Clock size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />

          <BaseTextInput
            label="Doctor/Provider Name"
            placeholder="Dr. Smith, Nurse Johnson, etc."
            value={doctorName}
            onChangeText={setDoctorName}
          />

          <BaseTextInput
            label="Location (Optional)"
            placeholder="Hospital, clinic, or office name"
            value={location}
            onChangeText={setLocation}
            leftIcon={<MapPin size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />
        </BaseCard>

        {/* Contact Information */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information (Optional)</Text>
          
          <BaseTextInput
            label="Phone Number"
            placeholder="(555) 123-4567"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />

          <BaseTextInput
            label="Email"
            placeholder="doctor@clinic.com"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          />
        </BaseCard>

        {/* Visit Preparation */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FileText size={16} color={theme.colors.text.primary} strokeWidth={2} />
            {' '}Visit Preparation (Optional)
          </Text>
          
          <BaseTextInput
            label="Questions & Concerns to Discuss"
            placeholder="List questions you want to ask, symptoms to discuss, or concerns to address..."
            value={visitPrep}
            onChangeText={setVisitPrep}
            multiline
            style={styles.textArea}
          />
        </BaseCard>

        {/* Visit Summary */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Summary (Optional)</Text>
          
          <BaseTextInput
            label="What was discussed and recommended?"
            placeholder="Diagnosis, treatment recommendations, test results, next steps..."
            value={visitSummary}
            onChangeText={setVisitSummary}
            multiline
            style={styles.textArea}
          />
        </BaseCard>

        {/* Follow-up */}
        <BaseCard style={styles.section}>
          <Text style={styles.sectionTitle}>Follow-up Required?</Text>
          <View style={styles.followUpContainer}>
            <TouchableOpacity
              style={[
                styles.followUpOption,
                !followUpRequired && styles.followUpOptionSelected
              ]}
              onPress={() => setFollowUpRequired(false)}
            >
              <View style={[
                styles.followUpRadio,
                !followUpRequired && styles.followUpRadioSelected
              ]} />
              <Text style={styles.followUpLabel}>No follow-up needed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.followUpOption,
                followUpRequired && styles.followUpOptionSelected
              ]}
              onPress={() => setFollowUpRequired(true)}
            >
              <View style={[
                styles.followUpRadio,
                followUpRequired && styles.followUpRadioSelected
              ]} />
              <Text style={styles.followUpLabel}>Follow-up required</Text>
            </TouchableOpacity>
          </View>
        </BaseCard>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <BaseButton
          title="Save Visit"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !visitDate.trim() || !doctorName.trim()}
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
  
  textArea: {
    minHeight: 100,
  },
  
  followUpContainer: {
    gap: theme.spacing.md,
  },
  
  followUpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
  },
  
  followUpOptionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  
  followUpRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    marginRight: theme.spacing.md,
  },
  
  followUpRadioSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[500],
  },
  
  followUpLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  
  saveContainer: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
});