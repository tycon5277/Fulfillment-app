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
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dark Magical Theme
const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  cyan: '#06B6D4',
  magenta: '#D946EF',
  amber: '#F59E0B',
  green: '#34D399',
  blue: '#3B82F6',
  pink: '#EC4899',
  red: '#F87171',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

interface Quest {
  id: string;
  type: 'hub_order' | 'wish';
  title: string;
  subtitle: string;
  status: 'active' | 'completed';
  statusStep: number;
  location: string;
  distance: number;
  earning: number;
  xp: number;
  time: string;
  completedAt?: string;
  isUrgent?: boolean;
  customer?: {
    name: string;
    rating: number;
  };
}

// Mock data for active quests (when online)
const MOCK_ACTIVE_QUESTS: Quest[] = [
  {
    id: 'ho1',
    type: 'hub_order',
    title: 'Starbucks Coffee',
    subtitle: 'Order #ST-2847',
    status: 'active',
    statusStep: 2,
    location: 'MG Road, Bangalore',
    distance: 2.3,
    earning: 85,
    xp: 40,
    time: '12 mins',
    customer: { name: 'Priya K.', rating: 4.8 },
  },
  {
    id: 'w1',
    type: 'wish',
    title: 'Birthday Cake Pickup',
    subtitle: 'Surprise Delivery',
    status: 'active',
    statusStep: 2,
    location: 'HSR Layout, Bangalore',
    distance: 4.2,
    earning: 200,
    xp: 85,
    time: '25 mins',
    customer: { name: 'Ananya S.', rating: 4.7 },
  },
];

// Mock data for completed quests (history)
const MOCK_COMPLETED_QUESTS: Quest[] = [
  {
    id: 'c1',
    type: 'hub_order',
    title: 'Dominos Pizza',
    subtitle: 'Order #DM-9421',
    status: 'completed',
    statusStep: 4,
    location: 'Koramangala, Bangalore',
    distance: 3.8,
    earning: 120,
    xp: 55,
    time: 'Completed',
    completedAt: '2 hours ago',
    customer: { name: 'Rahul M.', rating: 4.9 },
  },
  {
    id: 'c2',
    type: 'wish',
    title: 'Grocery Shopping',
    subtitle: 'Monthly groceries',
    status: 'completed',
    statusStep: 4,
    location: 'Indiranagar, Bangalore',
    distance: 5.1,
    earning: 350,
    xp: 120,
    time: 'Completed',
    completedAt: '5 hours ago',
    customer: { name: 'Meera T.', rating: 5.0 },
  },
  {
    id: 'c3',
    type: 'hub_order',
    title: 'Amazon Package',
    subtitle: 'Order #AMZ-7823',
    status: 'completed',
    statusStep: 4,
    location: 'Whitefield, Bangalore',
    distance: 8.2,
    earning: 180,
    xp: 75,
    time: 'Completed',
    completedAt: 'Yesterday',
    customer: { name: 'Arjun P.', rating: 4.6 },
  },
  {
    id: 'c4',
    type: 'wish',
    title: 'Airport Pickup',
    subtitle: 'Ride request',
    status: 'completed',
    statusStep: 4,
    location: 'KIA Airport',
    distance: 35.0,
    earning: 850,
    xp: 200,
    time: 'Completed',
    completedAt: 'Yesterday',
    customer: { name: 'Kavya R.', rating: 5.0 },
  },
];

const QUEST_STEPS = ['Accepted', 'In Progress', 'Completing', 'Done'];

export default function MyQuestsScreen() {
  const router = useRouter();
  const { isOnline, activeWork } = useAuthStore();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<Quest[]>(MOCK_COMPLETED_QUESTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation for tab indicator
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  // When online, show active quests from store; when offline, only completed
  useEffect(() => {
    if (isOnline && activeWork.length > 0) {
      // Convert active work to quest format
      const quests = activeWork.map(work => ({
        id: work.id,
        type: work.type as 'hub_order' | 'wish',
        title: work.title,
        subtitle: work.status,
        status: 'active' as const,
        statusStep: 2,
        location: 'In Progress',
        distance: 0,
        earning: 0,
        xp: 0,
        time: 'Active',
      }));
      setActiveQuests(quests.length > 0 ? quests : MOCK_ACTIVE_QUESTS);
    } else if (isOnline) {
      setActiveQuests(MOCK_ACTIVE_QUESTS);
    } else {
      setActiveQuests([]);
      setTab('completed'); // Force to completed tab when offline
    }
  }, [isOnline, activeWork]);

  useEffect(() => {
    Animated.spring(tabIndicatorAnim, {
      toValue: tab === 'active' ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [tab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getTotalEarnings = () => {
    return completedQuests.reduce((sum, q) => sum + q.earning, 0);
  };

  const getTotalXP = () => {
    return completedQuests.reduce((sum, q) => sum + q.xp, 0);
  };

  const handleQuestPress = (quest: Quest) => {
    if (quest.status === 'active') {
      router.push({
        pathname: '/navigation',
        params: {
          type: quest.type,
          orderId: quest.id,
          title: quest.title,
        }
      });
    }
  };

  const renderQuestCard = (quest: Quest, isCompleted: boolean = false) => {
    const isHubOrder = quest.type === 'hub_order';
    const iconName = isHubOrder ? 'cube' : 'sparkles';
    const iconBgColor = isHubOrder ? COLORS.blue : COLORS.primary;
    const gradientColors = isCompleted 
      ? [COLORS.green + '20', COLORS.cyan + '10']
      : isHubOrder 
        ? [COLORS.blue + '15', COLORS.cyan + '10']
        : [COLORS.primary + '15', COLORS.magenta + '10'];

    return (
      <TouchableOpacity 
        key={quest.id} 
        activeOpacity={isCompleted ? 1 : 0.9}
        onPress={() => !isCompleted && handleQuestPress(quest)}
        style={[styles.questCard, isCompleted && styles.completedCard]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.questCardGradient}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: isCompleted ? COLORS.green + '20' : iconBgColor + '20' }]}>
              <Ionicons 
                name={isCompleted ? 'checkmark-circle' : iconName as any} 
                size={22} 
                color={isCompleted ? COLORS.green : iconBgColor} 
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.questTitle}>{quest.title}</Text>
              <Text style={styles.questSubtitle}>{quest.subtitle}</Text>
            </View>
            {isCompleted ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedTime}>{quest.completedAt}</Text>
              </View>
            ) : (
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={14} color={COLORS.amber} />
                <Text style={styles.timeText}>{quest.time}</Text>
              </View>
            )}
          </View>

          {/* Location & Customer */}
          <View style={styles.detailsRow}>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={COLORS.cyan} />
              <Text style={styles.locationText} numberOfLines={1}>{quest.location}</Text>
            </View>
            {quest.customer && (
              <View style={styles.customerContainer}>
                <Text style={styles.customerName}>{quest.customer.name}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={10} color={COLORS.amber} />
                  <Text style={styles.ratingText}>{quest.customer.rating}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Earnings Row */}
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <Ionicons name="wallet" size={16} color={COLORS.green} />
              <Text style={styles.earningText}>₹{quest.earning}</Text>
            </View>
            <View style={styles.earningItem}>
              <Ionicons name="flash" size={16} color={COLORS.amber} />
              <Text style={styles.xpText}>+{quest.xp} XP</Text>
            </View>
            {!isCompleted && (
              <TouchableOpacity style={styles.navigateBtn} onPress={() => handleQuestPress(quest)}>
                <Text style={styles.navigateBtnText}>Navigate</Text>
                <Ionicons name="navigate" size={14} color={COLORS.cyan} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Offline State UI
  const renderOfflineState = () => (
    <View style={styles.offlineContainer}>
      <View style={styles.offlineContent}>
        <View style={styles.offlineIconContainer}>
          <Ionicons name="moon" size={48} color={COLORS.textMuted} />
        </View>
        <Text style={styles.offlineTitle}>You're Offline</Text>
        <Text style={styles.offlineSubtitle}>
          No active quests when offline.{'\n'}View your completed quests below.
        </Text>
      </View>
    </View>
  );

  // Empty State
  const renderEmptyState = (type: 'active' | 'completed') => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons 
          name={type === 'active' ? 'hourglass-outline' : 'trophy-outline'} 
          size={48} 
          color={COLORS.textMuted} 
        />
      </View>
      <Text style={styles.emptyTitle}>
        {type === 'active' ? 'No Active Quests' : 'No Completed Quests Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {type === 'active' 
          ? 'Accept hub orders or wishes to start your quests!'
          : 'Complete quests to build your history.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A5F', '#0F172A', '#08080C']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>🏆 My Quests</Text>
            <Text style={styles.headerSubtitle}>
              {isOnline ? 'Your magical journey' : 'Currently offline'}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.green + '20' }]}>
              <Ionicons name="wallet" size={18} color={COLORS.green} />
            </View>
            <View>
              <Text style={styles.statValue}>₹{getTotalEarnings()}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.amber + '20' }]}>
              <Ionicons name="flash" size={18} color={COLORS.amber} />
            </View>
            <View>
              <Text style={styles.statValue}>{getTotalXP()}</Text>
              <Text style={styles.statLabel}>XP Earned</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIconBg, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.statValue}>{completedQuests.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, tab === 'active' && styles.tabActive]}
            onPress={() => isOnline && setTab('active')}
            disabled={!isOnline}
          >
            <Ionicons 
              name="rocket" 
              size={18} 
              color={tab === 'active' ? COLORS.cyan : (isOnline ? COLORS.textMuted : COLORS.textMuted + '50')} 
            />
            <Text style={[
              styles.tabText, 
              tab === 'active' && styles.tabTextActive,
              !isOnline && styles.tabTextDisabled
            ]}>
              Active ({isOnline ? activeQuests.length : 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, tab === 'completed' && styles.tabActive]}
            onPress={() => setTab('completed')}
          >
            <Ionicons 
              name="trophy" 
              size={18} 
              color={tab === 'completed' ? COLORS.green : COLORS.textMuted} 
            />
            <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActiveGreen]}>
              Completed ({completedQuests.length})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Show offline message if offline and on active tab */}
        {!isOnline && tab === 'active' && renderOfflineState()}

        {/* Active Quests */}
        {tab === 'active' && isOnline && (
          activeQuests.length > 0 
            ? activeQuests.map(quest => renderQuestCard(quest, false))
            : renderEmptyState('active')
        )}

        {/* Completed Quests */}
        {tab === 'completed' && (
          completedQuests.length > 0
            ? (
              <>
                <Text style={styles.sectionTitle}>Quest History</Text>
                {completedQuests.map(quest => renderQuestCard(quest, true))}
              </>
            )
            : renderEmptyState('completed')
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.cardBg,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.cyan,
  },
  tabTextActiveGreen: {
    color: COLORS.green,
  },
  tabTextDisabled: {
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  questCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  completedCard: {
    opacity: 0.9,
  },
  questCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  questSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber,
  },
  completedBadge: {
    backgroundColor: COLORS.green + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedTime: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.green,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  customerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: 16,
  },
  earningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.green,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.amber,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: COLORS.cyan + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  navigateBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.cyan,
  },
  offlineContainer: {
    padding: 24,
    alignItems: 'center',
  },
  offlineContent: {
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 32,
    width: '100%',
  },
  offlineIconContainer: {
    marginBottom: 16,
  },
  offlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
