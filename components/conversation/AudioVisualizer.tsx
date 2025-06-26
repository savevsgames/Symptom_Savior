import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '@/lib/theme';

interface AudioVisualizerProps {
  isListening: boolean;
  isResponding: boolean;
  audioLevel: number;
  barCount?: number;
}

export function AudioVisualizer({
  isListening,
  isResponding,
  audioLevel,
  barCount = 20
}: AudioVisualizerProps) {
  // Create animated values for each bar
  const animatedValues = useRef<Animated.Value[]>(
    Array(barCount).fill(0).map(() => new Animated.Value(0))
  ).current;
  
  // Update animation based on audio level and state
  useEffect(() => {
    if (!isListening && !isResponding) {
      // Animate all bars to minimum height when inactive
      animatedValues.forEach((value, index) => {
        Animated.timing(value, {
          toValue: 0.1,
          duration: 500,
          useNativeDriver: false,
        }).start();
      });
      return;
    }
    
    // Normalize audio level (0-1)
    const normalizedLevel = Math.min(1, Math.max(0, audioLevel / 100));
    
    // Animate each bar with a slight delay between them
    animatedValues.forEach((value, index) => {
      // Calculate random height based on audio level
      // Center bars are taller than edge bars
      const centerOffset = Math.abs(index - barCount / 2) / (barCount / 2);
      const maxHeight = isListening ? normalizedLevel : 0.5;
      const randomFactor = isListening ? Math.random() * 0.3 : Math.random() * 0.2;
      const height = maxHeight * (1 - centerOffset * 0.5) + randomFactor;
      
      // Animate to new height
      Animated.timing(value, {
        toValue: Math.max(0.1, height), // Minimum height of 0.1
        duration: 100,
        useNativeDriver: false,
      }).start();
    });
  }, [isListening, isResponding, audioLevel, animatedValues, barCount]);
  
  return (
    <View style={styles.container}>
      <View style={styles.visualizer}>
        {animatedValues.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                height: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: isListening 
                  ? theme.colors.primary[500] 
                  : isResponding 
                    ? theme.colors.secondary[500]
                    : theme.colors.neutral[300],
                marginHorizontal: 2,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});