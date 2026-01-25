import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as api from '../../src/api';
import THEME from '../../src/theme';

interface Wish {
  wish_id: string;
  user_id: string;
  wish_type: string;
  title: string;
  description?: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  remuneration: number;
  is_immediate: boolean;
  status: string;
  wisher_name?: string;
  wisher_picture?: string;
}

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
      Alert.alert(
        'Wish Accepted!',
        'You can now chat with the wisher to discuss details.',
        [
          {
            text: 'Open Chat',
            onPress: () => router.push(`/(main)/chat/${response.data.room_id}`),
          },
          { text: 'OK' },
        ]
      );
      fetchWishes();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept wish');
    } finally {
      setAccepting(null);
    }
  };

  const getWishTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type.includes('delivery') || type.includes('food') || type.includes('grocery')) return 'fast-food';
    if (type.includes('courier') || type.includes('document')) return 'document-text';
    if (type.includes('ride') || type.includes('airport')) return 'car';
    if (type.includes('errand') || type.includes('bill') || type.includes('pickup')) return 'clipboard';
    return 'star';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Wishes</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{wishes.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />
        }
      >
        {wishes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={64} color={THEME.textMuted} />
            <Text style={styles.emptyTitle}>No Wishes Available</Text>
            <Text style={styles.emptyText}>
              New wishes from customers will appear here
            </Text>
          </View>
        ) : (
          wishes.map((wish) => (
            <View key={wish.wish_id} style={styles.wishCard}>
              <View style={styles.wishHeader}>
                <View style={styles.wishIconBg}>
                  <Ionicons name={getWishTypeIcon(wish.wish_type)} size={24} color={THEME.accent2} />
                </View>
                <View style={styles.wishInfo}>
                  <Text style={styles.wishTitle}>{wish.title}</Text>
                  <Text style={styles.wishType}>{wish.wish_type.replace(/_/g, ' ')}</Text>
                </View>
                {wish.is_immediate && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="flash" size={12} color={THEME.background} />
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>

              {wish.description && (
                <Text style={styles.wishDescription} numberOfLines={2}>
                  {wish.description}
                </Text>
              )}

              <View style={styles.wishDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={16} color={THEME.textMuted} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {wish.location.address}
                  </Text>
                </View>
              </View>

              <View style={styles.wishFooter}>
                <View style={styles.remunerationBadge}>
                  <Ionicons name="cash" size={18} color={THEME.success} />
                  <Text style={styles.remunerationText}>₹{wish.remuneration}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.acceptButton, accepting === wish.wish_id && styles.acceptButtonDisabled]}
                  onPress={() => handleAcceptWish(wish.wish_id)}
                  disabled={accepting === wish.wish_id}
                >
                  {accepting === wish.wish_id ? (
                    <ActivityIndicator size="small" color={THEME.background} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color={THEME.background} />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: THEME.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
  },
  countBadge: {
    backgroundColor: THEME.accent2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: THEME.background,
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  wishCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  wishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wishIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.accent2 + '25',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wishTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  wishType: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.background,
  },
  wishDescription: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  wishDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: THEME.textSecondary,
    flex: 1,
  },
  wishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.cardBorder,
  },
  remunerationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  remunerationText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.success,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: THEME.background,
    fontWeight: '600',
    fontSize: 14,
  },
});
