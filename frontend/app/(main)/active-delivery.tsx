import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { genieAPI, ActiveOrder, DeliverResponse } from '../../src/orderApi';
import * as Location from 'expo-location';

// Warm Cream Theme for Skilled Genie
const COLORS = {
  background: '#FDF8F3',
  cardBg: '#FFFFFF',
  cardBorder: '#E8DFD5',
  primary: '#D97706',
  secondary: '#F59E0B',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  text: '#44403C',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  border: '#E8DFD5',
  purple: '#7C3AED',
  blue: '#2563EB',
};

const STATUS_COLORS = {
  awaiting_pickup: { bg: '#EDE9FE', text: '#7C3AED', label: 'Awaiting Pickup' },
  picked_up: { bg: '#DBEAFE', text: '#2563EB', label: 'In Transit' },
};

export default function ActiveDeliveryScreen() {
  const router = useRouter();
  const { currentLocation, setCurrentLocation } = useAuthStore();
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [earnings, setEarnings] = useState<number | null>(null);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  
  // Animation for pulsing status
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Location update interval ref
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch current active order
  const fetchActiveOrder = useCallback(async () => {
    try {
      const response = await genieAPI.getCurrentOrder();
      if (response.data.has_active_order && response.data.order) {
        setActiveOrder(response.data.order);
      } else {
        setActiveOrder(null);
      }
    } catch (error: any) {
      console.error('Error fetching active order:', error?.response?.data || error.message);
      // Don't show alert for 404 (no active order)
      if (error?.response?.status !== 404) {
        Alert.alert('Error', 'Failed to fetch active order');
      }
      setActiveOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Update location to backend
  const updateLocationToBackend = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      
      // Update store
      setCurrentLocation({
        latitude,
        longitude,
        accuracy: location.coords.accuracy || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      });
      
      // Send to backend
      await genieAPI.updateLocation(latitude, longitude);
      console.log('📍 Location updated:', latitude, longitude);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [setCurrentLocation]);

  // Start location tracking
  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for delivery tracking');
        return;
      }
      
      // Initial update
      await updateLocationToBackend();
      
      // Update every 30 seconds
      locationIntervalRef.current = setInterval(updateLocationToBackend, 30000);
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }, [updateLocationToBackend]);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }
  }, []);

  // Initial load and location tracking
  useEffect(() => {
    fetchActiveOrder();
    startLocationTracking();
    
    // Start pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => {
      stopLocationTracking();
      pulseAnimation.stop();
    };
  }, [fetchActiveOrder, startLocationTracking, stopLocationTracking]);

  // Handle pickup action
  const handlePickup = async () => {
    if (!activeOrder) return;
    
    setActionLoading(true);
    try {
      await genieAPI.pickupOrder(activeOrder.order_id);
      Alert.alert('Success! 🎉', 'Order picked up! Now deliver to the customer.');
      fetchActiveOrder();
    } catch (error: any) {
      console.error('Error picking up order:', error?.response?.data || error.message);
      Alert.alert('Error', error?.response?.data?.detail || 'Failed to mark as picked up');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delivery completion
  const handleDeliver = async () => {
    if (!activeOrder) return;
    
    setActionLoading(true);
    try {
      const response = await genieAPI.deliverOrder(activeOrder.order_id);
      const data = response.data as DeliverResponse;
      setEarnings(data.earnings);
      setShowEarningsModal(true);
      setActiveOrder(null);
    } catch (error: any) {
      console.error('Error delivering order:', error?.response?.data || error.message);
      Alert.alert('Error', error?.response?.data?.detail || 'Failed to mark as delivered');
    } finally {
      setActionLoading(false);
    }
  };

  // Call phone number
  const handleCall = (phone: string, name: string) => {
    Alert.alert(
      `Call ${name}?`,
      phone,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };

  // Open maps for navigation
  const handleNavigate = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/maps?q=${encodedAddress}`);
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActiveOrder();
  }, [fetchActiveOrder]);

  // Go back to work orders
  const goBackToWorkOrders = () => {
    setShowEarningsModal(false);
    router.replace('/(main)/nearby-wishes');
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking for active delivery...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No active order
  if (!activeOrder && !showEarningsModal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Delivery</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bicycle-outline" size={64} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptyText}>Accept an order from Work Orders to start delivering</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={goBackToWorkOrders}>
            <Ionicons name="briefcase-outline" size={20} color="#FFF" />
            <Text style={styles.goBackBtnText}>Browse Work Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Earnings celebration modal
  if (showEarningsModal && earnings !== null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.earningsModal}>
          <View style={styles.earningsIcon}>
            <Text style={{ fontSize: 64 }}>🎉</Text>
          </View>
          <Text style={styles.earningsTitle}>Delivery Complete!</Text>
          <Text style={styles.earningsAmount}>₹{earnings.toFixed(2)}</Text>
          <Text style={styles.earningsLabel}>Earnings Added</Text>
          <TouchableOpacity style={styles.earningsBtn} onPress={goBackToWorkOrders}>
            <Text style={styles.earningsBtnText}>Continue to Work Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Active order view
  const statusConfig = STATUS_COLORS[activeOrder!.status] || STATUS_COLORS.awaiting_pickup;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Delivery</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Status Banner */}
        <Animated.View style={[styles.statusBanner, { backgroundColor: statusConfig.bg, transform: [{ scale: pulseAnim }] }]}>
          <Ionicons 
            name={activeOrder!.status === 'awaiting_pickup' ? 'storefront' : 'bicycle'} 
            size={24} 
            color={statusConfig.text} 
          />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
        </Animated.View>

        {/* Order ID */}
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderIdValue}>{activeOrder!.order_id.slice(0, 8).toUpperCase()}</Text>
        </View>

        {/* Vendor Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="storefront" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>Pickup Location</Text>
          </View>
          
          <Text style={styles.cardName}>{activeOrder!.vendor_name}</Text>
          <Text style={styles.cardAddress}>{activeOrder!.vendor_address}</Text>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.cardBtn, { backgroundColor: '#DBEAFE' }]}
              onPress={() => handleCall(activeOrder!.vendor_phone, 'Vendor')}
            >
              <Ionicons name="call" size={18} color={COLORS.blue} />
              <Text style={[styles.cardBtnText, { color: COLORS.blue }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cardBtn, { backgroundColor: '#D1FAE5' }]}
              onPress={() => handleNavigate(activeOrder!.vendor_address)}
            >
              <Ionicons name="navigate" size={18} color={COLORS.success} />
              <Text style={[styles.cardBtnText, { color: COLORS.success }]}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="person" size={20} color={COLORS.purple} />
            </View>
            <Text style={styles.cardTitle}>Delivery Location</Text>
          </View>
          
          <Text style={styles.cardName}>{activeOrder!.customer_name}</Text>
          <Text style={styles.cardAddress}>{activeOrder!.customer_address}</Text>
          
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={[styles.cardBtn, { backgroundColor: '#DBEAFE' }]}
              onPress={() => handleCall(activeOrder!.customer_phone, 'Customer')}
            >
              <Ionicons name="call" size={18} color={COLORS.blue} />
              <Text style={[styles.cardBtnText, { color: COLORS.blue }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cardBtn, { backgroundColor: '#D1FAE5' }]}
              onPress={() => handleNavigate(activeOrder!.customer_address)}
            >
              <Ionicons name="navigate" size={18} color={COLORS.success} />
              <Text style={[styles.cardBtnText, { color: COLORS.success }]}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Special Instructions */}
        {activeOrder!.special_instructions && (
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.instructionsTitle}>Special Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>{activeOrder!.special_instructions}</Text>
          </View>
        )}

        {/* Earnings */}
        <View style={styles.earningsCard}>
          <Ionicons name="wallet-outline" size={24} color={COLORS.success} />
          <View style={styles.earningsInfo}>
            <Text style={styles.earningsCardLabel}>Delivery Earnings</Text>
            <Text style={styles.earningsCardAmount}>₹{activeOrder!.delivery_fee.toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {activeOrder!.status === 'awaiting_pickup' ? (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.pickupBtn]} 
              onPress={handlePickup}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  <Text style={styles.actionBtnText}>Mark as Picked Up</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.deliverBtn]} 
              onPress={handleDeliver}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="gift" size={24} color="#FFF" />
                  <Text style={styles.actionBtnText}>Mark as Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  goBackBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
  },
  orderIdContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  orderIdLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  orderIdValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cardBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsCardLabel: {
    fontSize: 12,
    color: '#065F46',
    marginBottom: 2,
  },
  earningsCardAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.success,
  },
  actionContainer: {
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 16,
  },
  pickupBtn: {
    backgroundColor: COLORS.purple,
  },
  deliverBtn: {
    backgroundColor: COLORS.success,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  earningsModal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  earningsIcon: {
    marginBottom: 24,
  },
  earningsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.success,
  },
  earningsLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  earningsBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  earningsBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
