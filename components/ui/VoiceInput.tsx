import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Mic, MicOff, Square } from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { Config } from '@/lib/config';
import { logger } from '@/utils/logger';

export interface VoiceInputProps {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onTranscription?: (text: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceInput({
  onStartRecording,
  onStopRecording,
  onTranscription,
  disabled = false,
  style,
  size = 'md',
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePress = async () => {
    if (!Config.features.enableVoice) {
      logger.warn('Voice feature is disabled');
      return;
    }

    if (disabled || isProcessing) return;

    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsProcessing(true);
      onStopRecording?.();
      
      // Simulate transcription processing
      // In real implementation, this would call speech-to-text API
      setTimeout(() => {
        setIsProcessing(false);
        onTranscription?.('Sample transcribed text');
        logger.debug('Voice transcription completed');
      }, 2000);
    } else {
      // Start recording
      setIsRecording(true);
      onStartRecording?.();
      logger.debug('Voice recording started');
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 28;
      default: return 20;
    }
  };

  const getIcon = () => {
    if (isProcessing) {
      return <Square size={getIconSize()} color={theme.colors.text.inverse} strokeWidth={2} />;
    }
    
    if (isRecording) {
      return <MicOff size={getIconSize()} color={theme.colors.text.inverse} strokeWidth={2} />;
    }
    
    return <Mic size={getIconSize()} color={theme.colors.text.inverse} strokeWidth={2} />;
  };

  const buttonStyles = [
    styles.button,
    styles[size],
    isRecording && styles.recording,
    isProcessing && styles.processing,
    disabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || isProcessing}
      activeOpacity={0.7}
    >
      {getIcon()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  
  sm: {
    width: 32,
    height: 32,
  },
  
  md: {
    width: 40,
    height: 40,
  },
  
  lg: {
    width: 48,
    height: 48,
  },
  
  recording: {
    backgroundColor: theme.colors.error[500],
  },
  
  processing: {
    backgroundColor: theme.colors.warning[500],
  },
  
  disabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.neutral[400],
  },
});