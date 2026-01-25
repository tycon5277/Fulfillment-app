import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Magical Theme - No Red, Using Amber/Gold for Urgency
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
  // Urgency - Amber/Gold (positive energy)
  urgent: '#F59E0B',
  urgentLight: '#FBBF24',
  urgentDark: '#D97706',
  // Other colors
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#34D399',
  cyan: '#06B6D4',
  blue: '#3B82F6',
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
  wisher?: {
    name: string;
    rating: number;
    total_wishes: number;
    member_since: string;
    verified: boolean;
  };
}

// Mock wishes data with wisher profiles
const MOCK_WISHES: Wish[] = [
  {
    wish_id: 'w1',
    title: 'Birthday Cake Delivery',
    description: 'Need a chocolate cake delivered before 6 PM for a surprise party. Please handle with care and keep it upright.',
    wish_type: 'surprise',
    remuneration: 150,
    is_immediate: true,
    location: { address: 'MG Road, Bangalore', coordinates: { lat: 12.9716, lng: 77.5946 } },
    created_at: new Date(Date.now() - 300000).toISOString(),
    distance: 2.5,
    xp_reward: 75,
    wisher: { name: 'Priya S.', rating: 4.8, total_wishes: 23, member_since: 'Mar 2025', verified: true },
  },
  {
    wish_id: 'w2',
    title: 'Urgent Medicine Pickup',
    description: 'Need prescription medicines from Apollo Pharmacy. Will share prescription on chat.',
    wish_type: 'errand',
    remuneration: 200,
    is_immediate: true,
    location: { address: 'Koramangala, Bangalore', coordinates: { lat: 12.9352, lng: 77.6245 } },
    created_at: new Date(Date.now() - 600000).toISOString(),
    distance: 1.8,
    xp_reward: 100,
    wisher: { name: 'Rahul M.', rating: 4.9, total_wishes: 47, member_since: 'Jan 2025', verified: true },
  },
  {
    wish_id: 'w3',
    title: 'Grocery Shopping',
    description: 'Weekly grocery list - approximately 15 items from BigBasket store',
    wish_type: 'shopping',
    remuneration: 180,
    is_immediate: false,
    location: { address: 'HSR Layout, Bangalore', coordinates: { lat: 12.9081, lng: 77.6476 } },
    created_at: new Date(Date.now() - 1800000).toISOString(),
    distance: 3.2,
    xp_reward: 60,
    wisher: { name: 'Ananya K.', rating: 4.6, total_wishes: 12, member_since: 'Nov 2025', verified: false },
  },
  {
    wish_id: 'w4',
    title: 'Document Courier',
    description: 'Important legal documents to be delivered to law firm. Signature required.',
    wish_type: 'courier',
    remuneration: 120,
    is_immediate: false,
    location: { address: 'Indiranagar, Bangalore', coordinates: { lat: 12.9784, lng: 77.6408 } },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    distance: 4.1,
    xp_reward: 50,
    wisher: { name: 'Vikram R.', rating: 5.0, total_wishes: 8, member_since: 'Dec 2025', verified: true },
  },
  {
    wish_id: 'w5',
    title: 'Anniversary Flowers',
    description: 'Red roses bouquet for anniversary surprise. Please include a small card.',
    wish_type: 'surprise',
    remuneration: 250,
    is_immediate: false,
    location: { address: 'Whitefield, Bangalore', coordinates: { lat: 12.9698, lng: 77.7500 } },
    created_at: new Date(Date.now() - 7200000).toISOString(),
    distance: 8.5,
    xp_reward: 90,
    wisher: { name: 'Deepak J.', rating: 4.7, total_wishes: 31, member_since: 'Feb 2025', verified: true },
  },
];

// Area potential data (mock)
const AREA_POTENTIAL = {
  radius: '3-10 km',
  activeWishers: 342,
  avgWishesPerHour: 28,
  peakHours: '6 PM - 9 PM',
  populationDensity: 'High',
  topCategories: ['Food Delivery', 'Errands', 'Surprise Gifts'],
  potentialEarnings: {
    morning: '₹400-600',
    afternoon: '₹500-800',
    evening: '₹800-1,500',
    night: '₹300-500',
  },
  historicAvg: '₹1,850/day',
};

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
    case 'errand': return COLORS.urgentLight;
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
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for urgent wishes
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchWishes = useCallback(async () => {
    try {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSelectedWish(null);
      setWishes(prev => prev.filter(w => w.wish_id !== wishId));
    } catch (err) {
      console.error('Failed to accept wish:', err);
    } finally {
      setAccepting(null);
    }
  };

  const urgentWishes = wishes.filter(w => w.is_immediate);
  const nearbyWishes = [...wishes].sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const getFilteredWishes = () => {
    switch (filter) {
      case 'urgent': return urgentWishes;
      case 'nearby': return nearbyWishes;
      default: return wishes;
    }
  };

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

  // Earnings Detail Modal
  const EarningsModal = () => (
    <Modal visible={showEarningsModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>📊 Area Insights</Text>
            <Text style={styles.modalSubtitle}>{AREA_POTENTIAL.radius} radius</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowEarningsModal(false)}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Potential Earnings Card */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="trending-up" size={24} color={COLORS.success} />
                <Text style={styles.insightTitle}>Earning Potential</Text>
              </View>
              <Text style={styles.bigNumber}>{AREA_POTENTIAL.historicAvg}</Text>
              <Text style={styles.insightLabel}>Average daily earnings in your area</Text>
              
              <View style={styles.timeSlots}>
                {Object.entries(AREA_POTENTIAL.potentialEarnings).map(([time, amount]) => (
                  <View key={time} style={styles.timeSlot}>
                    <Text style={styles.timeLabel}>{time.charAt(0).toUpperCase() + time.slice(1)}</Text>
                    <Text style={styles.timeAmount}>{amount}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Area Stats */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="people" size={24} color={COLORS.cyan} />
                <Text style={styles.insightTitle}>Wisher Activity</Text>
              </View>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{AREA_POTENTIAL.activeWishers}</Text>
                  <Text style={styles.statLabel}>Active Wishers</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{AREA_POTENTIAL.avgWishesPerHour}</Text>
                  <Text style={styles.statLabel}>Wishes/Hour</Text>
                </View>
              </View>
              <View style={styles.peakBadge}>
                <Ionicons name="time" size={16} color={COLORS.urgent} />
                <Text style={styles.peakText}>Peak: {AREA_POTENTIAL.peakHours}</Text>
              </View>
            </View>

            {/* Top Categories */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="flame" size={24} color={COLORS.magenta} />
                <Text style={styles.insightTitle}>Trending Categories</Text>
              </View>
              {AREA_POTENTIAL.topCategories.map((cat, i) => (
                <View key={cat} style={styles.categoryRow}>
                  <Text style={styles.categoryRank}>#{i + 1}</Text>
                  <Text style={styles.categoryName}>{cat}</Text>
                  <View style={[styles.categoryBar, { width: `${80 - i * 20}%` }]} />
                </View>
              ))}
            </View>

            {/* Population Density */}
            <View style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Ionicons name="location" size={24} color={COLORS.primary} />
                <Text style={styles.insightTitle}>Area Profile</Text>
              </View>
              <View style={styles.densityBadge}>
                <Text style={styles.densityLabel}>Population Density</Text>
                <Text style={styles.densityValue}>{AREA_POTENTIAL.populationDensity}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Wish Detail Modal
  const WishDetailModal = () => {
    if (!selectedWish) return null;
    const typeColor = getWishTypeColor(selectedWish.wish_type);
    
    return (
      <Modal visible={!!selectedWish} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.wishModalContent}>
            {/* Header */}
            <LinearGradient
              colors={selectedWish.is_immediate ? [COLORS.urgentDark, COLORS.urgent] : [COLORS.primaryDark, COLORS.primary]}
              style={styles.wishModalHeader}
            >
              {selectedWish.is_immediate && (
                <View style={styles.urgentTag}>
                  <Ionicons name="flash" size={14} color="#FFF" />
                  <Text style={styles.urgentTagText}>TIME SENSITIVE</Text>
                </View>
              )}
              <Text style={styles.wishModalTitle}>{selectedWish.title}</Text>
              <View style={styles.wishModalMeta}>
                <View style={[styles.typeBadge, { backgroundColor: typeColor + '30' }]}>
                  <Ionicons name={getWishTypeIcon(selectedWish.wish_type) as any} size={14} color="#FFF" />
                  <Text style={styles.typeBadgeText}>{selectedWish.wish_type}</Text>
                </View>
                <Text style={styles.wishModalTime}>{formatTimeAgo(selectedWish.created_at)}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedWish(null)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.wishModalBody} showsVerticalScrollIndicator={false}>
              {/* Description */}
              <View style={styles.wishSection}>
                <Text style={styles.wishSectionTitle}>Wish Details</Text>
                <Text style={styles.wishDescription}>{selectedWish.description}</Text>
              </View>

              {/* Location */}
              <View style={styles.wishSection}>
                <Text style={styles.wishSectionTitle}>Location</Text>
                <View style={styles.locationCard}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationAddress}>{selectedWish.location.address}</Text>
                    <Text style={styles.locationDistance}>{selectedWish.distance} km away</Text>
                  </View>
                </View>
              </View>

              {/* Wisher Profile */}
              {selectedWish.wisher && (
                <View style={styles.wishSection}>
                  <Text style={styles.wishSectionTitle}>About the Wisher</Text>
                  <View style={styles.wisherCard}>
                    <View style={styles.wisherAvatar}>
                      <Text style={styles.wisherInitial}>{selectedWish.wisher.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.wisherInfo}>
                      <View style={styles.wisherNameRow}>
                        <Text style={styles.wisherName}>{selectedWish.wisher.name}</Text>
                        {selectedWish.wisher.verified && (
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color={COLORS.cyan} />
                          </View>
                        )}
                      </View>
                      <View style={styles.wisherStats}>
                        <View style={styles.wisherStat}>
                          <Ionicons name="star" size={14} color={COLORS.urgent} />
                          <Text style={styles.wisherStatText}>{selectedWish.wisher.rating}</Text>
                        </View>
                        <View style={styles.wisherStat}>
                          <Ionicons name="gift" size={14} color={COLORS.primary} />
                          <Text style={styles.wisherStatText}>{selectedWish.wisher.total_wishes} wishes</Text>
                        </View>
                      </View>
                      <Text style={styles.wisherSince}>Member since {selectedWish.wisher.member_since}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Rewards */}
              <View style={styles.rewardsSection}>
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardLabel}>Earnings</Text>
                  <Text style={styles.rewardValue}>₹{selectedWish.remuneration}</Text>
                </View>
                <View style={styles.rewardDivider} />
                <View style={styles.rewardItem}>
                  <Text style={styles.rewardLabel}>XP Reward</Text>
                  <Text style={[styles.rewardValue, { color: COLORS.primary }]}>+{selectedWish.xp_reward || 50}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Accept Button */}
            <View style={styles.wishModalFooter}>
              <TouchableOpacity
                style={styles.acceptFullButton}
                onPress={() => handleAcceptWish(selectedWish.wish_id)}
                disabled={accepting === selectedWish.wish_id}
              >
                <LinearGradient
                  colors={selectedWish.is_immediate ? [COLORS.urgent, COLORS.urgentLight] : [COLORS.primary, COLORS.magenta]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.acceptFullGradient}
                >
                  {accepting === selectedWish.wish_id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#FFF" />
                      <Text style={styles.acceptFullText}>Grant This Wish</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <EarningsModal />
      <WishDetailModal />

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
            <Text style={styles.headerSubtitle}>Grant wishes, earn magic</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Clickable Stats Row */}
        <TouchableOpacity style={styles.statsRow} onPress={() => setShowEarningsModal(true)} activeOpacity={0.8}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{totalEarnings}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{wishes.length}</Text>
            <Text style={styles.statLabel}>Wishes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.urgentStatBadge}>
              <Ionicons name="flash" size={14} color={COLORS.urgentLight} />
              <Text style={[styles.statValue, { color: COLORS.urgentLight }]}>{urgentWishes.length}</Text>
            </View>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Urgent Wishes Banner - Amber Theme */}
      {urgentWishes.length > 0 && (
        <View style={styles.urgentBanner}>
          <LinearGradient
            colors={[COLORS.urgentDark, COLORS.urgent, COLORS.urgentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.urgentGradient}
          >
            <View style={styles.urgentIcon}>
              <Ionicons name="flash" size={18} color="#FFF" />
            </View>
            <View style={styles.urgentContent}>
              <Text style={styles.urgentTitle}>⚡ {urgentWishes.length} Time-Sensitive Wish{urgentWishes.length > 1 ? 'es' : ''}!</Text>
              <Text style={styles.urgentText}>Higher rewards • Quick completion bonus</Text>
            </View>
            <TouchableOpacity style={styles.urgentAction} onPress={() => setFilter('urgent')}>
              <Text style={styles.urgentActionText}>View</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
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
              {f === 'all' ? '🌟 All' : f === 'urgent' ? '⚡ Priority' : '📍 Nearby'}
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
            <Text style={styles.emptyText}>Pull down to refresh or check back soon</Text>
          </View>
        ) : (
          getFilteredWishes().map((wish) => {
            const isUrgent = wish.is_immediate;
            const typeColor = getWishTypeColor(wish.wish_type);
            
            return (
              <TouchableOpacity
                key={wish.wish_id}
                activeOpacity={0.9}
                onPress={() => setSelectedWish(wish)}
              >
                <Animated.View
                  style={[
                    styles.wishCard,
                    isUrgent && styles.wishCardUrgent,
                    isUrgent && { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  {/* Urgent Badge - Amber/Gold */}
                  {isUrgent && (
                    <View style={styles.urgentCardBadge}>
                      <Ionicons name="flash" size={12} color="#FFF" />
                      <Text style={styles.urgentCardText}>PRIORITY</Text>
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
                        <Text style={[styles.wishType, { color: typeColor }]}>{wish.wish_type}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.timeAgo}>{formatTimeAgo(wish.created_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.xpBadge}>
                      <Text style={styles.xpText}>+{wish.xp_reward || 50}</Text>
                      <Text style={styles.xpLabel}>XP</Text>
                    </View>
                  </View>

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
                    <View style={styles.viewDetails}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                    </View>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })
        )}

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
    alignItems: 'center',
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
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  urgentStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentBanner: {
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  urgentGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  urgentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentContent: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  urgentText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  urgentAction: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  urgentActionText: {
    fontSize: 13,
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
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 16,
  },
  insightCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.success,
    marginBottom: 4,
  },
  insightLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
  },
  timeLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  timeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.backgroundSecondary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.urgent + '15',
    padding: 10,
    borderRadius: 10,
  },
  peakText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.urgent,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryRank: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    width: 30,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 120,
  },
  categoryBar: {
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  densityBadge: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  densityLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  densityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  // Wish Detail Modal
  wishModalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  wishModalHeader: {
    padding: 20,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  urgentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 12,
  },
  urgentTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  wishModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
  },
  wishModalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'capitalize',
  },
  wishModalTime: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  wishModalBody: {
    padding: 16,
  },
  wishSection: {
    marginBottom: 20,
  },
  wishSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wishDescription: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationDistance: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  wisherCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 12,
    gap: 14,
  },
  wisherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wisherInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  wisherInfo: {
    flex: 1,
  },
  wisherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wisherName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  wisherStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  wisherStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wisherStatText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  wisherSince: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  rewardsSection: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
  },
  rewardItem: {
    flex: 1,
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.success,
  },
  rewardDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
    marginHorizontal: 16,
  },
  wishModalFooter: {
    padding: 16,
    paddingBottom: 32,
  },
  acceptFullButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  acceptFullGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  acceptFullText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
