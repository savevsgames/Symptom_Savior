import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

export interface BaseTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  variant?: 'default' | 'filled' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function BaseTextInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  variant = 'outline',
  size = 'md',
  ...textInputProps
}: BaseTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles = [
    styles.container,
    containerStyle,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    styles[variant],
    styles[size],
    isFocused && styles.focused,
    error && styles.error,
  ];

  const inputStyles = [
    styles.input,
    styles[`${size}Input`],
    inputStyle,
  ];

  return (
    <View style={containerStyles}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={inputContainerStyles}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={inputStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={theme.colors.text.tertiary}
          {...textInputProps}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  
  label: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  filled: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  outline: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  // Sizes
  sm: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
  },
  
  md: {
    height: theme.components.input.height,
    paddingHorizontal: theme.components.input.paddingHorizontal,
  },
  
  lg: {
    height: 56,
    paddingHorizontal: theme.spacing.xl,
  },
  
  // States
  focused: {
    borderColor: theme.colors.primary[500],
    ...theme.shadows.sm,
  },
  
  error: {
    borderColor: theme.colors.error[500],
  },
  
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
  },
  
  smInput: {
    fontSize: theme.typography.fontSize.sm,
  },
  
  mdInput: {
    fontSize: theme.typography.fontSize.base,
  },
  
  lgInput: {
    fontSize: theme.typography.fontSize.lg,
  },
  
  leftIcon: {
    marginRight: theme.spacing.sm,
  },
  
  rightIcon: {
    marginLeft: theme.spacing.sm,
  },
  
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error[500],
    marginTop: theme.spacing.xs,
  },
  
  hintText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
});