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
  orange: '#F97316',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
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
  photography: { name: 'Photography', emoji: '📸', color: '#D946EF' },
  cooking: { name: 'Home Cook', emoji: '👨‍🍳', color: '#EF4444' },
  tutoring: { name: 'Tutoring', emoji: '📚', color: '#8B5CF6' },
  pet_grooming: { name: 'Pet Grooming', emoji: '🛁', color: '#F97316' },
  gardening: { name: 'Gardening', emoji: '🌱', color: '#22C55E' },
};

// Mock data for skilled genie dashboard
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
  rank: 'Gold Genie',
  nextRank: 'Platinum Genie',
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
    address: 'Flat 402, Tower B, Sector 14',
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
    address: 'Office 12, Tech Park',
  },
  {
    id: 'j3',
    service: 'Car Wash',
    skillId: 'car_wash',
    customer: 'Ankit Verma',
    location: 'MG Road',
    time: 'Tomorrow, 8:00 AM',
    duration: '1 hour',
    earnings: 500,
    status: 'pending',
    address: 'Basement Parking, Central Mall',
  },
];

const ACHIEVEMENTS = [
  { id: 'streak7', name: '7 Day Streak', emoji: '🔥', unlocked: true },
  { id: 'jobs50', name: '50 Jobs Done', emoji: '🏆', unlocked: true },
  { id: 'rating5', name: '5 Star Rating', emoji: '⭐', unlocked: true },
  { id: 'speedy', name: 'Speed Demon', emoji: '⚡', unlocked: false },
];

export default function SkilledHomeScreen() {
  const router = useRouter();
  const { user, isOnline, setOnline } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusGlow = useRef(new Animated.Value(0.5)).current;
  const streakGlow = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(statusGlow, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(statusGlow, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline]);

  useEffect(() => {
    // Streak fire animation
    const streakAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(streakGlow, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(streakGlow, { toValue: 0.8, duration: 600, useNativeDriver: true }),
      ])
    );
    streakAnim.start();
    return () => streakAnim.stop();
  }, []);

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

  const getLevelTitle = (level: number) => {
    if (level < 5) return 'Apprentice Genie';
    if (level < 10) return 'Rising Genie';
    if (level < 20) return 'Expert Genie';
    if (level < 30) return 'Master Genie';
    return 'Legendary Genie';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user?.name || 'Skilled Genie'}</Text>
            <Text style={styles.genieStar}>✨</Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>🏆 {MOCK_STATS.rank}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>5</Text>
            </View>
          </TouchableOpacity>
        </View>
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
            colors={isOnline ? [COLORS.green + '25', COLORS.cyan + '15'] : [COLORS.cardBg, COLORS.cardBg]}
            style={styles.availabilityGradient}
          >
            <View style={styles.availabilityLeft}>
              <Animated.View style={[
                styles.statusDot,
                { backgroundColor: isOnline ? COLORS.green : COLORS.textMuted },
                isOnline && { opacity: statusGlow }
              ]} />
              <View>
                <Text style={styles.availabilityTitle}>
                  {isOnline ? '🟢 You\'re Online' : '⚫ You\'re Offline'}
                </Text>
                <Text style={styles.availabilitySubtitle}>
                  {isOnline ? 'Accepting new service requests' : 'Tap to start accepting requests'}
                </Text>
              </View>
            </View>
            <View style={[
              styles.toggleTrack,
              { backgroundColor: isOnline ? COLORS.green : COLORS.cardBorder }
            ]}>
              <Animated.View style={[
                styles.toggleThumb,
                { transform: [{ translateX: isOnline ? 22 : 0 }] }
              ]} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.green + '25', COLORS.green + '08']}
              style={styles.statGradient}
            >
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₹{MOCK_STATS.todayEarnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.blue + '25', COLORS.blue + '08']}
              style={styles.statGradient}
            >
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statValue}>{MOCK_STATS.completedJobs}</Text>
              <Text style={styles.statLabel}>Jobs Completed</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.amber + '25', COLORS.amber + '08']}
              style={styles.statGradient}
            >
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{MOCK_STATS.rating}</Text>
              <Text style={styles.statLabel}>{MOCK_STATS.totalReviews} Reviews</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[COLORS.orange + '25', COLORS.orange + '08']}
              style={styles.statGradient}
            >
              <Animated.Text style={[styles.statEmoji, { opacity: streakGlow }]}>🔥</Animated.Text>
              <Text style={styles.statValue}>{MOCK_STATS.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Level Progress Card */}
        <View style={styles.levelCard}>
          <LinearGradient
            colors={[COLORS.primary + '20', COLORS.magenta + '12']}
            style={styles.levelGradient}
          >
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.magenta]}
                  style={styles.levelBadgeGradient}
                >
                  <Text style={styles.levelNumber}>{MOCK_STATS.level}</Text>
                </LinearGradient>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>{getLevelTitle(MOCK_STATS.level)}</Text>
                <Text style={styles.levelXP}>{MOCK_STATS.xp.toLocaleString()} / {MOCK_STATS.xpToNext.toLocaleString()} XP</Text>
                <Text style={styles.nextRankText}>Next: {MOCK_STATS.nextRank}</Text>
              </View>
              <Text style={styles.levelEmoji}>🧞</Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.magenta]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${(MOCK_STATS.xp / MOCK_STATS.xpToNext) * 100}%` }]}
              />
            </View>
            <View style={styles.achievementsRow}>
              {ACHIEVEMENTS.map((ach) => (
                <View 
                  key={ach.id} 
                  style={[styles.achievementBadge, !ach.unlocked && styles.achievementLocked]}
                >
                  <Text style={[styles.achievementEmoji, !ach.unlocked && { opacity: 0.3 }]}>
                    {ach.emoji}
                  </Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* New Service Requests */}
        {isOnline && (
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
                <Text style={styles.seeAllText}>See All →</Text>
              </TouchableOpacity>
            </View>

            {MOCK_NEW_REQUESTS.slice(0, showAllRequests ? undefined : 2).map((request) => {
              const skillInfo = getSkillInfo(request.skillId);
              return (
                <TouchableOpacity 
                  key={request.id} 
                  style={styles.requestCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.requestHeader}>
                    <View style={styles.requestService}>
                      <View style={[styles.requestIconBg, { backgroundColor: skillInfo.color + '20' }]}>
                        <Text style={styles.requestEmoji}>{skillInfo.emoji}</Text>
                      </View>
                      <View style={styles.requestServiceInfo}>
                        <Text style={styles.requestServiceName}>{request.service}</Text>
                        <View style={styles.customerRow}>
                          <Text style={styles.requestCustomer}>{request.customer}</Text>
                          <View style={styles.customerRating}>
                            <Ionicons name="star" size={10} color={COLORS.amber} />
                            <Text style={styles.customerRatingText}>{request.customerRating}</Text>
                          </View>
                        </View>
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
                  
                  <View style={styles.requestDetails}>
                    <View style={styles.requestMeta}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.requestMetaText}>{request.distance}</Text>
                    </View>
                    <View style={styles.requestMeta}>
                      <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.requestMetaText}>{request.estimatedDuration}</Text>
                    </View>
                    <View style={styles.requestMeta}>
                      <Ionicons name="hourglass-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.requestMetaText}>{request.postedTime}</Text>
                    </View>
                  </View>

                  <View style={styles.requestFooter}>
                    <Text style={styles.requestBudget}>{request.budget}</Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity style={styles.declineBtn}>
                        <Ionicons name="close" size={18} color={COLORS.textSecondary} />
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
                  {showAllRequests ? 'Show Less' : `Show ${MOCK_NEW_REQUESTS.length - 2} More`}
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

        {/* Offline Message */}
        {!isOnline && (
          <View style={styles.offlineCard}>
            <LinearGradient
              colors={[COLORS.cardBg, COLORS.backgroundSecondary]}
              style={styles.offlineGradient}
            >
              <Text style={styles.offlineEmoji}>😴</Text>
              <Text style={styles.offlineTitle}>You're Currently Offline</Text>
              <Text style={styles.offlineText}>
                Go online to start receiving new service requests and earn money!
              </Text>
              <TouchableOpacity style={styles.goOnlineBtn} onPress={toggleAvailability}>
                <LinearGradient
                  colors={[COLORS.green, '#16A34A']}
                  style={styles.goOnlineBtnGradient}
                >
                  <Text style={styles.goOnlineBtnText}>Go Online Now</Text>
                  <Ionicons name="flash" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Upcoming Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>📅</Text>
              <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(main)/my-jobs')}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          {MOCK_UPCOMING_JOBS.map((job) => {
            const skillInfo = getSkillInfo(job.skillId);
            return (
              <TouchableOpacity 
                key={job.id} 
                style={styles.jobCard}
                activeOpacity={0.8}
              >
                <View style={styles.jobTop}>
                  <View style={[styles.jobIconBg, { backgroundColor: skillInfo.color + '20' }]}>
                    <Text style={styles.jobEmoji}>{skillInfo.emoji}</Text>
                  </View>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobService}>{job.service}</Text>
                    <Text style={styles.jobCustomer}>{job.customer}</Text>
                    <View style={styles.jobLocationRow}>
                      <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                      <Text style={styles.jobLocation}>{job.location}</Text>
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
                        {job.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.jobBottom}>
                  <View style={styles.jobTimeRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.jobTime}>{job.time}</Text>
                    <Text style={styles.jobDuration}>• {job.duration}</Text>
                  </View>
                  <TouchableOpacity style={styles.navigateBtn}>
                    <Ionicons name="navigate" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Earnings Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEmoji}>💵</Text>
              <Text style={styles.sectionTitle}>Earnings</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Details →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.earningsCard}>
            <LinearGradient
              colors={[COLORS.green + '15', COLORS.cyan + '08']}
              style={styles.earningsGradient}
            >
              <View style={styles.earningsRow}>
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>This Week</Text>
                  <Text style={styles.earningsValue}>₹{MOCK_STATS.weekEarnings.toLocaleString()}</Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>This Month</Text>
                  <Text style={styles.earningsValue}>₹{MOCK_STATS.monthEarnings.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.earningsChart}>
                <View style={styles.chartBar} />
                <View style={[styles.chartBar, { height: 45 }]} />
                <View style={[styles.chartBar, { height: 60 }]} />
                <View style={[styles.chartBar, { height: 35 }]} />
                <View style={[styles.chartBar, { height: 55 }]} />
                <View style={[styles.chartBar, { height: 70, backgroundColor: COLORS.green }]} />
                <View style={[styles.chartBar, { height: 50 }]} />
              </View>
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>Mon</Text>
                <Text style={styles.chartLabel}>Tue</Text>
                <Text style={styles.chartLabel}>Wed</Text>
                <Text style={styles.chartLabel}>Thu</Text>
                <Text style={styles.chartLabel}>Fri</Text>
                <Text style={[styles.chartLabel, { color: COLORS.green }]}>Sat</Text>
                <Text style={styles.chartLabel}>Sun</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn}>
            <LinearGradient
              colors={[COLORS.primary + '20', COLORS.primary + '10']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              <Text style={styles.quickActionText}>Schedule</Text>
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
              <Ionicons name="star-outline" size={24} color={COLORS.amber} />
              <Text style={styles.quickActionText}>Reviews</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <LinearGradient
              colors={[COLORS.pink + '20', COLORS.pink + '10']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="help-circle-outline" size={24} color={COLORS.pink} />
              <Text style={styles.quickActionText}>Help</Text>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {},
  headerRight: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  genieStar: {
    fontSize: 20,
  },
  rankBadge: {
    marginTop: 6,
    backgroundColor: COLORS.amber + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber,
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
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 50) / 2,
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
    marginBottom: 14,
  },
  levelBadge: {
    marginRight: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
  levelBadgeGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 20,
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
  nextRankText: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  levelEmoji: {
    fontSize: 36,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  achievementBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.amber,
  },
  achievementLocked: {
    borderColor: COLORS.cardBorder,
  },
  achievementEmoji: {
    fontSize: 18,
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
    gap: 12,
  },
  requestIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestEmoji: {
    fontSize: 24,
  },
  requestServiceInfo: {
    flex: 1,
  },
  requestServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  requestCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  customerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  customerRatingText: {
    fontSize: 11,
    color: COLORS.amber,
    fontWeight: '600',
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
  requestDetails: {
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
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestBudget: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  declineBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  acceptBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  acceptBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  offlineCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  offlineGradient: {
    padding: 24,
    alignItems: 'center',
  },
  offlineEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  goOnlineBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  goOnlineBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  goOnlineBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  jobCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  jobTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    fontSize: 22,
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
  jobLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  jobLocation: {
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
  jobBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  jobTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  jobDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  navigateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  earningsGradient: {
    padding: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.green,
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 16,
  },
  earningsChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: 8,
  },
  chartBar: {
    width: 28,
    height: 40,
    backgroundColor: COLORS.primary + '50',
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    width: 28,
    textAlign: 'center',
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
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
});
