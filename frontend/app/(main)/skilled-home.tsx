import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Professional Light Theme Colors
const COLORS = {
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  secondary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#7C3AED',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

// Mock stats
const MOCK_STATS = {
  todayEarnings: 2400,
  weekEarnings: 12800,
  completedJobs: 8,
  pendingJobs: 3,
  rating: 4.9,
  totalReviews: 156,
  todayAppointments: 3,
  upcomingAppointments: 5,
};

// Mock today's appointments
const MOCK_TODAY_APPOINTMENTS = [
  {
    id: 'a1',
    service: 'Deep Cleaning',
    customer: 'Priya Patel',
    time: '10:00 AM',
    duration: '3 hours',
    location: 'DLF Phase 3, Sector 24',
    status: 'completed',
    earnings: 2500,
  },
  {
    id: 'a2',
    service: 'Kitchen Cleaning',
    customer: 'Rahul Sharma',
    time: '2:00 PM',
    duration: '2 hours',
    location: 'Sector 21, Gurgaon',
    status: 'in_progress',
    earnings: 1200,
  },
  {
    id: 'a3',
    service: 'Sofa Cleaning',
    customer: 'Neha Gupta',
    time: '5:30 PM',
    duration: '1.5 hours',
    location: 'Golf Course Road',
    status: 'upcoming',
    earnings: 800,
  },
];

// Mock nearby wishes (filtered by skills)
const MOCK_NEARBY_WISHES = [
  {
    id: 'w1',
    service: 'Bathroom Deep Clean',
    category: 'cleaning',
    customer: 'Amit Kumar',
    customerRating: 4.8,
    distance: '1.2 km',
    budget: '₹800 - ₹1,000',
    urgent: true,
    postedTime: '5 min ago',
  },
  {
    id: 'w2',
    service: 'Full House Cleaning',
    category: 'cleaning',
    customer: 'Sunita Verma',
    customerRating: 4.9,
    distance: '2.8 km',
    budget: '₹2,500 - ₹3,500',
    urgent: false,
    postedTime: '15 min ago',
  },
];

export default function SkilledHomeScreen() {
  const router = useRouter();
  const { user, isOnline, setIsOnline } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'wishes'>('overview');
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const toggleAvailability = () => {
    setIsOnline(!isOnline);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: COLORS.success + '15', text: COLORS.success, label: '✓ Done' };
      case 'in_progress':
        return { bg: COLORS.warning + '15', text: COLORS.warning, label: '● Live' };
      case 'upcoming':
        return { bg: COLORS.primary + '15', text: COLORS.primary, label: '◷ Next' };
      default:
        return { bg: COLORS.textMuted + '15', text: COLORS.textMuted, label: status };
    }
  };

  const renderOverviewTab = () => (
    <>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValueWhite}>₹{MOCK_STATS.todayEarnings.toLocaleString()}</Text>
          <Text style={styles.statLabelWhite}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{MOCK_STATS.todayAppointments}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>{MOCK_STATS.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsBar}>
        <View style={styles.quickStatItem}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.quickStatValue}>{MOCK_STATS.completedJobs}</Text>
          <Text style={styles.quickStatLabel}>Done</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Ionicons name="time" size={18} color={COLORS.warning} />
          <Text style={styles.quickStatValue}>{MOCK_STATS.pendingJobs}</Text>
          <Text style={styles.quickStatLabel}>Pending</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Ionicons name="trending-up" size={18} color={COLORS.primary} />
          <Text style={styles.quickStatValue}>₹{(MOCK_STATS.weekEarnings/1000).toFixed(1)}K</Text>
          <Text style={styles.quickStatLabel}>This Week</Text>
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/appointments')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {MOCK_TODAY_APPOINTMENTS.map((apt) => {
          const statusStyle = getStatusStyle(apt.status);
          return (
            <TouchableOpacity 
              key={apt.id} 
              style={styles.appointmentCard}
              onPress={() => router.push(`/(main)/appointment-detail?id=${apt.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.aptTimeCol}>
                <Text style={styles.aptTime}>{apt.time}</Text>
                <Text style={styles.aptDuration}>{apt.duration}</Text>
              </View>
              <View style={styles.aptDivider} />
              <View style={styles.aptContent}>
                <View style={styles.aptTopRow}>
                  <Text style={styles.aptService}>{apt.service}</Text>
                  <View style={[styles.aptStatusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.aptStatusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                  </View>
                </View>
                <Text style={styles.aptCustomer}>{apt.customer}</Text>
                <View style={styles.aptLocationRow}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.aptLocation} numberOfLines={1}>{apt.location}</Text>
                </View>
              </View>
              <View style={styles.aptEarnings}>
                <Text style={styles.aptEarningsText}>₹{apt.earnings}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Nearby Wishes Preview */}
      {isOnline && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Nearby Wishes</Text>
              <View style={styles.wishCountBadge}>
                <Text style={styles.wishCountText}>{MOCK_NEARBY_WISHES.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(main)/nearby-wishes')}>
              <Text style={styles.seeAllText}>View Map</Text>
            </TouchableOpacity>
          </View>

          {MOCK_NEARBY_WISHES.slice(0, 2).map((wish) => (
            <TouchableOpacity 
              key={wish.id} 
              style={styles.wishCard}
              onPress={() => router.push(`/(main)/wish-detail?id=${wish.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.wishContent}>
                <View style={styles.wishTopRow}>
                  <Text style={styles.wishService}>{wish.service}</Text>
                  {wish.urgent && (
                    <View style={styles.urgentBadge}>
                      <Ionicons name="flash" size={10} color="#FFF" />
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.wishCustomer}>{wish.customer} • ⭐ {wish.customerRating}</Text>
                <View style={styles.wishMeta}>
                  <View style={styles.wishMetaItem}>
                    <Ionicons name="navigate-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.wishMetaText}>{wish.distance}</Text>
                  </View>
                  <View style={styles.wishMetaItem}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.wishMetaText}>{wish.postedTime}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.wishRight}>
                <Text style={styles.wishBudget}>{wish.budget}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Offline Message */}
      {!isOnline && (
        <View style={styles.offlineCard}>
          <Ionicons name="wifi-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.offlineTitle}>You're Offline</Text>
          <Text style={styles.offlineText}>Go online to see new wishes from customers in your area.</Text>
          <TouchableOpacity style={styles.goOnlineBtn} onPress={toggleAvailability}>
            <Text style={styles.goOnlineBtnText}>Go Online</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(main)/appointments')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(main)/skilled-chats')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="chatbubbles-outline" size={22} color={COLORS.secondary} />
            </View>
            <Text style={styles.quickActionText}>Chats</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="wallet-outline" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="star-outline" size={22} color={COLORS.warning} />
            </View>
            <Text style={styles.quickActionText}>Reviews</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Professional'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => router.push('/(main)/skilled-chats')}
          >
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Online Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textMuted }]} />
          <View>
            <Text style={styles.statusTitle}>{isOnline ? 'Available' : 'Offline'}</Text>
            <Text style={styles.statusSubtitle}>
              {isOnline ? 'Accepting new wishes' : 'Not visible to customers'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={toggleAvailability}
          trackColor={{ false: '#E2E8F0', true: COLORS.success + '40' }}
          thumbColor={isOnline ? COLORS.success : '#F1F5F9'}
          ios_backgroundColor="#E2E8F0"
        />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderOverviewTab()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  statValueWhite: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statLabelWhite: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quickStatsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  quickStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  wishCountBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  wishCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  appointmentCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aptTimeCol: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  aptDuration: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  aptDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  aptContent: {
    flex: 1,
  },
  aptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aptService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  aptStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aptStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  aptCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aptLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aptLocation: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  aptEarnings: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  aptEarningsText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  wishCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wishContent: {
    flex: 1,
  },
  wishTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  wishService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  wishCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  wishMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  wishMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wishMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  wishRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  wishBudget: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },
  offlineCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 28,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offlineTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  offlineText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  goOnlineBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: COLORS.success,
  },
  goOnlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  quickActionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
});
