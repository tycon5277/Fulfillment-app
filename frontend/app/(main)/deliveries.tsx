import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as api from '../../src/api';
import type { Order, Wish } from '../../src/types';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  amber: '#F59E0B',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#22C55E',
  lavender: '#E8D9F4',
  blue: '#D0E9F7',
};

const STATUS_STEPS = ['picked_up', 'on_the_way', 'nearby', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  picked_up: 'Picked Up',
  on_the_way: 'On The Way',
  nearby: 'Nearby',
  delivered: 'Delivered',
};

export default function DeliveriesScreen() {
  const router = useRouter();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [activeWishes, setActiveWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'orders' | 'wishes'>('orders');

  const fetchData = async () => {
    try {
      const [ordersRes, wishesRes] = await Promise.all([
        api.getActiveOrders(),
        api.getAgentWishes(),
      ]);
      setActiveOrders(ordersRes.data);
      setActiveWishes(wishesRes.data.filter((w: Wish) => w.status !== 'completed'));
    } catch (error) {
      console.error('Error fetching deliveries:', error);
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

  const getStatusIndex = (status: string) => {
    return STATUS_STEPS.indexOf(status);
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/delivery/${item.order_id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vendorInfo}>
          <View style={styles.iconBg}>
            <Ionicons name="storefront" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.vendorName}>{item.vendor_name}</Text>
            <Text style={styles.orderId}>#{item.order_id.slice(-8)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </View>

      {/* Status Progress */}
      <View style={styles.progressContainer}>
        {STATUS_STEPS.map((step, index) => (
          <View key={step} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                getStatusIndex(item.status) >= index && styles.progressDotActive,
              ]}
            >
              {getStatusIndex(item.status) >= index && (
                <Ionicons name="checkmark" size={12} color={COLORS.white} />
              )}
            </View>
            {index < STATUS_STEPS.length - 1 && (
              <View
                style={[
                  styles.progressLine,
                  getStatusIndex(item.status) > index && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>
      <View style={styles.statusLabels}>
        {STATUS_STEPS.map((step) => (
          <Text
            key={step}
            style={[
              styles.statusLabelText,
              item.status === step && styles.statusLabelActive,
            ]}
          >
            {STATUS_LABELS[step]}
          </Text>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.delivery_address?.address || 'Address not available'}
          </Text>
        </View>
        <Text style={styles.earningText}>₹{item.delivery_fee}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWish = ({ item }: { item: Wish }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        // Navigate to chat if exists
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.vendorInfo}>
          <View style={[styles.iconBg, { backgroundColor: COLORS.blue }]}>
            <Ionicons name="star" size={20} color={COLORS.secondary} />
          </View>
          <View>
            <Text style={styles.vendorName}>{item.title}</Text>
            <Text style={styles.orderId}>{item.wish_type.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={COLORS.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location?.address || 'Location not specified'}
          </Text>
        </View>
        <Text style={styles.earningText}>₹{item.remuneration}</Text>
      </View>
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <Text style={styles.title}>My Deliveries</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'orders' && styles.tabActive]}
          onPress={() => setTab('orders')}
        >
          <Text style={[styles.tabText, tab === 'orders' && styles.tabTextActive]}>
            Orders ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'wishes' && styles.tabActive]}
          onPress={() => setTab('wishes')}
        >
          <Text style={[styles.tabText, tab === 'wishes' && styles.tabTextActive]}>
            Wishes ({activeWishes.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tab === 'orders' ? activeOrders : activeWishes}
        keyExtractor={(item: any) => item.order_id || item.wish_id}
        renderItem={tab === 'orders' ? renderOrder : renderWish}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={tab === 'orders' ? 'cube-outline' : 'star-outline'}
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              No Active {tab === 'orders' ? 'Orders' : 'Wishes'}
            </Text>
            <Text style={styles.emptyText}>
              Accept {tab === 'orders' ? 'orders' : 'wishes'} to see them here
            </Text>
          </View>
        }
      />
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
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderId: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: COLORS.success,
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: COLORS.success,
  },
  statusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabelText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  statusLabelActive: {
    color: COLORS.success,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: COLORS.lavender,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
    textTransform: 'capitalize',
  },
  cardFooter: {
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
    color: COLORS.textSecondary,
    flex: 1,
  },
  earningText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
});
