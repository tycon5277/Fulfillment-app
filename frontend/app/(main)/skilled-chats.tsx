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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { getUserCategory, getChatsForUser } from '../../src/skillMockData';
import * as api from '../../src/api';

const COLORS = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  primary: '#2563EB',
  secondary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Chats</Text>
          {totalUnread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.seedButton} 
          onPress={seedChatData}
          disabled={isSeedingChats}
        >
          {isSeedingChats ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="add-circle" size={26} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers or services..."
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

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key as any)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chat List */}
      <ScrollView 
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {filteredChats.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Chats Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Start a conversation with a customer'}
            </Text>
          </View>
        ) : (
          filteredChats.map((chat) => (
            <TouchableOpacity 
              key={chat.id} 
              style={styles.chatCard}
              onPress={() => router.push(`/chat/${chat.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarContainer}>
                <View style={[styles.avatar, chat.unread > 0 && styles.avatarActive]}>
                  <Text style={styles.avatarText}>{chat.avatar}</Text>
                </View>
                {chat.status === 'active' && (
                  <View style={styles.onlineDot} />
                )}
              </View>
              
              <View style={styles.chatContent}>
                <View style={styles.chatTopRow}>
                  <Text style={styles.customerName}>{chat.customer}</Text>
                  <Text style={[styles.chatTime, chat.unread > 0 && styles.chatTimeUnread]}>
                    {chat.time}
                  </Text>
                </View>
                <Text style={styles.serviceName}>{chat.service}</Text>
                <View style={styles.chatBottomRow}>
                  <Text 
                    style={[styles.lastMessage, chat.unread > 0 && styles.lastMessageUnread]}
                    numberOfLines={1}
                  >
                    {chat.lastMessage}
                  </Text>
                  {chat.unread > 0 && (
                    <View style={styles.unreadCount}>
                      <Text style={styles.unreadCountText}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: COLORS.cardBg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary + '15',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterTabTextActive: {
    color: COLORS.primary,
  },
  chatList: {
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  chatCard: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActive: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  chatContent: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chatTimeUnread: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    marginRight: 10,
  },
  lastMessageUnread: {
    color: COLORS.text,
    fontWeight: '500',
  },
  unreadCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
});
