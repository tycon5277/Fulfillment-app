import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Theme
const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  cyan: '#06B6D4',
  blue: '#3B82F6',
  green: '#34D399',
  amber: '#F59E0B',
  magenta: '#D946EF',
  pink: '#EC4899',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  error: '#F87171',
};

// Mock earnings data
const MOCK_EARNINGS = {
  hub_orders: {
    today: 320,
    week: 2150,
    month: 8500,
    total: 45200,
    count: { today: 4, week: 28, month: 112 },
  },
  wishes: {
    today: 450,
    week: 2800,
    month: 11200,
    total: 58600,
    count: { today: 3, week: 18, month: 72 },
  },
};

const ACHIEVEMENTS = [
  { id: 'first_delivery', title: 'First Delivery', emoji: '🎉', unlocked: true },
  { id: 'speed_demon', title: 'Speed Demon', emoji: '⚡', unlocked: true },
  { id: 'five_star', title: '5-Star Genie', emoji: '⭐', unlocked: true },
  { id: 'hundred_club', title: '100 Deliveries', emoji: '💯', unlocked: false },
  { id: 'night_owl', title: 'Night Owl', emoji: '🦉', unlocked: false },
  { id: 'streak_master', title: '7-Day Streak', emoji: '🔥', unlocked: true },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEarningsTab, setSelectedEarningsTab] = useState<'all' | 'hub' | 'wishes'>('all');
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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

  // Calculate stats
  const totalTasks = user?.agent_total_deliveries || 184;
  const currentLevel = Math.floor(totalTasks / 25) + 1;
  const xpProgress = (totalTasks % 25) / 25;
  const xpCurrent = (totalTasks % 25) * 40;
  const xpNeeded = 1000;

  // Get earnings based on selected tab
  const getEarnings = (period: 'today' | 'week' | 'month' | 'total') => {
    if (selectedEarningsTab === 'hub') return MOCK_EARNINGS.hub_orders[period];
    if (selectedEarningsTab === 'wishes') return MOCK_EARNINGS.wishes[period];
    return MOCK_EARNINGS.hub_orders[period] + MOCK_EARNINGS.wishes[period];
  };

  const getCount = (period: 'today' | 'week' | 'month') => {
    if (selectedEarningsTab === 'hub') return MOCK_EARNINGS.hub_orders.count[period];
    if (selectedEarningsTab === 'wishes') return MOCK_EARNINGS.wishes.count[period];
    return MOCK_EARNINGS.hub_orders.count[period] + MOCK_EARNINGS.wishes.count[period];
  };

  // Get vehicle display
  const getVehicleDisplay = () => {
    const make = user?.agent_vehicle_make || 'Honda';
    const model = user?.agent_vehicle_model || 'Activa 6G';
    return `${make} ${model}`;
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 Profile</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.profileGradient}
          >
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {user?.picture ? (
                  <Image source={{ uri: user.picture }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'G'}</Text>
                  </View>
                )}
                <Animated.View style={[styles.onlineIndicator, { transform: [{ scale: pulseAnim }] }]} />
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>{user?.name || 'Carpet Genie'}</Text>
                <Text style={styles.userPhone}>{user?.phone || '+91 85457 89652'}</Text>
                <View style={styles.levelRow}>
                  <LinearGradient
                    colors={[COLORS.amber, '#F59E0B']}
                    style={styles.levelBadge}
                  >
                    <Ionicons name="flash" size={12} color="#FFF" />
                    <Text style={styles.levelText}>Level {currentLevel}</Text>
                  </LinearGradient>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={COLORS.amber} />
                    <Text style={styles.ratingText}>{user?.agent_rating?.toFixed(1) || '4.9'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* XP Progress */}
            <View style={styles.xpContainer}>
              <View style={styles.xpHeader}>
                <Text style={styles.xpLabel}>Experience Points</Text>
                <Text style={styles.xpValue}>{xpCurrent} / {xpNeeded} XP</Text>
              </View>
              <View style={styles.xpTrack}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.magenta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.xpFill, { width: `${xpProgress * 100}%` }]}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🚀</Text>
            <Text style={styles.statValue}>{totalTasks}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>

        {/* Dedicated Earnings Section */}
        <View style={styles.earningsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💰 Earnings</Text>
          </View>

          {/* Earnings Tabs */}
          <View style={styles.earningsTabs}>
            {(['all', 'hub', 'wishes'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.earningsTab, selectedEarningsTab === tab && styles.earningsTabActive]}
                onPress={() => setSelectedEarningsTab(tab)}
              >
                <Ionicons
                  name={tab === 'all' ? 'wallet' : tab === 'hub' ? 'cube' : 'sparkles'}
                  size={16}
                  color={selectedEarningsTab === tab 
                    ? (tab === 'hub' ? COLORS.blue : tab === 'wishes' ? COLORS.magenta : COLORS.green)
                    : COLORS.textMuted
                  }
                />
                <Text style={[
                  styles.earningsTabText,
                  selectedEarningsTab === tab && styles.earningsTabTextActive,
                  selectedEarningsTab === tab && { 
                    color: tab === 'hub' ? COLORS.blue : tab === 'wishes' ? COLORS.magenta : COLORS.green 
                  }
                ]}>
                  {tab === 'all' ? 'All' : tab === 'hub' ? 'Hub Orders' : 'Wishes'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Earnings Grid */}
          <View style={styles.earningsGrid}>
            <View style={[styles.earningsCard, styles.earningsCardLarge]}>
              <View style={styles.earningsCardHeader}>
                <Text style={styles.earningsCardLabel}>Total Earnings</Text>
                <View style={[styles.earningsIconBg, { backgroundColor: COLORS.green + '20' }]}>
                  <Ionicons name="trending-up" size={18} color={COLORS.green} />
                </View>
              </View>
              <Text style={[styles.earningsCardValue, { color: COLORS.green }]}>
                ₹{getEarnings('total').toLocaleString()}
              </Text>
            </View>

            <View style={styles.earningsCardRow}>
              <View style={styles.earningsCardSmall}>
                <Text style={styles.earningsSmallLabel}>Today</Text>
                <Text style={styles.earningsSmallValue}>₹{getEarnings('today')}</Text>
                <Text style={styles.earningsSmallCount}>{getCount('today')} orders</Text>
              </View>
              <View style={styles.earningsCardSmall}>
                <Text style={styles.earningsSmallLabel}>This Week</Text>
                <Text style={styles.earningsSmallValue}>₹{getEarnings('week').toLocaleString()}</Text>
                <Text style={styles.earningsSmallCount}>{getCount('week')} orders</Text>
              </View>
              <View style={styles.earningsCardSmall}>
                <Text style={styles.earningsSmallLabel}>This Month</Text>
                <Text style={styles.earningsSmallValue}>₹{getEarnings('month').toLocaleString()}</Text>
                <Text style={styles.earningsSmallCount}>{getCount('month')} orders</Text>
              </View>
            </View>
          </View>

          {/* Earnings Breakdown */}
          {selectedEarningsTab === 'all' && (
            <View style={styles.earningsBreakdown}>
              <Text style={styles.breakdownTitle}>Breakdown</Text>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownIcon, { backgroundColor: COLORS.blue + '20' }]}>
                    <Ionicons name="cube" size={18} color={COLORS.blue} />
                  </View>
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.breakdownLabel}>Hub Orders</Text>
                    <Text style={[styles.breakdownValue, { color: COLORS.blue }]}>
                      ₹{MOCK_EARNINGS.hub_orders.total.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownIcon, { backgroundColor: COLORS.magenta + '20' }]}>
                    <Ionicons name="sparkles" size={18} color={COLORS.magenta} />
                  </View>
                  <View style={styles.breakdownInfo}>
                    <Text style={styles.breakdownLabel}>Wishes</Text>
                    <Text style={[styles.breakdownValue, { color: COLORS.magenta }]}>
                      ₹{MOCK_EARNINGS.wishes.total.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Vehicle Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIconBg}>
              <Text style={styles.vehicleEmoji}>
                {user?.agent_vehicle === 'car' ? '🚗' : user?.agent_vehicle === 'motorbike' ? '🏍️' : '🛵'}
              </Text>
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{getVehicleDisplay()}</Text>
              <Text style={styles.vehicleReg}>{user?.agent_vehicle_registration || 'KA-01-AB-1234'}</Text>
            </View>
            {user?.agent_is_electric && (
              <View style={styles.evBadge}>
                <Text style={styles.evEmoji}>⚡</Text>
                <Text style={styles.evText}>EV</Text>
              </View>
            )}
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>🏆 Achievements</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsScroll}
          >
            {ACHIEVEMENTS.map((achievement) => (
              <View 
                key={achievement.id} 
                style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}
              >
                <Text style={[styles.achievementEmoji, !achievement.unlocked && { opacity: 0.3 }]}>
                  {achievement.emoji}
                </Text>
                <Text style={[styles.achievementTitle, !achievement.unlocked && { color: COLORS.textMuted }]}>
                  {achievement.title}
                </Text>
                {achievement.unlocked && (
                  <View style={styles.achievementUnlocked}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.cyan + '20' }]}>
              <Ionicons name="document-text" size={22} color={COLORS.cyan} />
            </View>
            <Text style={styles.actionText}>Documents</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.amber + '20' }]}>
              <Ionicons name="help-circle" size={22} color={COLORS.amber} />
            </View>
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="information-circle" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>About</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileGradient: {
    padding: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    borderWidth: 3,
    borderColor: '#334155',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  xpContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 14,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  xpTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  earningsSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  earningsTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  earningsTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.backgroundSecondary,
    gap: 6,
  },
  earningsTabActive: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  earningsTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  earningsTabTextActive: {
    fontWeight: '700',
  },
  earningsGrid: {
    gap: 12,
  },
  earningsCardLarge: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 14,
    padding: 16,
  },
  earningsCard: {},
  earningsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsCardLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  earningsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCardValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  earningsCardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  earningsCardSmall: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
  },
  earningsSmallLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  earningsSmallValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  earningsSmallCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  earningsBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  breakdownItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  breakdownIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  vehicleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 24,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  vehicleReg: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  evBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  evEmoji: {
    fontSize: 12,
  },
  evText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },
  achievementsSection: {
    marginBottom: 16,
  },
  achievementsScroll: {
    paddingTop: 12,
    gap: 10,
  },
  achievementCard: {
    width: 100,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    position: 'relative',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  achievementUnlocked: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  quickActions: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.error + '15',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.error,
  },
});
