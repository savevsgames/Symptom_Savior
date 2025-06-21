import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, TrendingUp, Calendar, BarChart3, PieChart, Activity, Target } from 'lucide-react-native';
import { BaseCard, BaseButton } from '@/components/ui';
import { useSymptoms } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

const { width } = Dimensions.get('window');
const chartWidth = width - 48; // Account for padding

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface InsightData {
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
  icon: React.ComponentType<any>;
}

export default function Trends() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | '3months'>('week');
  const { symptoms, treatments } = useSymptoms();

  const periods = [
    { key: 'week', label: '7 Days', days: 7 },
    { key: 'month', label: '30 Days', days: 30 },
    { key: '3months', label: '90 Days', days: 90 },
  ];

  // Filter data by selected period
  const getFilteredData = () => {
    const selectedDays = periods.find(p => p.key === selectedPeriod)?.days || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedDays);

    const filteredSymptoms = symptoms.filter(symptom => {
      const symptomDate = new Date(symptom.created_at);
      return symptomDate >= cutoffDate;
    });

    const filteredTreatments = treatments.filter(treatment => {
      const treatmentDate = new Date(treatment.created_at);
      return treatmentDate >= cutoffDate;
    });

    return { filteredSymptoms, filteredTreatments };
  };

  const { filteredSymptoms, filteredTreatments } = getFilteredData();

  // Generate frequency chart data (symptoms per day)
  const generateFrequencyData = (): ChartData[] => {
    const days = periods.find(p => p.key === selectedPeriod)?.days || 7;
    const data: ChartData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const symptomsOnDay = filteredSymptoms.filter(symptom => {
        const symptomDate = new Date(symptom.created_at);
        return symptomDate.toDateString() === date.toDateString();
      }).length;

      data.push({
        label: dateStr,
        value: symptomsOnDay,
        color: symptomsOnDay > 2 ? theme.colors.error[500] : 
               symptomsOnDay > 0 ? theme.colors.warning[500] : 
               theme.colors.success[500]
      });
    }
    
    return data;
  };

  // Generate severity trend data
  const generateSeverityData = (): ChartData[] => {
    const days = periods.find(p => p.key === selectedPeriod)?.days || 7;
    const data: ChartData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const symptomsOnDay = filteredSymptoms.filter(symptom => {
        const symptomDate = new Date(symptom.created_at);
        return symptomDate.toDateString() === date.toDateString();
      });

      const avgSeverity = symptomsOnDay.length > 0 
        ? symptomsOnDay.reduce((sum, s) => sum + s.severity, 0) / symptomsOnDay.length
        : 0;

      data.push({
        label: dateStr,
        value: avgSeverity,
        color: avgSeverity > 6 ? theme.colors.error[500] : 
               avgSeverity > 3 ? theme.colors.warning[500] : 
               theme.colors.success[500]
      });
    }
    
    return data;
  };

  // Generate symptom distribution data
  const generateDistributionData = (): ChartData[] => {
    const symptomCounts: Record<string, number> = {};
    
    filteredSymptoms.forEach(symptom => {
      symptomCounts[symptom.symptom] = (symptomCounts[symptom.symptom] || 0) + 1;
    });

    const colors = [
      theme.colors.primary[500],
      theme.colors.secondary[500],
      theme.colors.warning[500],
      theme.colors.error[500],
      theme.colors.success[500],
    ];

    return Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom, count], index) => ({
        label: symptom,
        value: count,
        color: colors[index % colors.length]
      }));
  };

  // Generate insights
  const generateInsights = (): InsightData[] => {
    const insights: InsightData[] = [];
    
    // Frequency insight
    const totalSymptoms = filteredSymptoms.length;
    const days = periods.find(p => p.key === selectedPeriod)?.days || 7;
    const avgPerDay = totalSymptoms / days;
    
    if (avgPerDay < 0.5) {
      insights.push({
        title: 'Great Progress!',
        description: `You're averaging only ${avgPerDay.toFixed(1)} symptoms per day. Keep up the excellent work!`,
        type: 'positive',
        icon: Target
      });
    } else if (avgPerDay > 2) {
      insights.push({
        title: 'High Activity Period',
        description: `You've logged ${avgPerDay.toFixed(1)} symptoms per day on average. Consider discussing patterns with your healthcare provider.`,
        type: 'warning',
        icon: TrendingUp
      });
    }

    // Severity insight
    const avgSeverity = filteredSymptoms.length > 0 
      ? filteredSymptoms.reduce((sum, s) => sum + s.severity, 0) / filteredSymptoms.length
      : 0;
    
    if (avgSeverity < 3) {
      insights.push({
        title: 'Mild Symptoms',
        description: `Your average symptom severity is ${avgSeverity.toFixed(1)}/10, indicating mostly mild symptoms.`,
        type: 'positive',
        icon: Activity
      });
    } else if (avgSeverity > 6) {
      insights.push({
        title: 'Elevated Severity',
        description: `Your average symptom severity is ${avgSeverity.toFixed(1)}/10. Consider seeking medical advice if this persists.`,
        type: 'warning',
        icon: Activity
      });
    }

    // Most common symptom
    const distributionData = generateDistributionData();
    if (distributionData.length > 0) {
      const mostCommon = distributionData[0];
      insights.push({
        title: 'Most Frequent Symptom',
        description: `${mostCommon.label} appears most often (${mostCommon.value} times). Consider tracking triggers for this symptom.`,
        type: 'neutral',
        icon: BarChart3
      });
    }

    // Treatment insight
    const activeTreatments = filteredTreatments.filter(t => !t.completed);
    if (activeTreatments.length > 0) {
      insights.push({
        title: 'Active Treatments',
        description: `You have ${activeTreatments.length} active treatment${activeTreatments.length > 1 ? 's' : ''}. Track their effectiveness by logging symptoms.`,
        type: 'neutral',
        icon: Target
      });
    }

    return insights;
  };

  const frequencyData = generateFrequencyData();
  const severityData = generateSeverityData();
  const distributionData = generateDistributionData();
  const insights = generateInsights();

  // Simple bar chart component
  const BarChart = ({ data, title, yAxisLabel }: { data: ChartData[], title: string, yAxisLabel: string }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const chartHeight = 200;
    
    return (
      <BaseCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartContainer}>
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{yAxisLabel}</Text>
            <View style={styles.yAxisTicks}>
              {[maxValue, Math.round(maxValue * 0.5), 0].map((tick, index) => (
                <Text key={index} style={styles.yAxisTick}>
                  {tick.toFixed(tick < 1 ? 1 : 0)}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.chart}>
            <View style={styles.bars}>
              {data.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: (item.value / maxValue) * (chartHeight - 40),
                        backgroundColor: item.color,
                      }
                    ]}
                  />
                  <Text style={styles.barLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </BaseCard>
    );
  };

  // Simple line chart component
  const LineChart = ({ data, title, yAxisLabel }: { data: ChartData[], title: string, yAxisLabel: string }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const chartHeight = 200;
    
    return (
      <BaseCard style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartContainer}>
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{yAxisLabel}</Text>
            <View style={styles.yAxisTicks}>
              {[maxValue, Math.round(maxValue * 0.5), 0].map((tick, index) => (
                <Text key={index} style={styles.yAxisTick}>
                  {tick.toFixed(1)}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.chart}>
            <View style={styles.lineChart}>
              {data.map((item, index) => (
                <View key={index} style={styles.linePoint}>
                  <View
                    style={[
                      styles.point,
                      {
                        bottom: (item.value / maxValue) * (chartHeight - 60),
                        backgroundColor: item.color,
                      }
                    ]}
                  />
                  <Text style={styles.lineLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </BaseCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Trends</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <BaseButton
              key={period.key}
              title={period.label}
              onPress={() => setSelectedPeriod(period.key as any)}
              variant={selectedPeriod === period.key ? 'primary' : 'outline'}
              size="sm"
              style={styles.periodButton}
            />
          ))}
        </View>

        {/* Summary Stats */}
        <BaseCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {periods.find(p => p.key === selectedPeriod)?.label} Summary
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{filteredSymptoms.length}</Text>
              <Text style={styles.summaryLabel}>Total Symptoms</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>
                {filteredSymptoms.length > 0 
                  ? (filteredSymptoms.reduce((sum, s) => sum + s.severity, 0) / filteredSymptoms.length).toFixed(1)
                  : '0'
                }
              </Text>
              <Text style={styles.summaryLabel}>Avg Severity</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{filteredTreatments.length}</Text>
              <Text style={styles.summaryLabel}>Treatments</Text>
            </View>
          </View>
        </BaseCard>

        {/* Charts */}
        {filteredSymptoms.length > 0 ? (
          <>
            <BarChart 
              data={frequencyData} 
              title="Symptom Frequency" 
              yAxisLabel="Count"
            />
            
            <LineChart 
              data={severityData} 
              title="Average Severity Trend" 
              yAxisLabel="Severity"
            />

            {distributionData.length > 0 && (
              <BaseCard style={styles.chartCard}>
                <Text style={styles.chartTitle}>Most Common Symptoms</Text>
                <View style={styles.distributionChart}>
                  {distributionData.map((item, index) => (
                    <View key={index} style={styles.distributionItem}>
                      <View style={styles.distributionBar}>
                        <View
                          style={[
                            styles.distributionFill,
                            {
                              width: `${(item.value / distributionData[0].value) * 100}%`,
                              backgroundColor: item.color,
                            }
                          ]}
                        />
                      </View>
                      <View style={styles.distributionLabel}>
                        <Text style={styles.distributionSymptom}>{item.label}</Text>
                        <Text style={styles.distributionCount}>{item.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </BaseCard>
            )}
          </>
        ) : (
          <BaseCard style={styles.emptyState}>
            <PieChart size={48} color={theme.colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.emptyStateTitle}>No Data Available</Text>
            <Text style={styles.emptyStateText}>
              Start logging symptoms to see your health trends and patterns.
            </Text>
            <BaseButton
              title="Log Your First Symptom"
              onPress={() => router.push('/add-symptom')}
              variant="primary"
              size="md"
              style={styles.emptyStateButton}
            />
          </BaseCard>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.insightsTitle}>Health Insights</Text>
            {insights.map((insight, index) => (
              <BaseCard key={index} style={[
                styles.insightCard,
                insight.type === 'positive' && styles.insightPositive,
                insight.type === 'warning' && styles.insightWarning,
              ]}>
                <View style={styles.insightHeader}>
                  <insight.icon 
                    size={20} 
                    color={
                      insight.type === 'positive' ? theme.colors.success[600] :
                      insight.type === 'warning' ? theme.colors.warning[600] :
                      theme.colors.primary[600]
                    } 
                    strokeWidth={2} 
                  />
                  <Text style={[
                    styles.insightTitle,
                    insight.type === 'positive' && styles.insightTitlePositive,
                    insight.type === 'warning' && styles.insightTitleWarning,
                  ]}>
                    {insight.title}
                  </Text>
                </View>
                <Text style={[
                  styles.insightDescription,
                  insight.type === 'positive' && styles.insightDescriptionPositive,
                  insight.type === 'warning' && styles.insightDescriptionWarning,
                ]}>
                  {insight.description}
                </Text>
              </BaseCard>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <BaseButton
            title="Log New Symptom"
            onPress={() => router.push('/add-symptom')}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.actionButton}
          />
          <BaseButton
            title="View Symptom History"
            onPress={() => router.push('/(tabs)/symptoms')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.actionButton}
          />
        </View>
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
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  
  backButton: {
    padding: theme.spacing.sm,
  },
  
  headerTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  
  headerSpacer: {
    width: 40,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
  },
  
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  
  periodButton: {
    flex: 1,
  },
  
  summaryCard: {
    marginBottom: theme.spacing.lg,
  },
  
  summaryTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  
  summaryItem: {
    alignItems: 'center',
  },
  
  summaryNumber: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.primary[500],
    marginBottom: theme.spacing.xs,
  },
  
  summaryLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  chartCard: {
    marginBottom: theme.spacing.lg,
  },
  
  chartTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  
  chartContainer: {
    flexDirection: 'row',
    height: 200,
  },
  
  yAxis: {
    width: 50,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: theme.spacing.sm,
  },
  
  yAxisLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    transform: [{ rotate: '-90deg' }],
    position: 'absolute',
    left: -10,
    top: 80,
  },
  
  yAxisTicks: {
    height: 160,
    justifyContent: 'space-between',
  },
  
  yAxisTick: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  
  chart: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    justifyContent: 'space-around',
  },
  
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  
  bar: {
    width: 20,
    borderRadius: 2,
    marginBottom: theme.spacing.sm,
  },
  
  barLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  
  lineChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
    justifyContent: 'space-around',
    position: 'relative',
  },
  
  linePoint: {
    alignItems: 'center',
    flex: 1,
    height: 160,
  },
  
  point: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  
  lineLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    position: 'absolute',
    bottom: 0,
  },
  
  distributionChart: {
    gap: theme.spacing.md,
  },
  
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  distributionBar: {
    flex: 1,
    height: 24,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.md,
  },
  
  distributionFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  
  distributionLabel: {
    width: 80,
    alignItems: 'flex-end',
  },
  
  distributionSymptom: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  
  distributionCount: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['4xl'],
  },
  
  emptyStateTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  
  emptyStateText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  emptyStateButton: {
    marginTop: theme.spacing.md,
  },
  
  insightsSection: {
    marginBottom: theme.spacing.lg,
  },
  
  insightsTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  
  insightCard: {
    marginBottom: theme.spacing.md,
  },
  
  insightPositive: {
    backgroundColor: theme.colors.success[50],
    borderWidth: 1,
    borderColor: theme.colors.success[200],
  },
  
  insightWarning: {
    backgroundColor: theme.colors.warning[50],
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
  },
  
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  insightTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  insightTitlePositive: {
    color: theme.colors.success[700],
  },
  
  insightTitleWarning: {
    color: theme.colors.warning[700],
  },
  
  insightDescription: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  
  insightDescriptionPositive: {
    color: theme.colors.success[600],
  },
  
  insightDescriptionWarning: {
    color: theme.colors.warning[600],
  },
  
  actionButtons: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing['2xl'],
  },
  
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
});