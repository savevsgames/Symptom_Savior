import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { theme } from '@/lib/theme';

export interface BaseButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function BaseButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: BaseButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  const getLoadingColor = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return theme.colors.text.inverse;
      default:
        return theme.colors.primary[500];
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getLoadingColor()} 
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary[500],
  },
  
  secondary: {
    backgroundColor: theme.colors.secondary[100],
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
  
  danger: {
    backgroundColor: theme.colors.error[500],
  },
  
  // Sizes
  sm: {
    height: theme.components.button.height.sm,
    paddingHorizontal: theme.components.button.paddingHorizontal.sm,
  },
  
  md: {
    height: theme.components.button.height.md,
    paddingHorizontal: theme.components.button.paddingHorizontal.md,
  },
  
  lg: {
    height: theme.components.button.height.lg,
    paddingHorizontal: theme.components.button.paddingHorizontal.lg,
  },
  
  // States
  disabled: {
    opacity: 0.5,
  },
  
  fullWidth: {
    width: '100%',
  },
  
  // Text styles
  baseText: {
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  
  primaryText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
  },
  
  secondaryText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
  },
  
  outlineText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.base,
  },
  
  ghostText: {
    color: theme.colors.primary[500],
    fontSize: theme.typography.fontSize.base,
  },
  
  dangerText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
  },
  
  smText: {
    fontSize: theme.typography.fontSize.sm,
  },
  
  mdText: {
    fontSize: theme.typography.fontSize.base,
  },
  
  lgText: {
    fontSize: theme.typography.fontSize.lg,
  },
  
  disabledText: {
    opacity: 0.7,
  },
});