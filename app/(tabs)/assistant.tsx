import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Bot, User, Heart } from 'lucide-react-native';
import { useProfile } from '@/hooks/useProfile';
import { useSymptoms } from '@/hooks/useSymptoms';

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
  const [contextInitialized, setContextInitialized] = useState(false);
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
    if (!profile) return '';

    let context = '\n--- Patient Context ---\n';
    
    // Basic demographics
    if (profile.full_name) {
      context += `Patient: ${profile.full_name}\n`;
    }
    
    if (profile.date_of_birth) {
      const age = Math.floor((new Date().getTime() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      context += `Age: ${age} years old\n`;
    }
    
    if (profile.gender) {
      context += `Gender: ${profile.gender}\n`;
    }

    if (profile.blood_group && profile.blood_group !== 'unknown') {
      context += `Blood Type: ${profile.blood_group}\n`;
    }

    // Medical conditions
    if (conditions.length > 0) {
      context += `\nMedical Conditions:\n`;
      conditions.forEach(condition => {
        context += `- ${condition.condition_name}`;
        if (condition.severity) {
          context += ` (severity: ${condition.severity}/10)`;
        }
        if (condition.diagnosed_on) {
          context += ` diagnosed ${condition.diagnosed_on}`;
        }
        context += '\n';
      });
    }

    // Current medications
    if (medications.length > 0) {
      context += `\nCurrent Medications:\n`;
      medications.forEach(medication => {
        context += `- ${medication.medication_name}`;
        if (medication.dose) {
          context += ` ${medication.dose}`;
        }
        if (medication.frequency) {
          context += ` ${medication.frequency}`;
        }
        context += '\n';
      });
    }

    // Allergies
    if (allergies.length > 0) {
      context += `\nKnown Allergies:\n`;
      allergies.forEach(allergy => {
        context += `- ${allergy.allergen}`;
        if (allergy.severity) {
          context += ` (severity: ${allergy.severity}/10)`;
        }
        if (allergy.reaction) {
          context += ` - reaction: ${allergy.reaction}`;
        }
        context += '\n';
      });
    }

    // Recent symptoms (last 10)
    const recentSymptoms = symptoms.slice(0, 10);
    if (recentSymptoms.length > 0) {
      context += `\nRecent Symptoms (last 10):\n`;
      recentSymptoms.forEach(symptom => {
        context += `- ${symptom.symptom} (severity: ${symptom.severity}/10)`;
        if (symptom.date) {
          context += ` on ${symptom.date}`;
        }
        if (symptom.triggers) {
          context += ` - triggers: ${symptom.triggers}`;
        }
        if (symptom.location) {
          context += ` - location: ${symptom.location}`;
        }
        context += '\n';
      });
    }

    // Recent treatments (last 10)
    const recentTreatments = treatments.slice(0, 10);
    if (recentTreatments.length > 0) {
      context += `\nRecent Treatments (last 10):\n`;
      recentTreatments.forEach(treatment => {
        context += `- ${treatment.name} (${treatment.treatment_type})`;
        if (treatment.dosage) {
          context += ` - ${treatment.dosage}`;
        }
        if (treatment.doctor_recommended) {
          context += ' - doctor recommended';
        }
        if (treatment.completed) {
          context += ' - completed';
        } else {
          context += ' - ongoing';
        }
        context += '\n';
      });
    }

    // Most recent doctor visit
    if (doctorVisits.length > 0) {
      const lastVisit = doctorVisits[0]; // Already sorted by most recent
      context += `\nMost Recent Doctor Visit:\n`;
      context += `- Date: ${new Date(lastVisit.visit_ts).toLocaleDateString()}\n`;
      if (lastVisit.doctor_name) {
        context += `- Doctor: ${lastVisit.doctor_name}\n`;
      }
      if (lastVisit.visit_summary) {
        context += `- Summary: ${lastVisit.visit_summary}\n`;
      }
      if (lastVisit.follow_up_required) {
        context += `- Follow-up required: Yes\n`;
      }
    }

    context += '--- End Patient Context ---\n\n';
    return context;
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const originalInput = inputText.trim();
    setInputText('');
    setIsTyping(true);

    // Build context-enhanced query
    let enhancedQuery = originalInput;
    
    // Add context if we have profile data and this is the first time or user explicitly asks for personalized advice
    if (profile && (!contextInitialized || originalInput.toLowerCase().includes('my') || originalInput.toLowerCase().includes('personal'))) {
      const context = buildUserContext();
      enhancedQuery = context + 'User Question: ' + originalInput;
      
      if (!contextInitialized) {
        setContextInitialized(true);
      }
    }

    // Simulate AI response with context awareness
    setTimeout(() => {
      const botResponse = generateBotResponse(originalInput, enhancedQuery);
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

  const generateBotResponse = (originalInput: string, enhancedQuery: string): string => {
    const input = originalInput.toLowerCase();
    
    // Check if we have context to provide personalized responses
    const hasContext = profile && (conditions.length > 0 || medications.length > 0 || symptoms.length > 0);
    
    if (input.includes('headache') || input.includes('head pain')) {
      let response = "I'm sorry you're experiencing a headache. ";
      
      if (hasContext) {
        // Check for relevant conditions or medications
        const headacheRelatedConditions = conditions.filter(c => 
          c.condition_name.toLowerCase().includes('migraine') || 
          c.condition_name.toLowerCase().includes('headache')
        );
        
        const recentHeadaches = symptoms.filter(s => 
          s.symptom.toLowerCase().includes('headache') || 
          s.symptom.toLowerCase().includes('head')
        );
        
        if (headacheRelatedConditions.length > 0) {
          response += `Given your history of ${headacheRelatedConditions[0].condition_name.toLowerCase()}, `;
        }
        
        if (recentHeadaches.length > 1) {
          response += `I notice you've logged ${recentHeadaches.length} headache episodes recently. `;
        }
        
        // Check for relevant medications
        const painMeds = medications.filter(m => 
          m.medication_name.toLowerCase().includes('ibuprofen') ||
          m.medication_name.toLowerCase().includes('acetaminophen') ||
          m.medication_name.toLowerCase().includes('aspirin')
        );
        
        if (painMeds.length > 0) {
          response += `You're currently taking ${painMeds[0].medication_name} which may help. `;
        }
      }
      
      response += "For immediate relief, try resting in a quiet, dark room and staying hydrated. If headaches persist or worsen, please consider consulting with your healthcare provider. Would you like to log this symptom in your tracker?";
      return response;
    }
    
    if (input.includes('log') || input.includes('track') || input.includes('record')) {
      return "To log a new symptom, tap the 'Log New Symptom' button on your dashboard or go to the Symptoms tab and tap the '+' icon. You can record the symptom type, severity level, and any additional details. Regular tracking helps identify patterns!";
    }
    
    if (input.includes('pattern') || input.includes('trend')) {
      let response = "Your symptom patterns can reveal important insights! ";
      
      if (hasContext && symptoms.length > 0) {
        const mostCommonSymptom = symptoms.reduce((acc, symptom) => {
          acc[symptom.symptom] = (acc[symptom.symptom] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const topSymptom = Object.entries(mostCommonSymptom).sort(([,a], [,b]) => b - a)[0];
        
        if (topSymptom) {
          response += `Based on your recent entries, your most frequent symptom is ${topSymptom[0].toLowerCase()} (${topSymptom[1]} times logged). `;
        }
        
        const avgSeverity = symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length;
        response += `Your average symptom severity is ${avgSeverity.toFixed(1)}/10. `;
      }
      
      response += "To view detailed analytics, tap 'View Trends' on your dashboard. Would you like me to summarize your recent symptom activity?";
      return response;
    }
    
    if (input.includes('anxious') || input.includes('anxiety') || input.includes('worried')) {
      let response = "I understand that feeling anxious can be overwhelming. ";
      
      if (hasContext) {
        const anxietyConditions = conditions.filter(c => 
          c.condition_name.toLowerCase().includes('anxiety') || 
          c.condition_name.toLowerCase().includes('depression')
        );
        
        if (anxietyConditions.length > 0) {
          response += `I see you have a history of ${anxietyConditions[0].condition_name.toLowerCase()}. `;
        }
        
        const anxietyMeds = medications.filter(m => 
          m.medication_name.toLowerCase().includes('sertraline') ||
          m.medication_name.toLowerCase().includes('fluoxetine') ||
          m.medication_name.toLowerCase().includes('lorazepam')
        );
        
        if (anxietyMeds.length > 0) {
          response += `You're currently taking ${anxietyMeds[0].medication_name} for this. `;
        }
      }
      
      response += "Take a moment to breathe deeply. Anxiety can sometimes be related to physical symptoms. If this is a new or concerning symptom, consider logging it and speaking with a healthcare provider. Remember, you're taking positive steps by tracking your health. Is there anything specific triggering your anxiety?";
      return response;
    }
    
    if (input.includes('pain')) {
      let response = "I'm sorry you're experiencing pain. ";
      
      if (hasContext) {
        const painSymptoms = symptoms.filter(s => 
          s.symptom.toLowerCase().includes('pain')
        );
        
        if (painSymptoms.length > 0) {
          const avgPainSeverity = painSymptoms.reduce((sum, s) => sum + s.severity, 0) / painSymptoms.length;
          response += `Looking at your recent pain logs, your average pain level has been ${avgPainSeverity.toFixed(1)}/10. `;
        }
      }
      
      response += "Pain levels and triggers are important to track. Consider logging this symptom with details about location, intensity (1-10 scale), and any potential triggers. If pain is severe or persistent, please don't hesitate to contact your healthcare provider.";
      return response;
    }
    
    if (input.includes('thank') || input.includes('thanks')) {
      return "You're very welcome! I'm here to support you on your health journey. Remember, consistent symptom tracking can provide valuable insights for both you and your healthcare team. Is there anything else I can help you with today?";
    }
    
    // Default empathetic response with context if available
    let response = "Thank you for sharing that with me. ";
    
    if (hasContext) {
      response += "Based on your health profile and recent tracking, ";
    }
    
    response += "every person's health journey is unique, and I'm here to support you. If you're experiencing concerning symptoms, please consider consulting with a healthcare professional. In the meantime, I can help you track symptoms, understand patterns, or guide you through using the app. What would be most helpful for you right now?";
    
    return response;
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
              <Text style={styles.headerSubtitle}>
                {profile ? `Your personalized health guardian` : 'Your compassionate health guardian'}
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
                <Text style={styles.timestamp}>analyzing your health context...</Text>
              </View>
              <View style={[styles.messageBubble, styles.botMessage]}>
                <Text style={styles.typingText}>Your guardian is thinking...</Text>
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