import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import { BaseCard } from './BaseCard';
import { theme } from '@/lib/theme';

export interface SymptomCardProps {
  id: string;
  symptom: string;
  severity: number;
  description?: string;
  date: string;
  time: string;
  triggers?: string[];
  onPress?: () => void;
}

export function SymptomCard({
  symptom,
  severity,
  description,
  date,
  time,
  triggers,
  onPress,
}: SymptomCardProps) {
  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return theme.colors.success[500];
    if (severity <= 3) return theme.colors.warning[500];
    return theme.colors.error[500];
  };

  const getSeverityText = (severity: number) => {
    if (severity <= 2) return 'Mild';
    if (severity <= 3) return 'Moderate';
    return 'Severe';
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <BaseCard variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.symptomInfo}>
            <Text style={styles.symptomName}>{symptom}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) }]}>
              <Text style={styles.severityText}>{getSeverityText(severity)}</Text>
            </View>
          </View>
          
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.metaText}>{date}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.metaText}>{time}</Text>
            </View>
          </View>
        </View>

        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {triggers && triggers.length > 0 && (
          <View style={styles.triggersContainer}>
            <Text style={styles.triggersLabel}>Triggers:</Text>
            <View style={styles.triggersList}>
              {triggers.slice(0, 3).map((trigger, index) => (
                <View key={index} style={styles.triggerTag}>
                  <Text style={styles.triggerText}>{trigger}</Text>
                </View>
              ))}
              {triggers.length > 3 && (
                <Text style={styles.moreTriggersText}>+{triggers.length - 3} more</Text>
              )}
            </View>
          </View>
        )}
      </BaseCard>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  
  header: {
    marginBottom: theme.spacing.sm,
  },
  
  symptomInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  symptomName: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  severityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  
  severityText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.inverse,
  },
  
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  
  metaText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
  },
  
  description: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },
  
  triggersContainer: {
    marginTop: theme.spacing.sm,
  },
  
  triggersLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  triggersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  
  triggerTag: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  
  triggerText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  
  moreTriggersText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});