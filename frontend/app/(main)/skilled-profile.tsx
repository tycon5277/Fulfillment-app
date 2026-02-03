import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Warm Cream Theme for Skilled Genie
const COLORS = {
  background: '#FDF8F3',
  backgroundSecondary: '#F5EDE4',
  cardBg: '#FFFFFF',
  cardBorder: '#E8DFD5',
  primary: '#D97706',
  primaryLight: '#F59E0B',
  success: '#059669',
  error: '#DC2626',
  warning: '#D97706',
  text: '#44403C',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  cyan: '#0891B2',
};

// Mock earnings data for Skilled Genie (Services based)
const MOCK_EARNINGS = {
  today: 2400,
  week: 12800,
  month: 45000,
  total: 325000,
  jobs: {
    today: 3,
    week: 15,
    month: 52,
    total: 420,
  },
  categories: [
    { name: 'Deep Cleaning', amount: 18500, jobs: 22, percentage: 41 },
    { name: 'Kitchen Cleaning', amount: 12000, jobs: 15, percentage: 27 },
    { name: 'Bathroom Cleaning', amount: 8500, jobs: 10, percentage: 19 },
    { name: 'Other Services', amount: 6000, jobs: 5, percentage: 13 },
  ],
  recentTransactions: [
    { id: 't1', type: 'earning', amount: 800, service: 'Deep Cleaning', customer: 'Amit Kumar', date: 'Today, 2:30 PM' },
    { id: 't2', type: 'earning', amount: 1200, service: 'Kitchen Cleaning', customer: 'Priya Patel', date: 'Today, 11:00 AM' },
    { id: 't3', type: 'earning', amount: 400, service: 'Bathroom Cleaning', customer: 'Rahul Sharma', date: 'Yesterday' },
    { id: 't4', type: 'earning', amount: 2500, service: 'Full House Clean', customer: 'Sunita Verma', date: '2 days ago' },
    { id: 't5', type: 'earning', amount: 1800, service: 'Office Cleaning', customer: 'Tech Solutions', date: '3 days ago' },
  ],
};

export default function SkilledProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'earnings'>('profile');
  const [earningsPeriod, setEarningsPeriod] = useState<'today' | 'week' | 'month' | 'total'>('week');

  const fetchData = async () => {
    try {
      const meRes = await api.getMe();
      setUser(meRes.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const getEarnings = () => {
    return MOCK_EARNINGS[earningsPeriod];
  };

  const getJobCount = () => {
    return MOCK_EARNINGS.jobs[earningsPeriod];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Profile Tab Content
  const renderProfileTab = () => (
    <>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Skilled Professional'}</Text>
            <Text style={styles.userPhone}>{user?.phone || ''}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={COLORS.primary} />
              <Text style={styles.ratingText}>{user?.agent_rating?.toFixed(1) || '4.9'}</Text>
              <Text style={styles.jobsText}>• {user?.partner_total_tasks || 45} jobs completed</Text>
            </View>
          </View>
        </View>

        {/* Skills Tags */}
        <View style={styles.skillsSection}>
          <Text style={styles.skillsLabel}>Your Skills</Text>
          <View style={styles.skillsTags}>
            {(user?.agent_skills || ['Cleaning', 'Deep Cleaning']).slice(0, 4).map((skill: string, index: number) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>✨</Text>
          <Text style={styles.statValue}>{user?.partner_total_tasks || 45}</Text>
          <Text style={styles.statLabel}>Jobs Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statValue}>{user?.agent_rating?.toFixed(1) || '4.9'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Insights & Reports */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Insights & Reports</Text>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => router.push('/(main)/earnings-detail')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="wallet-outline" size={22} color={COLORS.success} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionText}>Earnings</Text>
            <Text style={styles.actionSubtext}>View detailed earnings breakdown</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => router.push('/(main)/reviews-detail')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="star-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionText}>Reviews & Ratings</Text>
            <Text style={styles.actionSubtext}>See customer feedback</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => router.push('/(main)/appointments-summary')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.blue + '15' }]}>
            <Ionicons name="bar-chart-outline" size={22} color={COLORS.blue} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionText}>Appointments Stats</Text>
            <Text style={styles.actionSubtext}>View booking analytics</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Developer / Demo Section */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => router.push('/(main)/tracking-demo')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.purple + '15' }]}>
            <Ionicons name="location-outline" size={22} color={COLORS.purple} />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionText}>Tracking Demo</Text>
            <Text style={styles.actionSubtext}>Preview Wisher's live tracking view</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="person-outline" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.blue + '15' }]}>
            <Ionicons name="construct-outline" size={22} color={COLORS.blue} />
          </View>
          <Text style={styles.actionText}>Manage Skills</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="document-text-outline" size={22} color={COLORS.success} />
          </View>
          <Text style={styles.actionText}>Documents & Certificates</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.purple + '15' }]}>
            <Ionicons name="share-social-outline" size={22} color={COLORS.purple} />
          </View>
          <Text style={styles.actionText}>Social Profiles</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <View style={[styles.actionIcon, { backgroundColor: COLORS.cyan + '15' }]}>
            <Ionicons name="help-circle-outline" size={22} color={COLORS.cyan} />
          </View>
          <Text style={styles.actionText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </>
  );

  // Earnings Tab Content
  const renderEarningsTab = () => (
    <>
      {/* Earnings Summary Card */}
      <View style={styles.earningsSummaryCard}>
        <Text style={styles.earningsSummaryLabel}>Total Earnings</Text>
        <Text style={styles.earningsSummaryAmount}>₹{getEarnings().toLocaleString()}</Text>
        <View style={styles.earningsJobsRow}>
          <Ionicons name="briefcase-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.earningsJobsText}>{getJobCount()} jobs completed</Text>
        </View>

        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          {(['today', 'week', 'month', 'total'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodTab, earningsPeriod === period && styles.periodTabActive]}
              onPress={() => setEarningsPeriod(period)}
            >
              <Text style={[styles.periodTabText, earningsPeriod === period && styles.periodTabTextActive]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Earnings by Category */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>Earnings by Service</Text>
        {MOCK_EARNINGS.categories.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryJobs}>{category.jobs} jobs</Text>
            </View>
            <View style={styles.categoryRight}>
              <Text style={styles.categoryAmount}>₹{category.amount.toLocaleString()}</Text>
              <View style={styles.categoryBarContainer}>
                <View style={[styles.categoryBar, { width: `${category.percentage}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {MOCK_EARNINGS.recentTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={[
              styles.transactionIcon,
              { backgroundColor: transaction.type === 'earning' ? COLORS.success + '15' : COLORS.error + '15' }
            ]}>
              <Ionicons
                name={transaction.type === 'earning' ? 'arrow-down' : 'arrow-up'}
                size={18}
                color={transaction.type === 'earning' ? COLORS.success : COLORS.error}
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionService}>{transaction.service}</Text>
              <Text style={styles.transactionCustomer}>{transaction.customer}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <Text style={[
              styles.transactionAmount,
              { color: transaction.type === 'earning' ? COLORS.success : COLORS.error }
            ]}>
              {transaction.type === 'earning' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 My Profile</Text>
        <TouchableOpacity style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={activeTab === 'profile' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'earnings' && styles.tabBtnActive]}
          onPress={() => setActiveTab('earnings')}
        >
          <Ionicons
            name="wallet-outline"
            size={18}
            color={activeTab === 'earnings' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'earnings' && styles.tabBtnTextActive]}>
            Earnings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' ? renderProfileTab() : renderEarningsTab()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingsBtn: {
    padding: 8,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary + '15',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Profile Card
  profileCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  jobsText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  skillsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingTop: 16,
  },
  skillsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Quick Actions
  quickActions: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  actionSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '10',
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
  // Earnings Summary
  earningsSummaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  earningsSummaryLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  earningsSummaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 8,
  },
  earningsJobsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  earningsJobsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 10,
    padding: 4,
    width: '100%',
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  periodTabTextActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  // Category Section
  categorySection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryJobs: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  categoryRight: {
    alignItems: 'flex-end',
    width: 120,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 6,
  },
  categoryBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  // Transactions
  transactionsSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionService: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  transactionCustomer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  transactionDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Withdraw Button
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
