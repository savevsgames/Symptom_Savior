import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Heart, Pill, TriangleAlert as AlertTriangle, Settings, CircleHelp as HelpCircle, ChevronRight, Activity, Calendar, Stethoscope, Shield, FileText, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { BaseCard } from '@/components/ui';
import { useProfile } from '@/hooks/useProfile';
import { useAuthContext } from '@/contexts/AuthContext';
import { theme } from '@/lib/theme';

export default function Profile() {
  const { profile, conditions, medications, allergies, getProfileCompletionPercentage } = useProfile();
  const { user, signOut } = useAuthContext();

  const profileStats = [
    { label: 'Profile Complete', value: `${getProfileCompletionPercentage()}%`, icon: User },
    { label: 'Conditions', value: conditions.length.toString(), icon: Heart },
    { label: 'Medications', value: medications.length.toString(), icon: Pill },
    { label: 'Allergies', value: allergies.length.toString(), icon: AlertTriangle },
  ];

  const menuSections = [
    {
      title: 'Health Profile',
      items: [
        { 
          icon: User, 
          label: 'Personal Information', 
          subtitle: 'Age, gender, physical measurements',
          route: '/(tabs)/profile/personal-info'
        },
        { 
          icon: Heart, 
          label: 'Medical History', 
          subtitle: 'Conditions, medications, allergies',
          route: '/(tabs)/profile/medical-history'
        },
        { 
          icon: FileText, 
          label: 'Export Health Data', 
          subtitle: 'Download your health information',
          route: null // TODO: Implement in future
        },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { 
          icon: Settings, 
          label: 'App Preferences', 
          subtitle: 'Notifications, language, units',
          route: null // TODO: Implement in future
        },
        { 
          icon: Shield, 
          label: 'Privacy & Security', 
          subtitle: 'Data protection settings',
          route: null // TODO: Implement in future
        },
      ]
    },
    {
      title: 'Support',
      items: [
        { 
          icon: HelpCircle, 
          label: 'Help & FAQ', 
          subtitle: 'Get answers to common questions',
          route: null // TODO: Implement in future
        },
        { 
          icon: FileText, 
          label: 'Terms & Privacy', 
          subtitle: 'App policies and legal info',
          route: null // TODO: Implement in future
        },
      ]
    }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'No email';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#FFFFFF" strokeWidth={2} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{getUserDisplayName()}</Text>
              <Text style={styles.userEmail}>{getUserEmail()}</Text>
              <Text style={styles.memberSince}>
                Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Profile Completion */}
        {getProfileCompletionPercentage() < 100 && (
          <BaseCard style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionTitle}>Complete Your Profile</Text>
              <Text style={styles.completionPercentage}>{getProfileCompletionPercentage()}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getProfileCompletionPercentage()}%` }
                ]} 
              />
            </View>
            <Text style={styles.completionSubtitle}>
              Complete your profile to get more personalized health insights
            </Text>
          </BaseCard>
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Health Profile</Text>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <stat.icon size={20} color="#0066CC" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuItems}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity 
                  key={itemIndex} 
                  style={styles.menuItem}
                  onPress={() => {
                    if (item.route) {
                      router.push(item.route as any);
                    }
                  }}
                  disabled={!item.route}
                >
                  <View style={styles.menuItemContent}>
                    <View style={styles.menuItemIcon}>
                      <item.icon size={20} color="#0066CC" strokeWidth={2} />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#94A3B8" strokeWidth={2} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Health Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Activity size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.insightTitle}>Profile Summary</Text>
            </View>
            <Text style={styles.insightText}>
              {getProfileCompletionPercentage() === 100 
                ? "Your health profile is complete! This helps provide more accurate and personalized health guidance from your AI assistant."
                : `Your profile is ${getProfileCompletionPercentage()}% complete. Adding more information helps provide better health insights and emergency preparedness.`
              }
            </Text>
            {getProfileCompletionPercentage() < 100 && (
              <TouchableOpacity 
                style={styles.insightButton}
                onPress={() => router.push('/(tabs)/profile/personal-info')}
              >
                <Text style={styles.insightButtonText}>Complete Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={theme.colors.error[600]} strokeWidth={2} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Symptom Savior v1.0.0</Text>
          <Text style={styles.appBuild}>Build 2024.12.21</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0066CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  memberSince: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
  completionCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: theme.colors.primary[50],
    borderWidth: 1,
    borderColor: theme.colors.primary[200],
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[700],
  },
  completionPercentage: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[600],
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.primary[100],
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: 4,
  },
  completionSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
  },
  statsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#0066CC',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  menuItems: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  insightsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#166534',
    marginLeft: 8,
  },
  insightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginBottom: 12,
  },
  insightButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  insightButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  signOutSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.error[200],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  signOutText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.error[600],
    marginLeft: theme.spacing.sm,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appVersion: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  appBuild: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94A3B8',
  },
});