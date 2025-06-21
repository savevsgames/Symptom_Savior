import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { BaseCard } from './BaseCard';
import { theme } from '@/lib/theme';

export interface SymptomCardProps {
  id: string;
  symptom: string;
  severity: number;
  description?: string;
  date: string;
  time: string;
  triggers?: string;
  duration_hours?: number;
  location?: string;
  onPress?: () => void;
}

export function SymptomCard({
  symptom,
  severity,
  description,
  date,
  time,
  triggers,
  duration_hours,
  location,
  onPress,
}: SymptomCardProps) {
  const getSeverityColor = (severity: number) => {
    if (severity <= 2) return theme.colors.success[500];
    if (severity <= 4) return theme.colors.warning[400];
    if (severity <= 6) return theme.colors.warning[500];
    if (severity <= 8) return theme.colors.error[500];
    return theme.colors.error[600];
  };

  const getSeverityText = (severity: number) => {
    if (severity <= 2) return 'Minimal';
    if (severity <= 4) return 'Mild';
    if (severity <= 6) return 'Moderate';
    if (severity <= 8) return 'Severe';
    return 'Very Severe';
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <BaseCard variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.symptomInfo}>
            <Text style={styles.symptomName}>{symptom}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(severity) }]}>
              <Text style={styles.severityText}>{severity}/10</Text>
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

        {location && (
          <View style={styles.locationContainer}>
            <MapPin size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        )}

        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {duration_hours && (
          <View style={styles.durationContainer}>
            <Clock size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.durationText}>
              Duration: {duration_hours} hour{duration_hours !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {triggers && (
          <View style={styles.triggersContainer}>
            <Text style={styles.triggersLabel}>Triggers:</Text>
            <Text style={styles.triggersText} numberOfLines={1}>
              {triggers}
            </Text>
          </View>
        )}

        <View style={styles.severityIndicator}>
          <Text style={styles.severityLabel}>Severity: </Text>
          <Text style={[styles.severityValue, { color: getSeverityColor(severity) }]}>
            {getSeverityText(severity)}
          </Text>
        </View>
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
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  locationText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  
  description: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },
  
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  durationText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  
  triggersContainer: {
    marginBottom: theme.spacing.sm,
  },
  
  triggersLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  triggersText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  severityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  
  severityLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  severityValue: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.sm,
  },
});