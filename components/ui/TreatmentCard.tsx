import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Clock, User, CircleCheck as CheckCircle, Pill, Activity, Dumbbell, Brain, Plus } from 'lucide-react-native';
import { BaseCard } from './BaseCard';
import { theme } from '@/lib/theme';

export interface TreatmentCardProps {
  id: string;
  treatment_type: 'medication' | 'supplement' | 'exercise' | 'therapy' | 'other';
  name: string;
  dosage?: string;
  duration?: string;
  description?: string;
  doctor_recommended: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
  onPress?: () => void;
}

export function TreatmentCard({
  treatment_type,
  name,
  dosage,
  duration,
  description,
  doctor_recommended,
  completed,
  created_at,
  onPress,
}: TreatmentCardProps) {
  const getTypeIcon = () => {
    switch (treatment_type) {
      case 'medication':
        return Pill;
      case 'supplement':
        return Plus;
      case 'exercise':
        return Dumbbell;
      case 'therapy':
        return Brain;
      default:
        return Activity;
    }
  };

  const getTypeColor = () => {
    switch (treatment_type) {
      case 'medication':
        return theme.colors.primary[500];
      case 'supplement':
        return theme.colors.success[500];
      case 'exercise':
        return theme.colors.warning[500];
      case 'therapy':
        return theme.colors.secondary[500];
      default:
        return theme.colors.neutral[500];
    }
  };

  const getTypeLabel = () => {
    return treatment_type.charAt(0).toUpperCase() + treatment_type.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const CardWrapper = onPress ? TouchableOpacity : View;
  const TypeIcon = getTypeIcon();

  return (
    <CardWrapper onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <BaseCard variant="elevated" style={[styles.card, completed && styles.completedCard]}>
        <View style={styles.header}>
          <View style={styles.typeInfo}>
            <View style={[styles.typeIcon, { backgroundColor: getTypeColor() }]}>
              <TypeIcon size={16} color={theme.colors.text.inverse} strokeWidth={2} />
            </View>
            <View style={styles.typeText}>
              <Text style={styles.treatmentName}>{name}</Text>
              <Text style={styles.typeLabel}>{getTypeLabel()}</Text>
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            {completed && (
              <View style={styles.completedBadge}>
                <CheckCircle size={16} color={theme.colors.success[600]} strokeWidth={2} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
            {doctor_recommended && (
              <View style={styles.doctorBadge}>
                <User size={12} color={theme.colors.primary[600]} strokeWidth={2} />
                <Text style={styles.doctorText}>Doctor Recommended</Text>
              </View>
            )}
          </View>
        </View>

        {(dosage || duration) && (
          <View style={styles.detailsContainer}>
            {dosage && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  {treatment_type === 'exercise' ? 'Frequency:' : 
                   treatment_type === 'therapy' ? 'Sessions:' : 'Dosage:'}
                </Text>
                <Text style={styles.detailValue}>{dosage}</Text>
              </View>
            )}
            {duration && (
              <View style={styles.detailItem}>
                <Clock size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
                <Text style={styles.detailValue}>{duration}</Text>
              </View>
            )}
          </View>
        )}

        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.metaInfo}>
            <Calendar size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
            <Text style={styles.metaText}>Started {formatDate(created_at)}</Text>
          </View>
        </View>
      </BaseCard>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing.md,
  },
  
  completedCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success[500],
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  
  typeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  
  typeText: {
    flex: 1,
  },
  
  treatmentName: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  typeLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  
  statusContainer: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  
  completedText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success[600],
    marginLeft: theme.spacing.xs,
  },
  
  doctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  
  doctorText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
    marginLeft: theme.spacing.xs,
  },
  
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  detailLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  
  detailValue: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  
  description: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },
  
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
  },
  
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  metaText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.xs,
  },
});