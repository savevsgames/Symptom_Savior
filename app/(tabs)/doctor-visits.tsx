import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, Calendar, AlertCircle, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { BaseTextInput, BaseButton, BaseCard, DoctorVisitCard } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

export default function DoctorVisits() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const { doctorVisits, loading, refetch } = useSymptoms();

  const filterOptions = [
    { key: 'all', label: 'All' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'follow-up', label: 'Follow-up Required' },
  ];

  const filteredVisits = doctorVisits.filter(visit => {
    const matchesSearch = (visit.doctor_name && visit.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (visit.location && visit.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (visit.visit_summary && visit.visit_summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const visitDate = new Date(visit.visit_ts);
    const now = new Date();
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'upcoming') return matchesSearch && visitDate > now;
    if (selectedFilter === 'past') return matchesSearch && visitDate < now;
    if (selectedFilter === 'follow-up') return matchesSearch && visit.follow_up_required;
    
    return matchesSearch;
  });

  const getVisitStats = () => {
    const now = new Date();
    const upcoming = doctorVisits.filter(v => new Date(v.visit_ts) > now);
    const past = doctorVisits.filter(v => new Date(v.visit_ts) < now);
    const followUp = doctorVisits.filter(v => v.follow_up_required);
    
    return { upcoming: upcoming.length, past: past.length, followUp: followUp.length };
  };

  const stats = getVisitStats();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Doctor Visits</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-doctor-visit')}
        >
          <Plus size={20} color={theme.colors.primary[500]} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <BaseTextInput
          placeholder="Search doctors, locations, or visit notes..."
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
            <Text style={styles.statNumber}>{doctorVisits.length}</Text>
            <Text style={styles.statLabel}>Total Visits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.past}</Text>
            <Text style={styles.statLabel}>Past</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.followUp}</Text>
            <Text style={styles.statLabel}>Follow-up</Text>
          </View>
        </View>
      </BaseCard>

      {/* Visits List */}
      <ScrollView 
        style={styles.visitsList} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      >
        {loading && doctorVisits.length === 0 ? (
          <BaseCard variant="outlined" style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading visits...</Text>
          </BaseCard>
        ) : filteredVisits.length > 0 ? (
          filteredVisits.map((visit) => (
            <DoctorVisitCard
              key={visit.id}
              {...visit}
              onPress={() => {
                // TODO: Navigate to visit detail in Phase 2
                console.log('Navigate to visit detail:', visit.id);
              }}
            />
          ))
        ) : (
          <BaseCard variant="outlined" style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedFilter !== 'all' ? 'No visits found' : 'No doctor visits logged yet'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start tracking your medical appointments to see them here'
              }
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <BaseButton
                title="Add Your First Visit"
                onPress={() => router.push('/add-doctor-visit')}
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
  
  visitsList: {
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