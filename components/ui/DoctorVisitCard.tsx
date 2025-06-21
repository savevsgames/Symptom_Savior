import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Phone, Mail, FileText, CircleAlert as AlertCircle, User } from 'lucide-react-native';
import { BaseCard } from './BaseCard';
import { theme } from '@/lib/theme';

export interface DoctorVisitCardProps {
  id: string;
  visit_ts: string;
  doctor_name?: string;
  location?: string;
  contact_phone?: string;
  contact_email?: string;
  visit_prep?: string;
  visit_summary?: string;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
  onPress?: () => void;
}

export function DoctorVisitCard({
  visit_ts,
  doctor_name,
  location,
  contact_phone,
  contact_email,
  visit_prep,
  visit_summary,
  follow_up_required,
  onPress,
}: DoctorVisitCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isUpcoming = () => {
    const visitDate = new Date(visit_ts);
    const now = new Date();
    return visitDate > now;
  };

  const isPast = () => {
    const visitDate = new Date(visit_ts);
    const now = new Date();
    return visitDate < now;
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <BaseCard variant="elevated" style={[
        styles.card,
        isUpcoming() && styles.upcomingCard,
        follow_up_required && styles.followUpCard
      ]}>
        <View style={styles.header}>
          <View style={styles.doctorInfo}>
            <View style={styles.doctorIcon}>
              <User size={20} color={theme.colors.primary[500]} strokeWidth={2} />
            </View>
            <View style={styles.doctorText}>
              <Text style={styles.doctorName}>{doctor_name || 'Healthcare Provider'}</Text>
              {location && <Text style={styles.location}>{location}</Text>}
            </View>
          </View>
          
          <View style={styles.statusContainer}>
            {isUpcoming() && (
              <View style={styles.upcomingBadge}>
                <Text style={styles.upcomingText}>Upcoming</Text>
              </View>
            )}
            {follow_up_required && (
              <View style={styles.followUpBadge}>
                <AlertCircle size={12} color={theme.colors.warning[600]} strokeWidth={2} />
                <Text style={styles.followUpText}>Follow-up Required</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.visitDetails}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateTimeItem}>
              <Calendar size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
              <Text style={styles.dateTimeText}>{formatDate(visit_ts)}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={styles.timeText}>{formatTime(visit_ts)}</Text>
            </View>
          </View>
        </View>

        {(contact_phone || contact_email) && (
          <View style={styles.contactInfo}>
            {contact_phone && (
              <View style={styles.contactItem}>
                <Phone size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
                <Text style={styles.contactText}>{contact_phone}</Text>
              </View>
            )}
            {contact_email && (
              <View style={styles.contactItem}>
                <Mail size={14} color={theme.colors.text.tertiary} strokeWidth={2} />
                <Text style={styles.contactText}>{contact_email}</Text>
              </View>
            )}
          </View>
        )}

        {visit_prep && (
          <View style={styles.prepSection}>
            <Text style={styles.prepLabel}>Preparation:</Text>
            <Text style={styles.prepText} numberOfLines={2}>
              {visit_prep}
            </Text>
          </View>
        )}

        {visit_summary && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>Summary:</Text>
            <Text style={styles.summaryText} numberOfLines={3}>
              {visit_summary}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.visitType}>
            {isPast() ? 'Past Visit' : isUpcoming() ? 'Scheduled Visit' : 'Visit'}
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
  
  upcomingCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  
  followUpCard: {
    borderRightWidth: 4,
    borderRightColor: theme.colors.warning[500],
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  doctorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  
  doctorText: {
    flex: 1,
  },
  
  doctorName: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  location: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  statusContainer: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  
  upcomingBadge: {
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  
  upcomingText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
  },
  
  followUpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  
  followUpText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning[600],
    marginLeft: theme.spacing.xs,
  },
  
  visitDetails: {
    marginBottom: theme.spacing.sm,
  },
  
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  dateTimeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  
  timeText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  
  contactInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  contactText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  
  prepSection: {
    marginBottom: theme.spacing.sm,
  },
  
  prepLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  prepText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  
  summarySection: {
    marginBottom: theme.spacing.sm,
  },
  
  summaryLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  
  summaryText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.normal * theme.typography.fontSize.sm,
  },
  
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
  },
  
  visitType: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});