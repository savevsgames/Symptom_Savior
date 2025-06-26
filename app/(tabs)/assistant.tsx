import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Heart, TriangleAlert as AlertTriangle, Volume2, VolumeX, MessageCircle } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';
import { useSymptoms } from '@/hooks/useSymptoms';
import { callTxAgent, logConsultation, detectEmergency, generateFallbackResponse, type TxAgentRequest, type TxAgentResponse } from '@/lib/api';
import { VoiceRecordButton } from '@/components/ui/VoiceRecordButton';
import { type TranscriptionResult } from '@/lib/speech';
import { ttsService } from '@/lib/tts';
import { Config } from '@/lib/config';
import { logger } from '@/utils/logger';
import { BaseButton } from '@/components/ui';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  sources?: Array<{
    title: string;
    content: string;
    relevance_score: number;
  }>;
  voiceUrl?: string;
  emergencyDetected?: boolean;
  disclaimer?: string;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your Symptom Savior AI Assistant. I'm here to help you track your symptoms, understand your health patterns, and provide evidence-based medical guidance. How are you feeling today?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contextInitialized, setContextInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}`);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get user profile and health data
  const { profile, conditions, medications, allergies } = useProfile();
  const { symptoms, treatments, doctorVisits } = useSymptoms();

  const quickPrompts = [
    "How do I log a new symptom?",
    "What should I do about my headache?",
    "Show me my symptom patterns",
    "I'm feeling anxious"
  ];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const buildUserContext = () => {
    if (!profile) return null;

    // Calculate age from date of birth
    const calculateAge = (dateOfBirth: string) => {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const context = {
      user_profile: {
        full_name: profile.full_name,
        age: profile.date_of_birth ? calculateAge(profile.date_of_birth) : null,
        gender: profile.gender,
        blood_group: profile.blood_group,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
      },
      medical_conditions: conditions.map(c => ({
        name: c.condition_name,
        severity: c.severity,
        diagnosed_on: c.diagnosed_on,
        notes: c.notes,
      })),
      current_medications: medications.map(m => ({
        name: m.medication_name,
        dose: m.dose,
        frequency: m.frequency,
        started_on: m.started_on,
        prescribing_doctor: m.prescribing_doctor,
      })),
      allergies: allergies.map(a => ({
        allergen: a.allergen,
        reaction: a.reaction,
        severity: a.severity,
      })),
      recent_symptoms: symptoms.slice(0, 10).map(s => ({
        symptom: s.symptom,
        severity: s.severity,
        date: s.date,
        triggers: s.triggers,
        location: s.location,
        description: s.description,
      })),
      recent_visits: doctorVisits.slice(0, 3).map(v => ({
        date: new Date(v.visit_ts).toLocaleDateString(),
        doctor_name: v.doctor_name,
        summary: v.visit_summary,
        follow_up_required: v.follow_up_required,
      })),
    };

    return context;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build context for personalized responses
      const shouldUseContext = profile && (!contextInitialized || 
        textToSend.toLowerCase().includes('my') || 
        textToSend.toLowerCase().includes('personal') ||
        textToSend.toLowerCase().includes('history'));

      const context = shouldUseContext ? buildUserContext() : undefined;

      if (shouldUseContext && !contextInitialized) {
        setContextInitialized(true);
      }

      // Prepare TxAgent request
      const request: TxAgentRequest = {
        query: textToSend,
        context,
        // Only include voice if explicitly enabled in config AND this is a bot response
        // (not for user messages)
        include_voice: false, // Don't request voice in initial API call
        include_video: false, // Don't request video in initial API call
        session_id: sessionId,
        preferred_agent: 'txagent', // Default to TxAgent
      };

      let response: TxAgentResponse;

      try {
        // Call TxAgent API via Backend User Portal
        response = await callTxAgent(request);
        
        // Log the consultation
        await logConsultation(request, response);
      } catch (error) {
        logger.error('Backend User Portal call failed, using fallback', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
        
        // Use fallback response if backend is unavailable
        response = generateFallbackResponse(textToSend);
        
        // Show user-friendly error message
        Alert.alert(
          'Connection Issue',
          'Having trouble connecting to the medical consultation service. Using offline guidance for now.',
          [{ text: 'OK' }]
        );
      }

      // Create bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response.text,
        isBot: true,
        timestamp: new Date(),
        sources: response.response.sources,
        voiceUrl: response.media?.voice_audio_url,
        emergencyDetected: response.safety.emergency_detected,
        disclaimer: response.safety.disclaimer,
      };

      setMessages(prev => [...prev, botMessage]);

      // Handle emergency detection
      if (response.safety.emergency_detected) {
        setTimeout(() => {
          Alert.alert(
            '🚨 Emergency Detected',
            'Your symptoms may require immediate medical attention. If this is a medical emergency, please call emergency services immediately.',
            [
              { text: 'I understand', style: 'default' },
              { 
                text: 'Call Emergency Services', 
                style: 'destructive',
                onPress: () => {
                  // Platform-specific emergency calling
                  if (Platform.OS !== 'web') {
                    // On mobile, this would open the phone dialer
                    // Linking.openURL('tel:911');
                  }
                }
              }
            ]
          );
        }, 1000);
      }

      // Generate and play TTS response if voice is enabled and explicitly requested
      if (Config.features.enableVoice && Config.voice.elevenLabsApiKey) {
        // Only generate TTS if the user has explicitly requested it by clicking the play button
        // This will be handled by the playAudioResponse function when the user clicks the button
        if (response.media?.voice_audio_url) {
          // Store the voice URL but don't auto-play
          botMessage.voiceUrl = response.media.voice_audio_url;
        }
      }

    } catch (error) {
      logger.error('Message sending failed', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        textToSend
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment. If you're experiencing a medical emergency, please contact emergency services immediately.",
        isBot: true,
        timestamp: new Date(),
        emergencyDetected: detectEmergency(textToSend).isEmergency,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateTTSResponse = async (text: string, messageId: string) => {
    try {
      logger.debug('Generating TTS for AI response', { messageId });
      setPlayingAudio(messageId);

      // Clean text for TTS (remove markdown, excessive punctuation)
      const cleanText = text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
        .replace(/\n+/g, ' ')            // Replace newlines with spaces
        .replace(/\s+/g, ' ')            // Normalize whitespace
        .trim();

      const result = await ttsService.generateSpeech(cleanText, {
        voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella - professional female voice
        model_id: 'eleven_turbo_v2',       // Fast, cost-effective
        voice_settings: {
          stability: 0.6,
          similarity_boost: 0.8,
          style: 0.2,
          use_speaker_boost: true,
        },
      });

      if (result.error) {
        logger.error('TTS generation failed', result.error);
        setPlayingAudio(null);
        return;
      }

      if (result.audioUrl) {
        await ttsService.playAudio(result.audioUrl);
        logger.info('TTS playback completed');
      }
    } catch (error) {
      logger.error('TTS generation/playback failed', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        messageId,
        textLength: text.length
      });
    } finally {
      setPlayingAudio(null);
    }
  };

  const handleVoiceTranscription = (result: TranscriptionResult) => {
    if (result.text.trim()) {
      logger.info('Voice transcription received', { text: result.text });
      sendMessage(result.text);
    }
  };

  const handleVoiceError = (error: string) => {
    logger.error('Voice input error', error);
    Alert.alert('Voice Input Error', error);
  };

  const playAudioResponse = async (audioUrl: string, messageId: string) => {
    try {
      logger.debug('Playing audio response', { messageId });
      setPlayingAudio(messageId);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudio(null);
          sound.unloadAsync();
        }
      });
    } catch (error) {
      logger.error('Failed to play audio response', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        audioUrl,
        messageId
      });
      setPlayingAudio(null);
    }
  };

  const stopAudioPlayback = async () => {
    try {
      await ttsService.stopAudio();
      setPlayingAudio(null);
    } catch (error) {
      logger.error('Failed to stop audio playback', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
    }
  };

  const sendQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const navigateToConversationView = () => {
    router.push('/(tabs)/assistant-conversation');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg' }}
              style={styles.characterAvatar}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Medical AI Assistant</Text>
              <Text style={styles.headerSubtitle}>
                {Config.ai.backendUserPortal ? 'Powered by TxAgent Medical RAG' : 'Offline Mode'}
              </Text>
            </View>
          </View>
        </View>

        {/* Context Status Indicator */}
        {profile && (
          <View style={styles.contextIndicator}>
            <Heart size={12} color="#10B981" strokeWidth={2} />
            <Text style={styles.contextText}>
              Personalized responses enabled • {conditions.length + medications.length + allergies.length} health factors
            </Text>
          </View>
        )}

        {/* Emergency Banner */}
        {messages.some(m => m.emergencyDetected) && (
          <View style={styles.emergencyBanner}>
            <AlertTriangle size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.emergencyText}>
              EMERGENCY DETECTED - CALL 911 IMMEDIATELY IF NEEDED
            </Text>
          </View>
        )}

        {/* New Conversation Mode Banner */}
        <TouchableOpacity 
          style={styles.newModeBanner}
          onPress={navigateToConversationView}
        >
          <MessageCircle size={16} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.newModeText}>
            Try our new conversational AI experience!
          </Text>
        </TouchableOpacity>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id} style={[
              styles.messageWrapper,
              message.isBot ? styles.botMessageWrapper : styles.userMessageWrapper
            ]}>
              <View style={styles.messageHeader}>
                <View style={[
                  styles.avatar,
                  message.isBot ? styles.botAvatar : styles.userAvatar
                ]}>
                  {message.isBot ? (
                    <Image 
                      source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg' }}
                      style={styles.messageAvatar}
                      resizeMode="contain"
                    />
                  ) : (
                    <User size={16} color="#FFFFFF" strokeWidth={2} />
                  )}
                </View>
                <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
              </View>
              
              <View style={[
                styles.messageBubble,
                message.isBot ? styles.botMessage : styles.userMessage,
                message.emergencyDetected && styles.emergencyMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  message.isBot ? styles.botMessageText : styles.userMessageText,
                  message.emergencyDetected && styles.emergencyMessageText
                ]}>
                  {message.text}
                </Text>

                {/* Voice Playback Button - Only show for bot messages when voice is enabled */}
                {message.isBot && Config.features.enableVoice && (
                  <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={() => {
                      if (playingAudio === message.id) {
                        stopAudioPlayback();
                      } else {
                        generateTTSResponse(message.text, message.id);
                      }
                    }}
                  >
                    {playingAudio === message.id ? (
                      <VolumeX size={16} color="#0066CC" strokeWidth={2} />
                    ) : (
                      <Volume2 size={16} color="#0066CC" strokeWidth={2} />
                    )}
                    <Text style={styles.voiceButtonText}>
                      {playingAudio === message.id ? 'Stop' : 'Play'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <View style={styles.sourcesContainer}>
                    <Text style={styles.sourcesTitle}>Sources:</Text>
                    {message.sources.slice(0, 3).map((source, index) => (
                      <Text key={index} style={styles.sourceItem}>
                        • {source.title}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Medical Disclaimer */}
                {message.disclaimer && (
                  <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>{message.disclaimer}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
              <View style={styles.messageHeader}>
                <View style={styles.botAvatar}>
                  <Image 
                    source={{ uri: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg' }}
                    style={styles.messageAvatar}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.timestamp}>analyzing your health context...</Text>
              </View>
              <View style={[styles.messageBubble, styles.botMessage]}>
                <Text style={styles.typingText}>Your medical AI is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <View style={styles.quickPromptsContainer}>
            <Text style={styles.quickPromptsTitle}>Quick questions:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickPrompts.map((prompt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickPromptButton}
                  onPress={() => sendQuickPrompt(prompt)}
                >
                  <Text style={styles.quickPromptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Try New Experience Button */}
        <View style={styles.newExperienceContainer}>
          <BaseButton
            title="Try New Conversational Experience"
            onPress={navigateToConversationView}
            variant="primary"
            size="md"
            fullWidth
          />
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your medical question..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage()}
          />
          
          {/* Voice Input Button - Only show when voice is enabled */}
          {Config.features.enableVoice && (
            <VoiceRecordButton
              onTranscription={handleVoiceTranscription}
              onError={handleVoiceError}
              disabled={isTyping}
              maxDuration={30000} // 30 seconds
              size="md"
              style={styles.voiceInputButton}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!inputText.trim() || isTyping}
          >
            <Send size={20} color={inputText.trim() ? "#FFFFFF" : "#94A3B8"} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  characterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1E293B',
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
  },
  contextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  contextText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#166534',
    marginLeft: 6,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emergencyText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  newModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  newModeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageWrapper: {
    marginVertical: 8,
  },
  botMessageWrapper: {
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  botAvatar: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  userAvatar: {
    backgroundColor: '#10B981',
  },
  messageAvatar: {
    width: 28,
    height: 28,
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    backgroundColor: '#0066CC',
    borderBottomRightRadius: 4,
  },
  emergencyMessage: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  botMessageText: {
    color: '#1E293B',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  emergencyMessageText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  typingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  voiceButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#0066CC',
    marginLeft: 4,
  },
  sourcesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sourcesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  sourceItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  disclaimerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEF3C7',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 8,
  },
  disclaimerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#92400E',
    fontStyle: 'italic',
  },
  quickPromptsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quickPromptsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  quickPromptButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  quickPromptText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#0066CC',
  },
  newExperienceContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1E293B',
    maxHeight: 100,
    marginRight: 8,
  },
  voiceInputButton: {
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
});