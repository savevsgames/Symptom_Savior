import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

export interface BaseCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function BaseCard({
  children,
  variant = 'default',
  padding = 'md',
  style,
}: BaseCardProps) {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[`${padding}Padding`],
    style,
  ];

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.components.card.borderRadius,
  },
  
  // Variants
  default: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  elevated: {
    backgroundColor: theme.colors.background.primary,
    ...theme.shadows.md,
  },
  
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  
  filled: {
    backgroundColor: theme.colors.background.secondary,
  },
  
  // Padding variants
  nonePadding: {
    padding: 0,
  },
  
  smPadding: {
    padding: theme.spacing.sm,
  },
  
  mdPadding: {
    padding: theme.components.card.padding,
  },
  
  lgPadding: {
    padding: theme.spacing['2xl'],
  },
});