import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { BaseButton, BaseCard, SymptomCard } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { useAuthContext } from '@/contexts/AuthContext';
import { theme } from '@/lib/theme';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { symptoms, loading } = useSymptoms();
  const { user } = useAuthContext();
  
  // Get recent symptoms (last 3)
  const recentSymptoms = symptoms.slice(0, 3);
  
  // Calculate stats
  const todaySymptoms = symptoms.filter(s => s.date === new Date().toLocaleDateString()).length;
  const avgSeverity = symptoms.length > 0 
    ? (symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length).toFixed(1)
    : '0';
  const goodDaysPercent = symptoms.length > 0
    ? Math.round((symptoms.filter(s => s.severity <= 2).length / symptoms.length) * 100)
    : 100;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.subtitle}>How are you feeling today?</Text>
            </View>
            <Image 
              source={require('@/assets/images/symptom_savior_concept_art_04_guardianagent.png')}
              style={styles.guardianImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <BaseButton
            title="Log New Symptom"
            onPress={() => router.push('/add-symptom')}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.primaryAction}
          />
          
          <View style={styles.secondaryActions}>
            <BaseButton
              title="View Trends"
              onPress={() => router.push('/(tabs)/symptoms')}
              variant="outline"
              size="md"
              style={styles.secondaryAction}
            />
            
            <BaseButton
              title="Ask Guardian"
              onPress={() => router.push('/(tabs)/assistant')}
              variant="outline"
              size="md"
              style={styles.secondaryAction}
            />
          </View>
        </View>

        {/* Health Summary */}
        <BaseCard variant="elevated" style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{todaySymptoms}</Text>
              <Text style={styles.statLabel}>Symptoms Logged</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{avgSeverity}</Text>
              <Text style={styles.statLabel}>Avg. Severity</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{goodDaysPercent}%</Text>
              <Text style={styles.statLabel}>Good Days</Text>
            </View>
          </View>
        </BaseCard>

        {/* Recent Symptoms */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            <BaseButton
              title="View All"
              onPress={() => router.push('/(tabs)/symptoms')}
              variant="ghost"
              size="sm"
            />
          </View>
          
          {loading ? (
            <BaseCard variant="outlined" style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading symptoms...</Text>
            </BaseCard>
          ) : recentSymptoms.length > 0 ? (
            recentSymptoms.map((symptom) => (
              <SymptomCard
                key={symptom.id}
                {...symptom}
                onPress={() => {
                  // Navigate to symptom detail when implemented
                }}
              />
            ))
          ) : (
            <BaseCard variant="outlined" style={styles.emptyCard}>
              <Text style={styles.emptyText}>No symptoms logged yet</Text>
              <Text style={styles.emptySubtext}>Tap "Log New Symptom" to get started</Text>
            </BaseCard>
          )}
        </View>

        {/* Guardian Tip */}
        <BaseCard variant="filled" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Image 
              source={require('@/assets/images/symptom_savior_concept_art_04_guardianagent.png')}
              style={styles.tipAvatar}
              resizeMode="contain"
            />
            <Text style={styles.tipTitle}>Guardian's Daily Wisdom</Text>
          </View>
          <Text style={styles.tipText}>
            Regular symptom tracking helps identify patterns and triggers. Try to log symptoms as they occur for the most accurate data. Your guardian is always here to help guide you on your health journey.
          </Text>
          <BaseButton
            title="Chat with Guardian"
            onPress={() => router.push('/(tabs)/assistant')}
            variant="primary"
            size="sm"
            style={styles.tipButton}
          />
        </BaseCard>
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
    padding: theme.spacing['2xl'],
    paddingBottom: theme.spacing.lg,
  },
  
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  greeting: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  
  guardianImage: {
    width: 80,
    height: 80,
  },
  
  quickActions: {
    paddingHorizontal: theme.spacing['2xl'],
    marginBottom: theme.spacing['2xl'],
  },
  
  primaryAction: {
    marginBottom: theme.spacing.md,
  },
  
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  secondaryAction: {
    flex: 0.48,
  },
  
  summaryCard: {
    marginHorizontal: theme.spacing['2xl'],
    marginBottom: theme.spacing['2xl'],
  },
  
  cardTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
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
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.primary[500],
    marginBottom: theme.spacing.xs,
  },
  
  statLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.lg,
  },
  
  recentSection: {
    paddingHorizontal: theme.spacing['2xl'],
    marginBottom: theme.spacing['2xl'],
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
  
  loadingCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  
  emptyText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  
  emptySubtext: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  
  tipCard: {
    marginHorizontal: theme.spacing['2xl'],
    marginBottom: theme.spacing['2xl'],
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[100],
  },
  
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  tipAvatar: {
    width: 24,
    height: 24,
    marginRight: theme.spacing.sm,
  },
  
  tipTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
  },
  
  tipText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  
  tipButton: {
    alignSelf: 'flex-start',
  },
});