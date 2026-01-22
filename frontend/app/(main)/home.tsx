import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';

interface PartnerStats {
  partner_type: string;
  total_tasks: number;
  total_earnings: number;
  today_earnings: number;
  rating: number;
  active_count: number;
  status: string;
}

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  amber: '#F59E0B',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#22C55E',
  offline: '#9CA3AF',
  lavender: '#E8D9F4',
  blue: '#D0E9F7',
  yellow: '#FCE9C6',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.getAgentStats();
      setStats(response.data);
      setIsOnline(response.data.status === 'available');
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchUser()]);
    setRefreshing(false);
  }, []);

  const toggleOnlineStatus = async () => {
    setStatusLoading(true);
    const newStatus = isOnline ? 'offline' : 'available';
    try {
      await api.updateAgentStatus(newStatus);
      setIsOnline(!isOnline);
      await fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(false);
    }
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.name || 'Agent'}</Text>
          </View>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
          )}
        </View>

        {/* Online Status Toggle */}
        <View style={[styles.statusCard, isOnline && styles.statusCardOnline]}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
            <View>
              <Text style={styles.statusLabel}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
              <Text style={styles.statusSubtext}>
                {isOnline ? 'Accepting orders' : 'Toggle to start accepting'}
              </Text>
            </View>
          </View>
          {statusLoading ? (
            <ActivityIndicator color={isOnline ? COLORS.success : COLORS.primary} />
          ) : (
            <Switch
              value={isOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isOnline ? COLORS.success : '#9CA3AF'}
            />
          )}
        </View>

        {/* Today's Earnings */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <View style={styles.earningsIconBg}>
              <Ionicons name="wallet" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.earningsLabel}>Today's Earnings</Text>
          </View>
          <Text style={styles.earningsAmount}>
            ₹{stats?.today_earnings?.toFixed(2) || '0.00'}
          </Text>
          <TouchableOpacity
            style={styles.viewEarningsBtn}
            onPress={() => router.push('/(main)/profile')}
          >
            <Text style={styles.viewEarningsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.lavender }]}>
            <Ionicons name="cube" size={28} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats?.active_orders || 0}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.blue }]}>
            <Ionicons name="star" size={28} color={COLORS.secondary} />
            <Text style={styles.statValue}>{stats?.active_wishes || 0}</Text>
            <Text style={styles.statLabel}>Active Wishes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.yellow }]}>
            <Ionicons name="bicycle" size={28} color={COLORS.amber} />
            <Text style={styles.statValue}>{stats?.total_deliveries || 0}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="star-half" size={28} color="#EF4444" />
            <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(main)/orders')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: COLORS.lavender }]}>
              <Ionicons name="cube" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionLabel}>Available Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(main)/wishes')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: COLORS.blue }]}>
              <Ionicons name="star" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionLabel}>Browse Wishes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(main)/deliveries')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: COLORS.yellow }]}>
              <Ionicons name="navigate" size={24} color={COLORS.amber} />
            </View>
            <Text style={styles.actionLabel}>My Deliveries</Text>
          </TouchableOpacity>
        </View>
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
  headerLeft: {},
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  statusCardOnline: {
    borderColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.offline,
  },
  statusDotOnline: {
    backgroundColor: COLORS.success,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  earningsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  viewEarningsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewEarningsText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
});
