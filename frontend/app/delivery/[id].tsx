import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as api from '../../src/api';
import type { Order } from '../../src/types';

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
};

const STATUS_STEPS = ['picked_up', 'on_the_way', 'nearby', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  picked_up: 'Picked Up',
  on_the_way: 'On The Way',
  nearby: 'Nearby',
  delivered: 'Delivered',
};

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const fetchOrder = async () => {
    try {
      const response = await api.getOrderDetail(id!);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [id]);

  const getNextStatus = (): string | null => {
    if (!order) return null;
    const currentIndex = STATUS_STEPS.indexOf(order.status);
    if (currentIndex < STATUS_STEPS.length - 1) {
      return STATUS_STEPS[currentIndex + 1];
    }
    return null;
  };

  const handleUpdateStatus = async () => {
    const nextStatus = getNextStatus();
    if (!nextStatus || !order) return;

    Alert.alert(
      'Update Status',
      `Mark order as "${STATUS_LABELS[nextStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              await api.updateOrderStatus(order.order_id, nextStatus);
              await fetchOrder();
              if (nextStatus === 'delivered') {
                Alert.alert('Delivery Complete!', 'Great job! Earnings have been added.');
                router.back();
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const startLocationSharing = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for live tracking');
        return;
      }

      setSharingLocation(true);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        async (location) => {
          try {
            await api.updateDeliveryLocation(
              order!.order_id,
              location.coords.latitude,
              location.coords.longitude
            );
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location sharing:', error);
      Alert.alert('Error', 'Failed to start location sharing');
    }
  };

  const stopLocationSharing = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setSharingLocation(false);
  };

  const openMaps = () => {
    if (!order?.delivery_address) return;
    const { lat, lng, address } = order.delivery_address;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = lat && lng ? `${lat},${lng}` : '';
    const label = encodeURIComponent(address || 'Delivery Location');
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  const callCustomer = () => {
    // In real app, you'd have customer phone
    Alert.alert('Call Customer', 'Customer phone: +91 98765 43210');
  };

  const getStatusIndex = (status: string) => STATUS_STEPS.indexOf(status);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const nextStatus = getNextStatus();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Order Info */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View style={styles.vendorIconBg}>
              <Ionicons name="storefront" size={24} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.vendorName}>{order.vendor_name}</Text>
              <Text style={styles.orderId}>Order #{order.order_id.slice(-8)}</Text>
            </View>
          </View>

          {/* Status Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Delivery Progress</Text>
            <View style={styles.progressContainer}>
              {STATUS_STEPS.map((step, index) => (
                <View key={step} style={styles.progressStep}>
                  <View
                    style={[
                      styles.progressDot,
                      getStatusIndex(order.status) >= index && styles.progressDotActive,
                    ]}
                  >
                    {getStatusIndex(order.status) >= index && (
                      <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      getStatusIndex(order.status) >= index && styles.progressLabelActive,
                    ]}
                  >
                    {STATUS_LABELS[step]}
                  </Text>
                  {index < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        getStatusIndex(order.status) > index && styles.progressLineActive,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.addressText}>
              {order.delivery_address?.address || 'Address not available'}
            </Text>
          </View>
          <TouchableOpacity style={styles.navigateButton} onPress={openMaps}>
            <Ionicons name="navigate" size={18} color={COLORS.white} />
            <Text style={styles.navigateButtonText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order.items?.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Delivery Fee</Text>
            <Text style={styles.totalValue}>₹{order.delivery_fee}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          {/* Location Sharing */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              sharingLocation && styles.actionButtonActive,
            ]}
            onPress={sharingLocation ? stopLocationSharing : startLocationSharing}
          >
            <Ionicons
              name={sharingLocation ? 'location' : 'location-outline'}
              size={20}
              color={sharingLocation ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.actionButtonText,
                sharingLocation && styles.actionButtonTextActive,
              ]}
            >
              {sharingLocation ? 'Sharing Location' : 'Share Location'}
            </Text>
          </TouchableOpacity>

          {/* Call Customer */}
          <TouchableOpacity style={styles.actionButton} onPress={callCustomer}>
            <Ionicons name="call" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Call Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Update Status Button */}
        {nextStatus && (
          <TouchableOpacity
            style={[styles.updateButton, updating && styles.updateButtonDisabled]}
            onPress={handleUpdateStatus}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.updateButtonText}>
                  Mark as {STATUS_LABELS[nextStatus]}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.completedText}>Delivery Completed!</Text>
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  content: {
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
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  vendorIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  orderId: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: COLORS.success,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: COLORS.success,
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-40%',
    height: 3,
    backgroundColor: '#E5E7EB',
  },
  progressLineActive: {
    backgroundColor: COLORS.success,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 8,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemName: {
    fontSize: 14,
    color: COLORS.text,
  },
  itemQty: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  actionsCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionButtonTextActive: {
    color: COLORS.white,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
});
