import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store';
import { getUserCategory, getChatsForUser } from '../../src/skillMockData';
import * as api from '../../src/api';

// Unified Warm Theme for Skilled Genie
const COLORS = {
  background: '#FDF8F3',
  backgroundSecondary: '#F5EDE4',
  cardBg: '#FFFFFF',
  cardBorder: '#E8DFD5',
  primary: '#D97706',
  primaryLight: '#F59E0B',
  primaryDark: '#B45309',
  secondary: '#0D9488',
  secondaryLight: '#14B8A6',
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#44403C',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  white: '#FFFFFF',
  purple: '#8B5CF6',
  blue: '#3B82F6',
};

interface ChatRoom {
  room_id: string;
  wish_id: string;
  wish_title?: string;
  wisher?: {
    name: string;
    phone?: string;
    rating?: number;
  };
  wish?: {
    title: string;
    remuneration?: number;
    status?: string;
  };
  status: string;
  created_at: string;
  updated_at?: string;
}

export default function SkilledChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeedingChats, setIsSeedingChats] = useState(false);

  // Get user's category and mock chats as fallback
  const userSkills = user?.agent_skills || [];
  const mockChats = getChatsForUser(userSkills);

  const fetchChatRooms = useCallback(async () => {
    try {
      const response = await api.getChatRooms();
      if (response.data && response.data.length > 0) {
        setChatRooms(response.data);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  const seedChatData = async () => {
    setIsSeedingChats(true);
    try {
      const response = await api.seedChatRooms();
      Alert.alert('Success', `Created ${response.data.rooms?.length || 0} chat rooms with messages!`);
      fetchChatRooms();
    } catch (error: any) {
      console.error('Error seeding chats:', error);
      Alert.alert('Error', 'Failed to create chat rooms. Please try again.');
    } finally {
      setIsSeedingChats(false);
    }
  };

  // Combine real chat rooms with mock data for display
  const displayChats = useMemo(() => {
    if (chatRooms.length > 0) {
      return chatRooms.map(room => ({
        id: room.room_id,
        customer: room.wisher?.name || 'Customer',
        avatar: (room.wisher?.name || 'C').charAt(0),
        service: room.wish_title || room.wish?.title || 'Service Request',
        lastMessage: 'Tap to view conversation',
        time: room.updated_at ? new Date(room.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Now',
        unread: 0,
        status: room.status === 'active' ? 'active' : 'completed',
        price: room.wish?.remuneration || 0,
      }));
    }
    return mockChats;
  }, [chatRooms, mockChats]);

  const filteredChats = displayChats.filter(chat => {
    const matchesSearch = chat.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || chat.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalUnread = displayChats.reduce((sum, chat) => sum + chat.unread, 0);
  const activeChats = displayChats.filter(c => c.status === 'active').length;
  const completedChats = displayChats.filter(c => c.status === 'completed').length;

  const getStatusColor = (status: string) => {
    return status === 'active' ? COLORS.success : COLORS.textMuted;
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? 'chatbubble-ellipses' : 'checkmark-done';
  };

  const navigateToChat = (chatId: string, chat: any) => {
    router.push({
      pathname: '/chat/[roomId]',
      params: { 
        roomId: chatId,
        wishTitle: chat.service,
        customerName: chat.customer
      }
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>💬</Text>
            <View>
              <Text style={styles.headerTitle}>Conversations</Text>
              <Text style={styles.headerSubtitle}>
                {activeChats} active • {completedChats} completed
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={seedChatData}
            disabled={isSeedingChats}
          >
            {isSeedingChats ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="add" size={24} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
            <Ionicons name="chatbubbles" size={18} color={COLORS.success} />
          </View>
          <Text style={[styles.statNumber, { color: COLORS.success }]}>{activeChats}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="checkmark-done" size={18} color={COLORS.primary} />
          </View>
          <Text style={[styles.statNumber, { color: COLORS.primary }]}>{completedChats}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.purple + '15' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.purple + '20' }]}>
            <Ionicons name="star" size={18} color={COLORS.purple} />
          </View>
          <Text style={[styles.statNumber, { color: COLORS.purple }]}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: 'All', icon: 'apps', count: displayChats.length },
            { key: 'active', label: 'Active', icon: 'chatbubble-ellipses', count: activeChats },
            { key: 'completed', label: 'Completed', icon: 'checkmark-done', count: completedChats },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterPill,
                filter === f.key && styles.filterPillActive
              ]}
              onPress={() => setFilter(f.key as any)}
            >
              <Ionicons 
                name={f.icon as any} 
                size={14} 
                color={filter === f.key ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive
              ]}>
                {f.label}
              </Text>
              <View style={[
                styles.filterCount,
                filter === f.key && styles.filterCountActive
              ]}>
                <Text style={[
                  styles.filterCountText,
                  filter === f.key && styles.filterCountTextActive
                ]}>
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat List */}
      <ScrollView
        style={styles.chatList}
        contentContainerStyle={styles.chatListContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
              Accept a work order to start chatting with customers
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/(main)/nearby-wishes')}
            >
              <Text style={styles.emptyButtonText}>Browse Work Orders</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredChats.map((chat, index) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatCard}
              onPress={() => navigateToChat(chat.id, chat)}
              activeOpacity={0.7}
            >
              {/* Avatar with Status */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={chat.status === 'active' 
                    ? [COLORS.success, COLORS.successLight]
                    : [COLORS.textMuted, COLORS.textSecondary]
                  }
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{chat.avatar}</Text>
                </LinearGradient>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(chat.status) }
                ]} />
              </View>

              {/* Chat Info */}
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.customerName} numberOfLines={1}>
                    {chat.customer}
                  </Text>
                  <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <Text style={styles.serviceTitle} numberOfLines={1}>
                  {chat.service}
                </Text>
                <View style={styles.chatFooter}>
                  <View style={styles.chatMeta}>
                    <Ionicons 
                      name={getStatusIcon(chat.status)} 
                      size={14} 
                      color={getStatusColor(chat.status)} 
                    />
                    <Text style={[styles.chatStatus, { color: getStatusColor(chat.status) }]}>
                      {chat.status === 'active' ? 'Active' : 'Completed'}
                    </Text>
                  </View>
                  {chat.price > 0 && (
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>₹{chat.price}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </View>

              {/* Unread Badge */}
              {chat.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{chat.unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
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
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: -8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  filterCount: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  filterCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterCountTextActive: {
    color: COLORS.white,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundSecondary,
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
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  serviceTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chatStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  unreadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.error,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },
});
