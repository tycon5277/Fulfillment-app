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
import { useAuthStore, PartnerStats, User } from '../../src/store';
import * as api from '../../src/api';

// Mobile Genie Theme - Dark with Neon Green (inspired by Fly screenshot)
const COLORS = {
  background: '#0A0A0A',
  cardBg: '#1A1A1A',
  cardBorder: '#2A2A2A',
  primary: '#10B981',      // Neon Green
  primaryLight: '#34D399',
  primaryDark: '#059669',
  secondary: '#8B5CF6',    // Purple
  accent1: '#EC4899',      // Pink
  accent2: '#F59E0B',      // Yellow/Amber
  accent3: '#3B82F6',      // Blue
  accent4: '#06B6D4',      // Cyan
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#22C55E',
  error: '#EF4444',
  offline: '#EF4444',
  online: '#10B981',
};

// Skilled Genie Theme - Teal
const SKILLED_COLORS = {
  background: '#F0FDFA',
  cardBg: '#FFFFFF',
  cardBorder: '#CCFBF1',
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  text: '#134E4A',
  textSecondary: '#5EEAD4',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  const isMobileGenie = user?.agent_type === 'mobile';
  const isSkilledGenie = user?.agent_type === 'skilled';

  const fetchStats = async () => {
    try {
      const response = await api.getPartnerStats();
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
      await api.updatePartnerStatus(newStatus);
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

  // Get vehicle display name
  const getVehicleDisplay = () => {
    const make = user?.agent_vehicle_make || '';
    const model = user?.agent_vehicle_model || '';
    const type = user?.agent_vehicle || '';
    if (make && model) return `${make} ${model}`;
    if (make) return make;
    if (model) return model;
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Mobile Genie Dashboard
  if (isMobileGenie) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]} 👋</Text>
              <Text style={styles.subtitle}>Ready to fulfill wishes?</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => router.push('/(main)/profile')}
            >
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Online Status Card */}
          <View style={[styles.statusCard, isOnline && styles.statusCardOnline]}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, isOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
              <View>
                <Text style={styles.statusTitle}>
                  {isOnline ? "You're Online" : "You're Offline"}
                </Text>
                <Text style={styles.statusSubtext}>
                  {isOnline ? 'Wishes coming your way!' : 'Go online to receive wishes'}
                </Text>
              </View>
            </View>
            {statusLoading ? (
              <ActivityIndicator color={isOnline ? COLORS.primary : COLORS.textMuted} />
            ) : (
              <Switch
                value={isOnline}
                onValueChange={toggleOnlineStatus}
                trackColor={{ false: COLORS.cardBorder, true: COLORS.primary + '50' }}
                thumbColor={isOnline ? COLORS.primary : COLORS.textMuted}
              />
            )}
          </View>

          {/* XP & Level Card (Gamification) */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <View style={styles.levelBadge}>
                <Ionicons name="star" size={14} color={COLORS.accent2} />
                <Text style={styles.levelText}>Level {Math.floor((stats?.total_tasks || 0) / 10) + 1}</Text>
              </View>
              <Text style={styles.xpText}>{((stats?.total_tasks || 0) % 10) * 100} / 1000 XP</Text>
            </View>
            <View style={styles.xpBarTrack}>
              <View style={[styles.xpBarFill, { width: `${((stats?.total_tasks || 0) % 10) * 10}%` }]} />
            </View>
            <Text style={styles.xpHint}>{10 - ((stats?.total_tasks || 0) % 10)} more tasks to level up!</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
              <View style={[styles.statIconBg, { backgroundColor: COLORS.primary + '30' }]}>
                <Ionicons name="wallet" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>₹{stats?.today_earnings?.toFixed(0) || '0'}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.accent3 + '15' }]}>
              <View style={[styles.statIconBg, { backgroundColor: COLORS.accent3 + '30' }]}>
                <Ionicons name="checkmark-done" size={22} color={COLORS.accent3} />
              </View>
              <Text style={styles.statValue}>{stats?.total_tasks || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.accent2 + '15' }]}>
              <View style={[styles.statIconBg, { backgroundColor: COLORS.accent2 + '30' }]}>
                <Ionicons name="star" size={22} color={COLORS.accent2} />
              </View>
              <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: COLORS.accent1 + '15' }]}>
              <View style={[styles.statIconBg, { backgroundColor: COLORS.accent1 + '30' }]}>
                <Ionicons name="flame" size={22} color={COLORS.accent1} />
              </View>
              <Text style={styles.statValue}>{stats?.active_count || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>

          {/* Vehicle Card */}
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconBg}>
                <Ionicons 
                  name={user?.agent_vehicle === 'car' ? 'car' : user?.agent_vehicle === 'motorbike' ? 'bicycle' : 'speedometer'} 
                  size={24} 
                  color={COLORS.primary} 
                />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{getVehicleDisplay()}</Text>
                <Text style={styles.vehicleReg}>{user?.agent_vehicle_registration || 'N/A'}</Text>
              </View>
              {user?.agent_is_electric && (
                <View style={styles.evBadge}>
                  <Ionicons name="flash" size={12} color={COLORS.success} />
                  <Text style={styles.evText}>EV</Text>
                </View>
              )}
            </View>
            <View style={styles.vehicleDetails}>
              {user?.agent_vehicle_color && (
                <View style={styles.vehicleDetail}>
                  <View style={[styles.colorDot, { backgroundColor: getColorHex(user.agent_vehicle_color) }]} />
                  <Text style={styles.vehicleDetailText}>{user.agent_vehicle_color}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Services */}
          <Text style={styles.sectionTitle}>Your Services</Text>
          <View style={styles.servicesRow}>
            {(user?.agent_services || []).map((service: string) => (
              <View key={service} style={[styles.serviceChip, { backgroundColor: getServiceColor(service) + '20' }]}>
                <Ionicons name={getServiceIcon(service)} size={14} color={getServiceColor(service)} />
                <Text style={[styles.serviceChipText, { color: getServiceColor(service) }]}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/orders')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="cube" size={26} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>Available</Text>
              <Text style={styles.actionSubtext}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/wishes')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.secondary + '20' }]}>
                <Ionicons name="star" size={26} color={COLORS.secondary} />
              </View>
              <Text style={styles.actionLabel}>Browse</Text>
              <Text style={styles.actionSubtext}>Wishes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/deliveries')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: COLORS.accent2 + '20' }]}>
                <Ionicons name="navigate" size={26} color={COLORS.accent2} />
              </View>
              <Text style={styles.actionLabel}>Active</Text>
              <Text style={styles.actionSubtext}>Deliveries</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Challenge Card (Gamification) */}
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Ionicons name="trophy" size={20} color={COLORS.accent2} />
              <Text style={styles.challengeTitle}>Daily Challenge</Text>
            </View>
            <Text style={styles.challengeDesc}>Complete 5 deliveries today</Text>
            <View style={styles.challengeProgress}>
              <View style={styles.challengeBarTrack}>
                <View style={[styles.challengeBarFill, { width: '40%' }]} />
              </View>
              <Text style={styles.challengeCount}>2/5</Text>
            </View>
            <Text style={styles.challengeReward}>🎁 Reward: +50 XP & ₹100 bonus</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // Skilled Genie Dashboard (Basic for now - will be expanded later)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: SKILLED_COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.greeting, { color: SKILLED_COLORS.text }]}>
          Skilled Genie Dashboard
        </Text>
        <Text style={[styles.subtitle, { color: SKILLED_COLORS.primary }]}>
          Coming soon with work planner & appointments!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper functions
function getServiceIcon(service: string): keyof typeof Ionicons.glyphMap {
  switch (service) {
    case 'delivery': return 'basket';
    case 'courier': return 'document-text';
    case 'rides': return 'car';
    case 'errands': return 'clipboard';
    case 'surprise': return 'gift';
    default: return 'star';
  }
}

function getServiceColor(service: string): string {
  switch (service) {
    case 'delivery': return COLORS.primary;
    case 'courier': return COLORS.accent3;
    case 'rides': return COLORS.secondary;
    case 'errands': return COLORS.accent2;
    case 'surprise': return COLORS.accent1;
    default: return COLORS.primary;
  }
}

function getColorHex(colorName: string): string {
  const colors: Record<string, string> = {
    white: '#FFFFFF',
    black: '#1F2937',
    silver: '#9CA3AF',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#22C55E',
    yellow: '#F59E0B',
    orange: '#F97316',
    brown: '#92400E',
    grey: '#6B7280',
  };
  return colors[colorName] || '#9CA3AF';
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statusCardOnline: {
    borderColor: COLORS.primary + '50',
    backgroundColor: COLORS.primary + '10',
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
  },
  statusDotOnline: {
    backgroundColor: COLORS.online,
  },
  statusDotOffline: {
    backgroundColor: COLORS.offline,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  xpCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent2 + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent2,
  },
  xpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  xpBarTrack: {
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  xpHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  vehicleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  evText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  vehicleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  vehicleDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  actionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  actionSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  challengeCard: {
    backgroundColor: COLORS.accent2 + '15',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.accent2 + '30',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.accent2,
  },
  challengeDesc: {
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  challengeBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent2,
    borderRadius: 4,
  },
  challengeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent2,
  },
  challengeReward: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
