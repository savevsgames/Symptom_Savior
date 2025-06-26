import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mic, MicOff, Volume2, VolumeX, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useConversation, ConversationState } from '@/hooks/useConversation';
import { theme } from '@/lib/theme';
import { BaseButton } from '@/components/ui';
import { AudioVisualizer } from './AudioVisualizer';

interface ConversationViewProps {
  autoStart?: boolean;
  enableVoiceResponse?: boolean;
  enableEmergencyDetection?: boolean;
}

export function ConversationView({
  autoStart = false,
  enableVoiceResponse = true,
  enableEmergencyDetection = true
}: ConversationViewProps) {
  const {
    state,
    messages,
    currentTranscript,
    isEmergencyDetected,
    audioLevel,
    error,
    startConversation,
    endConversation,
    stopAudioPlayback,
    isListening,
    isProcessing,
    isResponding,
    isActive
  } = useConversation({
    autoStart,
    enableVoiceResponse,
    enableEmergencyDetection
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, currentTranscript]);
  
  // Get state label for display
  const getStateLabel = () => {
    switch (state) {
      case ConversationState.IDLE:
        return 'Tap to start conversation';
      case ConversationState.CONNECTING:
        return 'Connecting...';
      case ConversationState.LISTENING:
        return 'Listening...';
      case ConversationState.PROCESSING:
        return 'Processing...';
      case ConversationState.RESPONDING:
        return 'AI is responding...';
      case ConversationState.WAITING:
        return 'Waiting for your question...';
      case ConversationState.EMERGENCY:
        return 'EMERGENCY DETECTED';
      case ConversationState.ERROR:
        return `Error: ${error || 'Unknown error'}`;
      case ConversationState.ENDED:
        return 'Conversation ended';
      default:
        return 'Ready';
    }
  };
  
  // Format timestamp for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Medical Assistant</Text>
        <Text style={styles.headerSubtitle}>{getStateLabel()}</Text>
      </View>
      
      {/* Emergency Banner */}
      {isEmergencyDetected && (
        <View style={styles.emergencyBanner}>
          <AlertTriangle size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.emergencyText}>
            EMERGENCY DETECTED - CALL 911 IMMEDIATELY IF NEEDED
          </Text>
        </View>
      )}
      
      {/* Conversation */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View key={message.id} style={[
            styles.messageWrapper,
            message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper
          ]}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>
                {message.isUser ? 'You' : 'AI Assistant'}
              </Text>
              <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
            </View>
            
            <View style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage,
              message.isEmergency && styles.emergencyMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText,
                message.isEmergency && styles.emergencyMessageText
              ]}>
                {message.text}
              </Text>
              
              {/* Voice Playback Button - Only show for AI messages with audio */}
              {!message.isUser && message.audioUrl && (
                <TouchableOpacity
                  style={styles.voiceButton}
                  onPress={() => {
                    // TODO: Implement audio playback toggle
                  }}
                >
                  <Volume2 size={16} color="#0066CC" strokeWidth={2} />
                  <Text style={styles.voiceButtonText}>Play</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        {/* Current Transcript (when listening) */}
        {isListening && currentTranscript && (
          <View style={[styles.messageWrapper, styles.userMessageWrapper]}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>You</Text>
              <Text style={styles.timestamp}>now</Text>
            </View>
            
            <View style={[styles.messageBubble, styles.userMessage, styles.partialMessage]}>
              <Text style={[styles.messageText, styles.userMessageText, styles.partialText]}>
                {currentTranscript}
              </Text>
            </View>
          </View>
        )}
        
        {/* AI Thinking Indicator */}
        {isProcessing && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={styles.messageHeader}>
              <Text style={styles.messageSender}>AI Assistant</Text>
              <Text style={styles.timestamp}>now</Text>
            </View>
            
            <View style={[styles.messageBubble, styles.aiMessage, styles.thinkingMessage]}>
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
              <Text style={[styles.messageText, styles.aiMessageText, styles.thinkingText]}>
                Thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      {/* Audio Visualizer */}
      <View style={styles.visualizerContainer}>
        <AudioVisualizer 
          isListening={isListening}
          isResponding={isResponding}
          audioLevel={audioLevel}
        />
      </View>
      
      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!isActive ? (
          <BaseButton
            title="Start Conversation"
            onPress={startConversation}
            variant="primary"
            size="lg"
            fullWidth
          />
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity
              style={[
                styles.micButton,
                isListening && styles.micButtonActive
              ]}
              onPress={isListening ? endConversation : startConversation}
            >
              {isListening ? (
                <MicOff size={24} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Mic size={24} color="#FFFFFF" strokeWidth={2} />
              )}
            </TouchableOpacity>
            
            <Text style={styles.controlsText}>
              {isListening ? 'Tap to end conversation' : 'Listening...'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error[600],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  emergencyText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
  },
  messageWrapper: {
    marginBottom: theme.spacing.lg,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  aiMessageWrapper: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  messageSender: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  timestamp: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.sm,
  },
  messageBubble: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  userMessage: {
    backgroundColor: theme.colors.primary[500],
    borderBottomRightRadius: theme.spacing.xs,
  },
  aiMessage: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderBottomLeftRadius: theme.spacing.xs,
  },
  emergencyMessage: {
    borderWidth: 2,
    borderColor: theme.colors.error[500],
  },
  partialMessage: {
    opacity: 0.7,
  },
  thinkingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  messageText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: theme.colors.text.primary,
  },
  emergencyMessageText: {
    fontFamily: theme.typography.fontFamily.medium,
  },
  partialText: {
    fontStyle: 'italic',
  },
  thinkingText: {
    fontStyle: 'italic',
    marginLeft: theme.spacing.sm,
    color: theme.colors.text.secondary,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  voiceButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[500],
    marginLeft: theme.spacing.xs,
  },
  visualizerContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  controlsContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  activeControls: {
    alignItems: 'center',
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.md,
  },
  micButtonActive: {
    backgroundColor: theme.colors.error[500],
  },
  controlsText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});