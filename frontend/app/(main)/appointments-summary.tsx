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
];

export default function AppointmentsSummaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Get user's category and appointments
  const userSkills = user?.agent_skills || [];
  const userCategory = getUserCategory(userSkills);
  const categoryAppointments = MOCK_APPOINTMENTS[userCategory] || MOCK_APPOINTMENTS['home_services'] || [];

  // Calculate stats
  const completedCount = categoryAppointments.filter(apt => apt.status === 'completed').length;
  const inProgressCount = categoryAppointments.filter(apt => apt.status === 'in_progress').length;
  const upcomingCount = categoryAppointments.filter(apt => apt.status === 'upcoming').length;
  const totalCount = categoryAppointments.length;

  // Period-based stats (mock multipliers)
  const periodMultipliers = {
    today: 1,
    week: 5,
    month: 22,
  };
  const multiplier = periodMultipliers[selectedPeriod as keyof typeof periodMultipliers];

  const periodStats = {
    total: totalCount * multiplier,
    completed: completedCount * multiplier,
    cancelled: Math.round(totalCount * multiplier * 0.05),
    avgDuration: '2.5 hrs',
    busiestDay: 'Saturday',
    peakTime: '10 AM - 2 PM',
  };

  const completionRate = periodStats.total > 0 
    ? Math.round((periodStats.completed / periodStats.total) * 100) 
    : 0;

  // Upcoming appointments
  const upcomingAppointments = categoryAppointments.filter(apt => apt.status === 'upcoming' || apt.status === 'in_progress');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments Overview</Text>
        <TouchableOpacity 
          style={styles.calendarBtn}
          onPress={() => router.push('/(main)/appointments')}
        >
          <Ionicons name="calendar" size={22} color={COLORS.primary} />
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

        {/* Main Stats Card */}
        <View style={styles.mainStatsCard}>
          <View style={styles.mainStatItem}>
            <Text style={styles.mainStatValue}>{periodStats.total}</Text>
            <Text style={styles.mainStatLabel}>Total Bookings</Text>
          </View>
          <View style={styles.mainStatDivider} />
          <View style={styles.mainStatItem}>
            <Text style={[styles.mainStatValue, { color: COLORS.success }]}>{completionRate}%</Text>
            <Text style={styles.mainStatLabel}>Completion Rate</Text>
          </View>
        </View>

        {/* Status Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Booking Status</Text>
          
          <View style={styles.statusGrid}>
            <View style={[styles.statusItem, { borderColor: COLORS.success }]}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.statusValue}>{periodStats.completed}</Text>
              <Text style={styles.statusLabel}>Completed</Text>
            </View>
            
            <View style={[styles.statusItem, { borderColor: COLORS.warning }]}>
              <Ionicons name="time" size={24} color={COLORS.warning} />
              <Text style={styles.statusValue}>{inProgressCount * multiplier}</Text>
              <Text style={styles.statusLabel}>In Progress</Text>
            </View>
            
            <View style={[styles.statusItem, { borderColor: COLORS.primary }]}>
              <Ionicons name="calendar" size={24} color={COLORS.primary} />
              <Text style={styles.statusValue}>{upcomingCount * multiplier}</Text>
              <Text style={styles.statusLabel}>Scheduled</Text>
            </View>
            
            <View style={[styles.statusItem, { borderColor: COLORS.error }]}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
              <Text style={styles.statusValue}>{periodStats.cancelled}</Text>
              <Text style={styles.statusLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Insights Card */}
        <View style={styles.insightsCard}>
          <Text style={styles.sectionTitle}>Insights</Text>
          
          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Ionicons name="timer-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Average Duration</Text>
              <Text style={styles.insightValue}>{periodStats.avgDuration}</Text>
            </View>
          </View>

          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Ionicons name="flame-outline" size={20} color={COLORS.warning} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Busiest Day</Text>
              <Text style={styles.insightValue}>{periodStats.busiestDay}</Text>
            </View>
          </View>

          <View style={styles.insightRow}>
            <View style={styles.insightIcon}>
              <Ionicons name="sunny-outline" size={20} color={COLORS.success} />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightLabel}>Peak Hours</Text>
              <Text style={styles.insightValue}>{periodStats.peakTime}</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Section */}
        <View style={styles.upcomingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/appointments')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No upcoming appointments</Text>
            </View>
          ) : (
            upcomingAppointments.map((apt) => (
              <TouchableOpacity key={apt.id} style={styles.appointmentCard}>
                <View style={styles.aptTimeCol}>
                  <Text style={styles.aptTime}>{apt.time}</Text>
                  <Text style={styles.aptDuration}>{apt.duration}</Text>
                </View>
                <View style={styles.aptDivider} />
                <View style={styles.aptContent}>
                  <Text style={styles.aptService}>{apt.service}</Text>
                  <Text style={styles.aptCustomer}>{apt.customer}</Text>
                  <View style={styles.aptLocation}>
                    <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.aptLocationText} numberOfLines={1}>{apt.location}</Text>
                  </View>
                </View>
                <View style={[
                  styles.aptStatus,
                  { backgroundColor: apt.status === 'in_progress' ? COLORS.warning + '15' : COLORS.primary + '15' }
                ]}>
                  <Ionicons 
                    name={apt.status === 'in_progress' ? 'time' : 'calendar'} 
                    size={14} 
                    color={apt.status === 'in_progress' ? COLORS.warning : COLORS.primary} 
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push('/(main)/appointments')}
          >
            <Ionicons name="calendar" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>Open Calendar</Text>
          </TouchableOpacity>
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
  calendarBtn: {
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
  mainStatsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  mainStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
  },
  mainStatLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  mainStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 20,
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statusItem: {
    width: (SCREEN_WIDTH - 64) / 2 - 6,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  insightsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  upcomingSection: {
    marginBottom: 16,
  },
  sectionHeader: {
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
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  aptTimeCol: {
    alignItems: 'center',
    width: 60,
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
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  aptContent: {
    flex: 1,
  },
  aptService: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  aptCustomer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  aptLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  aptLocationText: {
    fontSize: 11,
    color: COLORS.textMuted,
    flex: 1,
  },
  aptStatus: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsCard: {
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
