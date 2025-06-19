import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
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
});