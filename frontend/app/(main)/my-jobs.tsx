import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  primary: '#8B5CF6',
  cyan: '#06B6D4',
  green: '#34D399',
  amber: '#F59E0B',
  magenta: '#D946EF',
  blue: '#3B82F6',
  red: '#F87171',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  headerBg: '#1E3A5F',
};

const STATUS_TABS = [
  { id: 'today', label: 'Today', count: 3 },
  { id: 'upcoming', label: 'Upcoming', count: 5 },
  { id: 'completed', label: 'Completed', count: 24 },
];

const MOCK_JOBS = {
  today: [
    {
      id: 'j1',
      service: 'AC Repair',
      emoji: '❄️',
      customer: 'Rahul Sharma',
      location: 'Sector 21, Gurgaon',
      time: '2:00 PM',
      duration: '2 hours',
      earnings: 1200,
      status: 'in_progress',
      progress: 60,
    },
    {
      id: 'j2',
      service: 'Electrical Work',
      emoji: '⚡',
      customer: 'Priya Patel',
      location: 'DLF Phase 3',
      time: '5:30 PM',
      duration: '1.5 hours',
      earnings: 800,
      status: 'confirmed',
      progress: 0,
    },
    {
      id: 'j3',
      service: 'Plumbing',
      emoji: '🔧',
      customer: 'Amit Singh',
      location: 'Cyber City',
      time: '7:00 PM',
      duration: '1 hour',
      earnings: 600,
      status: 'confirmed',
      progress: 0,
    },
  ],
  upcoming: [
    {
      id: 'j4',
      service: 'Computer Repair',
      emoji: '🖥️',
      customer: 'Neha Gupta',
      location: 'Sector 15, Gurgaon',
      time: 'Tomorrow, 10:00 AM',
      duration: '3 hours',
      earnings: 1500,
      status: 'confirmed',
      progress: 0,
    },
    {
      id: 'j5',
      service: 'Photography',
      emoji: '📸',
      customer: 'Anjali Mehta',
      location: 'Golf Course Road',
      time: 'Sat, 4:00 PM',
      duration: '4 hours',
      earnings: 3500,
      status: 'confirmed',
      progress: 0,
    },
  ],
  completed: [
    {
      id: 'j6',
      service: 'AC Service',
      emoji: '❄️',
      customer: 'Vikram Singh',
      location: 'DLF Phase 2',
      time: 'Yesterday',
      duration: '2 hours',
      earnings: 600,
      status: 'completed',
      rating: 5,
      progress: 100,
    },
    {
      id: 'j7',
      service: 'Electrical Repair',
      emoji: '⚡',
      customer: 'Deepak Kumar',
      location: 'Cyber Hub',
      time: '2 days ago',
      duration: '1.5 hours',
      earnings: 900,
      status: 'completed',
      rating: 4,
      progress: 100,
    },
  ],
};

export default function MyJobsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const jobs = MOCK_JOBS[activeTab as keyof typeof MOCK_JOBS];
  const totalEarnings = jobs.reduce((acc, job) => acc + job.earnings, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return COLORS.cyan;
      case 'confirmed': return COLORS.green;
      case 'completed': return COLORS.primary;
      default: return COLORS.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const handleJobPress = (job: any) => {
    if (job.status === 'in_progress') {
      router.push({
        pathname: '/job-navigation',
        params: { jobId: job.id, title: job.service }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.headerBg, COLORS.background]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>My Jobs</Text>
            <Text style={styles.headerSubtitle}>Manage your scheduled work</Text>
          </View>
          <TouchableOpacity style={styles.calendarButton}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{jobs.length}</Text>
            <Text style={styles.quickStatLabel}>Jobs</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={[styles.quickStatValue, { color: COLORS.green }]}>₹{totalEarnings}</Text>
            <Text style={styles.quickStatLabel}>Est. Earnings</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                  {MOCK_JOBS[tab.id as keyof typeof MOCK_JOBS].length}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Jobs List */}
      <ScrollView style={styles.jobsList} showsVerticalScrollIndicator={false}>
        {jobs.map((job) => (
          <TouchableOpacity
            key={job.id}
            style={styles.jobCard}
            onPress={() => handleJobPress(job)}
            activeOpacity={0.8}
          >
            {/* Job Header */}
            <View style={styles.jobHeader}>
              <View style={styles.jobServiceRow}>
                <View style={styles.jobIconContainer}>
                  <Text style={styles.jobEmoji}>{job.emoji}</Text>
                </View>
                <View style={styles.jobServiceInfo}>
                  <Text style={styles.jobServiceName}>{job.service}</Text>
                  <Text style={styles.jobCustomer}>{job.customer}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                  {getStatusLabel(job.status)}
                </Text>
              </View>
            </View>

            {/* Progress Bar (for in_progress jobs) */}
            {job.status === 'in_progress' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${job.progress}%` }]}>
                    <LinearGradient
                      colors={[COLORS.cyan, COLORS.blue]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.progressGradient}
                    />
                  </View>
                </View>
                <Text style={styles.progressText}>{job.progress}% complete</Text>
              </View>
            )}

            {/* Rating (for completed jobs) */}
            {job.status === 'completed' && job.rating && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Customer Rating:</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= job.rating! ? 'star' : 'star-outline'}
                      size={16}
                      color={COLORS.amber}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Job Details */}
            <View style={styles.jobDetails}>
              <View style={styles.jobDetailItem}>
                <Ionicons name="location-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.jobDetailText}>{job.location}</Text>
              </View>
              <View style={styles.jobDetailItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.jobDetailText}>{job.time}</Text>
              </View>
              <View style={styles.jobDetailItem}>
                <Ionicons name="hourglass-outline" size={16} color={COLORS.textMuted} />
                <Text style={styles.jobDetailText}>{job.duration}</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.jobFooter}>
              <View style={styles.earningsContainer}>
                <Text style={styles.earningsLabel}>Earnings</Text>
                <Text style={styles.earningsValue}>₹{job.earnings}</Text>
              </View>
              {job.status === 'in_progress' && (
                <TouchableOpacity style={styles.navigateBtn} onPress={() => handleJobPress(job)}>
                  <LinearGradient
                    colors={[COLORS.cyan, COLORS.blue]}
                    style={styles.navigateBtnGradient}
                  >
                    <Ionicons name="navigate" size={16} color="#FFF" />
                    <Text style={styles.navigateBtnText}>Navigate</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {job.status === 'confirmed' && (
                <TouchableOpacity style={styles.startBtn}>
                  <LinearGradient
                    colors={[COLORS.green, '#16A34A']}
                    style={styles.startBtnGradient}
                  >
                    <Ionicons name="play" size={16} color="#FFF" />
                    <Text style={styles.startBtnText}>Start Job</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Empty State */}
        {jobs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Jobs Yet</Text>
            <Text style={styles.emptyText}>Jobs will appear here once you accept service requests</Text>
          </View>
        )}

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
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStats: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  tabBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.cardBorder,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBadgeTextActive: {
    color: '#FFF',
  },
  jobsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  jobServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  jobIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobEmoji: {
    fontSize: 26,
  },
  jobServiceInfo: {},
  jobServiceName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  jobCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.cyan,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  ratingLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  jobDetails: {
    gap: 8,
    marginBottom: 14,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  earningsContainer: {},
  earningsLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.green,
  },
  navigateBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  navigateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  navigateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  startBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
