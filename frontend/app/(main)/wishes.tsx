import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as api from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Magical Violet Theme
const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  // Violet/Purple palette
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  magenta: '#D946EF',
  pink: '#EC4899',
  // Other colors
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  urgent: '#EF4444',
  cyan: '#06B6D4',
};

interface Wish {
  wish_id: string;
  title: string;
  description?: string;
  wish_type: string;
  remuneration: number;
  is_immediate: boolean;
  location: {
    address: string;
    coordinates?: { lat: number; lng: number };
  };
  created_at: string;
  distance?: number;
  xp_reward?: number;
}

// Mock wishes data for demonstration
const MOCK_WISHES: Wish[] = [
  {
    wish_id: 'w1',
    title: 'Birthday Cake Delivery',
    description: 'Need a chocolate cake delivered before 6 PM for a surprise party',
    wish_type: 'surprise',
    remuneration: 150,
    is_immediate: true,
    location: { address: 'MG Road, Bangalore' },
    created_at: new Date(Date.now() - 300000).toISOString(),
    distance: 2.5,
    xp_reward: 75,
  },
  {
    wish_id: 'w2',
    title: 'Urgent Medicine Pickup',
    description: 'Need prescription medicines from Apollo Pharmacy',
    wish_type: 'errand',
    remuneration: 200,
    is_immediate: true,
    location: { address: 'Koramangala, Bangalore' },
    created_at: new Date(Date.now() - 600000).toISOString(),
    distance: 1.8,
    xp_reward: 100,
  },
  {
    wish_id: 'w3',
    title: 'Grocery Shopping',
    description: 'Weekly grocery list - approximately 15 items',
    wish_type: 'shopping',
    remuneration: 180,
    is_immediate: false,
    location: { address: 'HSR Layout, Bangalore' },
    created_at: new Date(Date.now() - 1800000).toISOString(),
    distance: 3.2,
    xp_reward: 60,
  },
  {
    wish_id: 'w4',
    title: 'Document Courier',
    description: 'Important documents to be delivered to law firm',
    wish_type: 'courier',
    remuneration: 120,
    is_immediate: false,
    location: { address: 'Indiranagar, Bangalore' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    distance: 4.1,
    xp_reward: 50,
  },
  {
    wish_id: 'w5',
    title: 'Anniversary Flowers',
    description: 'Red roses bouquet for anniversary surprise',
    wish_type: 'surprise',
    remuneration: 250,
    is_immediate: false,
    location: { address: 'Whitefield, Bangalore' },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    distance: 8.5,
    xp_reward: 90,
  },
];

const getWishTypeIcon = (type: string): string => {
  switch (type) {
    case 'delivery': return 'cube';
    case 'courier': return 'document-text';
    case 'errand': return 'walk';
    case 'shopping': return 'cart';
    case 'surprise': return 'gift';
    case 'ride': return 'car';
    default: return 'star';
  }
};

const getWishTypeColor = (type: string): string => {
  switch (type) {
    case 'delivery': return COLORS.cyan;
    case 'courier': return COLORS.primary;
    case 'errand': return COLORS.warning;
    case 'shopping': return COLORS.success;
    case 'surprise': return COLORS.magenta;
    case 'ride': return COLORS.pink;
    default: return COLORS.primaryLight;
  }
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
};

export default function WishesScreen() {
  const router = useRouter();
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'nearby'>('all');
  
  // Animations
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Shimmer animation for urgent banner
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Pulse animation for urgent wishes
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchWishes = useCallback(async () => {
    try {
      // Use mock data for now
      setWishes(MOCK_WISHES);
    } catch (err) {
      console.error('Failed to fetch wishes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishes();
  }, [fetchWishes]);

  const handleAcceptWish = async (wishId: string) => {
    setAccepting(wishId);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('🎉 Wish Accepted!', 'Navigate to the pickup location to fulfill this wish.', [
        { text: 'Let\'s Go!', style: 'default' }
      ]);
      setWishes(prev => prev.filter(w => w.wish_id !== wishId));
    } catch (err) {
      Alert.alert('Error', 'Failed to accept wish. Please try again.');
    } finally {
      setAccepting(null);
    }
  };

  const urgentWishes = wishes.filter(w => w.is_immediate);
  const regularWishes = wishes.filter(w => !w.is_immediate);
  const nearbyWishes = [...wishes].sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const getFilteredWishes = () => {
    switch (filter) {
      case 'urgent': return urgentWishes;
      case 'nearby': return nearbyWishes;
      default: return wishes;
    }
  };

  const totalXP = wishes.reduce((sum, w) => sum + (w.xp_reward || 50), 0);
  const totalEarnings = wishes.reduce((sum, w) => sum + w.remuneration, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Summoning wishes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Magical Header */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, COLORS.magenta]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>✨ Wishes Portal</Text>
            <Text style={styles.headerSubtitle}>{wishes.length} wishes waiting</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{totalEarnings}</Text>
            <Text style={styles.statLabel}>Potential</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalXP} XP</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{urgentWishes.length}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Urgent Wishes Banner */}
      {urgentWishes.length > 0 && (
        <Animated.View style={[styles.urgentBanner, { opacity: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1]
        })}]}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.urgentGradient}
          >
            <View style={styles.urgentIcon}>
              <Ionicons name="flash" size={18} color="#FFF" />
            </View>
            <View style={styles.urgentContent}>
              <Text style={styles.urgentTitle}>⚡ {urgentWishes.length} Urgent Wish{urgentWishes.length > 1 ? 'es' : ''}!</Text>
              <Text style={styles.urgentText}>Higher rewards • Time sensitive</Text>
            </View>
            <TouchableOpacity style={styles.urgentAction} onPress={() => setFilter('urgent')}>
              <Text style={styles.urgentActionText}>View</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'urgent', 'nearby'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? '🌟 All' : f === 'urgent' ? '⚡ Urgent' : '📍 Nearby'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {getFilteredWishes().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔮</Text>
            <Text style={styles.emptyTitle}>No {filter !== 'all' ? filter : ''} wishes found</Text>
            <Text style={styles.emptyText}>
              Pull down to refresh or check back soon
            </Text>
          </View>
        ) : (
          getFilteredWishes().map((wish, index) => {
            const isUrgent = wish.is_immediate;
            const typeColor = getWishTypeColor(wish.wish_type);
            
            return (
              <Animated.View
                key={wish.wish_id}
                style={[
                  styles.wishCard,
                  isUrgent && styles.wishCardUrgent,
                  isUrgent && { transform: [{ scale: pulseAnim }] }
                ]}
              >
                {/* Urgent Badge */}
                {isUrgent && (
                  <View style={styles.urgentCardBadge}>
                    <Ionicons name="flash" size={12} color="#FFF" />
                    <Text style={styles.urgentCardText}>URGENT</Text>
                  </View>
                )}

                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.typeIconBg, { backgroundColor: typeColor + '20' }]}>
                    <Ionicons name={getWishTypeIcon(wish.wish_type) as any} size={24} color={typeColor} />
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.wishTitle}>{wish.title}</Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.wishType}>{wish.wish_type}</Text>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.timeAgo}>{formatTimeAgo(wish.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{wish.xp_reward || 50}</Text>
                    <Text style={styles.xpLabel}>XP</Text>
                  </View>
                </View>

                {/* Description */}
                {wish.description && (
                  <Text style={styles.wishDescription} numberOfLines={2}>
                    {wish.description}
                  </Text>
                )}

                {/* Location & Distance */}
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={COLORS.textMuted} />
                  <Text style={styles.locationText} numberOfLines={1}>{wish.location.address}</Text>
                  {wish.distance && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{wish.distance} km</Text>
                    </View>
                  )}
                </View>

                {/* Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.earningsBadge}>
                    <Text style={styles.earningsSymbol}>₹</Text>
                    <Text style={styles.earningsAmount}>{wish.remuneration}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.acceptButton, accepting === wish.wish_id && styles.acceptButtonDisabled]}
                    onPress={() => handleAcceptWish(wish.wish_id)}
                    disabled={accepting === wish.wish_id}
                  >
                    <LinearGradient
                      colors={isUrgent ? ['#EF4444', '#DC2626'] : [COLORS.primary, COLORS.magenta]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.acceptButtonGradient}
                    >
                      {accepting === wish.wish_id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="sparkles" size={16} color="#FFF" />
                          <Text style={styles.acceptButtonText}>Grant Wish</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            );
          })
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  urgentBanner: {
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  urgentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  urgentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentContent: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  urgentText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  urgentAction: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  urgentActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTextActive: {
    color: COLORS.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
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
  },
  wishCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  wishCardUrgent: {
    borderColor: COLORS.urgent,
    borderWidth: 2,
  },
  urgentCardBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.urgent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 4,
  },
  urgentCardText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wishTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishType: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dotSeparator: {
    color: COLORS.textMuted,
    marginHorizontal: 6,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  xpBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  xpLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  wishDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  distanceBadge: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  earningsSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.success,
    marginLeft: 2,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
