import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Config } from '@/lib/config';
import { theme } from '@/lib/theme';

export default function RootIndex() {
  const { isAuthenticated, initialized, loading } = useAuthContext();

  // Check if AI Container URL is configured
  if (!Config.ai.txAgentUrl) {
    return (
      <View style={styles.configErrorContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>⚙️ Configuration Required</Text>
          <Text style={styles.errorMessage}>
            The AI Container URL is not configured. Please set the following environment variable in your .env file:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>EXPO_PUBLIC_TXAGENT_URL=your_txagent_url_here</Text>
          </View>
          <Text style={styles.errorSubtext}>
            After adding this variable, restart the development server to continue.
          </Text>
        </View>
      </View>
    );
  }

  // Show loading screen while authentication state is being determined
  if (!initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },

  configErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing['2xl'],
  },

  errorCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing['2xl'],
    maxWidth: 500,
    width: '100%',
    ...theme.shadows.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning[500],
  },

  errorTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },

  errorMessage: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.base,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },

  codeBlock: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },

  codeText: {
    fontFamily: 'monospace',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  errorSubtext: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});