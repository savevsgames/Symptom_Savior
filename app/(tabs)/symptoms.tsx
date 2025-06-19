import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Plus, Calendar, Clock, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';

interface SymptomEntry {
  id: string;
  symptom: string;
  severity: number;
  description: string;
  date: string;
  time: string;
  triggers?: string[];
}

export default function Symptoms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const [symptoms] = useState<SymptomEntry[]>([
    {
      id: '1',
      symptom: 'Headache',
      severity: 3,
      description: 'Tension headache, pressure around temples',
      date: 'Today',
      time: '2:30 PM',
      triggers: ['Stress', 'Screen time']
    },
    {
      id: '2',
      symptom: 'Fatigue',
      severity: 2,
      description: 'General tiredness, low energy',
      date: 'Yesterday',
      time: '10:15 AM',
      triggers: ['Poor sleep']
    },
    {
      id: '3',
      symptom: 'Nausea',
      severity: 4,
      description: 'Strong nausea after eating, lasted 2 hours',
      date: '2 days ago',
      time: '6:45 PM',
      triggers: ['Spicy food']
    },
    {
      id: '4',
      symptom: 'Joint Pain',
      severity: 2,
      description: 'Mild stiffness in knees and wrists',
      date: '3 days ago',
      time: '8:00 AM',
      triggers: ['Weather', 'Activity']
    },
    {
      id: '5',
      symptom: 'Dizziness',
      severity: 3,
      description: 'Light-headed when standing up',
      date: '4 days ago',
      time: '11:30 AM',
      triggers: ['Dehydration']
    },
  ]);

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'mild', label: 'Mild' },
    { key: 'moderate', label: 'Moderate' },
    { key: 'severe', label: 'Severe' },
  ];

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

  const filteredSymptoms = symptoms.filter(symptom => {
    const matchesSearch = symptom.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         symptom.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'mild') return matchesSearch && symptom.severity <= 2;
    if (selectedFilter === 'moderate') return matchesSearch && symptom.severity === 3;
    if (selectedFilter === 'severe') return matchesSearch && symptom.severity >= 4;
    
    return matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Symptom History</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-symptom')}
        >
          <Plus size={20} color="#0066CC" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748B" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search symptoms..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter.key && styles.filterButtonTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{symptoms.length}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <TouchableOpacity style={styles.statCard}>
          <TrendingUp size={20} color="#0066CC" strokeWidth={2} />
          <Text style={styles.statLabel}>View Trends</Text>
        </TouchableOpacity>
      </View>

      {/* Symptoms List */}
      <ScrollView style={styles.symptomsList} showsVerticalScrollIndicator={false}>
        {filteredSymptoms.map((symptom) => (
          <TouchableOpacity key={symptom.id} style={styles.symptomCard}>
            <View style={styles.symptomHeader}>
              <View style={styles.symptomInfo}>
                <Text style={styles.symptomName}>{symptom.symptom}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(symptom.severity) }]}>
                  <Text style={styles.severityText}>{getSeverityText(symptom.severity)}</Text>
                </View>
              </View>
              <View style={styles.symptomMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={12} color="#64748B" strokeWidth={2} />
                  <Text style={styles.metaText}>{symptom.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={12} color="#64748B" strokeWidth={2} />
                  <Text style={styles.metaText}>{symptom.time}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.symptomDescription}>{symptom.description}</Text>
            
            {symptom.triggers && symptom.triggers.length > 0 && (
              <View style={styles.triggersContainer}>
                <Text style={styles.triggersLabel}>Triggers:</Text>
                <View style={styles.triggersList}>
                  {symptom.triggers.map((trigger, index) => (
                    <View key={index} style={styles.triggerTag}>
                      <Text style={styles.triggerText}>{trigger}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
        
        {filteredSymptoms.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No symptoms found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Start tracking your symptoms'}
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  filterButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#0066CC',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  symptomsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  symptomCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  symptomHeader: {
    marginBottom: 8,
  },
  symptomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  symptomDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  triggersContainer: {
    marginTop: 8,
  },
  triggersLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  triggersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  triggerTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  triggerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#475569',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});