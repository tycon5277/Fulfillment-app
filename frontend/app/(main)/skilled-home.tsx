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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Professional Light Theme Colors for Skilled Genie
const COLORS = {
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  primary: '#2563EB',        // Professional Blue
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  secondary: '#0EA5E9',      // Cyan accent
  success: '#10B981',        // Green
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Red
  purple: '#7C3AED',
  text: '#0F172A',           // Dark text
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  shadowColor: '#64748B',
};

// Skill mapping for display
const SKILL_INFO: { [key: string]: { name: string; emoji: string; color: string } } = {
  deep_cleaning: { name: 'Deep Cleaning', emoji: '🧹', color: '#F59E0B' },
  plumbing: { name: 'Plumbing', emoji: '🚰', color: '#3B82F6' },
  electrical: { name: 'Electrical', emoji: '⚡', color: '#3B82F6' },
  ac_repair: { name: 'AC Repair', emoji: '❄️', color: '#06B6D4' },
  car_wash: { name: 'Car Wash', emoji: '🚿', color: '#EF4444' },
  computer_repair: { name: 'Computer Repair', emoji: '🖥️', color: '#06B6D4' },
  phone_repair: { name: 'Phone Repair', emoji: '📱', color: '#06B6D4' },
  yoga: { name: 'Yoga', emoji: '🧘', color: '#EC4899' },
  massage: { name: 'Massage', emoji: '💆', color: '#EC4899' },
  photography: { name: 'Photography', emoji: '📸', color: '#8B5CF6' },
  cooking: { name: 'Home Cook', emoji: '👨‍🍳', color: '#EF4444' },
  tutoring: { name: 'Tutoring', emoji: '📚', color: '#8B5CF6' },
  pet_grooming: { name: 'Pet Grooming', emoji: '🛁', color: '#F97316' },
  gardening: { name: 'Gardening', emoji: '🌱', color: '#22C55E' },
  personal_driver: { name: 'Personal Driver', emoji: '🚗', color: '#6366F1' },
  wedding_photography: { name: 'Wedding Photo', emoji: '📸', color: '#EC4899' },
  drone_photography: { name: 'Drone Photo', emoji: '🚁', color: '#06B6D4' },
};

// Mock data
const MOCK_STATS = {
  todayEarnings: 2400,
  weekEarnings: 12800,
  monthEarnings: 48500,
  completedJobs: 8,
  pendingJobs: 3,
  rating: 4.9,
  totalReviews: 156,
  responseRate: 95,
  level: 12,
  xp: 2680,
  xpToNext: 3000,
  rank: 'Expert Professional',
  streakDays: 7,
};

const MOCK_NEW_REQUESTS = [
  {
    id: 'r1',
    service: 'AC Repair',
    skillId: 'ac_repair',
    customer: 'Rahul Sharma',
    customerRating: 4.8,
    description: 'AC not cooling properly, making weird noise. Need urgent help!',
    budget: '₹800 - ₹1,200',
    location: 'Sector 21, Gurgaon',
    distance: '2.5 km',
    urgent: true,
    postedTime: '2 min ago',
    estimatedDuration: '2-3 hours',
  },
  {
    id: 'r2',
    service: 'Deep Cleaning',
    skillId: 'deep_cleaning',
    customer: 'Priya Patel',
    customerRating: 4.9,
    description: '3BHK apartment full deep cleaning needed before festival',
    budget: '₹2,500 - ₹3,500',
    location: 'DLF Phase 3',
    distance: '4.2 km',
    urgent: false,
    postedTime: '15 min ago',
    estimatedDuration: '4-5 hours',
  },
  {
    id: 'r3',
    service: 'Plumbing',
    skillId: 'plumbing',
    customer: 'Amit Kumar',
    customerRating: 4.7,
    description: 'Bathroom tap leaking, need replacement',
    budget: '₹400 - ₹600',
    location: 'Cyber City',
    distance: '3.8 km',
    urgent: false,
    postedTime: '25 min ago',
    estimatedDuration: '1-2 hours',
  },
];

const MOCK_UPCOMING_JOBS = [
  {
    id: 'j1',
    service: 'Electrical Work',
    skillId: 'electrical',
    customer: 'Neha Gupta',
    location: 'Sector 14',
    time: 'Today, 2:00 PM',
    duration: '2 hours',
    earnings: 1200,
    status: 'confirmed',
  },
  {
    id: 'j2',
    service: 'Computer Repair',
    skillId: 'computer_repair',
    customer: 'Vikram Singh',
    location: 'Golf Course Road',
    time: 'Today, 5:30 PM',
    duration: '1.5 hours',
    earnings: 800,
    status: 'confirmed',
  },
];

export default function SkilledHomeScreen() {
  const router = useRouter();
  const { user, isOnline, setOnline } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  
  const statusAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(statusAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const toggleAvailability = () => {
    setOnline(!isOnline);
  };

  const getSkillInfo = (skillId: string) => {
    return SKILL_INFO[skillId] || { name: skillId, emoji: '🔧', color: COLORS.primary };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Professional'}</Text>
          <View style={styles.rankBadge}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
            <Text style={styles.rankText}>{MOCK_STATS.rank}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Online Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textMuted }]} />
            <View>
              <Text style={styles.statusTitle}>
                {isOnline ? 'You\'re Available' : 'You\'re Offline'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isOnline ? 'Accepting service requests' : 'Not accepting requests'}
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

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>₹{MOCK_STATS.todayEarnings.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={[styles.statValue, { color: COLORS.text }]}>{MOCK_STATS.completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={[styles.statValue, { color: COLORS.text }]}>{MOCK_STATS.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.quickStatsBanner}>
          <View style={styles.quickStatItem}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.quickStatValue}>{MOCK_STATS.pendingJobs}</Text>
            <Text style={styles.quickStatLabel}>Pending</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Ionicons name="trending-up-outline" size={18} color={COLORS.success} />
            <Text style={styles.quickStatValue}>₹{(MOCK_STATS.weekEarnings / 1000).toFixed(1)}K</Text>
            <Text style={styles.quickStatLabel}>This Week</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Ionicons name="chatbubbles-outline" size={18} color={COLORS.warning} />
            <Text style={styles.quickStatValue}>{MOCK_STATS.totalReviews}</Text>
            <Text style={styles.quickStatLabel}>Reviews</Text>
          </View>
        </View>

        {/* New Requests Section */}
        {isOnline && MOCK_NEW_REQUESTS.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flash" size={20} color={COLORS.warning} />
                <Text style={styles.sectionTitle}>New Requests</Text>
                <View style={styles.requestCountBadge}>
                  <Text style={styles.requestCountText}>{MOCK_NEW_REQUESTS.length}</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {MOCK_NEW_REQUESTS.slice(0, showAllRequests ? undefined : 2).map((request) => {
              const skillInfo = getSkillInfo(request.skillId);
              return (
                <TouchableOpacity 
                  key={request.id} 
                  style={styles.requestCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.requestTop}>
                    <View style={[styles.requestIconBg, { backgroundColor: skillInfo.color + '15' }]}>
                      <Text style={styles.requestEmoji}>{skillInfo.emoji}</Text>
                    </View>
                    <View style={styles.requestInfo}>
                      <View style={styles.requestTitleRow}>
                        <Text style={styles.requestService}>{request.service}</Text>
                        {request.urgent && (
                          <View style={styles.urgentBadge}>
                            <Text style={styles.urgentText}>URGENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.requestCustomer}>{request.customer}</Text>
                      <View style={styles.requestMeta}>
                        <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                        <Text style={styles.requestMetaText}>{request.distance}</Text>
                        <Text style={styles.requestMetaDot}>•</Text>
                        <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                        <Text style={styles.requestMetaText}>{request.postedTime}</Text>
                      </View>
                    </View>
                    <View style={styles.requestRight}>
                      <Text style={styles.requestBudget}>{request.budget}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.requestDescription} numberOfLines={2}>
                    {request.description}
                  </Text>

                  <View style={styles.requestActions}>
                    <TouchableOpacity style={styles.declineBtn}>
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptBtn}>
                      <Text style={styles.acceptBtnText}>Accept Request</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            {MOCK_NEW_REQUESTS.length > 2 && (
              <TouchableOpacity 
                style={styles.showMoreBtn}
                onPress={() => setShowAllRequests(!showAllRequests)}
              >
                <Text style={styles.showMoreText}>
                  {showAllRequests ? 'Show Less' : `View ${MOCK_NEW_REQUESTS.length - 2} More Requests`}
                </Text>
                <Ionicons 
                  name={showAllRequests ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={COLORS.primary} 
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Offline State */}
        {!isOnline && (
          <View style={styles.offlineCard}>
            <Ionicons name="pause-circle-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.offlineTitle}>You're Currently Offline</Text>
            <Text style={styles.offlineText}>
              Turn on availability to start receiving service requests from customers.
            </Text>
            <TouchableOpacity style={styles.goOnlineBtn} onPress={toggleAvailability}>
              <Text style={styles.goOnlineBtnText}>Go Online</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {MOCK_UPCOMING_JOBS.map((job) => {
            const skillInfo = getSkillInfo(job.skillId);
            return (
              <TouchableOpacity 
                key={job.id} 
                style={styles.jobCard}
                activeOpacity={0.7}
              >
                <View style={[styles.jobIconBg, { backgroundColor: skillInfo.color + '15' }]}>
                  <Text style={styles.jobEmoji}>{skillInfo.emoji}</Text>
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobService}>{job.service}</Text>
                  <Text style={styles.jobCustomer}>{job.customer}</Text>
                  <View style={styles.jobMeta}>
                    <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.jobTime}>{job.time}</Text>
                  </View>
                </View>
                <View style={styles.jobRight}>
                  <Text style={styles.jobEarnings}>₹{job.earnings}</Text>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedText}>Confirmed</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {MOCK_UPCOMING_JOBS.length === 0 && (
            <View style={styles.emptyJobs}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming jobs</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionBtn}>
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionText}>Schedule</Text>
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
            <TouchableOpacity style={styles.quickActionBtn}>
              <View style={[styles.quickActionIcon, { backgroundColor: COLORS.purple + '15' }]}>
                <Ionicons name="settings-outline" size={22} color={COLORS.purple} />
              </View>
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {},
  headerRight: {},
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
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
    top: 8,
    right: 8,
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
  scrollContent: {
    paddingTop: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  quickStatsBanner: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  requestCountBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requestCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  requestCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestEmoji: {
    fontSize: 24,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestService: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  urgentBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  requestCustomer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  requestMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  requestMetaDot: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 4,
  },
  requestRight: {
    alignItems: 'flex-end',
  },
  requestBudget: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    gap: 6,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  offlineCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 32,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  goOnlineBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: COLORS.success,
  },
  goOnlineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobEmoji: {
    fontSize: 20,
  },
  jobInfo: {
    flex: 1,
  },
  jobService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  jobCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  jobTime: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  jobRight: {
    alignItems: 'flex-end',
  },
  jobEarnings: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  confirmedBadge: {
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  emptyJobs: {
    alignItems: 'center',
    padding: 32,
    marginHorizontal: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
});
