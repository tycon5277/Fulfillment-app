import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as api from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dark Magical Theme
const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  // Primary palette
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  // Accent colors
  cyan: '#06B6D4',
  magenta: '#D946EF',
  amber: '#F59E0B',
  green: '#34D399',
  blue: '#3B82F6',
  pink: '#EC4899',
  // Text
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

interface Delivery {
  id: string;
  type: 'hub_order' | 'wish';
  title: string;
  subtitle: string;
  status: string;
  statusStep: number;
  location: string;
  distance: number;
  earning: number;
  xp: number;
  time: string;
  isUrgent?: boolean;
  customer?: {
    name: string;
    rating: number;
  };
}

// Mock data for demonstration
const MOCK_HUB_ORDERS: Delivery[] = [
  {
    id: 'ho1',
    type: 'hub_order',
    title: 'Starbucks Coffee',
    subtitle: 'Order #ST-2847',
    status: 'on_the_way',
    statusStep: 2,
    location: 'MG Road, Bangalore',
    distance: 2.3,
    earning: 85,
    xp: 40,
    time: '12 mins',
    customer: { name: 'Priya K.', rating: 4.8 },
  },
  {
    id: 'ho2',
    type: 'hub_order',
    title: 'Dominos Pizza',
    subtitle: 'Order #DM-9421',
    status: 'picked_up',
    statusStep: 1,
    location: 'Koramangala, Bangalore',
    distance: 3.8,
    earning: 120,
    xp: 55,
    time: '18 mins',
    isUrgent: true,
    customer: { name: 'Rahul M.', rating: 4.9 },
  },
];

const MOCK_WISHES: Delivery[] = [
  {
    id: 'w1',
    type: 'wish',
    title: 'Birthday Cake Pickup',
    subtitle: 'Surprise Delivery',
    status: 'in_progress',
    statusStep: 2,
    location: 'HSR Layout, Bangalore',
    distance: 4.2,
    earning: 200,
    xp: 85,
    time: '25 mins',
    customer: { name: 'Ananya S.', rating: 4.7 },
  },
  {
    id: 'w2',
    type: 'wish',
    title: 'Pharmacy Pickup',
    subtitle: 'Errand',
    status: 'accepted',
    statusStep: 1,
    location: 'Whitefield, Bangalore',
    distance: 6.1,
    earning: 150,
    xp: 65,
    time: '35 mins',
    customer: { name: 'Vikram R.', rating: 5.0 },
  },
];

const HUB_ORDER_STEPS = ['Accepted', 'Picked Up', 'On The Way', 'Delivered'];
const WISH_STEPS = ['Accepted', 'In Progress', 'Completing', 'Done'];

export default function DeliveriesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'hub_orders' | 'wishes'>('hub_orders');
  const [hubOrders, setHubOrders] = useState<Delivery[]>(MOCK_HUB_ORDERS);
  const [wishes, setWishes] = useState<Delivery[]>(MOCK_WISHES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation for tab indicator
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'hub_orders' ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [tab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getTotalEarnings = () => {
    const hubTotal = hubOrders.reduce((sum, d) => sum + d.earning, 0);
    const wishTotal = wishes.reduce((sum, d) => sum + d.earning, 0);
    return hubTotal + wishTotal;
  };

  const getTotalXP = () => {
    const hubXP = hubOrders.reduce((sum, d) => sum + d.xp, 0);
    const wishXP = wishes.reduce((sum, d) => sum + d.xp, 0);
    return hubXP + wishXP;
  };

  const handleDeliveryPress = (delivery: Delivery) => {
    router.push({
      pathname: '/navigation',
      params: {
        type: delivery.type,
        orderId: delivery.id,
        title: delivery.title,
      }
    });
  };

  const renderDeliveryCard = (delivery: Delivery) => {
    const isHubOrder = delivery.type === 'hub_order';
    const steps = isHubOrder ? HUB_ORDER_STEPS : WISH_STEPS;
    const gradientColors = isHubOrder 
      ? [COLORS.blue, COLORS.cyan] 
      : [COLORS.primary, COLORS.magenta];
    const iconName = isHubOrder ? 'cube' : 'sparkles';
    const iconBgColor = isHubOrder ? COLORS.blue : COLORS.primary;

    return (
      <TouchableOpacity 
        key={delivery.id} 
        activeOpacity={0.9}
        onPress={() => handleDeliveryPress(delivery)}
        style={[styles.deliveryCard, delivery.isUrgent && styles.urgentCard]}
      >
        {/* Urgent Badge */}
        {delivery.isUrgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={10} color="#FFF" />
            <Text style={styles.urgentBadgeText}>PRIORITY</Text>
          </View>
        )}

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconBg, { backgroundColor: iconBgColor + '20' }]}>
            <Ionicons name={iconName as any} size={22} color={iconBgColor} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.deliveryTitle}>{delivery.title}</Text>
            <Text style={styles.deliverySubtitle}>{delivery.subtitle}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={COLORS.amber} />
            <Text style={styles.timeText}>{delivery.time}</Text>
          </View>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <View style={styles.progressStepContainer}>
                  <View style={[
                    styles.progressDot,
                    index <= delivery.statusStep && styles.progressDotActive,
                    index === delivery.statusStep && styles.progressDotCurrent,
                  ]}>
                    {index < delivery.statusStep ? (
                      <Ionicons name="checkmark" size={10} color="#FFF" />
                    ) : index === delivery.statusStep ? (
                      <View style={styles.currentDotInner} />
                    ) : null}
                  </View>
                  <Text style={[
                    styles.progressLabel,
                    index <= delivery.statusStep && styles.progressLabelActive,
                  ]}>{step}</Text>
                </View>
                {index < steps.length - 1 && (
                  <View style={[
                    styles.progressLine,
                    index < delivery.statusStep && styles.progressLineActive,
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Customer & Location */}
        <View style={styles.infoSection}>
          <View style={styles.customerRow}>
            <View style={styles.customerAvatar}>
              <Text style={styles.avatarText}>{delivery.customer?.name.charAt(0)}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{delivery.customer?.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={COLORS.amber} />
                <Text style={styles.ratingText}>{delivery.customer?.rating}</Text>
              </View>
            </View>
          </View>
          <View style={styles.locationBadge}>
            <Ionicons name="location" size={14} color={COLORS.textMuted} />
            <Text style={styles.locationText} numberOfLines={1}>{delivery.location}</Text>
            <Text style={styles.distanceText}>{delivery.distance} km</Text>
          </View>
        </View>

        {/* Footer with Earnings & Action */}
        <View style={styles.cardFooter}>
          <View style={styles.earningsDisplay}>
            <Text style={styles.earningsLabel}>Earnings</Text>
            <Text style={styles.earningsValue}>₹{delivery.earning}</Text>
          </View>
          <View style={styles.xpDisplay}>
            <Text style={styles.xpValue}>+{delivery.xp} XP</Text>
          </View>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeliveryPress(delivery)}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="navigate" size={16} color="#FFF" />
              <Text style={styles.actionText}>Navigate</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const currentData = tab === 'hub_orders' ? hubOrders : wishes;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Stats - Soothing Deep Blue */}
      <LinearGradient
        colors={['#1E293B', '#334155', '#475569']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>🚀 Active Deliveries</Text>
            <Text style={styles.headerSubtitle}>Track your ongoing tasks</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <View style={styles.statIconBg}>
              <Ionicons name="cube" size={18} color={COLORS.blue} />
            </View>
            <View>
              <Text style={styles.statValue}>{hubOrders.length}</Text>
              <Text style={styles.statLabel}>Hub Orders</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.magenta + '20' }]}>
              <Ionicons name="sparkles" size={18} color={COLORS.magenta} />
            </View>
            <View>
              <Text style={styles.statValue}>{wishes.length}</Text>
              <Text style={styles.statLabel}>Wishes</Text>
            </View>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.green + '20' }]}>
              <Ionicons name="wallet" size={18} color={COLORS.green} />
            </View>
            <View>
              <Text style={styles.statValue}>₹{getTotalEarnings()}</Text>
              <Text style={styles.statLabel}>Potential</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'hub_orders' && styles.tabActive]}
          onPress={() => setTab('hub_orders')}
        >
          <Ionicons 
            name="cube" 
            size={18} 
            color={tab === 'hub_orders' ? COLORS.blue : COLORS.textMuted} 
          />
          <Text style={[styles.tabText, tab === 'hub_orders' && styles.tabTextActive]}>
            Hub Orders
          </Text>
          {hubOrders.length > 0 && (
            <View style={[styles.tabBadge, tab === 'hub_orders' && styles.tabBadgeActive]}>
              <Text style={styles.tabBadgeText}>{hubOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'wishes' && styles.tabActive]}
          onPress={() => setTab('wishes')}
        >
          <Ionicons 
            name="sparkles" 
            size={18} 
            color={tab === 'wishes' ? COLORS.magenta : COLORS.textMuted} 
          />
          <Text style={[styles.tabText, tab === 'wishes' && styles.tabTextActiveWish]}>
            Wishes
          </Text>
          {wishes.length > 0 && (
            <View style={[styles.tabBadgeWish, tab === 'wishes' && styles.tabBadgeActiveWish]}>
              <Text style={styles.tabBadgeText}>{wishes.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Delivery List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {currentData.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons 
                name={tab === 'hub_orders' ? 'cube-outline' : 'sparkles-outline'} 
                size={48} 
                color={COLORS.textMuted} 
              />
            </View>
            <Text style={styles.emptyTitle}>
              No Active {tab === 'hub_orders' ? 'Hub Orders' : 'Wishes'}
            </Text>
            <Text style={styles.emptyText}>
              Accept {tab === 'hub_orders' ? 'orders from the Hub' : 'wishes from the portal'} to see them here
            </Text>
            <TouchableOpacity style={styles.emptyButton}>
              <LinearGradient
                colors={tab === 'hub_orders' ? [COLORS.blue, COLORS.cyan] : [COLORS.primary, COLORS.magenta]}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>
                  Go to {tab === 'hub_orders' ? 'Hub Orders' : 'Wishes Portal'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Active Delivery Count Banner */}
            <View style={styles.activeBanner}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>
                {currentData.length} active {tab === 'hub_orders' ? 'order' : 'wish'}{currentData.length > 1 ? 's' : ''} • 
                {' '}{getTotalXP()} XP on completion
              </Text>
            </View>

            {currentData.map(renderDeliveryCard)}

            {/* Completion Bonus */}
            <View style={styles.bonusCard}>
              <LinearGradient
                colors={[COLORS.amber + '30', COLORS.amber + '10']}
                style={styles.bonusGradient}
              >
                <Ionicons name="trophy" size={24} color={COLORS.amber} />
                <View style={styles.bonusContent}>
                  <Text style={styles.bonusTitle}>Complete All Deliveries</Text>
                  <Text style={styles.bonusText}>Earn bonus +50 XP & priority access</Text>
                </View>
              </LinearGradient>
            </View>
          </>
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.blue + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 8,
  },
  tabActive: {
    backgroundColor: COLORS.blue + '15',
    borderColor: COLORS.blue,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.blue,
  },
  tabTextActiveWish: {
    color: COLORS.magenta,
  },
  tabBadge: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: COLORS.blue,
  },
  tabBadgeWish: {
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActiveWish: {
    backgroundColor: COLORS.magenta,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.green + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.green,
  },
  activeText: {
    fontSize: 13,
    color: COLORS.green,
    fontWeight: '500',
  },
  deliveryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  urgentCard: {
    borderColor: COLORS.amber,
    borderWidth: 2,
  },
  urgentBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    gap: 4,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  deliverySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber,
  },
  progressSection: {
    marginBottom: 14,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  progressStepContainer: {
    alignItems: 'center',
    width: 60,
  },
  progressDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: COLORS.green,
  },
  progressDotCurrent: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  currentDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  progressLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: COLORS.green,
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.cardBorder,
    marginTop: 10,
    marginHorizontal: -10,
  },
  progressLineActive: {
    backgroundColor: COLORS.green,
  },
  infoSection: {
    marginBottom: 14,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  customerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.amber,
    fontWeight: '500',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    backgroundColor: COLORS.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  earningsDisplay: {
    marginRight: 12,
  },
  earningsLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green,
  },
  xpDisplay: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionButton: {
    flex: 1,
    marginLeft: 'auto',
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  bonusCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  bonusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  bonusContent: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.amber,
  },
  bonusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
