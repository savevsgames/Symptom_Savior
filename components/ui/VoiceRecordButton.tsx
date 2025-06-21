import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Animated } from 'react-native';
import { Mic, MicOff, Square } from 'lucide-react-native';
import { speechService, type TranscriptionResult } from '@/lib/speech';
import { theme } from '@/lib/theme';
import { logger } from '@/utils/logger';

export interface VoiceRecordButtonProps {
  onTranscription?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  disabled?: boolean;
  maxDuration?: number; // in milliseconds
  style?: any;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceRecordButton({
  onTranscription,
  onError,
  onRecordingStart,
  onRecordingStop,
  disabled = false,
  maxDuration = 60000, // 60 seconds default
  style,
  size = 'md',
}: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // Animation for recording pulse effect
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (isRecording) {
      // Start pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Start duration counter
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);

      return () => {
        pulse.stop();
        clearInterval(interval);
      };
    } else {
      setRecordingDuration(0);
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const checkPermissions = async () => {
    try {
      const granted = await speechService.requestPermissions();
      setHasPermission(granted);
    } catch (error) {
      logger.error('Permission check failed', error);
      setHasPermission(false);
    }
  };

  const handlePress = async () => {
    if (disabled || isProcessing) return;

    if (!hasPermission) {
      onError?.('Microphone permission is required for voice input');
      return;
    }

    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      onRecordingStart?.();
      
      await speechService.startRecording({
        maxDuration,
        quality: 'high',
      });

      logger.info('Voice recording started');
    } catch (error) {
      logger.error('Failed to start recording', error);
      setIsRecording(false);
      onError?.('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      onRecordingStop?.();

      const audioUri = await speechService.stopRecording();
      
      if (audioUri) {
        logger.info('Processing audio transcription');
        const result = await speechService.transcribeAudio(audioUri);
        onTranscription?.(result);
        logger.info('Transcription completed', { text: result.text });
      } else {
        onError?.('No audio was recorded');
      }
    } catch (error) {
      logger.error('Failed to process recording', error);
      onError?.('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 40;
      case 'lg': return 64;
      default: return 52;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 18;
      case 'lg': return 28;
      default: return 24;
    }
  };

  const buttonSize = getButtonSize();
  const iconSize = getIconSize();

  const getIcon = () => {
    if (isProcessing) {
      return <Square size={iconSize} color={theme.colors.text.inverse} strokeWidth={2} />;
    }
    
    if (isRecording) {
      return <MicOff size={iconSize} color={theme.colors.text.inverse} strokeWidth={2} />;
    }
    
    return <Mic size={iconSize} color={theme.colors.text.inverse} strokeWidth={2} />;
  };

  const getButtonStyle = () => {
    if (disabled) return [styles.button, styles.disabled, { width: buttonSize, height: buttonSize }];
    if (isProcessing) return [styles.button, styles.processing, { width: buttonSize, height: buttonSize }];
    if (isRecording) return [styles.button, styles.recording, { width: buttonSize, height: buttonSize }];
    return [styles.button, styles.idle, { width: buttonSize, height: buttonSize }];
  };

  if (hasPermission === false) {
    return (
      <TouchableOpacity 
        style={[styles.button, styles.disabled, { width: buttonSize, height: buttonSize }]}
        onPress={checkPermissions}
      >
        <Mic size={iconSize} color={theme.colors.text.tertiary} strokeWidth={2} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={getButtonStyle()}
          onPress={handlePress}
          disabled={disabled || isProcessing}
          activeOpacity={0.8}
        >
          {getIcon()}
        </TouchableOpacity>
      </Animated.View>
      
      {isRecording && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>
            {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}
      
      {isProcessing && (
        <View style={styles.processingContainer}>
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  
  button: {
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  
  idle: {
    backgroundColor: theme.colors.primary[500],
  },
  
  recording: {
    backgroundColor: theme.colors.error[500],
  },
  
  processing: {
    backgroundColor: theme.colors.warning[500],
  },
  
  disabled: {
    backgroundColor: theme.colors.neutral[400],
    opacity: 0.6,
  },
  
  durationContainer: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.error[500],
    borderRadius: theme.borderRadius.full,
  },
  
  durationText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.inverse,
  },
  
  processingContainer: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.warning[500],
    borderRadius: theme.borderRadius.full,
  },
  
  processingText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.inverse,
  },
});