import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';
import THEME from '../../src/theme';
import type { EarningsSummary, Earning, ChatRoom } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<Earning[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'earnings' | 'chats'>('earnings');
  
  // Animations
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  const isMobileGenie = user?.partner_type === 'agent' && user?.agent_type === 'mobile';

  // Pulse animation for online indicator
  useEffect(() => {
    if (isMobileGenie) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isMobileGenie]);

  const fetchData = async () => {
    try {
      const [earningsRes, historyRes, chatsRes, meRes] = await Promise.all([
        api.getEarningsSummary(),
        api.getEarningsHistory(20),
        api.getChatRooms(),
        api.getMe(),
      ]);
      setEarnings(earningsRes.data);
      setEarningsHistory(historyRes.data);
      setChatRooms(chatsRes.data);
      setUser(meRes.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // Get vehicle display
  const getVehicleDisplay = () => {
    const make = user?.agent_vehicle_make || '';
    const model = user?.agent_vehicle_model || '';
    if (make && model) return `${make} ${model}`;
    if (make) return make;
    if (model) return model;
    return (user?.agent_vehicle || 'Vehicle').charAt(0).toUpperCase() + (user?.agent_vehicle || '').slice(1);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isMobileGenie && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isMobileGenie ? THEME.primary : '#7C3AED'} />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate level and XP
  const totalTasks = user?.agent_total_deliveries || 0;
  const currentLevel = Math.floor(totalTasks / 10) + 1;
  const xpInLevel = (totalTasks % 10) * 100;
  const xpNeeded = 1000;

  // Mobile Genie Dark Theme Profile
  if (isMobileGenie) {
    return (
      <SafeAreaView style={styles.containerDark}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={THEME.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerDark}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={24} color={THEME.text} />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCardDark}>
            <View style={styles.avatarContainer}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatarDark} />
              ) : (
                <View style={styles.avatarPlaceholderDark}>
                  <Text style={styles.avatarTextDark}>{user?.name?.charAt(0) || 'G'}</Text>
                </View>
              )}
              <Animated.View style={[styles.onlineIndicator, { transform: [{ scale: pulseAnim }] }]} />
            </View>
            
            <Text style={styles.userNameDark}>{user?.name || 'Genie'}</Text>
            <Text style={styles.userPhoneDark}>{user?.phone || 'Mobile Genie'}</Text>
            
            {/* Level Badge */}
            <View style={styles.levelBadgeLarge}>
              <Ionicons name="flash" size={16} color={THEME.accent2} />
              <Text style={styles.levelBadgeLargeText}>Level {currentLevel}</Text>
            </View>

            {/* XP Progress */}
            <View style={styles.xpSection}>
              <View style={styles.xpHeaderRow}>
                <Text style={styles.xpLabel}>Experience</Text>
                <Text style={styles.xpValue}>{xpInLevel} / {xpNeeded} XP</Text>
              </View>
              <View style={styles.xpBarTrackDark}>
                <View style={[styles.xpBarFillDark, { width: `${(xpInLevel / xpNeeded) * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRowDark}>
            <View style={styles.statItemDark}>
              <Text style={styles.statEmojiDark}>⭐</Text>
              <Text style={styles.statValueDark}>{user?.agent_rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabelDark}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItemDark}>
              <Text style={styles.statEmojiDark}>🚀</Text>
              <Text style={styles.statValueDark}>{totalTasks}</Text>
              <Text style={styles.statLabelDark}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItemDark}>
              <Text style={styles.statEmojiDark}>🔥</Text>
              <Text style={styles.statValueDark}>3</Text>
              <Text style={styles.statLabelDark}>Streak</Text>
            </View>
          </View>

          {/* Vehicle Card */}
          <View style={styles.vehicleCardDark}>
            <View style={styles.vehicleHeaderDark}>
              <View style={styles.vehicleIconBgDark}>
                <Text style={styles.vehicleEmojiDark}>
                  {user?.agent_vehicle === 'car' ? '🚗' : user?.agent_vehicle === 'motorbike' ? '🏍️' : '🛵'}
                </Text>
              </View>
              <View style={styles.vehicleInfoDark}>
                <Text style={styles.vehicleNameDark}>{getVehicleDisplay()}</Text>
                <Text style={styles.vehicleRegDark}>{user?.agent_vehicle_registration || 'N/A'}</Text>
              </View>
              {user?.agent_is_electric && (
                <View style={styles.evBadgeDark}>
                  <Text style={styles.evEmojiDark}>⚡</Text>
                  <Text style={styles.evTextDark}>EV</Text>
                </View>
              )}
            </View>
          </View>

          {/* Earnings Summary */}
          <Text style={styles.sectionTitleDark}>💰 Earnings</Text>
          <View style={styles.earningsGridDark}>
            <View style={[styles.earningsCardDark, { borderColor: THEME.primary + '40' }]}>
              <Text style={styles.earningsLabelDark}>Today</Text>
              <Text style={[styles.earningsValueDark, { color: THEME.primary }]}>₹{earnings?.today?.toFixed(0) || '0'}</Text>
            </View>
            <View style={[styles.earningsCardDark, { borderColor: THEME.accent3 + '40' }]}>
              <Text style={styles.earningsLabelDark}>This Week</Text>
              <Text style={[styles.earningsValueDark, { color: THEME.accent3 }]}>₹{earnings?.week?.toFixed(0) || '0'}</Text>
            </View>
            <View style={[styles.earningsCardDark, { borderColor: THEME.accent2 + '40' }]}>
              <Text style={styles.earningsLabelDark}>This Month</Text>
              <Text style={[styles.earningsValueDark, { color: THEME.accent2 }]}>₹{earnings?.month?.toFixed(0) || '0'}</Text>
            </View>
            <View style={[styles.earningsCardDark, { borderColor: THEME.success + '40' }]}>
              <Text style={styles.earningsLabelDark}>Total</Text>
              <Text style={[styles.earningsValueDark, { color: THEME.success }]}>₹{earnings?.total?.toFixed(0) || '0'}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainerDark}>
            <TouchableOpacity
              style={[styles.tabDark, activeTab === 'earnings' && styles.tabActiveDark]}
              onPress={() => setActiveTab('earnings')}
            >
              <Ionicons 
                name="wallet-outline" 
                size={18} 
                color={activeTab === 'earnings' ? THEME.primary : THEME.textMuted} 
              />
              <Text style={[styles.tabTextDark, activeTab === 'earnings' && styles.tabTextActiveDark]}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabDark, activeTab === 'chats' && styles.tabActiveDark]}
              onPress={() => setActiveTab('chats')}
            >
              <Ionicons 
                name="chatbubbles-outline" 
                size={18} 
                color={activeTab === 'chats' ? THEME.primary : THEME.textMuted} 
              />
              <Text style={[styles.tabTextDark, activeTab === 'chats' && styles.tabTextActiveDark]}>
                Chats ({chatRooms.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'earnings' ? (
            <View style={styles.historyListDark}>
              {earningsHistory.length === 0 ? (
                <View style={styles.emptyHistoryDark}>
                  <Text style={styles.emptyEmojiDark}>💸</Text>
                  <Text style={styles.emptyTextDark}>No earnings yet</Text>
                  <Text style={styles.emptySubtextDark}>Complete deliveries to earn!</Text>
                </View>
              ) : (
                earningsHistory.map((item) => (
                  <View key={item.earning_id} style={styles.historyItemDark}>
                    <View style={styles.historyIconBgDark}>
                      <Ionicons
                        name={item.type === 'delivery' ? 'cube' : 'star'}
                        size={16}
                        color={THEME.primary}
                      />
                    </View>
                    <View style={styles.historyInfoDark}>
                      <Text style={styles.historyTitleDark}>{item.description}</Text>
                      <Text style={styles.historyDateDark}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.historyAmountDark}>+₹{item.amount}</Text>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View style={styles.chatListDark}>
              {chatRooms.length === 0 ? (
                <View style={styles.emptyHistoryDark}>
                  <Text style={styles.emptyEmojiDark}>💬</Text>
                  <Text style={styles.emptyTextDark}>No chats yet</Text>
                  <Text style={styles.emptySubtextDark}>Accept a wish to start chatting!</Text>
                </View>
              ) : (
                chatRooms.map((room) => (
                  <TouchableOpacity
                    key={room.room_id}
                    style={styles.chatItemDark}
                    onPress={() => router.push(`/chat/${room.room_id}`)}
                  >
                    <View style={styles.chatAvatarDark}>
                      <Ionicons name="person" size={20} color={THEME.background} />
                    </View>
                    <View style={styles.chatInfoDark}>
                      <Text style={styles.chatNameDark}>{room.wisher?.name || 'Customer'}</Text>
                      <Text style={styles.chatPreviewDark} numberOfLines={1}>
                        {room.wish_title || 'Wish request'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={THEME.textMuted} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButtonDark} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={THEME.error} />
            <Text style={styles.logoutTextDark}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Default Light Theme Profile (for non-Mobile Genies)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#FFFFFF" />
            </View>
          )}
          <Text style={styles.userName}>{user?.name || 'Agent'}</Text>
          <Text style={styles.userEmail}>{user?.email || user?.phone}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.badgeText}>{user?.agent_rating?.toFixed(1) || '5.0'}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="bicycle" size={14} color="#7C3AED" />
              <Text style={styles.badgeText}>{user?.agent_total_deliveries || 0} deliveries</Text>
            </View>
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsSummary}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.earningsGrid}>
            <View style={[styles.earningsCard, { backgroundColor: '#E8D9F4' }]}>
              <Text style={styles.earningsLabel}>Today</Text>
              <Text style={styles.earningsValue}>₹{earnings?.today?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.earningsCard, { backgroundColor: '#D0E9F7' }]}>
              <Text style={styles.earningsLabel}>This Week</Text>
              <Text style={styles.earningsValue}>₹{earnings?.week?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.earningsCard, { backgroundColor: '#FCE9C6' }]}>
              <Text style={styles.earningsLabel}>This Month</Text>
              <Text style={styles.earningsValue}>₹{earnings?.month?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.earningsCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.earningsLabel}>Total</Text>
              <Text style={[styles.earningsValue, { color: '#22C55E' }]}>
                ₹{earnings?.total?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Light theme styles
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#212529',
    fontWeight: '500',
  },
  earningsSummary: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  earningsCard: {
    width: '48.5%',
    padding: 16,
    borderRadius: 12,
  },
  earningsLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Dark theme styles (Mobile Genie)
  containerDark: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  headerDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardDark: {
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarDark: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: THEME.primary,
  },
  avatarPlaceholderDark: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextDark: {
    fontSize: 40,
    fontWeight: '700',
    color: THEME.background,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.success,
    borderWidth: 3,
    borderColor: THEME.cardBg,
  },
  userNameDark: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 4,
  },
  userPhoneDark: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 16,
  },
  levelBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent2 + '25',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  levelBadgeLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.accent2,
  },
  xpSection: {
    width: '100%',
  },
  xpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  xpValue: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.primary,
  },
  xpBarTrackDark: {
    height: 8,
    backgroundColor: THEME.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFillDark: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 4,
  },
  statsRowDark: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  statItemDark: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: THEME.cardBorder,
  },
  statEmojiDark: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValueDark: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
  },
  statLabelDark: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  vehicleCardDark: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  vehicleHeaderDark: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBgDark: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmojiDark: {
    fontSize: 24,
  },
  vehicleInfoDark: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleNameDark: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  vehicleRegDark: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  evBadgeDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  evEmojiDark: {
    fontSize: 12,
  },
  evTextDark: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.success,
  },
  sectionTitleDark: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
  },
  earningsGridDark: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  earningsCardDark: {
    width: '48%',
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  earningsLabelDark: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 4,
  },
  earningsValueDark: {
    fontSize: 22,
    fontWeight: '800',
  },
  tabContainerDark: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabDark: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  tabActiveDark: {
    backgroundColor: THEME.primary + '20',
    borderColor: THEME.primary + '50',
  },
  tabTextDark: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  tabTextActiveDark: {
    color: THEME.primary,
  },
  historyListDark: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  emptyHistoryDark: {
    alignItems: 'center',
    padding: 32,
  },
  emptyEmojiDark: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTextDark: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  emptySubtextDark: {
    fontSize: 14,
    color: THEME.textMuted,
    marginTop: 4,
  },
  historyItemDark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  historyIconBgDark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfoDark: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitleDark: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  historyDateDark: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  historyAmountDark: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.success,
  },
  chatListDark: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  chatItemDark: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  chatAvatarDark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfoDark: {
    flex: 1,
    marginLeft: 12,
  },
  chatNameDark: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  chatPreviewDark: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  logoutButtonDark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.error + '15',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.error + '30',
  },
  logoutTextDark: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.error,
  },
});
