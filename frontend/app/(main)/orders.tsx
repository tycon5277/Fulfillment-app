import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as api from '../../src/api';
import { genieAPI, AvailableOrder } from '../../src/orderApi';
import THEME from '../../src/theme';
import type { Order } from '../../src/types';
import GameModal from '../../src/components/GameModal';
import { useAuthStore } from '../../src/store';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Mock location for demo
const MOCK_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946,
};

// Helper to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper to format time ago
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

// Get Carto tile URL for mini map
const getCartoTileUrl = (lat: number, lon: number, zoom: number = 14) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`;
};

const STATUS_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  confirmed: { color: '#0EA5E9', icon: 'checkmark-circle', label: 'Confirmed' },
  preparing: { color: '#F59E0B', icon: 'time', label: 'Preparing' },
  ready: { color: '#22C55E', icon: 'checkmark-done-circle', label: 'Ready' },
  pending: { color: '#8B5CF6', icon: 'hourglass', label: 'Pending' },
};

interface ExpandedOrder {
  [key: string]: boolean;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { user, isOnline, currentLocation, setCurrentLocation } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedOrder>({});
  const [myLocation, setMyLocation] = useState(MOCK_LOCATION);
  const [stats, setStats] = useState({ total: 0, pending: 0, earnings: 0 });
  
  // External API orders (from Order Lifecycle backend)
  const [externalOrders, setExternalOrders] = useState<AvailableOrder[]>([]);
  const [hasActiveDelivery, setHasActiveDelivery] = useState(false);
  
  // Polling interval ref
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedExternalOrderId, setSelectedExternalOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setMyLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          // Also update store
          setCurrentLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy || undefined,
            timestamp: loc.timestamp,
          });
        }
      } catch (error) {
        console.log('Location error, using mock');
      }
    })();
  }, [setCurrentLocation]);

  // Fetch external orders from Order Lifecycle API
  const fetchExternalOrders = useCallback(async () => {
    if (!isOnline) return;
    
    try {
      const lat = currentLocation?.latitude || myLocation.latitude;
      const lng = currentLocation?.longitude || myLocation.longitude;
      
      const response = await genieAPI.getAvailableOrders(lat, lng);
      setExternalOrders(response.data.available_orders || []);
      console.log('📦 External orders:', response.data.count);
    } catch (error: any) {
      console.log('External API not available or not authenticated');
      // Silently fail - external API might not be configured
    }
  }, [isOnline, currentLocation, myLocation]);

  // Check for active delivery
  const checkActiveDelivery = useCallback(async () => {
    try {
      const response = await genieAPI.getCurrentOrder();
      setHasActiveDelivery(response.data.has_active_order);
    } catch (error) {
      setHasActiveDelivery(false);
    }
  }, []);

  // Accept external order
  const handleAcceptExternalOrder = async (orderId: string) => {
    setAccepting(orderId);
    try {
      await genieAPI.acceptOrder(orderId, 10, 20);
      Alert.alert(
        'Order Accepted! 🎉',
        'Head to Active Delivery to see pickup details.',
        [{ text: 'View Delivery', onPress: () => router.push('/(main)/active-delivery') }]
      );
      fetchExternalOrders();
      checkActiveDelivery();
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Failed to accept order. It may have been taken.';
      Alert.alert('Unable to Accept', message);
    } finally {
      setAccepting(null);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.getAvailableOrders();
      setOrders(response.data);
      
      // Calculate stats
      const totalEarnings = response.data.reduce((sum: number, order: Order) => sum + (order.delivery_fee || 0), 0);
      setStats({
        total: response.data.length,
        pending: response.data.filter((o: Order) => o.status === 'pending' || o.status === 'confirmed').length,
        earnings: totalEarnings,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Real-time updates simulation - refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  const toggleExpand = (orderId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleAcceptOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowAcceptModal(true);
  };

  const confirmAcceptOrder = async () => {
    if (!selectedOrderId) return;
    
    setShowAcceptModal(false);
    setAccepting(selectedOrderId);
    
    try {
      await api.acceptOrder(selectedOrderId);
      setShowSuccessModal(true);
      fetchOrders();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.detail || 'Failed to accept order');
      setShowErrorModal(true);
    } finally {
      setAccepting(null);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/(main)/deliveries');
  };

  // Get distances for an order
  const getDistances = (order: Order) => {
    const shopLat = order.vendor_location?.lat || myLocation.latitude + 0.01;
    const shopLon = order.vendor_location?.lng || myLocation.longitude + 0.01;
    const custLat = order.delivery_address?.lat || myLocation.latitude + 0.02;
    const custLon = order.delivery_address?.lng || myLocation.longitude + 0.02;
    
    const toShop = calculateDistance(myLocation.latitude, myLocation.longitude, shopLat, shopLon);
    const shopToCustomer = calculateDistance(shopLat, shopLon, custLat, custLon);
    const total = toShop + shopToCustomer;
    
    return { toShop, shopToCustomer, total };
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const isExpanded = expanded[item.order_id];
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const distances = getDistances(item);
    const timeAgo = formatTimeAgo(item.created_at || new Date().toISOString());
    
    // Generate map tiles for expanded view
    const shopLat = item.vendor_location?.lat || myLocation.latitude + 0.01;
    const shopLon = item.vendor_location?.lng || myLocation.longitude + 0.01;
    const mapTile = getCartoTileUrl(shopLat, shopLon, 14);

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => toggleExpand(item.order_id)}
        activeOpacity={0.9}
      >
        {/* Priority Badge */}
        {index < 3 && (
          <View style={styles.priorityBadge}>
            <Text style={styles.priorityText}>🔥 HOT</Text>
          </View>
        )}

        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.vendorInfo}>
            <View style={styles.vendorIconBg}>
              <Ionicons name="storefront" size={22} color={THEME.primary} />
            </View>
            <View style={styles.vendorDetails}>
              <Text style={styles.vendorName}>{item.vendor_name || 'Shop'}</Text>
              <Text style={styles.orderId}>#{item.order_id.slice(-8)}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '25' }]}>
              <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>
        </View>

        {/* Time & Distance Row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={THEME.textMuted} />
            <Text style={styles.metaText}>{timeAgo}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={14} color={THEME.textMuted} />
            <Text style={styles.metaText}>{distances.total.toFixed(1)} km total</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={14} color={THEME.textMuted} />
            <Text style={styles.metaText}>{item.items?.length || 0} items</Text>
          </View>
        </View>

        {/* Distance Visualization */}
        <View style={styles.distanceVisual}>
          <View style={styles.distancePoint}>
            <View style={[styles.distanceDot, { backgroundColor: THEME.primary }]} />
            <Text style={styles.distanceLabel}>You</Text>
          </View>
          <View style={styles.distanceLine}>
            <Text style={styles.distanceValue}>{distances.toShop.toFixed(1)} km</Text>
          </View>
          <View style={styles.distancePoint}>
            <View style={[styles.distanceDot, { backgroundColor: THEME.accent2 }]} />
            <Text style={styles.distanceLabel}>Shop</Text>
          </View>
          <View style={styles.distanceLine}>
            <Text style={styles.distanceValue}>{distances.shopToCustomer.toFixed(1)} km</Text>
          </View>
          <View style={styles.distancePoint}>
            <View style={[styles.distanceDot, { backgroundColor: THEME.success }]} />
            <Text style={styles.distanceLabel}>Drop</Text>
          </View>
        </View>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Mini Map */}
            <View style={styles.miniMapContainer}>
              <Image 
                source={{ uri: mapTile }}
                style={styles.miniMapImage}
                resizeMode="cover"
              />
              <View style={styles.miniMapOverlay}>
                {/* Shop marker */}
                <View style={[styles.mapMarker, styles.shopMarker]}>
                  <Ionicons name="storefront" size={14} color="#FFF" />
                </View>
                {/* Customer marker */}
                <View style={[styles.mapMarker, styles.customerMarker]}>
                  <Ionicons name="location" size={14} color="#FFF" />
                </View>
              </View>
              <View style={styles.mapLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: THEME.accent2 }]} />
                  <Text style={styles.legendText}>Shop</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: THEME.success }]} />
                  <Text style={styles.legendText}>Customer</Text>
                </View>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetailSection}>
              <Text style={styles.sectionLabel}>PICKUP</Text>
              <View style={styles.addressRow}>
                <Ionicons name="storefront-outline" size={16} color={THEME.accent2} />
                <Text style={styles.addressText}>{item.vendor_address || item.vendor_name || 'Shop Address'}</Text>
              </View>
            </View>

            <View style={styles.orderDetailSection}>
              <Text style={styles.sectionLabel}>DROP-OFF</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={16} color={THEME.success} />
                <Text style={styles.addressText}>{item.delivery_address?.address || 'Customer Address'}</Text>
              </View>
            </View>

            {/* Items Preview */}
            {item.items && item.items.length > 0 && (
              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionLabel}>ITEMS ({item.items.length})</Text>
                <View style={styles.itemsPreview}>
                  {item.items.slice(0, 3).map((orderItem: any, idx: number) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{orderItem.quantity || 1}x</Text>
                      <Text style={styles.itemName}>{orderItem.name || 'Item'}</Text>
                    </View>
                  ))}
                  {item.items.length > 3 && (
                    <Text style={styles.moreItems}>+{item.items.length - 3} more items</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.earningContainer}>
            <Text style={styles.earningLabel}>Earn</Text>
            <Text style={styles.earningValue}>₹{item.delivery_fee || 50}</Text>
          </View>
          
          <View style={styles.footerRight}>
            <TouchableOpacity onPress={() => toggleExpand(item.order_id)} style={styles.expandBtn}>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={THEME.textMuted} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.acceptButton, accepting === item.order_id && styles.acceptButtonDisabled]}
              onPress={() => handleAcceptOrder(item.order_id)}
              disabled={accepting === item.order_id}
            >
              {accepting === item.order_id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.acceptButtonText}>Accept</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>📦</Text>
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={THEME.text} />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Hub Orders</Text>
          <Text style={styles.subtitle}>{stats.total} orders available</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshBtn}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={22} color={THEME.text} />
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📦</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⏳</Text>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <TouchableOpacity 
          style={[styles.statCard, styles.statCardClickable]}
          onPress={() => router.push('/earnings')}
          activeOpacity={0.7}
        >
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={[styles.statValue, styles.statValueHighlight]}>₹{stats.earnings}</Text>
          <Text style={styles.statLabel}>Total Earn</Text>
          <View style={styles.statArrow}>
            <Ionicons name="chevron-forward" size={14} color={THEME.success} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Orders List - Only show when online */}
      {!isOnline ? (
        <View style={styles.offlineContainer}>
          <LinearGradient
            colors={[THEME.cardBg, THEME.backgroundSecondary]}
            style={styles.offlineGradient}
          >
            <View style={styles.offlineIconContainer}>
              <Ionicons name="moon" size={64} color={THEME.textMuted} />
            </View>
            <Text style={styles.offlineTitle}>You're Offline</Text>
            <Text style={styles.offlineSubtitle}>
              Go online from the Home screen to see available hub orders
            </Text>
            <TouchableOpacity 
              style={styles.goOnlineButton}
              onPress={() => router.push('/(main)/home')}
            >
              <LinearGradient
                colors={[THEME.primary, THEME.primaryDark]}
                style={styles.goOnlineGradient}
              >
                <Ionicons name="power" size={18} color="#FFF" />
                <Text style={styles.goOnlineText}>Go to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.order_id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={THEME.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptyText}>New hub orders will appear here</Text>
              <TouchableOpacity 
                style={styles.seedButton} 
                onPress={() => api.seedOrders().then(fetchOrders)}
              >
                <LinearGradient
                  colors={[THEME.primary, THEME.primaryDark]}
                  style={styles.seedButtonGradient}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.seedButtonText}>Add Demo Orders</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Beautiful Game Modals */}
      <GameModal
        visible={showAcceptModal}
        type="confirm"
        title="Accept Order"
        message="Ready to pick up this order? Once accepted, head to the Deliveries tab to start."
        emoji="🎯"
        primaryButtonText="Accept"
        secondaryButtonText="Cancel"
        onPrimaryPress={confirmAcceptOrder}
        onSecondaryPress={() => setShowAcceptModal(false)}
        onClose={() => setShowAcceptModal(false)}
      />

      <GameModal
        visible={showSuccessModal}
        type="success"
        title="Order Accepted!"
        message="Great! Head to Deliveries to start your journey."
        emoji="🎉"
        xpReward={40}
        primaryButtonText="Go to Deliveries"
        onPrimaryPress={handleSuccessClose}
        onClose={handleSuccessClose}
      />

      <GameModal
        visible={showErrorModal}
        type="warning"
        title="Oops!"
        message={errorMessage}
        emoji="😕"
        primaryButtonText="Try Again"
        onPrimaryPress={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  loadingText: {
    color: THEME.textSecondary,
    fontSize: 15,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.text,
  },
  subtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  statCardClickable: {
    borderColor: THEME.success + '40',
    backgroundColor: THEME.success + '08',
    position: 'relative',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  statValueHighlight: {
    color: THEME.success,
  },
  statLabel: {
    fontSize: 11,
    color: THEME.textMuted,
    marginTop: 2,
  },
  statArrow: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  // List
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  // Order Card
  orderCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    position: 'relative',
  },
  priorityBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 1,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  // Order Header
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vendorIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorDetails: {},
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  orderId: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  headerRight: {},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Meta Row
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  // Distance Visual
  distanceVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  distancePoint: {
    alignItems: 'center',
  },
  distanceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  distanceLabel: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  distanceLine: {
    flex: 1,
    height: 2,
    backgroundColor: THEME.cardBorder,
    marginHorizontal: 6,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 10,
    color: THEME.textSecondary,
    backgroundColor: THEME.backgroundSecondary,
    paddingHorizontal: 4,
    position: 'absolute',
    top: -6,
  },
  // Expanded Content
  expandedContent: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.cardBorder,
  },
  miniMapContainer: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  miniMapImage: {
    width: '100%',
    height: '100%',
  },
  miniMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(210, 180, 140, 0.2)', // Desert tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapMarker: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  shopMarker: {
    backgroundColor: THEME.accent2,
    top: '40%',
    left: '35%',
  },
  customerMarker: {
    backgroundColor: THEME.success,
    top: '50%',
    right: '30%',
  },
  mapLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: THEME.cardBg + 'E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: THEME.text,
  },
  // Order Details
  orderDetailSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: THEME.textSecondary,
    lineHeight: 18,
  },
  itemsPreview: {
    backgroundColor: THEME.backgroundSecondary,
    borderRadius: 10,
    padding: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.primary,
    width: 30,
  },
  itemName: {
    fontSize: 13,
    color: THEME.text,
  },
  moreItems: {
    fontSize: 12,
    color: THEME.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Footer
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.cardBorder,
  },
  earningContainer: {
    backgroundColor: THEME.success + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  earningLabel: {
    fontSize: 10,
    color: THEME.success,
    fontWeight: '500',
  },
  earningValue: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.success,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.textMuted,
    marginTop: 8,
  },
  seedButton: {
    marginTop: 24,
    borderRadius: 14,
    overflow: 'hidden',
  },
  seedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  seedButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 15,
  },
  // Offline State
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  offlineGradient: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    width: '100%',
  },
  offlineIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: THEME.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 15,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  goOnlineButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  goOnlineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  goOnlineText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
