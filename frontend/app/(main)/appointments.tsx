import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as api from '../../src/api';
import { useAuthStore } from '../../src/store';

const COLORS = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  primary: '#6366F1',
  primaryLight: '#818CF8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
};

// Simple filter tabs
const FILTER_TABS = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'recent', label: 'Recent', icon: 'time' },
  { key: 'upcoming', label: 'Upcoming', icon: 'calendar' },
  { key: 'completed', label: 'Done', icon: 'checkmark-circle' },
];

interface Appointment {
  appointment_id: string;
  service_title: string;
  customer_name: string;
  scheduled_date: string;
  scheduled_time?: string;
  location: string;
  price: number;
  status: string;
  notes?: string;
  created_at?: string;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Fetch appointments from backend
  const fetchAppointments = async () => {
    try {
      const response = await api.default.get('/appointments');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.log('Using mock appointments');
      // Mock data for demo
      setAppointments([
        {
          appointment_id: 'apt_demo_1',
          service_title: 'Home Cleaning',
          customer_name: 'Priya Sharma',
          scheduled_date: 'Thu, 30 Jan 2025',
          scheduled_time: '3:00 PM',
          location: 'Andheri West, Mumbai',
          price: 1500,
          status: 'upcoming',
          created_at: new Date().toISOString(),
        },
        {
          appointment_id: 'apt_demo_2',
          service_title: 'Plumbing Repair',
          customer_name: 'Rahul Mehta',
          scheduled_date: 'Fri, 31 Jan 2025',
          scheduled_time: '10:00 AM',
          location: 'Bandra, Mumbai',
          price: 800,
          status: 'upcoming',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];
    
    switch (selectedFilter) {
      case 'recent':
        // Sort by created_at descending (most recent first)
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(apt => apt.status === 'upcoming');
        break;
      case 'completed':
        filtered = filtered.filter(apt => apt.status === 'completed');
        break;
      default:
        // All - show upcoming first, then in_progress, then completed
        const statusOrder: { [key: string]: number } = {
          'upcoming': 0,
          'in_progress': 1,
          'completed': 2,
        };
        filtered.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3));
    }
    
    return filtered;
  }, [appointments, selectedFilter]);

  // Get counts
  const counts = useMemo(() => ({
    all: appointments.length,
    recent: appointments.length,
    upcoming: appointments.filter(a => a.status === 'upcoming').length,
    completed: appointments.filter(a => a.status === 'completed').length,
  }), [appointments]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: COLORS.success + '15', color: COLORS.success, icon: 'checkmark-circle' as const };
      case 'in_progress':
        return { bg: COLORS.warning + '15', color: COLORS.warning, icon: 'play-circle' as const };
      case 'upcoming':
        return { bg: COLORS.primary + '15', color: COLORS.primary, icon: 'calendar' as const };
      default:
        return { bg: COLORS.textMuted + '15', color: COLORS.textMuted, icon: 'help-circle' as const };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Simple Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{appointments.length}</Text>
        </View>
      </View>

      {/* Filter Tabs - Horizontal Scroll */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = selectedFilter === tab.key;
            const count = counts[tab.key as keyof typeof counts];
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setSelectedFilter(tab.key)}
              >
                <Ionicons 
                  name={tab.icon as any} 
                  size={18} 
                  color={isActive ? '#FFF' : COLORS.textSecondary} 
                />
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'completed' 
                ? 'Completed jobs will appear here'
                : 'Accept jobs from Work Orders to see them here'}
            </Text>
          </View>
        ) : (
          <>
            {selectedFilter === 'recent' && (
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Recently Added</Text>
              </View>
            )}
            
            {filteredAppointments.map((apt) => {
              const status = getStatusStyle(apt.status);
              return (
                <TouchableOpacity 
                  key={apt.appointment_id} 
                  style={styles.appointmentCard}
                  activeOpacity={0.7}
                >
                  {/* Status Indicator */}
                  <View style={[styles.statusBar, { backgroundColor: status.color }]} />
                  
                  <View style={styles.cardContent}>
                    {/* Top Row: Title & Price */}
                    <View style={styles.cardTopRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{apt.service_title}</Text>
                      <Text style={styles.cardPrice}>₹{apt.price}</Text>
                    </View>

                    {/* Customer */}
                    <View style={styles.cardRow}>
                      <Ionicons name="person" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.cardText}>{apt.customer_name}</Text>
                    </View>

                    {/* Date & Time */}
                    <View style={styles.cardRow}>
                      <Ionicons name="calendar" size={16} color={COLORS.primary} />
                      <Text style={styles.cardText}>{apt.scheduled_date}</Text>
                      {apt.scheduled_time && (
                        <>
                          <Text style={styles.cardDivider}>•</Text>
                          <Ionicons name="time" size={16} color={COLORS.warning} />
                          <Text style={styles.cardText}>{apt.scheduled_time}</Text>
                        </>
                      )}
                    </View>

                    {/* Location */}
                    <View style={styles.cardRow}>
                      <Ionicons name="location" size={16} color={COLORS.error} />
                      <Text style={styles.cardTextMuted} numberOfLines={1}>{apt.location}</Text>
                    </View>

                    {/* Status Badge */}
                    <View style={styles.cardFooter}>
                      <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Ionicons name={status.icon} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {apt.status.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Bottom Padding */}
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
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerBadge: {
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },

  // Filters
  filterContainer: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  filterBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 2,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterBadgeTextActive: {
    color: '#FFF',
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Appointment Card
  appointmentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
  },
  statusBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.success,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.text,
  },
  cardTextMuted: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardDivider: {
    color: COLORS.textMuted,
    marginHorizontal: 4,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
