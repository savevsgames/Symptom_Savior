import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User } from 'lucide-react-native';
import { ConversationView } from '@/components/conversation/ConversationView';
import { Config } from '@/lib/config';
import { useProfile } from '@/hooks/useProfile';
import { BaseButton } from '@/components/ui';
import { theme } from '@/lib/theme';

export default function AssistantConversation() {
  const { profile, loading } = useProfile();
  const [profileChecked, setProfileChecked] = useState(false);
  
  // Check if user has a profile
  useEffect(() => {
    if (!loading) {
      setProfileChecked(true);
      
      // If no profile exists and we've finished loading, show alert
      if (!profile && !loading) {
        Alert.alert(
          'Profile Required',
          'You need to set up your medical profile before using the conversational AI feature. This helps provide personalized health guidance.',
          [
            { 
              text: 'Create Profile', 
              onPress: () => router.push('/(tabs)/profile/personal-info')
            },
            {
              text: 'Go Back',
              style: 'cancel',
              onPress: () => router.back()
            }
          ]
        );
      }
    }
  }, [profile, loading]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Conversation</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your medical profile...</Text>
        </View>
      ) : !profile ? (
        <View style={styles.noProfileContainer}>
          <View style={styles.iconContainer}>
            <User size={48} color={theme.colors.primary[500]} strokeWidth={2} />
          </View>
          <Text style={styles.noProfileTitle}>Profile Required</Text>
          <Text style={styles.noProfileText}>
            You need to set up your medical profile before using the conversational AI feature.
            This helps provide personalized health guidance based on your medical history.
          </Text>
          <BaseButton
            title="Create Medical Profile"
            onPress={() => router.push('/(tabs)/profile/personal-info')}
            variant="primary"
            size="lg"
            style={styles.profileButton}
          />
          <BaseButton
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            size="md"
            style={styles.backButtonStyle}
          />
        </View>
      ) : (
        <ConversationView 
          autoStart={false}
          enableVoiceResponse={Config.features.enableVoice}
          enableEmergencyDetection={Config.features.enableEmergencyDetection}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['2xl'],
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  noProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['2xl'],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  noProfileTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  noProfileText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  profileButton: {
    marginBottom: theme.spacing.md,
  },
  backButtonStyle: {
    marginTop: theme.spacing.md,
  },
});