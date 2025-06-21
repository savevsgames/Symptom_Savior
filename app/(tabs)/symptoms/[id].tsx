import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard as Edit3, Trash2, MapPin, Clock, Calendar, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { BaseButton, BaseCard } from '@/components/ui';
import { useSymptoms, type Symptom } from '@/hooks/useSymptoms';
import { theme } from '@/lib/theme';

export default function SymptomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [symptom, setSymptom] = useState<Symptom | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { getSymptomById, deleteSymptom } = useSymptoms();

  useEffect(() => {
    if (id) {
      loadSymptom();
    }
  }, [id]);

  // Reload symptom when screen comes into focus (after editing)
  useEffect(() => {
    const unsubscribe = router.addListener('focus', () => {
      if (id && !loading) {
        loadSymptom();
      }
    });

    return unsubscribe;
  }, [id, loading]);

  const loadSymptom = async () => {
    try {
      setLoading(true);
      const { data, error } = await getSymptomById(id);
      
      if (error) {
        Alert.alert('Error', 'Failed to load symptom details.');
        router.back();
        return;
      }

      setSymptom(data);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!symptom) return;
    router.push({
      pathname: '/edit-symptom',
      params: { id: symptom.id }
    });
  };

  const handleDelete = () => {
    if (!symptom) return;

    Alert.alert(
      'Delete Symptom',
      `Are you sure you want to delete this ${symptom.symptom.toLowerCase()} entry? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!symptom) return;

    try {
      setDeleting(true);
      const { error } = await deleteSymptom(symptom.id);

      if (error) {
        Alert.alert('Error', 'Failed to delete symptom. Please try again.');
        return;
      }

      Alert.alert(
        'Symptom Deleted',
        'The symptom entry has been successfully deleted.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while deleting.');
    } finally {
      setDeleting(false);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading symptom details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!symptom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Symptom Not Found</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Symptom not found or you don't have permission to view it.</Text>
          <BaseButton
            title="Go Back"
            onPress={() => router.back()}
            variant="primary"
            size="md"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Symptom Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={handleEdit}
          >
            <Edit3 size={20} color={theme.colors.text.secondary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerAction}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={20} color={theme.colors.error[500]} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Symptom Info */}
        <BaseCard style={styles.mainCard}>
          <View style={styles.symptomHeader}>
            <Text style={styles.symptomName}>{symptom.symptom}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(symptom.severity) }]}>
              <Text style={styles.severityText}>{symptom.severity}/10</Text>
            </View>
          </View>
          
          <View style={styles.severityInfo}>
            <Text style={styles.severityLabel}>Severity Level: </Text>
            <Text style={[styles.severityValue, { color: getSeverityColor(symptom.severity) }]}>
              {getSeverityText(symptom.severity)}
            </Text>
          </View>

          {symptom.severity >= 8 && (
            <View style={styles.warningBanner}>
              <AlertTriangle size={16} color={theme.colors.error[600]} strokeWidth={2} />
              <Text style={styles.warningText}>
                High severity symptom. Consider consulting a healthcare provider if this persists.
              </Text>
            </View>
          )}
        </BaseCard>

        {/* Date and Time */}
        <BaseCard style={styles.detailCard}>
          <Text style={styles.cardTitle}>When</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Calendar size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.dateTimeText}>{symptom.date}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Clock size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.dateTimeText}>{symptom.time}</Text>
            </View>
          </View>
        </BaseCard>

        {/* Location */}
        {symptom.location && (
          <BaseCard style={styles.detailCard}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <MapPin size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.locationText}>{symptom.location}</Text>
            </View>
          </BaseCard>
        )}

        {/* Duration */}
        {symptom.duration_hours && (
          <BaseCard style={styles.detailCard}>
            <Text style={styles.cardTitle}>Duration</Text>
            <View style={styles.durationContainer}>
              <Clock size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.durationText}>
                {symptom.duration_hours} hour{symptom.duration_hours !== 1 ? 's' : ''}
              </Text>
            </View>
          </BaseCard>
        )}

        {/* Description */}
        {symptom.description && (
          <BaseCard style={styles.detailCard}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descriptionText}>{symptom.description}</Text>
          </BaseCard>
        )}

        {/* Triggers */}
        {symptom.triggers && (
          <BaseCard style={styles.detailCard}>
            <Text style={styles.cardTitle}>Possible Triggers</Text>
            <View style={styles.triggersContainer}>
              {symptom.triggers.split(',').map((trigger, index) => (
                <View key={index} style={styles.triggerChip}>
                  <Text style={styles.triggerText}>{trigger.trim()}</Text>
                </View>
              ))}
            </View>
          </BaseCard>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <BaseButton
            title="Edit Symptom"
            onPress={handleEdit}
            variant="primary"
            size="lg"
            fullWidth
            style={styles.actionButton}
          />
          
          <BaseButton
            title="Log Similar Symptom"
            onPress={() => router.push('/add-symptom')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.actionButton}
          />
          
          <BaseButton
            title="View All Symptoms"
            onPress={() => router.push('/(tabs)/symptoms')}
            variant="outline"
            size="lg"
            fullWidth
            style={styles.actionButton}
          />

          <BaseButton
            title={deleting ? "Deleting..." : "Delete Symptom"}
            onPress={handleDelete}
            variant="danger"
            size="md"
            fullWidth
            disabled={deleting}
            style={styles.deleteButton}
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
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  headerAction: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  
  headerSpacer: {
    width: 40,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
  },
  
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  mainCard: {
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing.lg,
  },
  
  symptomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  symptomName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize['2xl'],
    color: theme.colors.text.primary,
    flex: 1,
  },
  
  severityBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  
  severityText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
  },
  
  severityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  severityLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  
  severityValue: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
  },
  
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error[50],
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  
  warningText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error[700],
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  
  detailCard: {
    marginBottom: theme.spacing.lg,
  },
  
  cardTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  dateTimeText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  locationText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  durationText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  
  descriptionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.base,
  },
  
  triggersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  
  triggerChip: {
    backgroundColor: theme.colors.warning[50],
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  
  triggerText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.warning[700],
  },
  
  actionsContainer: {
    marginBottom: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  
  deleteButton: {
    marginTop: theme.spacing.lg,
  },
});