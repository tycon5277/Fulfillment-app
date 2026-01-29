import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { getUserCategory, getChatsForUser } from '../../src/skillMockData';

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

export default function SkilledChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Get user's category and chats
  const userSkills = user?.agent_skills || [];
  const categoryChats = getChatsForUser(userSkills);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filteredChats = categoryChats.filter(chat => {
    const matchesSearch = chat.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chat.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || chat.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalUnread = categoryChats.reduce((sum, chat) => sum + chat.unread, 0);

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
        <View style={{ width: 40 }} />
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
