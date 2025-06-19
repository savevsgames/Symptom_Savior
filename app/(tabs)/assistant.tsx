import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Heart } from 'lucide-react-native';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your Symptom Savior AI Assistant. I'm here to help you track your symptoms, understand your health patterns, and provide supportive guidance. How are you feeling today?",
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const quickPrompts = [
    "How do I log a new symptom?",
    "What should I do about my headache?",
    "Show me my symptom patterns",
    "I'm feeling anxious"
  ];

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('headache') || input.includes('head pain')) {
      return "I'm sorry you're experiencing a headache. For immediate relief, try resting in a quiet, dark room and staying hydrated. If headaches persist or worsen, please consider consulting with your healthcare provider. Would you like to log this symptom in your tracker?";
    }
    
    if (input.includes('log') || input.includes('track') || input.includes('record')) {
      return "To log a new symptom, tap the 'Log New Symptom' button on your dashboard or go to the Symptoms tab and tap the '+' icon. You can record the symptom type, severity level, and any additional details. Regular tracking helps identify patterns!";
    }
    
    if (input.includes('pattern') || input.includes('trend')) {
      return "Your symptom patterns can reveal important insights! Based on your recent entries, I can help you identify triggers and trends. To view detailed analytics, tap 'View Trends' on your dashboard. Would you like me to summarize your recent symptom activity?";
    }
    
    if (input.includes('anxious') || input.includes('anxiety') || input.includes('worried')) {
      return "I understand that feeling anxious can be overwhelming. Take a moment to breathe deeply. Anxiety can sometimes be related to physical symptoms. If this is a new or concerning symptom, consider logging it and speaking with a healthcare provider. Remember, you're taking positive steps by tracking your health. Is there anything specific triggering your anxiety?";
    }
    
    if (input.includes('pain')) {
      return "I'm sorry you're experiencing pain. Pain levels and triggers are important to track. Consider logging this symptom with details about location, intensity (1-5 scale), and any potential triggers. If pain is severe or persistent, please don't hesitate to contact your healthcare provider.";
    }
    
    if (input.includes('thank') || input.includes('thanks')) {
      return "You're very welcome! I'm here to support you on your health journey. Remember, consistent symptom tracking can provide valuable insights for both you and your healthcare team. Is there anything else I can help you with today?";
    }
    
    // Default empathetic response
    return "Thank you for sharing that with me. Every person's health journey is unique, and I'm here to support you. If you're experiencing concerning symptoms, please consider consulting with a healthcare professional. In the meantime, I can help you track symptoms, understand patterns, or guide you through using the app. What would be most helpful for you right now?";
  };

  const sendQuickPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
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
              source={require('@/assets/images/symptom_savior_concept_art_04_guardianagent.png')}
              style={styles.characterAvatar}
              resizeMode="contain"
            />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Symptom Savior Assistant</Text>
              <Text style={styles.headerSubtitle}>Your compassionate health guardian</Text>
            </View>
          </View>
        </View>

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
                      source={require('@/assets/images/symptom_savior_concept_art_04_guardianagent.png')}
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
                message.isBot ? styles.botMessage : styles.userMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  message.isBot ? styles.botMessageText : styles.userMessageText
                ]}>
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageWrapper, styles.botMessageWrapper]}>
              <View style={styles.messageHeader}>
                <View style={styles.botAvatar}>
                  <Image 
                    source={require('@/assets/images/symptom_savior_concept_art_04_guardianagent.png')}
                    style={styles.messageAvatar}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.timestamp}>typing...</Text>
              </View>
              <View style={[styles.messageBubble, styles.botMessage]}>
                <Text style={styles.typingText}>Your guardian is typing...</Text>
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

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
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
  typingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
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