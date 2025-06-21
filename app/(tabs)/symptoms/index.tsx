import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { BaseTextInput, BaseButton, BaseCard, SymptomCard } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

export default function Symptoms() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { symptoms, loading, refetch } = useSymptoms();

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'minimal', label: 'Minimal (1-2)' },
    { key: 'mild', label: 'Mild (3-4)' },
    { key: 'moderate', label: 'Moderate (5-6)' },
    { key: 'severe', label: 'Severe (7-8)' },
    { key: 'very-severe', label: 'Very Severe (9-10)' },
  ];

  const filteredSymptoms = symptoms.filter(symptom => {
    const matchesSearch = symptom.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (symptom.description && symptom.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (symptom.triggers && symptom.triggers.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'minimal') return matchesSearch && symptom.severity <= 2;
    if (selectedFilter === 'mild') return matchesSearch && symptom.severity >= 3 && symptom.severity <= 4;
    if (selectedFilter === 'moderate') return matchesSearch && symptom.severity >= 5 && symptom.severity <= 6;
    if (selectedFilter === 'severe') return matchesSearch && symptom.severity >= 7 && symptom.severity <= 8;
    if (selectedFilter === 'very-severe') return matchesSearch && symptom.severity >= 9;
    
    return matchesSearch;
  });

  const getStatsForPeriod = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return symptoms.filter(symptom => {
      const symptomDate = new Date(symptom.created_at);
      return symptomDate >= cutoffDate;
    });
  };

  const thisWeekSymptoms = getStatsForPeriod(7);
  const avgSeverity = symptoms.length > 0 
    ? (symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)
    : '0';

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
          placeholder="Search symptoms, descriptions, or triggers..."
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
            <Text style={styles.statNumber}>{thisWeekSymptoms.length}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{avgSeverity}</Text>
            <Text style={styles.statLabel}>Avg. Severity</Text>
          </View>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push('/trends')}>
            <TrendingUp size={20} color={theme.colors.primary[500]} strokeWidth={2} />
            <Text style={styles.statLabel}>View Trends</Text>
          </TouchableOpacity>
        </View>
      </BaseCard>

      {/* Symptoms List */}
      <ScrollView 
        style={styles.symptomsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {loading && symptoms.length === 0 ? (
          <BaseCard variant="outlined" style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading symptoms...</Text>
          </BaseCard>
        ) : filteredSymptoms.length > 0 ? (
          filteredSymptoms.map((symptom) => (
            <SymptomCard
              key={symptom.id}
              {...symptom}
              onPress={() => {
                router.push(`/(tabs)/symptoms/${symptom.id}`);
              }}
            />
          ))
        ) : (
          <BaseCard variant="outlined" style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedFilter !== 'all' ? 'No symptoms found' : 'No symptoms logged yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start tracking your symptoms to see them here'
              }
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <BaseButton
                title="Log Your First Symptom"
                onPress={() => router.push('/add-symptom')}
                variant="primary"
                size="md"
                style={styles.emptyStateButton}
              />
            )}
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
  
  loadingState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
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
    marginBottom: theme.spacing.lg,
  },
  
  emptyStateButton: {
    marginTop: theme.spacing.md,
  },
});