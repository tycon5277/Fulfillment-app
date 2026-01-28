import React, { useState, useMemo } from 'react';
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Filter tabs for sorting appointments
const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Get user's category and appointments
  const userSkills = user?.agent_skills || [];
  const userCategory = getUserCategory(userSkills);
  const categoryAppointments = MOCK_APPOINTMENTS[userCategory] || MOCK_APPOINTMENTS['home_services'] || [];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const todayKey = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);
  
  // Filter and sort appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...categoryAppointments];
    
    // Apply filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedFilter);
    }
    
    // Sort: in_progress first, then upcoming, then completed
    const statusOrder: { [key: string]: number } = {
      'in_progress': 0,
      'upcoming': 1,
      'completed': 2,
    };
    
    filtered.sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 3;
      const orderB = statusOrder[b.status] ?? 3;
      return orderA - orderB;
    });
    
    return filtered;
  }, [categoryAppointments, selectedFilter]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: COLORS.success + '15', text: COLORS.success, icon: 'checkmark-circle', label: 'Completed' };
      case 'in_progress':
        return { bg: COLORS.warning + '15', text: COLORS.warning, icon: 'time', label: 'In Progress' };
      case 'upcoming':
        return { bg: COLORS.primary + '15', text: COLORS.primary, icon: 'calendar', label: 'Upcoming' };
      default:
        return { bg: COLORS.textMuted + '15', text: COLORS.textMuted, icon: 'help', label: status };
    }
  };

  const hasAppointments = (date: Date) => {
    return categoryAppointments.length > 0;
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  // Get counts for filter badges
  const filterCounts = useMemo(() => ({
    all: categoryAppointments.length,
    upcoming: categoryAppointments.filter(a => a.status === 'upcoming').length,
    in_progress: categoryAppointments.filter(a => a.status === 'in_progress').length,
    completed: categoryAppointments.filter(a => a.status === 'completed').length,
  }), [categoryAppointments]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Month & Year */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => navigateDate(-7)}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateDate(7)}>
          <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Week View */}
      <View style={styles.weekContainer}>
        {weekDates.map((date, index) => {
          const isToday = formatDateKey(date) === todayKey;
          const isSelected = formatDateKey(date) === selectedKey;
          const hasApt = hasAppointments(date);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCard,
                isSelected && styles.dayCardSelected,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {DAYS[date.getDay()]}
              </Text>
              <Text style={[
                styles.dayNumber,
                isToday && styles.dayNumberToday,
                isSelected && styles.dayNumberSelected,
              ]}>
                {date.getDate()}
              </Text>
              {hasApt && (
                <View style={[styles.aptDot, isSelected && styles.aptDotSelected]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{appointments.length}</Text>
          <Text style={styles.summaryLabel}>Appointments</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            ₹{appointments.reduce((sum, apt) => sum + apt.earnings, 0).toLocaleString()}
          </Text>
          <Text style={styles.summaryLabel}>Expected</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {appointments.reduce((sum, apt) => sum + parseFloat(apt.duration), 0)} hrs
          </Text>
          <Text style={styles.summaryLabel}>Total Time</Text>
        </View>
      </View>

      {/* Appointments List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {appointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptyText}>You don't have any appointments scheduled for this day.</Text>
          </View>
        ) : (
          appointments.map((apt, index) => {
            const statusStyle = getStatusStyle(apt.status);
            return (
              <TouchableOpacity 
                key={apt.id} 
                style={styles.aptCard}
                onPress={() => router.push(`/(main)/appointment-detail?id=${apt.id}`)}
                activeOpacity={0.7}
              >
                {/* Timeline */}
                <View style={styles.timeline}>
                  <View style={[styles.timelineDot, { backgroundColor: statusStyle.text }]} />
                  {index < appointments.length - 1 && <View style={styles.timelineLine} />}
                </View>
                
                {/* Content */}
                <View style={styles.aptCardContent}>
                  <View style={styles.aptCardHeader}>
                    <View>
                      <Text style={styles.aptTime}>{apt.time}</Text>
                      <Text style={styles.aptDuration}>{apt.duration}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Ionicons name={statusStyle.icon as any} size={12} color={statusStyle.text} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.aptService}>{apt.service}</Text>
                  <Text style={styles.aptCustomer}>{apt.customer}</Text>
                  
                  <View style={styles.aptFooter}>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                      <Text style={styles.locationText}>{apt.location}</Text>
                    </View>
                    <Text style={styles.aptEarnings}>₹{apt.earnings}</Text>
                  </View>
                  
                  {apt.status === 'upcoming' && (
                    <View style={styles.aptActions}>
                      <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>Navigate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn}>
                        <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>Chat</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.startBtn]}>
                        <Text style={styles.startBtnText}>Start Job</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
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
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
  },
  monthText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  weekContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  dayCardSelected: {
    backgroundColor: COLORS.primary,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  dayNameSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayNumberToday: {
    color: COLORS.primary,
  },
  dayNumberSelected: {
    color: '#FFF',
  },
  aptDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  aptDotSelected: {
    backgroundColor: '#FFF',
  },
  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  aptCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  timeline: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
  },
  aptCardContent: {
    flex: 1,
    marginLeft: 12,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  aptTime: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  aptDuration: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  aptService: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  aptCustomer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  aptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  aptEarnings: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.success,
  },
  aptActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  startBtn: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
});
