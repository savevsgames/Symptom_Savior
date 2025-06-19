import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { BaseTextInput, BaseButton, BaseCard, SymptomCard } from '@/components/ui';
import { theme } from '@/lib/theme';

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
          <Plus size={20} color={theme.colors.primary[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <BaseTextInput
          placeholder="Search symptoms..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={20} color={theme.colors.text.tertiary} strokeWidth={2} />}
          containerStyle={styles.searchContainer}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map((filter) => (
            <BaseButton
              key={filter.key}
              title={filter.label}
              onPress={() => setSelectedFilter(filter.key)}
              variant={selectedFilter === filter.key ? 'primary' : 'outline'}
              size="sm"
              style={styles.filterButton}
            />
          ))}
        </ScrollView>
      </View>

      {/* Stats Summary */}
      <BaseCard variant="elevated" style={styles.statsCard}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{symptoms.length}</Text>
            <Text style={styles.statLabel}>Total Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <TouchableOpacity style={styles.statItem}>
            <TrendingUp size={20} color={theme.colors.primary[500]} strokeWidth={2} />
            <Text style={styles.statLabel}>View Trends</Text>
          </TouchableOpacity>
        </View>
      </BaseCard>

      {/* Symptoms List */}
      <ScrollView style={styles.symptomsList} showsVerticalScrollIndicator={false}>
        {filteredSymptoms.map((symptom) => (
          <SymptomCard
            key={symptom.id}
            {...symptom}
            onPress={() => {
              // Navigate to symptom detail
            }}
          />
        ))}
        
        {filteredSymptoms.length === 0 && (
          <BaseCard variant="outlined" style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No symptoms found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Start tracking your symptoms'}
            </Text>
          </BaseCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.text.primary,
  },
  
  addButton: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  
  searchSection: {
    paddingHorizontal: theme.spacing['2xl'],
    marginBottom: theme.spacing.lg,
  },
  
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  
  filterContainer: {
    flexDirection: 'row',
  },
  
  filterButton: {
    marginRight: theme.spacing.sm,
  },
  
  statsCard: {
    marginHorizontal: theme.spacing['2xl'],
    marginBottom: theme.spacing.lg,
  },
  
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statNumber: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.primary[500],
    marginBottom: theme.spacing.xs,
  },
  
  statLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  symptomsList: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  
  emptyStateText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  
  emptyStateSubtext: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});