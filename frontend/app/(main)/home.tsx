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
  red: '#FEE2E2',
  green: '#D1FAE5',
};

// Get role-specific color
const getRoleColor = (partnerType: string | null) => {
  switch (partnerType) {
    case 'agent': return COLORS.primary;
    case 'vendor': return COLORS.secondary;
    case 'promoter': return COLORS.amber;
    default: return COLORS.primary;
  }
};

// Get role-specific icon
const getRoleIcon = (partnerType: string | null): keyof typeof Ionicons.glyphMap => {
  switch (partnerType) {
    case 'agent': return 'bicycle';
    case 'vendor': return 'storefront';
    case 'promoter': return 'megaphone';
    default: return 'person';
  }
};

// Get role-specific title
const getRoleTitle = (user: User | null) => {
  if (!user) return 'Partner';
  switch (user.partner_type) {
    case 'agent': return user.agent_vehicle ? `${user.agent_vehicle.charAt(0).toUpperCase() + user.agent_vehicle.slice(1)} Agent` : 'Agent';
    case 'vendor': return user.vendor_shop_name || 'Vendor';
    case 'promoter': return user.promoter_business_name || 'Promoter';
    default: return 'Partner';
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

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
          <ActivityIndicator size="large" color={getRoleColor(user?.partner_type || null)} />
        </View>
      </SafeAreaView>
    );
  }

  const roleColor = getRoleColor(user?.partner_type || null);

  // Render based on partner type
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
            <Text style={styles.userName}>{user?.name || 'Partner'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
              <Ionicons name={getRoleIcon(user?.partner_type || null)} size={14} color={roleColor} />
              <Text style={[styles.roleText, { color: roleColor }]}>{getRoleTitle(user)}</Text>
            </View>
          </View>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: roleColor }]}>
              <Ionicons name="person" size={24} color={COLORS.white} />
            </View>
          )}
        </View>

        {/* Online Status Toggle */}
        <View style={[styles.statusCard, isOnline && { borderColor: COLORS.success, backgroundColor: '#F0FDF4' }]}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, isOnline && { backgroundColor: COLORS.success }]} />
            <View>
              <Text style={styles.statusLabel}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
              <Text style={styles.statusSubtext}>
                {isOnline 
                  ? user?.partner_type === 'agent' ? 'Accepting tasks & deliveries' 
                    : user?.partner_type === 'vendor' ? 'Shop is open' 
                    : 'Accepting bookings'
                  : 'Toggle to go online'}
              </Text>
            </View>
          </View>
          {statusLoading ? (
            <ActivityIndicator color={isOnline ? COLORS.success : roleColor} />
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
            <View style={[styles.earningsIconBg, { backgroundColor: roleColor + '20' }]}>
              <Ionicons name="wallet" size={24} color={roleColor} />
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
            <Text style={[styles.viewEarningsText, { color: roleColor }]}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={roleColor} />
          </TouchableOpacity>
        </View>

        {/* Role-specific Dashboard */}
        {user?.partner_type === 'agent' && <AgentDashboard stats={stats} user={user} router={router} />}
        {user?.partner_type === 'vendor' && <VendorDashboard stats={stats} user={user} router={router} />}
        {user?.partner_type === 'promoter' && <PromoterDashboard stats={stats} user={user} router={router} />}

      </ScrollView>
    </SafeAreaView>
  );
}

// ============== AGENT DASHBOARD ==============
function AgentDashboard({ stats, user, router }: { stats: PartnerStats | null; user: User; router: any }) {
  return (
    <>
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.lavender }]}>
          <Ionicons name="cube" size={28} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats?.active_count || 0}</Text>
          <Text style={styles.statLabel}>Active Tasks</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.blue }]}>
          <Ionicons name="star" size={28} color={COLORS.secondary} />
          <Text style={styles.statValue}>{stats?.total_tasks || 0}</Text>
          <Text style={styles.statLabel}>Total Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.yellow }]}>
          <Ionicons name={user.agent_vehicle === 'car' ? 'car' : user.agent_vehicle === 'scooter' ? 'speedometer' : 'bicycle'} size={28} color={COLORS.amber} />
          <Text style={styles.statValue}>{user.agent_vehicle || '-'}</Text>
          <Text style={styles.statLabel}>Vehicle</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.green }]}>
          <Ionicons name="star-half" size={28} color={COLORS.success} />
          <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Services Offered */}
      {user.agent_services && user.agent_services.length > 0 && (
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Your Services</Text>
          <View style={styles.serviceChips}>
            {user.agent_services.map((service: string) => (
              <View key={service} style={[styles.serviceChip, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons 
                  name={service === 'delivery' ? 'fast-food' : service === 'courier' ? 'document-text' : service === 'rides' ? 'car' : 'clipboard'} 
                  size={14} 
                  color={COLORS.primary} 
                />
                <Text style={[styles.serviceChipText, { color: COLORS.primary }]}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

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
    </>
  );
}

// ============== VENDOR DASHBOARD ==============
function VendorDashboard({ stats, user, router }: { stats: PartnerStats | null; user: User; router: any }) {
  return (
    <>
      {/* Shop Info Card */}
      <View style={styles.shopInfoCard}>
        <View style={styles.shopInfoHeader}>
          <View style={[styles.shopIconBg, { backgroundColor: COLORS.secondary + '20' }]}>
            <Ionicons name="storefront" size={24} color={COLORS.secondary} />
          </View>
          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{user.vendor_shop_name || 'My Shop'}</Text>
            <Text style={styles.shopType}>{user.vendor_shop_type || 'Shop'}</Text>
          </View>
          {user.vendor_is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        {user.vendor_shop_address && (
          <View style={styles.shopAddressRow}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.shopAddress}>{user.vendor_shop_address}</Text>
          </View>
        )}
        <View style={styles.deliveryStatusRow}>
          <Ionicons 
            name={user.vendor_can_deliver ? 'bicycle' : 'storefront'} 
            size={16} 
            color={user.vendor_can_deliver ? COLORS.success : COLORS.amber} 
          />
          <Text style={styles.deliveryStatusText}>
            {user.vendor_can_deliver ? 'Offers home delivery' : 'Pickup only / Agent delivery'}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.blue }]}>
          <Ionicons name="receipt" size={28} color={COLORS.secondary} />
          <Text style={styles.statValue}>{stats?.active_count || 0}</Text>
          <Text style={styles.statLabel}>Pending Orders</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.green }]}>
          <Ionicons name="checkmark-done" size={28} color={COLORS.success} />
          <Text style={styles.statValue}>{stats?.total_tasks || 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.yellow }]}>
          <Ionicons name="wallet" size={28} color={COLORS.amber} />
          <Text style={styles.statValue}>₹{(stats?.total_earnings || 0).toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.lavender }]}>
          <Ionicons name="star" size={28} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Manage Your Shop</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(main)/orders')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.blue }]}>
            <Ionicons name="receipt" size={24} color={COLORS.secondary} />
          </View>
          <Text style={styles.actionLabel}>View Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(main)/products')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.lavender }]}>
            <Ionicons name="pricetags" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>My Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(main)/profile')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.yellow }]}>
            <Ionicons name="settings" size={24} color={COLORS.amber} />
          </View>
          <Text style={styles.actionLabel}>Shop Settings</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ============== PROMOTER DASHBOARD ==============
function PromoterDashboard({ stats, user, router }: { stats: PartnerStats | null; user: User; router: any }) {
  const getPromoterTypeLabel = (type: string | undefined) => {
    switch (type) {
      case 'trip_organizer': return 'Trip Organizer';
      case 'event_organizer': return 'Event Organizer';
      case 'service_provider': return 'Service Provider';
      default: return 'Promoter';
    }
  };

  const getPromoterTypeIcon = (type: string | undefined): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'trip_organizer': return 'bus';
      case 'event_organizer': return 'calendar';
      case 'service_provider': return 'briefcase';
      default: return 'megaphone';
    }
  };

  return (
    <>
      {/* Business Info Card */}
      <View style={styles.shopInfoCard}>
        <View style={styles.shopInfoHeader}>
          <View style={[styles.shopIconBg, { backgroundColor: COLORS.amber + '20' }]}>
            <Ionicons name={getPromoterTypeIcon(user.promoter_type)} size={24} color={COLORS.amber} />
          </View>
          <View style={styles.shopDetails}>
            <Text style={styles.shopName}>{user.promoter_business_name || 'My Business'}</Text>
            <Text style={styles.shopType}>{getPromoterTypeLabel(user.promoter_type)}</Text>
          </View>
        </View>
        {user.promoter_description && (
          <Text style={styles.businessDescription} numberOfLines={2}>
            {user.promoter_description}
          </Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.yellow }]}>
          <Ionicons name="calendar" size={28} color={COLORS.amber} />
          <Text style={styles.statValue}>{stats?.active_count || 0}</Text>
          <Text style={styles.statLabel}>Active Events</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.green }]}>
          <Ionicons name="ticket" size={28} color={COLORS.success} />
          <Text style={styles.statValue}>{stats?.total_tasks || 0}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.blue }]}>
          <Ionicons name="wallet" size={28} color={COLORS.secondary} />
          <Text style={styles.statValue}>₹{(stats?.total_earnings || 0).toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.lavender }]}>
          <Ionicons name="star" size={28} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Manage Events & Services</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(main)/events')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.yellow }]}>
            <Ionicons name="calendar" size={24} color={COLORS.amber} />
          </View>
          <Text style={styles.actionLabel}>My Events</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(main)/bookings')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.green }]}>
            <Ionicons name="ticket" size={24} color={COLORS.success} />
          </View>
          <Text style={styles.actionLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(main)/profile')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: COLORS.lavender }]}>
            <Ionicons name="create" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionLabel}>Create New</Text>
        </TouchableOpacity>
      </View>
    </>
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
    alignItems: 'flex-start',
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
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
    marginBottom: 24,
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
  // Services section (Agent)
  servicesSection: {
    marginBottom: 20,
  },
  serviceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  // Shop info card (Vendor & Promoter)
  shopInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shopInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  shopIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  shopType: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  shopAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  shopAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  deliveryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryStatusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  businessDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
