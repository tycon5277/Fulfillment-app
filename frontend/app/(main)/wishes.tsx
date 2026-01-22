import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as api from '../../src/api';
import type { Wish } from '../../src/types';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  amber: '#F59E0B',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#22C55E',
  blue: '#D0E9F7',
};

const WISH_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  delivery: 'cube',
  medicine_delivery: 'medical',
  errands: 'clipboard',
  ride_request: 'car',
  food_delivery: 'restaurant',
  home_maintenance: 'hammer',
};

const WISH_TYPE_COLORS: Record<string, string> = {
  delivery: '#7C3AED',
  medicine_delivery: '#EF4444',
  errands: '#F59E0B',
  ride_request: '#0EA5E9',
  food_delivery: '#22C55E',
  home_maintenance: '#6366F1',
};

export default function WishesScreen() {
  const router = useRouter();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchWishes = async () => {
    try {
      const response = await api.getAvailableWishes();
      setWishes(response.data);
    } catch (error) {
      console.error('Error fetching wishes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishes();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWishes();
    setRefreshing(false);
  }, []);

  const handleAcceptWish = async (wishId: string) => {
    setAccepting(wishId);
    try {
      const response = await api.acceptWish(wishId);
      Alert.alert('Success', 'Wish accepted! Chat room created.');
      router.push(`/chat/${response.data.room_id}`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept wish');
    } finally {
      setAccepting(null);
    }
  };

  const renderWish = ({ item }: { item: Wish }) => (
    <View style={styles.wishCard}>
      <View style={styles.wishHeader}>
        <View
          style={[
            styles.wishTypeBadge,
            { backgroundColor: WISH_TYPE_COLORS[item.wish_type] || COLORS.primary },
          ]}
        >
          <Ionicons
            name={WISH_TYPE_ICONS[item.wish_type] || 'star'}
            size={16}
            color={COLORS.white}
          />
          <Text style={styles.wishTypeText}>
            {item.wish_type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        {item.is_immediate && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={12} color={COLORS.white} />
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>

      <Text style={styles.wishTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.wishDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.locationInfo}>
        <Ionicons name="location" size={16} color={COLORS.textSecondary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {item.location?.address || 'Location not specified'}
        </Text>
      </View>

      <View style={styles.wishFooter}>
        <View style={styles.remunerationBadge}>
          <Ionicons name="cash" size={18} color={COLORS.success} />
          <Text style={styles.remunerationText}>₹{item.remuneration}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.makeOfferButton,
            accepting === item.wish_id && styles.makeOfferButtonDisabled,
          ]}
          onPress={() => handleAcceptWish(item.wish_id)}
          disabled={accepting === item.wish_id}
        >
          {accepting === item.wish_id ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="chatbubble" size={16} color={COLORS.white} />
              <Text style={styles.makeOfferText}>Make Offer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.title}>Available Wishes</Text>
        <TouchableOpacity onPress={() => api.seedWishes().then(fetchWishes)}>
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={wishes}
        keyExtractor={(item) => item.wish_id}
        renderItem={renderWish}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Wishes Available</Text>
            <Text style={styles.emptyText}>Customer wishes will appear here</Text>
            <TouchableOpacity style={styles.seedButton} onPress={() => api.seedWishes().then(fetchWishes)}>
              <Text style={styles.seedButtonText}>Add Test Wishes</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  listContent: {
    padding: 16,
  },
  wishCard: {
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
  wishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wishTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wishTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  wishTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  wishDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  wishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remunerationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  remunerationText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  makeOfferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  makeOfferButtonDisabled: {
    opacity: 0.7,
  },
  makeOfferText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
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
  seedButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  seedButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
