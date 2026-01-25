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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  cyan: '#06B6D4',
  green: '#34D399',
  amber: '#F59E0B',
  magenta: '#D946EF',
  pink: '#EC4899',
  blue: '#3B82F6',
  red: '#F87171',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

// Mock data for skilled genie
const MOCK_STATS = {
  todayEarnings: 2400,
  weekEarnings: 12800,
  completedJobs: 8,
  rating: 4.9,
  responseRate: 95,
  level: 12,
  xp: 680,
  xpToNext: 1000,
};

const MOCK_UPCOMING_JOBS = [
  {
    id: 'j1',
    service: 'AC Repair',
    emoji: '❄️',
    customer: 'Rahul Sharma',
    location: 'Sector 21, Gurgaon',
    time: 'Today, 2:00 PM',
    duration: '2 hours',
    earnings: 1200,
    status: 'confirmed',
  },
  {
    id: 'j2',
    service: 'Electrical Work',
    emoji: '⚡',
    customer: 'Priya Patel',
    location: 'DLF Phase 3',
    time: 'Today, 5:30 PM',
    duration: '1.5 hours',
    earnings: 800,
    status: 'confirmed',
  },
  {
    id: 'j3',
    service: 'Plumbing',
    emoji: '🔧',
    customer: 'Amit Kumar',
    location: 'Cyber City',
    time: 'Tomorrow, 10:00 AM',
    duration: '3 hours',
    earnings: 1500,
    status: 'pending',
  },
];

const MOCK_NEW_REQUESTS = [
  {
    id: 'r1',
    service: 'Computer Repair',
    emoji: '🖥️',
    customer: 'Neha Gupta',
    description: 'Laptop not turning on, need urgent help',
    budget: '₹500 - ₹800',
    distance: '2.5 km',
    urgent: true,
    postedTime: '5 min ago',
  },
  {
    id: 'r2',
    service: 'AC Service',
    emoji: '❄️',
    customer: 'Vikram Singh',
    description: 'AC making noise, needs servicing',
    budget: '₹400 - ₹600',
    distance: '4.2 km',
    urgent: false,
    postedTime: '15 min ago',
  },
];

export default function SkilledHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusGlow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (isAvailable) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(statusGlow, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(statusGlow, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isAvailable]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const toggleAvailability = () => {
    setIsAvailable(!isAvailable);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Skilled Genie'} ✨</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Availability Toggle */}
        <TouchableOpacity 
          style={styles.availabilityCard}
          onPress={toggleAvailability}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isAvailable ? [COLORS.green + '20', COLORS.cyan + '10'] : [COLORS.cardBg, COLORS.cardBg]}
            style={styles.availabilityGradient}
          >
            <View style={styles.availabilityLeft}>
              <Animated.View style={[
                styles.statusDot,
                { backgroundColor: isAvailable ? COLORS.green : COLORS.textMuted },
                isAvailable && { opacity: statusGlow }
              ]} />
              <View>
                <Text style={styles.availabilityTitle}>
                  {isAvailable ? 'You\'re Available' : 'You\'re Offline'}
                </Text>
                <Text style={styles.availabilitySubtitle}>
                  {isAvailable ? 'Accepting new service requests' : 'Tap to go online'}
                </Text>
              </View>
            </View>
            <View style={[
              styles.toggleTrack,
              { backgroundColor: isAvailable ? COLORS.green : COLORS.cardBorder }
            ]}>
              <View style={[
                styles.toggleThumb,
                { transform: [{ translateX: isAvailable ? 20 : 0 }] }
              ]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.green + '20', COLORS.green + '05']}
              style={styles.statGradient}
            >
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₹{MOCK_STATS.todayEarnings}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.blue + '20', COLORS.blue + '05']}
              style={styles.statGradient}
            >
              <Text style={styles.statEmoji}>📋</Text>
              <Text style={styles.statValue}>{MOCK_STATS.completedJobs}</Text>
              <Text style={styles.statLabel}>Jobs Done</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.amber + '20', COLORS.amber + '05']}
              style={styles.statGradient}
            >
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{MOCK_STATS.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelCard}>
          <LinearGradient
            colors={[COLORS.primary + '15', COLORS.magenta + '10']}
            style={styles.levelGradient}
          >
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>{MOCK_STATS.level}</Text>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>Expert Genie</Text>
                <Text style={styles.levelXP}>{MOCK_STATS.xp} / {MOCK_STATS.xpToNext} XP</Text>
              </View>
              <Text style={styles.levelEmoji}>🧞</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(MOCK_STATS.xp / MOCK_STATS.xpToNext) * 100}%` }]}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.magenta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* New Service Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>🔔</Text>
              <Text style={styles.sectionTitle}>New Requests</Text>
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsCount}>{MOCK_NEW_REQUESTS.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(main)/service-requests')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {MOCK_NEW_REQUESTS.map((request) => (
            <TouchableOpacity 
              key={request.id} 
              style={styles.requestCard}
              activeOpacity={0.8}
            >
              <View style={styles.requestHeader}>
                <View style={styles.requestService}>
                  <Text style={styles.requestEmoji}>{request.emoji}</Text>
                  <View>
                    <Text style={styles.requestServiceName}>{request.service}</Text>
                    <Text style={styles.requestCustomer}>{request.customer}</Text>
                  </View>
                </View>
                {request.urgent && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="flash" size={12} color="#FFF" />
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>
              <Text style={styles.requestDescription} numberOfLines={2}>
                {request.description}
              </Text>
              <View style={styles.requestFooter}>
                <View style={styles.requestMeta}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.requestMetaText}>{request.distance}</Text>
                </View>
                <View style={styles.requestMeta}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.requestMetaText}>{request.postedTime}</Text>
                </View>
                <Text style={styles.requestBudget}>{request.budget}</Text>
              </View>
              <View style={styles.requestActions}>
                <TouchableOpacity style={styles.declineBtn}>
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn}>
                  <LinearGradient
                    colors={[COLORS.green, '#16A34A']}
                    style={styles.acceptBtnGradient}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📅</Text>
              <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(main)/my-jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {MOCK_UPCOMING_JOBS.map((job) => (
            <TouchableOpacity 
              key={job.id} 
              style={styles.jobCard}
              activeOpacity={0.8}
            >
              <View style={styles.jobLeft}>
                <View style={styles.jobIconContainer}>
                  <Text style={styles.jobEmoji}>{job.emoji}</Text>
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobService}>{job.service}</Text>
                  <Text style={styles.jobCustomer}>{job.customer}</Text>
                  <View style={styles.jobMeta}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.jobTime}>{job.time}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.jobRight}>
                <Text style={styles.jobEarnings}>₹{job.earnings}</Text>
                <View style={[
                  styles.jobStatus,
                  { backgroundColor: job.status === 'confirmed' ? COLORS.green + '20' : COLORS.amber + '20' }
                ]}>
                  <Text style={[
                    styles.jobStatusText,
                    { color: job.status === 'confirmed' ? COLORS.green : COLORS.amber }
                  ]}>
                    {job.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn}>
            <LinearGradient
              colors={[COLORS.primary + '20', COLORS.primary + '10']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Set Schedule</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <LinearGradient
              colors={[COLORS.cyan + '20', COLORS.cyan + '10']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="construct-outline" size={24} color={COLORS.cyan} />
              <Text style={styles.quickActionText}>My Skills</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <LinearGradient
              colors={[COLORS.amber + '20', COLORS.amber + '10']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="wallet-outline" size={24} color={COLORS.amber} />
              <Text style={styles.quickActionText}>Earnings</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  availabilityCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  availabilityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  availabilitySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 14,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  levelCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  levelGradient: {
    padding: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  levelXP: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  levelEmoji: {
    fontSize: 32,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressGradient: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  requestsBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requestsCount: {
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
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  requestService: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestEmoji: {
    fontSize: 28,
  },
  requestServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  requestCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  requestDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  requestBudget: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
    marginLeft: 'auto',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  acceptBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  jobLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobEmoji: {
    fontSize: 24,
  },
  jobInfo: {
    flex: 1,
  },
  jobService: {
    fontSize: 15,
    fontWeight: '700',
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
    gap: 4,
    marginTop: 4,
  },
  jobTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  jobRight: {
    alignItems: 'flex-end',
  },
  jobEarnings: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.green,
  },
  jobStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
  },
  jobStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quickActionGradient: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
});
