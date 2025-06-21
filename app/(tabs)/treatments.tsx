import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Filter, CheckCircle, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { BaseTextInput, BaseButton, BaseCard, TreatmentCard } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

export default function Treatments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { treatments, loading, refetch } = useSymptoms();

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'medication', label: 'Medications' },
    { key: 'supplement', label: 'Supplements' },
    { key: 'exercise', label: 'Exercise' },
    { key: 'therapy', label: 'Therapy' },
    { key: 'doctor', label: 'Doctor Recommended' },
  ];

  const filteredTreatments = treatments.filter(treatment => {
    const matchesSearch = treatment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (treatment.description && treatment.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         treatment.treatment_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'active') return matchesSearch && !treatment.completed;
    if (selectedFilter === 'completed') return matchesSearch && treatment.completed;
    if (selectedFilter === 'doctor') return matchesSearch && treatment.doctor_recommended;
    if (['medication', 'supplement', 'exercise', 'therapy', 'other'].includes(selectedFilter)) {
      return matchesSearch && treatment.treatment_type === selectedFilter;
    }
    
    return matchesSearch;
  });

  const getStatsForPeriod = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return treatments.filter(treatment => {
      const treatmentDate = new Date(treatment.created_at);
      return treatmentDate >= cutoffDate;
    });
  };

  const activeTreatments = treatments.filter(t => !t.completed);
  const completedTreatments = treatments.filter(t => t.completed);
  const doctorRecommended = treatments.filter(t => t.doctor_recommended);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Treatments</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-treatment')}
        >
          <Plus size={20} color={theme.colors.primary[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <BaseTextInput
          placeholder="Search treatments, medications, exercises..."
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
            <Text style={styles.statNumber}>{treatments.length}</Text>
            <Text style={styles.statLabel}>Total Treatments</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeTreatments.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedTreatments.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{doctorRecommended.length}</Text>
            <Text style={styles.statLabel}>Doctor Recommended</Text>
          </View>
        </View>
      </BaseCard>

      {/* Treatments List */}
      <ScrollView 
        style={styles.treatmentsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {loading && treatments.length === 0 ? (
          <BaseCard variant="outlined" style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading treatments...</Text>
          </BaseCard>
        ) : filteredTreatments.length > 0 ? (
          filteredTreatments.map((treatment) => (
            <TreatmentCard
              key={treatment.id}
              {...treatment}
              onPress={() => {
                // TODO: Navigate to treatment detail in Phase 2
                console.log('Navigate to treatment detail:', treatment.id);
              }}
            />
          ))
        ) : (
          <BaseCard variant="outlined" style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedFilter !== 'all' ? 'No treatments found' : 'No treatments logged yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start tracking your treatments to see them here'
              }
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <BaseButton
                title="Add Your First Treatment"
                onPress={() => router.push('/add-treatment')}
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
  
  treatmentsList: {
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