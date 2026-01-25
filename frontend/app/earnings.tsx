import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import THEME from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 180;

// Mock earnings data for the past 7 days
const MOCK_WEEKLY_DATA = [
  { day: 'Mon', earnings: 450, orders: 8 },
  { day: 'Tue', earnings: 620, orders: 12 },
  { day: 'Wed', earnings: 380, orders: 7 },
  { day: 'Thu', earnings: 780, orders: 15 },
  { day: 'Fri', earnings: 920, orders: 18 },
  { day: 'Sat', earnings: 1100, orders: 22 },
  { day: 'Sun', earnings: 550, orders: 10 },
];

// Mock monthly earnings
const MOCK_MONTHLY_STATS = {
  total: 24500,
  thisWeek: 4800,
  lastWeek: 4200,
  growth: 14.3,
  totalOrders: 92,
  avgPerOrder: 52,
  bonusEarned: 1200,
  level: 3,
  xpEarned: 920,
};

// Mock achievements
const ACHIEVEMENTS = [
  { id: '1', icon: '🚀', title: 'Speed Demon', desc: 'Complete 5 orders in 1 hour', progress: 80, unlocked: false },
  { id: '2', icon: '⭐', title: '5-Star Hero', desc: 'Get 10 five-star ratings', progress: 100, unlocked: true },
  { id: '3', icon: '🔥', title: 'Hot Streak', desc: '7-day delivery streak', progress: 57, unlocked: false },
  { id: '4', icon: '💎', title: 'Diamond Genie', desc: 'Earn ₹50,000 total', progress: 49, unlocked: false },
];

export default function EarningsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [weeklyData, setWeeklyData] = useState(MOCK_WEEKLY_DATA);
  const [stats, setStats] = useState(MOCK_MONTHLY_STATS);

  const maxEarning = Math.max(...weeklyData.map(d => d.earnings));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const getBarHeight = (value: number) => {
    return (value / maxEarning) * (CHART_HEIGHT - 40);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={THEME.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Earnings</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Total Earnings Card */}
        <LinearGradient
          colors={['#10B981', '#059669', '#047857']}
          style={styles.totalCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.totalCardContent}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>₹{stats.total.toLocaleString()}</Text>
            <View style={styles.growthBadge}>
              <Ionicons name="trending-up" size={14} color="#34D399" />
              <Text style={styles.growthText}>+{stats.growth}% this week</Text>
            </View>
          </View>
          <View style={styles.totalIconContainer}>
            <Text style={styles.totalEmoji}>💰</Text>
          </View>
        </LinearGradient>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💵</Text>
            <Text style={styles.statValue}>₹{stats.avgPerOrder}</Text>
            <Text style={styles.statLabel}>Avg/Order</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🎁</Text>
            <Text style={styles.statValue}>₹{stats.bonusEarned}</Text>
            <Text style={styles.statLabel}>Bonus</Text>
          </View>
        </View>

        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodBtn, selectedPeriod === 'week' && styles.periodBtnActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodBtnText, selectedPeriod === 'week' && styles.periodBtnTextActive]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodBtn, selectedPeriod === 'month' && styles.periodBtnActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodBtnText, selectedPeriod === 'month' && styles.periodBtnTextActive]}>
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>📊 Earnings Overview</Text>
            <Text style={styles.chartSubtitle}>₹{stats.thisWeek.toLocaleString()} this week</Text>
          </View>
          
          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              {weeklyData.map((item, index) => (
                <View key={index} style={styles.barColumn}>
                  <View style={styles.barWrapper}>
                    <View 
                      style={[
                        styles.bar,
                        { height: getBarHeight(item.earnings) },
                        index === weeklyData.length - 2 && styles.barHighlight, // Highlight Saturday (best day)
                      ]} 
                    />
                    <Text style={styles.barValue}>₹{item.earnings}</Text>
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.performanceCard}>
          <Text style={styles.sectionTitle}>🏆 Performance</Text>
          
          <View style={styles.perfRow}>
            <View style={styles.perfItem}>
              <View style={[styles.perfIcon, { backgroundColor: THEME.primary + '20' }]}>
                <Ionicons name="flash" size={20} color={THEME.primary} />
              </View>
              <View>
                <Text style={styles.perfValue}>{stats.xpEarned} XP</Text>
                <Text style={styles.perfLabel}>Earned this week</Text>
              </View>
            </View>
            <View style={styles.perfItem}>
              <View style={[styles.perfIcon, { backgroundColor: THEME.accent2 + '20' }]}>
                <Ionicons name="trophy" size={20} color={THEME.accent2} />
              </View>
              <View>
                <Text style={styles.perfValue}>Level {stats.level}</Text>
                <Text style={styles.perfLabel}>Current rank</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>Last Week</Text>
              <Text style={styles.comparisonValue}>₹{stats.lastWeek.toLocaleString()}</Text>
            </View>
            <View style={styles.comparisonDivider} />
            <View style={styles.comparisonItem}>
              <Text style={styles.comparisonLabel}>This Week</Text>
              <Text style={[styles.comparisonValue, styles.comparisonHighlight]}>
                ₹{stats.thisWeek.toLocaleString()}
              </Text>
            </View>
            <View style={styles.comparisonArrow}>
              <Ionicons name="arrow-up" size={20} color={THEME.success} />
              <Text style={styles.comparisonGrowth}>+{stats.growth}%</Text>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>🎖️ Achievements</Text>
          
          {ACHIEVEMENTS.map((achievement) => (
            <View 
              key={achievement.id} 
              style={[styles.achievementCard, achievement.unlocked && styles.achievementUnlocked]}
            >
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{achievement.desc}</Text>
                <View style={styles.progressBarTrack}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${achievement.progress}%` },
                      achievement.unlocked && styles.progressBarComplete
                    ]} 
                  />
                </View>
              </View>
              <View style={styles.achievementBadge}>
                {achievement.unlocked ? (
                  <Ionicons name="checkmark-circle" size={24} color={THEME.success} />
                ) : (
                  <Text style={styles.achievementProgress}>{achievement.progress}%</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Tip Card */}
        <View style={styles.tipCard}>
          <LinearGradient
            colors={[THEME.secondary + '20', THEME.secondary + '10']}
            style={styles.tipGradient}
          >
            <Text style={styles.tipEmoji}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Pro Tip</Text>
              <Text style={styles.tipText}>
                Saturday and Sunday have the highest order volume. Go online early to maximize earnings!
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
  },
  // Total Card
  totalCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalCardContent: {},
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFF',
    marginVertical: 4,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  growthText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  totalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalEmoji: {
    fontSize: 32,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  statLabel: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  // Period Toggle
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodBtnActive: {
    backgroundColor: THEME.primary,
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  periodBtnTextActive: {
    color: '#FFF',
  },
  // Chart Card
  chartCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  chartSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  chartContainer: {
    height: CHART_HEIGHT,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: CHART_HEIGHT - 30,
  },
  bar: {
    width: 28,
    backgroundColor: THEME.primary + '60',
    borderRadius: 6,
    minHeight: 4,
  },
  barHighlight: {
    backgroundColor: THEME.primary,
  },
  barValue: {
    fontSize: 9,
    color: THEME.textMuted,
    marginTop: 4,
    transform: [{ rotate: '-45deg' }],
  },
  barLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  // Performance Card
  performanceCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 14,
  },
  perfRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  perfItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.backgroundSecondary,
    padding: 12,
    borderRadius: 12,
  },
  perfIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfValue: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },
  perfLabel: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
  },
  comparisonItem: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 11,
    color: THEME.textMuted,
    marginBottom: 4,
  },
  comparisonValue: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  comparisonHighlight: {
    color: THEME.success,
  },
  comparisonDivider: {
    width: 1,
    height: 30,
    backgroundColor: THEME.cardBorder,
  },
  comparisonArrow: {
    alignItems: 'center',
    paddingLeft: 14,
  },
  comparisonGrowth: {
    fontSize: 12,
    color: THEME.success,
    fontWeight: '600',
  },
  // Achievements
  achievementsSection: {
    marginBottom: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  achievementUnlocked: {
    borderColor: THEME.success + '50',
    backgroundColor: THEME.success + '08',
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 22,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  achievementDesc: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: THEME.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.secondary,
    borderRadius: 2,
  },
  progressBarComplete: {
    backgroundColor: THEME.success,
  },
  achievementBadge: {
    marginLeft: 10,
  },
  achievementProgress: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  // Tip Card
  tipCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tipGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  tipEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.secondary,
    marginBottom: 2,
  },
  tipText: {
    fontSize: 12,
    color: THEME.textSecondary,
    lineHeight: 18,
  },
});
