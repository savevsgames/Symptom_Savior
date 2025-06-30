import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { BaseTextInput, BaseButton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/lib/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signIn, loading } = useAuth();

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setError(signInError.message || 'Failed to sign in');
    } else {
      router.replace('/(tabs)');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your health journey</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <BaseTextInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              leftIcon={<Mail size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
            />

            <BaseTextInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              leftIcon={<Lock size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
              rightIcon={
                <TouchableOpacity onPress={togglePasswordVisibility}>
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.text.tertiary} strokeWidth={2} />
                  ) : (
                    <Eye size={20} color={theme.colors.text.tertiary} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              }
            />

            <BaseButton
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              variant="primary"
              size="lg"
              fullWidth
              style={styles.signInButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  keyboardAvoidingView: {
    flex: 1,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
    justifyContent: 'center',
  },
  
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['4xl'],
  },
  
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  form: {
    marginBottom: theme.spacing['2xl'],
  },
  
  errorContainer: {
    backgroundColor: theme.colors.error[50],
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  
  errorText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error[600],
    textAlign: 'center',
  },
  
  signInButton: {
    marginTop: theme.spacing.lg,
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  footerText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  linkText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[500],
  },
});