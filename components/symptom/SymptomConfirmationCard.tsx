import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseButton, BaseCard } from '@/components/ui';
import { ExtractedSymptomData } from '@/lib/intent-detection';
import { theme } from '@/lib/theme';
import { X, Check, Edit2 } from 'lucide-react-native';

interface SymptomConfirmationCardProps {
  symptomData: ExtractedSymptomData;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SymptomConfirmationCard({
  symptomData,
  onConfirm,
  onEdit,
  onCancel,
  isLoading = false
}: SymptomConfirmationCardProps) {
  const getSeverityColor = (severity?: number) => {
    if (!severity) return theme.colors.neutral[400];
    if (severity <= 2) return theme.colors.success[500];
    if (severity <= 4) return theme.colors.success[400];
    if (severity <= 6) return theme.colors.warning[500];
    if (severity <= 8) return theme.colors.error[500];
    return theme.colors.error[600];
  };

  const getSeverityText = (severity?: number) => {
    if (!severity) return 'Not specified';
    if (severity <= 2) return 'Minimal';
    if (severity <= 4) return 'Mild';
    if (severity <= 6) return 'Moderate';
    if (severity <= 8) return 'Severe';
    return 'Very Severe';
  };

  return (
    <BaseCard variant="elevated" style={styles.card}>
      <Text style={styles.title}>Log this symptom?</Text>
      
      <View style={styles.symptomDetails}>
        <Text style={styles.symptomName}>{symptomData.symptom_name || 'Unspecified Symptom'}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Severity:</Text>
            <View style={[
              styles.severityBadge, 
              { backgroundColor: getSeverityColor(symptomData.severity) }
            ]}>
              <Text style={styles.severityText}>
                {symptomData.severity ? `${symptomData.severity}/10` : 'Not specified'}
              </Text>
            </View>
          </View>
          
          {symptomData.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{symptomData.location}</Text>
            </View>
          )}
          
          {symptomData.duration_hours && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {symptomData.duration_hours} hour{symptomData.duration_hours !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          
          {symptomData.triggers && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Triggers:</Text>
              <Text style={styles.detailValue}>{symptomData.triggers}</Text>
            </View>
          )}
          
          {symptomData.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{symptomData.description}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.confidenceContainer}>
        <Text style={styles.confidenceText}>
          Confidence: {Math.round((symptomData.confidence || 0) * 100)}%
        </Text>
        <Text style={styles.confidenceHint}>
          {(symptomData.confidence || 0) < 0.7 ? 
            'Low confidence. Consider editing before saving.' : 
            'High confidence. Details look good!'}
        </Text>
      </View>
      
      <View style={styles.actions}>
        <BaseButton
          title="Confirm"
          onPress={onConfirm}
          variant="primary"
          size="md"
          style={styles.confirmButton}
          loading={isLoading}
          disabled={isLoading}
          leftIcon={<Check size={16} color={theme.colors.text.inverse} strokeWidth={2} />}
        />
        
        <BaseButton
          title="Edit"
          onPress={onEdit}
          variant="outline"
          size="md"
          style={styles.editButton}
          disabled={isLoading}
          leftIcon={<Edit2 size={16} color={theme.colors.primary[500]} strokeWidth={2} />}
        />
        
        <BaseButton
          title="Cancel"
          onPress={onCancel}
          variant="ghost"
          size="md"
          style={styles.cancelButton}
          disabled={isLoading}
          leftIcon={<X size={16} color={theme.colors.text.secondary} strokeWidth={2} />}
        />
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  title: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  symptomDetails: {
    marginBottom: theme.spacing.lg,
  },
  symptomName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailsContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    width: 90,
  },
  detailValue: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
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
  confidenceContainer: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
  },
  confidenceText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  confidenceHint: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  editButton: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
});