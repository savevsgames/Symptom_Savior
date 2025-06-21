import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { Config } from '@/lib/config';
import { theme } from '@/lib/theme';

export default function RootIndex() {
  const { isAuthenticated, initialized, loading } = useAuthContext();

  // Show loading screen while authentication state is being determined
  if (!initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show configuration status if TxAgent URL is missing
  if (!Config.ai.txAgentUrl && Config.features.debug) {
    return (
      <View style={styles.configContainer}>
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>⚙️ Configuration Status</Text>
          <Text style={styles.configMessage}>
            TxAgent URL not configured. The app will work in offline mode with fallback responses.
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>EXPO_PUBLIC_TXAGENT_URL=your_txagent_url_here</Text>
          </View>
          <Text style={styles.configSubtext}>
            Add this to your .env file to enable full AI integration.
          </Text>
        </View>
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

  configContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing['2xl'],
  },

  configCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing['2xl'],
    maxWidth: 500,
    width: '100%',
    ...theme.shadows.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning[500],
  },

  configTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },

  configMessage: {
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

  configSubtext: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});