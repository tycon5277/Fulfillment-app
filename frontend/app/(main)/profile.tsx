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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store';
import * as api from '../../src/api';
import type { EarningsSummary, Earning, ChatRoom } from '../../src/types';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  amber: '#F59E0B',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#22C55E',
  offline: '#9CA3AF',
  lavender: '#E8D9F4',
  blue: '#D0E9F7',
  yellow: '#FCE9C6',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<Earning[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'earnings' | 'chats'>('earnings');

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
              <Ionicons name="person" size={40} color={COLORS.white} />
            </View>
          )}
          <Text style={styles.userName}>{user?.name || 'Agent'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="star" size={14} color={COLORS.amber} />
              <Text style={styles.badgeText}>{user?.agent_rating?.toFixed(1) || '5.0'}</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="bicycle" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>{user?.agent_total_deliveries || 0} deliveries</Text>
            </View>
            <View style={styles.badge}>
              <Ionicons name="car" size={14} color={COLORS.secondary} />
              <Text style={styles.badgeText}>{user?.agent_vehicle || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsSummary}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.earningsGrid}>
            <View style={[styles.earningsCard, { backgroundColor: COLORS.lavender }]}>
              <Text style={styles.earningsLabel}>Today</Text>
              <Text style={styles.earningsValue}>₹{earnings?.today?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.earningsCard, { backgroundColor: COLORS.blue }]}>
              <Text style={styles.earningsLabel}>This Week</Text>
              <Text style={styles.earningsValue}>₹{earnings?.week?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.earningsCard, { backgroundColor: COLORS.yellow }]}>
              <Text style={styles.earningsLabel}>This Month</Text>
              <Text style={styles.earningsValue}>₹{earnings?.month?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={[styles.earningsCard, { backgroundColor: '#F0FDF4' }]}>
              <Text style={styles.earningsLabel}>Total</Text>
              <Text style={[styles.earningsValue, { color: COLORS.success }]}>
                ₹{earnings?.total?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'earnings' && styles.tabActive]}
            onPress={() => setActiveTab('earnings')}
          >
            <Text style={[styles.tabText, activeTab === 'earnings' && styles.tabTextActive]}>
              Earnings History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'chats' && styles.tabActive]}
            onPress={() => setActiveTab('chats')}
          >
            <Text style={[styles.tabText, activeTab === 'chats' && styles.tabTextActive]}>
              Chats ({chatRooms.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'earnings' ? (
          <View style={styles.historyList}>
            {earningsHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="wallet-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No earnings yet</Text>
              </View>
            ) : (
              earningsHistory.map((item) => (
                <View key={item.earning_id} style={styles.historyItem}>
                  <View style={styles.historyIconBg}>
                    <Ionicons
                      name={item.type === 'delivery' ? 'cube' : 'star'}
                      size={16}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTitle}>{item.description}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.historyAmount}>+₹{item.amount}</Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.chatList}>
            {chatRooms.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No chats yet</Text>
              </View>
            ) : (
              chatRooms.map((room) => (
                <TouchableOpacity
                  key={room.room_id}
                  style={styles.chatItem}
                  onPress={() => router.push(`/chat/${room.room_id}`)}
                >
                  <View style={styles.chatAvatar}>
                    <Ionicons name="person" size={20} color={COLORS.white} />
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{room.wisher?.name || 'Customer'}</Text>
                    <Text style={styles.chatPreview} numberOfLines={1}>
                      {room.wish_title || 'Wish request'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  earningsSummary: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
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
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  historyList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lavender,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  chatList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  chatPreview: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
});
