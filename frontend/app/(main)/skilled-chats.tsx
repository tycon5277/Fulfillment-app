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

// =============================================================================
// SKILL-BASED CHAT DATA
// =============================================================================

// Skill category mappings
const SKILL_CATEGORIES: { [key: string]: string } = {
  // Home Services (Cleaning)
  deep_cleaning: 'cleaning', regular_cleaning: 'cleaning', kitchen_cleaning: 'cleaning',
  bathroom_cleaning: 'cleaning', carpet_cleaning: 'cleaning', sofa_cleaning: 'cleaning',
  laundry: 'cleaning', dishwashing: 'cleaning', window_cleaning: 'cleaning',
  organizing: 'cleaning', mattress_cleaning: 'cleaning', chimney_cleaning: 'cleaning',
  
  // Repair & Maintenance
  plumbing: 'repair', electrical: 'repair', carpentry: 'repair', painting: 'repair',
  ac_repair: 'repair', refrigerator: 'repair', washing_machine: 'repair', tv_repair: 'repair',
  microwave: 'repair', geyser: 'repair', fan_repair: 'repair', inverter: 'repair',
  
  // Drone Services
  drone_photography: 'drone', drone_videography: 'drone', drone_wedding: 'drone',
  drone_survey: 'drone', drone_inspection: 'drone', drone_events: 'drone',
  drone_real_estate: 'drone', fpv_drone: 'drone', drone_agriculture: 'drone',
  
  // Photography & Videography
  wedding_photography: 'photo', portrait_photo: 'photo', event_photography: 'photo',
  product_photography: 'photo', wedding_video: 'video', corporate_video: 'video',
  
  // Beauty & Wellness
  massage: 'wellness', spa_home: 'wellness', haircut_men: 'beauty', haircut_women: 'beauty',
  facial: 'beauty', makeup: 'beauty', mehendi: 'beauty', yoga: 'wellness',
  
  // Pet Services
  pet_grooming: 'pet', dog_walking: 'pet', pet_sitting: 'pet', pet_training: 'pet',
  
  // Tech Services
  computer_repair: 'tech', phone_repair: 'tech', cctv: 'tech', smart_home: 'tech',
  
  // Education
  math_tutor: 'education', coding_tutor: 'education', music_lessons: 'education',
  
  // Driver Services
  personal_driver: 'driver', corporate_driver: 'driver', airport_transfer: 'driver',
};

// Category-based chats
const CHATS_BY_CATEGORY: { [key: string]: any[] } = {
  cleaning: [
    { id: 'c1', customer: 'Amit Kumar', service: 'Deep House Cleaning', lastMessage: 'Great! See you at 2 PM then.', time: '2 min ago', unread: 2, status: 'active', avatar: 'A' },
    { id: 'c2', customer: 'Priya Patel', service: 'Full House Cleaning', lastMessage: 'Can you bring the cleaning supplies?', time: '15 min ago', unread: 1, status: 'active', avatar: 'P' },
    { id: 'c3', customer: 'Sunita Verma', service: 'Kitchen Cleaning', lastMessage: 'Thank you for the great work!', time: '1 hr ago', unread: 0, status: 'completed', avatar: 'S' },
  ],
  drone: [
    { id: 'c1', customer: 'Kapoor Family', service: 'Wedding Aerial Shoot', lastMessage: 'Can you capture the Baraat entrance from above?', time: '5 min ago', unread: 3, status: 'active', avatar: 'K' },
    { id: 'c2', customer: 'DLF Builders', service: 'Real Estate Drone Video', lastMessage: 'Please include all 4 towers in the flyby.', time: '30 min ago', unread: 1, status: 'active', avatar: 'D' },
    { id: 'c3', customer: 'TechCorp Events', service: 'Event Aerial Coverage', lastMessage: 'The 4K footage was amazing, thank you!', time: '2 hrs ago', unread: 0, status: 'completed', avatar: 'T' },
    { id: 'c4', customer: 'Agriculture Dept', service: 'Land Survey Mapping', lastMessage: 'Need the orthomosaic maps by Friday.', time: 'Yesterday', unread: 0, status: 'active', avatar: 'A' },
  ],
  photo: [
    { id: 'c1', customer: 'Sharma Wedding', service: 'Wedding Photography', lastMessage: 'Can we do a couple shoot at sunset?', time: '10 min ago', unread: 2, status: 'active', avatar: 'S' },
    { id: 'c2', customer: 'FashionBrand', service: 'Product Photoshoot', lastMessage: 'We need the edited photos by Monday.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'F' },
    { id: 'c3', customer: 'Verma Family', service: 'Birthday Photography', lastMessage: 'The candid shots were beautiful!', time: '3 hrs ago', unread: 0, status: 'completed', avatar: 'V' },
  ],
  repair: [
    { id: 'c1', customer: 'Vikram Singh', service: 'AC Repair', lastMessage: 'The AC is cooling much better now, thanks!', time: '20 min ago', unread: 0, status: 'completed', avatar: 'V' },
    { id: 'c2', customer: 'Amit Kumar', service: 'Plumbing Work', lastMessage: 'Can you bring extra PVC pipes?', time: '45 min ago', unread: 2, status: 'active', avatar: 'A' },
    { id: 'c3', customer: 'Sanjay Gupta', service: 'Electrical Wiring', lastMessage: 'What time should I expect you tomorrow?', time: '1 hr ago', unread: 1, status: 'active', avatar: 'S' },
  ],
  beauty: [
    { id: 'c1', customer: 'Priya (Bride)', service: 'Bridal Makeup', lastMessage: 'Can we do a trial run this weekend?', time: '15 min ago', unread: 2, status: 'active', avatar: 'P' },
    { id: 'c2', customer: 'Meera Kapoor', service: 'Hair & Facial', lastMessage: 'Please bring the organic products.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'M' },
    { id: 'c3', customer: 'Gupta Family', service: 'Mehendi Design', lastMessage: 'The bridal design was stunning!', time: '3 hrs ago', unread: 0, status: 'completed', avatar: 'G' },
  ],
  wellness: [
    { id: 'c1', customer: 'Anjali Verma', service: 'Deep Tissue Massage', lastMessage: 'Can we schedule for next week too?', time: '30 min ago', unread: 1, status: 'active', avatar: 'A' },
    { id: 'c2', customer: 'Group Class', service: 'Yoga Session', lastMessage: '5 participants confirmed for tomorrow.', time: '2 hrs ago', unread: 0, status: 'active', avatar: 'G' },
  ],
  pet: [
    { id: 'c1', customer: 'Bruno Owner', service: 'Dog Grooming', lastMessage: 'Can you do a summer cut this time?', time: '10 min ago', unread: 2, status: 'active', avatar: 'B' },
    { id: 'c2', customer: 'Milo Owner', service: 'Pet Sitting', lastMessage: 'He likes to nap in the sunlight.', time: '1 hr ago', unread: 1, status: 'active', avatar: 'M' },
  ],
  tech: [
    { id: 'c1', customer: 'Amit Choudhary', service: 'Laptop Repair', lastMessage: 'The SSD upgrade worked perfectly!', time: '25 min ago', unread: 0, status: 'completed', avatar: 'A' },
    { id: 'c2', customer: 'Home Security', service: 'CCTV Installation', lastMessage: 'How many cameras for a 3BHK?', time: '1 hr ago', unread: 2, status: 'active', avatar: 'H' },
  ],
  education: [
    { id: 'c1', customer: 'Parent - Khanna', service: 'Math Tutoring', lastMessage: 'His grades have improved a lot!', time: '1 hr ago', unread: 0, status: 'active', avatar: 'K' },
    { id: 'c2', customer: 'Young Coder', service: 'Coding Class', lastMessage: 'Can we learn Python next?', time: '2 hrs ago', unread: 1, status: 'active', avatar: 'Y' },
  ],
  driver: [
    { id: 'c1', customer: 'Kavita Joshi', service: 'Airport Transfer', lastMessage: 'Flight is at 6 AM, please arrive by 4:30.', time: '10 min ago', unread: 1, status: 'active', avatar: 'K' },
    { id: 'c2', customer: 'Mr. Malhotra', service: 'Corporate Chauffeur', lastMessage: 'Need pickup from office at 6 PM.', time: '30 min ago', unread: 0, status: 'active', avatar: 'M' },
  ],
};

// Function to get user's primary category
const getUserCategory = (skills: string[]): string => {
  if (!skills || skills.length === 0) return 'cleaning';
  
  const categoryCounts: { [key: string]: number } = {};
  skills.forEach(skill => {
    const category = SKILL_CATEGORIES[skill];
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });
  
  let maxCategory = 'cleaning';
  let maxCount = 0;
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxCategory = cat;
    }
  });
  
  return maxCategory;
};

export default function SkilledChatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Get user's category and chats
  const userSkills = user?.agent_skills || [];
  const userCategory = getUserCategory(userSkills);
  const categoryChats = CHATS_BY_CATEGORY[userCategory] || CHATS_BY_CATEGORY['cleaning'];

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
              onPress={() => router.push(`/(main)/chat/${chat.id}`)}
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
