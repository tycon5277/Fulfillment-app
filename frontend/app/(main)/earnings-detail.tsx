import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { getUserCategory, MOCK_APPOINTMENTS } from '../../src/skillMockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

const PERIOD_TABS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

export default function EarningsDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Get user's category and appointments for earnings calculation
  const userSkills = user?.agent_skills || [];
  const userCategory = getUserCategory(userSkills);
  const categoryAppointments = MOCK_APPOINTMENTS[userCategory] || [];

  // Calculate earnings from appointments
  const completedAppointments = categoryAppointments.filter(apt => apt.status === 'completed');
  const todayEarnings = completedAppointments.reduce((sum, apt) => sum + apt.earnings, 0);

  // Mock earnings data based on period
  const earningsData = {
    today: {
      total: todayEarnings,
      jobs: completedAppointments.length,
      avgPerJob: completedAppointments.length > 0 ? Math.round(todayEarnings / completedAppointments.length) : 0,
      tips: Math.round(todayEarnings * 0.08),
      commission: Math.round(todayEarnings * 0.15),
    },
    week: {
      total: todayEarnings * 5.5,
      jobs: completedAppointments.length * 5,
      avgPerJob: completedAppointments.length > 0 ? Math.round((todayEarnings * 5.5) / (completedAppointments.length * 5)) : 0,
      tips: Math.round(todayEarnings * 5.5 * 0.08),
      commission: Math.round(todayEarnings * 5.5 * 0.15),
    },
    month: {
      total: todayEarnings * 22,
      jobs: completedAppointments.length * 20,
      avgPerJob: completedAppointments.length > 0 ? Math.round((todayEarnings * 22) / (completedAppointments.length * 20)) : 0,
      tips: Math.round(todayEarnings * 22 * 0.08),
      commission: Math.round(todayEarnings * 22 * 0.15),
    },
    all: {
      total: (user?.partner_total_earnings || 0),
      jobs: (user?.partner_total_tasks || 0),
      avgPerJob: (user?.partner_total_tasks || 0) > 0 ? Math.round((user?.partner_total_earnings || 0) / (user?.partner_total_tasks || 1)) : 0,
      tips: Math.round((user?.partner_total_earnings || 0) * 0.08),
      commission: Math.round((user?.partner_total_earnings || 0) * 0.15),
    },
  };

  const currentData = earningsData[selectedPeriod as keyof typeof earningsData];
  const netEarnings = currentData.total - currentData.commission;

  // Recent transactions (mock)
  const recentTransactions = categoryAppointments.map((apt, index) => ({
    id: apt.id,
    service: apt.service,
    customer: apt.customer,
    amount: apt.earnings,
    date: index === 0 ? 'Today' : index === 1 ? 'Yesterday' : `${index + 1} days ago`,
    status: apt.status === 'completed' ? 'credited' : 'pending',
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity style={styles.downloadBtn}>
          <Ionicons name="download-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Period Tabs */}
        <View style={styles.periodTabs}>
          {PERIOD_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.periodTab,
                selectedPeriod === tab.key && styles.periodTabActive,
              ]}
              onPress={() => setSelectedPeriod(tab.key)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  selectedPeriod === tab.key && styles.periodTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main Earnings Card */}
        <View style={styles.mainEarningsCard}>
          <Text style={styles.mainEarningsLabel}>Net Earnings</Text>
          <Text style={styles.mainEarningsValue}>₹{netEarnings.toLocaleString()}</Text>
          <View style={styles.earningsGrowth}>
            <Ionicons name="trending-up" size={16} color={COLORS.success} />
            <Text style={styles.earningsGrowthText}>+12% from last period</Text>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
          
          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownIcon, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="wallet" size={18} color={COLORS.success} />
              </View>
              <Text style={styles.breakdownLabel}>Service Earnings</Text>
            </View>
            <Text style={styles.breakdownValue}>₹{currentData.total.toLocaleString()}</Text>
          </View>

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownIcon, { backgroundColor: COLORS.warning + '15' }]}>
                <Ionicons name="gift" size={18} color={COLORS.warning} />
              </View>
              <Text style={styles.breakdownLabel}>Tips Received</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.success }]}>+₹{currentData.tips.toLocaleString()}</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownItem}>
            <View style={styles.breakdownLeft}>
              <View style={[styles.breakdownIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="cash" size={18} color={COLORS.primary} />
              </View>
              <Text style={[styles.breakdownLabel, { fontWeight: '700' }]}>Total Earned</Text>
            </View>
            <Text style={[styles.breakdownValue, { fontWeight: '700', color: COLORS.primary }]}>₹{(currentData.total + currentData.tips).toLocaleString()}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="briefcase-outline" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{currentData.jobs}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calculator-outline" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>₹{currentData.avgPerJob.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Avg/Job</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.slice(0, 5).map((tx) => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <View style={[styles.txIcon, { backgroundColor: tx.status === 'credited' ? COLORS.success + '15' : COLORS.warning + '15' }]}>
                  <Ionicons 
                    name={tx.status === 'credited' ? 'checkmark-circle' : 'time'} 
                    size={18} 
                    color={tx.status === 'credited' ? COLORS.success : COLORS.warning} 
                  />
                </View>
                <View>
                  <Text style={styles.txService}>{tx.service}</Text>
                  <Text style={styles.txCustomer}>{tx.customer} • {tx.date}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: tx.status === 'credited' ? COLORS.success : COLORS.text }]}>
                  {tx.status === 'credited' ? '+' : ''}₹{tx.amount.toLocaleString()}
                </Text>
                <Text style={[styles.txStatus, { color: tx.status === 'credited' ? COLORS.success : COLORS.warning }]}>
                  {tx.status === 'credited' ? 'Credited' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  downloadBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodTabActive: {
    backgroundColor: COLORS.primary,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodTabTextActive: {
    color: '#FFF',
  },
  mainEarningsCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  mainEarningsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  mainEarningsValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
  },
  earningsGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  earningsGrowthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  breakdownCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  transactionsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txService: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  txCustomer: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  txStatus: {
    fontSize: 11,
    fontWeight: '500',
  },
  withdrawBtn: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  withdrawBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
