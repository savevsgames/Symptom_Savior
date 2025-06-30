import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, TouchableOpacity, Linking, Platform } from 'react-native';

interface BoltBadgeProps {
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  referralId?: string;
}

export function BoltBadge({
  size = 'medium',
  position = 'top-right',
  referralId = 'os72mi',
}: BoltBadgeProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Intro animation
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    // Hover animation
    Animated.sequence([
      Animated.timing(rotation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Open Bolt.new in browser
    Linking.openURL(`https://bolt.new/?rid=${referralId}`);
  };

  // Size mapping
  const sizeMap = {
    small: 60,
    medium: 80,
    large: 100,
  };

  const badgeSize = sizeMap[size];

  // Position mapping
  const getPositionStyle = () => {
    switch (position) {
      case 'top-right':
        return { top: 20, right: 20 };
      case 'bottom-right':
        return { bottom: 20, right: 20 };
      case 'top-left':
        return { top: 20, left: 20 };
      case 'bottom-left':
        return { bottom: 20, left: 20 };
      default:
        return { top: 20, right: 20 };
    }
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '22deg'],
  });

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
        <Animated.View
          style={[
            styles.badgeContainer,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              transform: [
                { scale },
                { rotate: spin },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.badgeImage}
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  badgeContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    overflow: 'hidden',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
  },
});