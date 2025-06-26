import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { ConversationView } from '@/components/conversation/ConversationView';
import { Config } from '@/lib/config';

export default function AssistantConversation() {
  return (
    <SafeAreaView style={styles.container}>
      <ConversationView 
        autoStart={false}
        enableVoiceResponse={Config.features.enableVoice}
        enableEmergencyDetection={Config.features.enableEmergencyDetection}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});