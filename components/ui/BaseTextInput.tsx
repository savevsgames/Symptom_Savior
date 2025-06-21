import React, { useState, useEffect } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';
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
  value,
  ...textInputProps
}: BaseTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const labelAnimation = useSharedValue(0);

  // Determine if label should be floating
  const shouldFloat = isFocused || (value && value.length > 0);

  useEffect(() => {
    labelAnimation.value = withTiming(shouldFloat ? 1 : 0, {
      duration: 200,
    });
  }, [shouldFloat, labelAnimation]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      labelAnimation.value,
      [0, 1],
      [0, -28],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      labelAnimation.value,
      [0, 1],
      [1, 0.85],
      Extrapolate.CLAMP
    );

    const color = interpolate(
      labelAnimation.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
      color: color === 1 ? theme.colors.primary[500] : theme.colors.text.secondary,
    };
  });

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
    shouldFloat && styles.inputFloating,
    inputStyle,
  ];

  return (
    <View style={containerStyles}>
      <View style={inputContainerStyles}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <View style={styles.inputWrapper}>
          {label && (
            <Animated.Text style={[styles.floatingLabel, animatedLabelStyle]}>
              {label}
            </Animated.Text>
          )}
          
          <TextInput
            style={inputStyles}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholderTextColor={theme.colors.text.tertiary}
            value={value}
            {...textInputProps}
          />
        </View>
        
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
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    position: 'relative',
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
  
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  
  input: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.primary,
    paddingTop: 0,
    paddingBottom: 0,
  },
  
  inputFloating: {
    paddingTop: 12,
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
  
  floatingLabel: {
    position: 'absolute',
    left: 0,
    top: 12,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 4,
    zIndex: 1,
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