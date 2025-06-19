import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, Calendar, Clock, CircleAlert as AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface SymptomEntry {
  id: string;
  symptom: string;
  severity: number;
  date: string;
  time: string;
}

export default function Dashboard() {
  const [recentSymptoms] = useState<SymptomEntry[]>([
    { id: '1', symptom: 'Headache', severity: 3, date: 'Today', time: '2:30 PM' },
    { id: '2', symptom: 'Fatigue', severity: 2, date: 'Yesterday', time: '10:15 AM' },
    { id: '3', symptom: 'Nausea', severity: 4, date: '2 days ago', time: '6:45 PM' },
  ]);

  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return '#10B981';
    if (severity <= 3) return '#F59E0B';
    return '#EF4444';
  };

  const getSeverityText = (severity: number) => {
    if (severity <= 2) return 'Mild';
    if (severity <= 3) return 'Moderate';
    return 'Severe';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.primaryActionButton}
            onPress={() => router.push('/add-symptom')}
          >
            <Plus size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.primaryActionText}>Log New Symptom</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryActionButton}>
              <TrendingUp size={20} color="#0066CC" strokeWidth={2} />
              <Text style={styles.secondaryActionText}>View Trends</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryActionButton}>
              <Calendar size={20} color="#0066CC" strokeWidth={2} />
              <Text style={styles.secondaryActionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Health Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Symptoms Logged</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>7.5</Text>
              <Text style={styles.statLabel}>Avg. Wellness</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>Good Days</Text>
            </View>
          </View>
        </View>

        {/* Recent Symptoms */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            <TouchableOpacity onPress={() => router.push('/symptoms')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentSymptoms.map((symptom) => (
            <View key={symptom.id} style={styles.symptomCard}>
              <View style={styles.symptomHeader}>
                <Text style={styles.symptomName}>{symptom.symptom}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(symptom.severity) }]}>
                  <Text style={styles.severityText}>{getSeverityText(symptom.severity)}</Text>
                </View>
              </View>
              <View style={styles.symptomMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={14} color="#64748B" strokeWidth={2} />
                  <Text style={styles.metaText}>{symptom.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={14} color="#64748B" strokeWidth={2} />
                  <Text style={styles.metaText}>{symptom.time}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Health Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <AlertCircle size={20} color="#0066CC" strokeWidth={2} />
            <Text style={styles.tipTitle}>Daily Health Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Regular symptom tracking helps identify patterns and triggers. Try to log symptoms as they occur for the most accurate data.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#64748B',
  },
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  primaryActionButton: {
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryActionButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 0.48,
  },
  secondaryActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 6,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#0066CC',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1E293B',
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#0066CC',
  },
  symptomCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#1E293B',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  symptomMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  tipCard: {
    backgroundColor: '#EBF8FF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0066CC',
    marginLeft: 8,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});