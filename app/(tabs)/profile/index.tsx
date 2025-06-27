import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
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

  const profileSections = [
    { 
      id: 'personal_info', 
      title: 'Personal Information', 
      icon: User, 
      route: '/(tabs)/profile/personal-info',
      description: 'Age, gender, physical measurements',
      isComplete: profile && !!profile.full_name && !!profile.date_of_birth && !!profile.gender
    },
    { 
      id: 'conditions', 
      title: 'Medical Conditions', 
      icon: Heart, 
      route: '/(tabs)/profile/medical-history',
      description: 'Chronic and ongoing health conditions',
      isComplete: conditions.length > 0
    },
    { 
      id: 'medications', 
      title: 'Medications', 
      icon: Pill, 
      route: '/(tabs)/profile/medical-history',
      description: 'Current and past medications',
      isComplete: medications.length > 0
    },
    { 
      id: 'allergies', 
      title: 'Allergies', 
      icon: AlertTriangle, 
      route: '/(tabs)/profile/medical-history',
      description: 'Known allergies and reactions',
      isComplete: allergies.length > 0
    }
  ];

  const menuSections = [
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

  const completionPercentage = getProfileCompletionPercentage();

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

        {/* Profile Completion Progress */}
        <BaseCard style={styles.progressCard}>
          <Text style={styles.progressTitle}>Complete Your Health Profile</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBackground} />
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${completionPercentage}%` }
                ]} 
              />
              <View style={styles.progressMilestones}>
                {profileSections.map((section, index) => (
                  <View 
                    key={section.id} 
                    style={[
                      styles.milestone, 
                      { left: `${(index / (profileSections.length - 1)) * 100}%` },
                      section.isComplete ? styles.milestoneComplete : {}
                    ]}
                  />
                ))}
              </View>
            </View>
            <Text style={styles.progressPercentage}>{completionPercentage}% Complete</Text>
          </View>
          
          <Text style={styles.progressSubtitle}>
            Complete your profile to get more personalized health insights
          </Text>
        </BaseCard>

        {/* Profile Sections */}
        <View style={styles.profileSectionsContainer}>
          <Text style={styles.sectionTitle}>Health Profile</Text>
          
          <View style={styles.sectionsGrid}>
            {profileSections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.sectionCard,
                  section.isComplete ? styles.sectionCardComplete : {}
                ]}
                onPress={() => router.push(section.route as any)}
              >
                <View style={[
                  styles.sectionIconContainer,
                  section.isComplete ? styles.sectionIconContainerComplete : {}
                ]}>
                  <section.icon 
                    size={24} 
                    color={section.isComplete ? theme.colors.success[500] : theme.colors.primary[500]} 
                    strokeWidth={2} 
                  />
                  {section.isComplete && (
                    <View style={styles.completeBadge} />
                  )}
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
                <View style={styles.sectionStatus}>
                  <Text style={[
                    styles.sectionStatusText,
                    section.isComplete ? styles.sectionStatusTextComplete : {}
                  ]}>
                    {section.isComplete ? 'Completed' : 'Incomplete'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Health Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Health Insights</Text>
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Activity size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.insightTitle}>Profile Summary</Text>
            </View>
            <Text style={styles.insightText}>
              {completionPercentage === 100 
                ? "Your health profile is complete! This helps provide more accurate and personalized health guidance from your AI assistant."
                : `Your profile is ${completionPercentage}% complete. Adding more information helps provide better health insights and emergency preparedness.`
              }
            </Text>
            {completionPercentage < 100 && (
              <TouchableOpacity 
                style={styles.insightButton}
                onPress={() => {
                  // Find the first incomplete section and navigate to it
                  const firstIncomplete = profileSections.find(section => !section.isComplete);
                  if (firstIncomplete) {
                    router.push(firstIncomplete.route as any);
                  }
                }}
              >
                <Text style={styles.insightButtonText}>Complete Profile</Text>
              </TouchableOpacity>
            )}
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
          <Text style={styles.appBuild}>Build 2025.12.21</Text>
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
  progressCard: {
    marginHorizontal: 24,
    marginTop: 16,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  progressTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  progressContainer: {
    marginVertical: theme.spacing.md,
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: 6,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: 6,
    zIndex: 1,
  },
  progressMilestones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 2,
  },
  milestone: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    top: -2,
    marginLeft: -8,
    zIndex: 3,
  },
  milestoneComplete: {
    backgroundColor: theme.colors.success[500],
    borderColor: theme.colors.success[500],
  },
  progressPercentage: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[600],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  progressSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  profileSectionsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  sectionCard: {
    width: '48%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    marginHorizontal: 4,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  sectionCardComplete: {
    borderColor: theme.colors.success[300],
    backgroundColor: theme.colors.success[50],
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  sectionIconContainerComplete: {
    backgroundColor: theme.colors.success[50],
  },
  completeBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.success[500],
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  sectionStatus: {
    marginTop: 'auto',
  },
  sectionStatusText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  sectionStatusTextComplete: {
    color: theme.colors.success[600],
  },
  insightsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  insightCard: {
    backgroundColor: theme.colors.success[50],
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.success[200],
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