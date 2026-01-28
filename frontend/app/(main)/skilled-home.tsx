import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Professional Light Theme Colors
const COLORS = {
  background: '#F8FAFC',
  backgroundSecondary: '#FFFFFF',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  secondary: '#0EA5E9',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  purple: '#7C3AED',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

// =============================================================================
// SKILL-BASED MOCK DATA - Shows relevant data based on user's skills
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
  furniture_assembly: 'repair', door_lock: 'repair', waterproofing: 'repair',
  
  // Driver Services
  personal_driver: 'driver', outstation_driver: 'driver', corporate_driver: 'driver',
  airport_transfer: 'driver', night_driver: 'driver', wedding_driver: 'driver',
  vip_driver: 'driver', female_driver: 'driver', elderly_driver: 'driver', medical_transport: 'driver',
  
  // Photography & Videography
  wedding_photography: 'photo', portrait_photo: 'photo', event_photography: 'photo',
  product_photography: 'photo', fashion_photography: 'photo', food_photography: 'photo',
  real_estate_photo: 'photo', wedding_video: 'video', corporate_video: 'video',
  music_video: 'video', documentary: 'video', live_streaming: 'video',
  video_editing: 'video', photo_editing: 'photo',
  
  // Drone Services
  drone_photography: 'drone', drone_videography: 'drone', drone_wedding: 'drone',
  drone_survey: 'drone', drone_inspection: 'drone', drone_events: 'drone',
  drone_real_estate: 'drone', fpv_drone: 'drone', drone_agriculture: 'drone', drone_delivery: 'drone',
  
  // Wellness & Beauty
  massage: 'wellness', spa_home: 'wellness', haircut_men: 'beauty', haircut_women: 'beauty',
  facial: 'beauty', makeup: 'beauty', mehendi: 'beauty', manicure: 'beauty',
  waxing: 'beauty', yoga: 'wellness', personal_trainer: 'wellness', physiotherapy: 'wellness', dietician: 'wellness',
  
  // Pet Services
  pet_grooming: 'pet', dog_walking: 'pet', pet_sitting: 'pet', pet_boarding: 'pet',
  pet_training: 'pet', vet_visit: 'pet', aquarium: 'pet', bird_care: 'pet',
  
  // Tech Services
  computer_repair: 'tech', phone_repair: 'tech', tablet_repair: 'tech', data_recovery: 'tech',
  virus_removal: 'tech', software_install: 'tech', networking: 'tech', smart_home: 'tech',
  cctv: 'tech', printer: 'tech', gaming_setup: 'tech', website: 'tech',
  
  // Education
  math_tutor: 'education', science_tutor: 'education', english_tutor: 'education',
  hindi_tutor: 'education', coding_tutor: 'education', music_lessons: 'education',
  art_lessons: 'education', dance_lessons: 'education', foreign_lang: 'education',
  exam_prep: 'education', nursery_teach: 'education', special_needs: 'education',
  
  // Events
  dj: 'events', event_decor: 'events', balloon_decor: 'events', flower_decor: 'events',
  catering: 'events', anchor: 'events', magic_show: 'events', clown: 'events',
  live_music: 'events', standup: 'events', game_host: 'events', puppet_show: 'events',
};

// Mock appointments by category
const MOCK_APPOINTMENTS_BY_CATEGORY: { [key: string]: any[] } = {
  cleaning: [
    { id: 'a1', service: 'Deep House Cleaning', customer: 'Priya Patel', time: '10:00 AM', duration: '3 hours', location: 'DLF Phase 3', status: 'completed', earnings: 2500 },
    { id: 'a2', service: 'Kitchen Cleaning', customer: 'Rahul Sharma', time: '2:00 PM', duration: '2 hours', location: 'Sector 21', status: 'in_progress', earnings: 1200 },
    { id: 'a3', service: 'Sofa & Carpet Clean', customer: 'Neha Gupta', time: '5:30 PM', duration: '1.5 hours', location: 'Golf Course Road', status: 'upcoming', earnings: 800 },
  ],
  repair: [
    { id: 'a1', service: 'AC Service & Repair', customer: 'Vikram Singh', time: '9:00 AM', duration: '2 hours', location: 'Sector 45', status: 'completed', earnings: 1800 },
    { id: 'a2', service: 'Plumbing Work', customer: 'Amit Kumar', time: '1:00 PM', duration: '1.5 hours', location: 'MG Road', status: 'in_progress', earnings: 900 },
    { id: 'a3', service: 'Electrical Wiring', customer: 'Sanjay Gupta', time: '4:00 PM', duration: '3 hours', location: 'DLF Cyber Hub', status: 'upcoming', earnings: 2200 },
  ],
  drone: [
    { id: 'a1', service: 'Wedding Aerial Shoot', customer: 'Kapoor Family', time: '8:00 AM', duration: '6 hours', location: 'Farmhouse, Chattarpur', status: 'completed', earnings: 25000 },
    { id: 'a2', service: 'Real Estate Drone Video', customer: 'DLF Builders', time: '2:00 PM', duration: '3 hours', location: 'New Gurgaon', status: 'in_progress', earnings: 15000 },
    { id: 'a3', service: 'Event Aerial Coverage', customer: 'TechCorp', time: '5:00 PM', duration: '2 hours', location: 'Cyber Hub', status: 'upcoming', earnings: 12000 },
  ],
  photo: [
    { id: 'a1', service: 'Wedding Photography', customer: 'Sharma Family', time: '7:00 AM', duration: '10 hours', location: 'ITC Grand', status: 'completed', earnings: 35000 },
    { id: 'a2', service: 'Product Photoshoot', customer: 'FashionBrand Inc', time: '11:00 AM', duration: '4 hours', location: 'Studio 14', status: 'in_progress', earnings: 12000 },
    { id: 'a3', service: 'Birthday Party Photos', customer: 'Verma Family', time: '4:00 PM', duration: '3 hours', location: 'Sector 50', status: 'upcoming', earnings: 8000 },
  ],
  video: [
    { id: 'a1', service: 'Corporate Video', customer: 'TechCorp Solutions', time: '9:00 AM', duration: '5 hours', location: 'Cyber City', status: 'completed', earnings: 25000 },
    { id: 'a2', service: 'Wedding Film', customer: 'Mehta Wedding', time: '6:00 PM', duration: '8 hours', location: 'Delhi Farmhouse', status: 'upcoming', earnings: 40000 },
  ],
  driver: [
    { id: 'a1', service: 'Airport Transfer', customer: 'Kavita Joshi', time: '4:00 AM', duration: '1.5 hours', location: 'Sector 44 → IGI T3', status: 'completed', earnings: 1200 },
    { id: 'a2', service: 'Corporate Chauffeur', customer: 'Mr. Malhotra', time: '9:00 AM', duration: '8 hours', location: 'Multiple Locations', status: 'in_progress', earnings: 2500 },
    { id: 'a3', service: 'Wedding Car Service', customer: 'Kapoor Family', time: '5:00 PM', duration: '6 hours', location: 'Chattarpur', status: 'upcoming', earnings: 4000 },
  ],
  wellness: [
    { id: 'a1', service: 'Deep Tissue Massage', customer: 'Anjali Verma', time: '10:00 AM', duration: '1.5 hours', location: 'Sector 29', status: 'completed', earnings: 2500 },
    { id: 'a2', service: 'Yoga Session', customer: 'Sunita Group', time: '6:00 AM', duration: '1 hour', location: 'DLF Park', status: 'in_progress', earnings: 1500 },
    { id: 'a3', service: 'Personal Training', customer: 'Ravi Kumar', time: '7:00 PM', duration: '1 hour', location: 'Home Gym', status: 'upcoming', earnings: 1200 },
  ],
  beauty: [
    { id: 'a1', service: 'Bridal Makeup', customer: 'Priya Bride', time: '5:00 AM', duration: '4 hours', location: 'South City', status: 'completed', earnings: 25000 },
    { id: 'a2', service: 'Hair & Facial', customer: 'Meera Kapoor', time: '2:00 PM', duration: '2 hours', location: 'Sector 42', status: 'in_progress', earnings: 3000 },
    { id: 'a3', service: 'Mehendi Design', customer: 'Gupta Family', time: '6:00 PM', duration: '5 hours', location: 'Wedding Venue', status: 'upcoming', earnings: 12000 },
  ],
  pet: [
    { id: 'a1', service: 'Dog Grooming', customer: 'Rohit Saxena', time: '10:00 AM', duration: '2 hours', location: 'Sector 50', status: 'completed', earnings: 1800 },
    { id: 'a2', service: 'Pet Sitting', customer: 'Sneha Malik', time: '2:00 PM', duration: '3 days', location: 'Sector 47', status: 'in_progress', earnings: 3000 },
    { id: 'a3', service: 'Dog Walking', customer: 'Ankit Sharma', time: '6:00 AM', duration: '1 hour', location: 'Sector 31', status: 'upcoming', earnings: 500 },
  ],
  tech: [
    { id: 'a1', service: 'Laptop Repair', customer: 'Amit Choudhary', time: '10:00 AM', duration: '2 hours', location: 'Sector 14', status: 'completed', earnings: 2500 },
    { id: 'a2', service: 'CCTV Installation', customer: 'Home Security', time: '2:00 PM', duration: '4 hours', location: 'Sector 57', status: 'in_progress', earnings: 12000 },
    { id: 'a3', service: 'Smart Home Setup', customer: 'Tech Enthusiast', time: '5:00 PM', duration: '3 hours', location: 'DLF Phase 5', status: 'upcoming', earnings: 8000 },
  ],
  education: [
    { id: 'a1', service: 'Math Tutoring', customer: 'Parent - Khanna', time: '4:00 PM', duration: '2 hours', location: 'Sector 15', status: 'completed', earnings: 1200 },
    { id: 'a2', service: 'Coding Class', customer: 'Young Coder', time: '5:00 PM', duration: '1.5 hours', location: 'Sector 40', status: 'in_progress', earnings: 2500 },
    { id: 'a3', service: 'Music Lesson', customer: 'Guitar Student', time: '7:00 PM', duration: '1 hour', location: 'DLF Phase 1', status: 'upcoming', earnings: 1000 },
  ],
  events: [
    { id: 'a1', service: 'DJ at Birthday Party', customer: 'Birthday Host', time: '7:00 PM', duration: '4 hours', location: 'Sector 31 Farmhouse', status: 'completed', earnings: 12000 },
    { id: 'a2', service: 'Event Decoration', customer: 'Baby Shower', time: '10:00 AM', duration: '5 hours', location: 'Golf Course Ext', status: 'in_progress', earnings: 8000 },
    { id: 'a3', service: 'Magic Show', customer: "Kid's Birthday", time: '4:00 PM', duration: '1.5 hours', location: 'Sector 22', status: 'upcoming', earnings: 5000 },
  ],
};

// Default stats (will be customized by category)
const DEFAULT_STATS = {
  todayEarnings: 2400,
  weekEarnings: 12800,
  completedJobs: 8,
  pendingJobs: 3,
  rating: 4.9,
  totalReviews: 156,
  todayAppointments: 3,
  upcomingAppointments: 5,
};

// Function to get user's primary category from skills
const getUserCategory = (skills: string[]): string => {
  if (!skills || skills.length === 0) return 'cleaning'; // default
  
  // Count categories
  const categoryCounts: { [key: string]: number } = {};
  skills.forEach(skill => {
    const category = SKILL_CATEGORIES[skill];
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });
  
  // Return category with most skills
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

// Function to get appointments for user's category
const getAppointmentsForUser = (skills: string[]): any[] => {
  const category = getUserCategory(skills);
  return MOCK_APPOINTMENTS_BY_CATEGORY[category] || MOCK_APPOINTMENTS_BY_CATEGORY['cleaning'];
};

export default function SkilledHomeScreen() {
  const router = useRouter();
  const { user, isOnline, setIsOnline } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'wishes'>('overview');
  
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const toggleAvailability = () => {
    setIsOnline(!isOnline);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: COLORS.success + '15', text: COLORS.success, label: '✓ Done' };
      case 'in_progress':
        return { bg: COLORS.warning + '15', text: COLORS.warning, label: '● Live' };
      case 'upcoming':
        return { bg: COLORS.primary + '15', text: COLORS.primary, label: '◷ Next' };
      default:
        return { bg: COLORS.textMuted + '15', text: COLORS.textMuted, label: status };
    }
  };

  const renderOverviewTab = () => (
    <>
      {/* Quick Actions - Moved to TOP */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(main)/appointments')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="wallet-outline" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="star-outline" size={22} color={COLORS.warning} />
            </View>
            <Text style={styles.quickActionText}>Reviews</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}>
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.purple + '15' }]}>
              <Ionicons name="person-outline" size={22} color={COLORS.purple} />
            </View>
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValueWhite}>₹{MOCK_STATS.todayEarnings.toLocaleString()}</Text>
          <Text style={styles.statLabelWhite}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{MOCK_STATS.todayAppointments}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>{MOCK_STATS.rating}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStatsBar}>
        <View style={styles.quickStatItem}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.quickStatValue}>{MOCK_STATS.completedJobs}</Text>
          <Text style={styles.quickStatLabel}>Done</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Ionicons name="time" size={18} color={COLORS.warning} />
          <Text style={styles.quickStatValue}>{MOCK_STATS.pendingJobs}</Text>
          <Text style={styles.quickStatLabel}>Pending</Text>
        </View>
        <View style={styles.quickStatDivider} />
        <View style={styles.quickStatItem}>
          <Ionicons name="trending-up" size={18} color={COLORS.primary} />
          <Text style={styles.quickStatValue}>₹{(MOCK_STATS.weekEarnings/1000).toFixed(1)}K</Text>
          <Text style={styles.quickStatLabel}>This Week</Text>
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/appointments')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {MOCK_TODAY_APPOINTMENTS.map((apt) => {
          const statusStyle = getStatusStyle(apt.status);
          return (
            <TouchableOpacity 
              key={apt.id} 
              style={styles.appointmentCard}
              onPress={() => router.push(`/(main)/appointment-detail?id=${apt.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.aptTimeCol}>
                <Text style={styles.aptTime}>{apt.time}</Text>
                <Text style={styles.aptDuration}>{apt.duration}</Text>
              </View>
              <View style={styles.aptDivider} />
              <View style={styles.aptContent}>
                <View style={styles.aptTopRow}>
                  <Text style={styles.aptService}>{apt.service}</Text>
                  <View style={[styles.aptStatusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.aptStatusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
                  </View>
                </View>
                <Text style={styles.aptCustomer}>{apt.customer}</Text>
                <View style={styles.aptLocationRow}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.aptLocation} numberOfLines={1}>{apt.location}</Text>
                </View>
              </View>
              <View style={styles.aptEarnings}>
                <Text style={styles.aptEarningsText}>₹{apt.earnings}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Nearby Wishes Preview */}
      {isOnline && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Nearby Wishes</Text>
              <View style={styles.wishCountBadge}>
                <Text style={styles.wishCountText}>{MOCK_NEARBY_WISHES.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(main)/nearby-wishes')}>
              <Text style={styles.seeAllText}>View Map</Text>
            </TouchableOpacity>
          </View>

          {MOCK_NEARBY_WISHES.slice(0, 2).map((wish) => (
            <TouchableOpacity 
              key={wish.id} 
              style={styles.wishCard}
              onPress={() => router.push(`/(main)/wish-detail?id=${wish.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.wishContent}>
                <View style={styles.wishTopRow}>
                  <Text style={styles.wishService}>{wish.service}</Text>
                  {wish.urgent && (
                    <View style={styles.urgentBadge}>
                      <Ionicons name="flash" size={10} color="#FFF" />
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.wishCustomer}>{wish.customer} • ⭐ {wish.customerRating}</Text>
                <View style={styles.wishMeta}>
                  <View style={styles.wishMetaItem}>
                    <Ionicons name="navigate-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.wishMetaText}>{wish.distance}</Text>
                  </View>
                  <View style={styles.wishMetaItem}>
                    <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.wishMetaText}>{wish.postedTime}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.wishRight}>
                <Text style={styles.wishBudget}>{wish.budget}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Offline Message */}
      {!isOnline && (
        <View style={styles.offlineCard}>
          <Ionicons name="wifi-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.offlineTitle}>You're Offline</Text>
          <Text style={styles.offlineText}>Go online to see new wishes from customers in your area.</Text>
          <TouchableOpacity style={styles.goOnlineBtn} onPress={toggleAvailability}>
            <Text style={styles.goOnlineBtnText}>Go Online</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Professional'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => router.push('/(main)/skilled-chats')}
          >
            <Ionicons name="chatbubble-outline" size={22} color={COLORS.text} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Online Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusLeft}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.textMuted }]} />
          <View>
            <Text style={styles.statusTitle}>{isOnline ? 'Available' : 'Offline'}</Text>
            <Text style={styles.statusSubtitle}>
              {isOnline ? 'Accepting new wishes' : 'Not visible to customers'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={toggleAvailability}
          trackColor={{ false: '#E2E8F0', true: COLORS.success + '40' }}
          thumbColor={isOnline ? COLORS.success : '#F1F5F9'}
          ios_backgroundColor="#E2E8F0"
        />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {renderOverviewTab()}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  statValueWhite: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statLabelWhite: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  quickStatsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  quickStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  wishCountBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  wishCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  appointmentCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aptTimeCol: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aptTime: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  aptDuration: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  aptDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  aptContent: {
    flex: 1,
  },
  aptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aptService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  aptStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aptStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  aptCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aptLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aptLocation: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  aptEarnings: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  aptEarningsText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  wishCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wishContent: {
    flex: 1,
  },
  wishTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  wishService: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  wishCustomer: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  wishMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  wishMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wishMetaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  wishRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  wishBudget: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 4,
  },
  offlineCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 28,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offlineTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  offlineText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  goOnlineBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: COLORS.success,
  },
  goOnlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  quickActionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
});
