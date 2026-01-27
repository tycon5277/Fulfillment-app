import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Warm Cream Theme for Skilled Genie
const COLORS = {
  background: '#FDF8F3',
  cardBg: '#FFFFFF',
  cardBorder: '#E8DFD5',
  primary: '#D97706',
  secondary: '#F59E0B',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  text: '#44403C',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  border: '#E8DFD5',
};

// COMPREHENSIVE MOCK WISHES FOR ALL SKILL CATEGORIES
// Each wish has a 'skillMatch' array that determines which genie skills can see this wish
const ALL_WISHES = [
  // ==================== HOME SERVICES / CLEANING ====================
  {
    id: 'w1',
    service: 'Bathroom Deep Clean',
    category: 'home_services',
    skillMatch: ['deep_cleaning', 'regular_cleaning', 'bathroom_cleaning'],
    customer: 'Amit Kumar',
    customerRating: 4.8,
    customerJobs: 12,
    description: 'Need thorough cleaning of 2 bathrooms. Tiles, fixtures, and glass partitions need special attention.',
    photos: ['photo1.jpg', 'photo2.jpg'],
    budget: '₹800 - ₹1,000',
    budgetMin: 800,
    budgetMax: 1000,
    location: 'Sector 21, Gurgaon',
    distance: 1.2,
    urgent: true,
    postedTime: '5 min ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Today',
  },
  {
    id: 'w2',
    service: 'Full House Cleaning',
    category: 'home_services',
    skillMatch: ['deep_cleaning', 'regular_cleaning', 'kitchen_cleaning', 'bathroom_cleaning'],
    customer: 'Sunita Verma',
    customerRating: 4.9,
    customerJobs: 24,
    description: '3BHK apartment needs deep cleaning before a family function.',
    photos: [],
    budget: '₹2,500 - ₹3,500',
    budgetMin: 2500,
    budgetMax: 3500,
    location: 'DLF Phase 3',
    distance: 2.8,
    urgent: false,
    postedTime: '15 min ago',
    estimatedDuration: '5-6 hours',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'w3',
    service: 'Kitchen Deep Clean',
    category: 'home_services',
    skillMatch: ['deep_cleaning', 'kitchen_cleaning', 'chimney_cleaning'],
    customer: 'Priya Patel',
    customerRating: 4.7,
    customerJobs: 8,
    description: 'Kitchen cleaning including chimney, cabinets, and appliances.',
    photos: ['photo1.jpg'],
    budget: '₹1,200 - ₹1,500',
    budgetMin: 1200,
    budgetMax: 1500,
    location: 'Cyber Hub',
    distance: 3.5,
    urgent: false,
    postedTime: '32 min ago',
    estimatedDuration: '3-4 hours',
    preferredDate: 'This Week',
  },
  {
    id: 'w4',
    service: 'Sofa & Carpet Cleaning',
    category: 'home_services',
    skillMatch: ['carpet_cleaning', 'sofa_cleaning', 'deep_cleaning'],
    customer: 'Rahul Sharma',
    customerRating: 4.6,
    customerJobs: 5,
    description: 'Large L-shaped sofa and 2 carpets need professional cleaning.',
    photos: ['photo1.jpg', 'photo2.jpg'],
    budget: '₹1,800 - ₹2,200',
    budgetMin: 1800,
    budgetMax: 2200,
    location: 'Golf Course Road',
    distance: 4.2,
    urgent: true,
    postedTime: '45 min ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Today',
  },
  
  // ==================== REPAIR & MAINTENANCE ====================
  {
    id: 'r1',
    service: 'Plumbing - Leak Repair',
    category: 'repair_maintenance',
    skillMatch: ['plumbing'],
    customer: 'Vikram Singh',
    customerRating: 4.5,
    customerJobs: 6,
    description: 'Kitchen sink is leaking badly. Need urgent repair.',
    photos: ['photo1.jpg'],
    budget: '₹400 - ₹600',
    budgetMin: 400,
    budgetMax: 600,
    location: 'Sector 15',
    distance: 1.8,
    urgent: true,
    postedTime: '10 min ago',
    estimatedDuration: '1-2 hours',
    preferredDate: 'Today',
  },
  {
    id: 'r2',
    service: 'AC Service & Gas Refill',
    category: 'repair_maintenance',
    skillMatch: ['ac_repair'],
    customer: 'Meera Reddy',
    customerRating: 4.7,
    customerJobs: 15,
    description: 'Split AC not cooling properly. Might need gas refill.',
    photos: [],
    budget: '₹1,500 - ₹2,500',
    budgetMin: 1500,
    budgetMax: 2500,
    location: 'Sector 49',
    distance: 3.2,
    urgent: false,
    postedTime: '1 hr ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'r3',
    service: 'Electrical Wiring Repair',
    category: 'repair_maintenance',
    skillMatch: ['electrical'],
    customer: 'Anand Kapoor',
    customerRating: 4.8,
    customerJobs: 20,
    description: 'Multiple switches not working in bedroom. Need rewiring.',
    photos: ['photo1.jpg'],
    budget: '₹800 - ₹1,200',
    budgetMin: 800,
    budgetMax: 1200,
    location: 'MG Road',
    distance: 2.5,
    urgent: false,
    postedTime: '2 hrs ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'This Week',
  },
  {
    id: 'r4',
    service: 'Refrigerator Repair',
    category: 'repair_maintenance',
    skillMatch: ['refrigerator'],
    customer: 'Sanjay Gupta',
    customerRating: 4.6,
    customerJobs: 8,
    description: 'Samsung refrigerator not cooling. Compressor might be faulty.',
    photos: [],
    budget: '₹1,000 - ₹2,000',
    budgetMin: 1000,
    budgetMax: 2000,
    location: 'Sector 56',
    distance: 4.5,
    urgent: true,
    postedTime: '30 min ago',
    estimatedDuration: '1-2 hours',
    preferredDate: 'Today',
  },
  {
    id: 'r5',
    service: 'Carpentry - Furniture Repair',
    category: 'repair_maintenance',
    skillMatch: ['carpentry', 'furniture_assembly'],
    customer: 'Neha Sharma',
    customerRating: 4.9,
    customerJobs: 12,
    description: 'Wardrobe door hinges broken. Need to replace and fix alignment.',
    photos: ['photo1.jpg', 'photo2.jpg'],
    budget: '₹600 - ₹1,000',
    budgetMin: 600,
    budgetMax: 1000,
    location: 'Sushant Lok',
    distance: 3.8,
    urgent: false,
    postedTime: '3 hrs ago',
    estimatedDuration: '1-2 hours',
    preferredDate: 'Tomorrow',
  },
  
  // ==================== DRIVER SERVICES ====================
  {
    id: 'd1',
    service: 'Full Day Driver Needed',
    category: 'driver_services',
    skillMatch: ['personal_driver', 'corporate_driver', 'vip_driver'],
    customer: 'Rajesh Malhotra',
    customerRating: 4.9,
    customerJobs: 35,
    description: 'Need a driver for full day. Multiple errands across Delhi NCR.',
    photos: [],
    budget: '₹1,500 - ₹2,000',
    budgetMin: 1500,
    budgetMax: 2000,
    location: 'Connaught Place',
    distance: 8.5,
    urgent: false,
    postedTime: '1 hr ago',
    estimatedDuration: '8-10 hours',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'd2',
    service: 'Airport Drop - IGI T3',
    category: 'driver_services',
    skillMatch: ['personal_driver', 'airport_transfer', 'night_driver'],
    customer: 'Kavita Joshi',
    customerRating: 4.7,
    customerJobs: 18,
    description: 'Early morning airport drop at 4 AM. Flight at 6:30 AM.',
    photos: [],
    budget: '₹800 - ₹1,200',
    budgetMin: 800,
    budgetMax: 1200,
    location: 'Sector 44',
    distance: 5.2,
    urgent: true,
    postedTime: '20 min ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'd3',
    service: 'Outstation Trip - Jaipur',
    category: 'driver_services',
    skillMatch: ['outstation_driver', 'personal_driver'],
    customer: 'Arun Mehta',
    customerRating: 4.8,
    customerJobs: 25,
    description: '2-day trip to Jaipur. Comfortable driving, experienced driver preferred.',
    photos: [],
    budget: '₹4,000 - ₹5,000',
    budgetMin: 4000,
    budgetMax: 5000,
    location: 'South Delhi',
    distance: 12.5,
    urgent: false,
    postedTime: '5 hrs ago',
    estimatedDuration: '2 days',
    preferredDate: 'Weekend',
  },
  
  // ==================== PHOTOGRAPHY & VIDEOGRAPHY ====================
  {
    id: 'p1',
    service: 'Wedding Photography',
    category: 'photography_video',
    skillMatch: ['wedding_photography', 'portrait_photo', 'event_photography'],
    customer: 'Sharma Family',
    customerRating: 4.9,
    customerJobs: 8,
    description: 'Full day wedding photography. Haldi, Mehendi and Reception.',
    photos: ['photo1.jpg'],
    budget: '₹25,000 - ₹35,000',
    budgetMin: 25000,
    budgetMax: 35000,
    location: 'Chattarpur',
    distance: 15.0,
    urgent: false,
    postedTime: '2 days ago',
    estimatedDuration: '10-12 hours',
    preferredDate: 'Feb 15',
  },
  {
    id: 'p2',
    service: 'Product Photography',
    category: 'photography_video',
    skillMatch: ['product_photography', 'food_photography'],
    customer: 'FashionBrand Inc',
    customerRating: 4.8,
    customerJobs: 45,
    description: '50 product shots for e-commerce website. White background.',
    photos: [],
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Okhla Industrial',
    distance: 10.2,
    urgent: false,
    postedTime: '1 day ago',
    estimatedDuration: '4-5 hours',
    preferredDate: 'This Week',
  },
  {
    id: 'p3',
    service: 'Corporate Video Shoot',
    category: 'photography_video',
    skillMatch: ['corporate_video', 'wedding_video', 'video_editing'],
    customer: 'TechCorp Solutions',
    customerRating: 4.7,
    customerJobs: 22,
    description: 'Company profile video. Interview style with B-roll footage.',
    photos: [],
    budget: '₹15,000 - ₹25,000',
    budgetMin: 15000,
    budgetMax: 25000,
    location: 'Cyber City',
    distance: 6.5,
    urgent: false,
    postedTime: '3 days ago',
    estimatedDuration: '1 day',
    preferredDate: 'Next Week',
  },
  
  // ==================== DRONE SERVICES ====================
  {
    id: 'dr1',
    service: 'Wedding Drone Coverage',
    category: 'drone_services',
    skillMatch: ['drone_photography', 'drone_videography', 'drone_wedding'],
    customer: 'Kapoor Wedding',
    customerRating: 4.9,
    customerJobs: 5,
    description: 'Aerial shots and cinematic drone video for wedding ceremony.',
    photos: ['photo1.jpg'],
    budget: '₹15,000 - ₹25,000',
    budgetMin: 15000,
    budgetMax: 25000,
    location: 'Gurugram Farmhouse',
    distance: 8.5,
    urgent: false,
    postedTime: '1 day ago',
    estimatedDuration: '6-8 hours',
    preferredDate: 'Feb 20',
  },
  {
    id: 'dr2',
    service: 'Real Estate Aerial Shots',
    category: 'drone_services',
    skillMatch: ['drone_photography', 'drone_videography', 'drone_real_estate'],
    customer: 'DLF Builders',
    customerRating: 4.8,
    customerJobs: 30,
    description: 'Drone video and photos of new residential project for marketing.',
    photos: [],
    budget: '₹12,000 - ₹18,000',
    budgetMin: 12000,
    budgetMax: 18000,
    location: 'New Gurgaon',
    distance: 12.0,
    urgent: false,
    postedTime: '2 days ago',
    estimatedDuration: '3-4 hours',
    preferredDate: 'This Week',
  },
  {
    id: 'dr3',
    service: 'Event Aerial Coverage',
    category: 'drone_services',
    skillMatch: ['drone_photography', 'drone_videography', 'drone_events'],
    customer: 'Corporate Event Org',
    customerRating: 4.7,
    customerJobs: 18,
    description: 'Drone coverage for outdoor corporate event. 500+ attendees.',
    photos: [],
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'India Gate Area',
    distance: 18.0,
    urgent: false,
    postedTime: '4 hrs ago',
    estimatedDuration: '4-5 hours',
    preferredDate: 'Saturday',
  },
  {
    id: 'dr4',
    service: 'Land Survey Drone',
    category: 'drone_services',
    skillMatch: ['drone_survey', 'drone_photography'],
    customer: 'Agri Farms Ltd',
    customerRating: 4.6,
    customerJobs: 12,
    description: 'Agricultural land survey using drone. 50 acres plot mapping.',
    photos: [],
    budget: '₹20,000 - ₹30,000',
    budgetMin: 20000,
    budgetMax: 30000,
    location: 'Sohna',
    distance: 25.0,
    urgent: false,
    postedTime: '1 day ago',
    estimatedDuration: '1 day',
    preferredDate: 'Next Week',
  },
  
  // ==================== WELLNESS & BEAUTY ====================
  {
    id: 'b1',
    service: 'Bridal Makeup',
    category: 'wellness_beauty',
    skillMatch: ['makeup', 'facial', 'haircut_women'],
    customer: 'Priya Bride',
    customerRating: 5.0,
    customerJobs: 2,
    description: 'Complete bridal makeup for wedding day. HD makeup preferred.',
    photos: ['photo1.jpg'],
    budget: '₹15,000 - ₹25,000',
    budgetMin: 15000,
    budgetMax: 25000,
    location: 'South City',
    distance: 5.5,
    urgent: false,
    postedTime: '2 days ago',
    estimatedDuration: '4-5 hours',
    preferredDate: 'Feb 14',
  },
  {
    id: 'b2',
    service: 'Home Spa Session',
    category: 'wellness_beauty',
    skillMatch: ['massage', 'spa_home', 'facial'],
    customer: 'Anjali Verma',
    customerRating: 4.8,
    customerJobs: 15,
    description: 'Full body massage and facial at home. Relaxation session.',
    photos: [],
    budget: '₹2,000 - ₹3,000',
    budgetMin: 2000,
    budgetMax: 3000,
    location: 'Sector 29',
    distance: 3.2,
    urgent: false,
    postedTime: '3 hrs ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Today',
  },
  {
    id: 'b3',
    service: 'Mehendi for Wedding',
    category: 'wellness_beauty',
    skillMatch: ['mehendi'],
    customer: 'Gupta Family',
    customerRating: 4.9,
    customerJobs: 10,
    description: 'Bridal mehendi for bride and 10 family members.',
    photos: ['photo1.jpg'],
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Rajouri Garden',
    distance: 15.0,
    urgent: false,
    postedTime: '1 day ago',
    estimatedDuration: '5-6 hours',
    preferredDate: 'Feb 13',
  },
  
  // ==================== PET SERVICES ====================
  {
    id: 'pet1',
    service: 'Dog Grooming at Home',
    category: 'pet_services',
    skillMatch: ['pet_grooming'],
    customer: 'Rohit Saxena',
    customerRating: 4.8,
    customerJobs: 8,
    description: 'Golden Retriever needs full grooming - bath, hair cut, nail trim.',
    photos: ['photo1.jpg'],
    budget: '₹1,200 - ₹1,800',
    budgetMin: 1200,
    budgetMax: 1800,
    location: 'Sector 50',
    distance: 4.8,
    urgent: false,
    postedTime: '2 hrs ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'pet2',
    service: 'Pet Sitting - 3 Days',
    category: 'pet_services',
    skillMatch: ['pet_sitting', 'pet_boarding', 'dog_walking'],
    customer: 'Sneha Malik',
    customerRating: 4.7,
    customerJobs: 5,
    description: 'Need someone to take care of my cat for 3 days while I travel.',
    photos: [],
    budget: '₹2,000 - ₹3,000',
    budgetMin: 2000,
    budgetMax: 3000,
    location: 'Sector 47',
    distance: 3.5,
    urgent: true,
    postedTime: '1 hr ago',
    estimatedDuration: '3 days',
    preferredDate: 'Starting Friday',
  },
  
  // ==================== EDUCATION & TUTORING ====================
  {
    id: 'edu1',
    service: 'Math Tutor for Class 10',
    category: 'education',
    skillMatch: ['math_tutor', 'exam_prep'],
    customer: 'Parent - Vinay Khanna',
    customerRating: 4.9,
    customerJobs: 12,
    description: 'Need tutor for Class 10 math. Board exam preparation.',
    photos: [],
    budget: '₹800 - ₹1,200',
    budgetMin: 800,
    budgetMax: 1200,
    location: 'Sector 15',
    distance: 2.5,
    urgent: false,
    postedTime: '4 hrs ago',
    estimatedDuration: '2 hrs/day',
    preferredDate: 'Ongoing',
  },
  {
    id: 'edu2',
    service: 'Guitar Lessons at Home',
    category: 'education',
    skillMatch: ['music_lessons'],
    customer: 'Teenage Student',
    customerRating: 4.6,
    customerJobs: 3,
    description: 'Beginner guitar lessons for 15-year-old. Acoustic guitar.',
    photos: [],
    budget: '₹600 - ₹1,000',
    budgetMin: 600,
    budgetMax: 1000,
    location: 'DLF Phase 1',
    distance: 5.8,
    urgent: false,
    postedTime: '1 day ago',
    estimatedDuration: '1 hr/session',
    preferredDate: 'Weekends',
  },
  
  // ==================== EVENTS & ENTERTAINMENT ====================
  {
    id: 'ev1',
    service: 'DJ for Birthday Party',
    category: 'events_entertainment',
    skillMatch: ['dj', 'live_music', 'anchor'],
    customer: 'Birthday Host',
    customerRating: 4.8,
    customerJobs: 6,
    description: '50th birthday party. 4 hours of music, 50 guests.',
    photos: [],
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Sector 31 Farmhouse',
    distance: 7.5,
    urgent: false,
    postedTime: '2 days ago',
    estimatedDuration: '4-5 hours',
    preferredDate: 'Saturday',
  },
  {
    id: 'ev2',
    service: 'Balloon & Flower Decoration',
    category: 'events_entertainment',
    skillMatch: ['balloon_decor', 'flower_decor', 'event_decor'],
    customer: 'Baby Shower Host',
    customerRating: 4.9,
    customerJobs: 10,
    description: 'Baby shower decoration. Theme: Pastel colors. Balloons + flowers.',
    photos: ['photo1.jpg'],
    budget: '₹5,000 - ₹8,000',
    budgetMin: 5000,
    budgetMax: 8000,
    location: 'Golf Course Extension',
    distance: 6.2,
    urgent: false,
    postedTime: '1 day ago',
    estimatedDuration: '3-4 hours',
    preferredDate: 'Sunday',
  },
];

export default function NearbyWishesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useState(5);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'distance' | 'budget' | 'time'>('distance');

  // Get user's skills
  const userSkills = user?.agent_skills || [];

  // Filter wishes based on user's skills
  const filteredWishes = useMemo(() => {
    // If user has no skills, show nothing (shouldn't happen)
    if (userSkills.length === 0) {
      return [];
    }

    // Filter wishes that match user's skills AND are within radius
    return ALL_WISHES
      .filter(wish => {
        // Check if any of the user's skills match the wish's skill requirements
        const skillsMatch = wish.skillMatch.some(requiredSkill => 
          userSkills.includes(requiredSkill)
        );
        // Check if within radius
        const withinRadius = wish.distance <= radius;
        return skillsMatch && withinRadius;
      })
      .sort((a, b) => {
        if (sortBy === 'distance') return a.distance - b.distance;
        if (sortBy === 'budget') return b.budgetMax - a.budgetMax;
        return 0; // time - keep original order (newest first)
      });
  }, [userSkills, radius, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const renderMapView = () => (
    <View style={styles.mapContainer}>
      {/* Simple map placeholder */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapGrid}>
          {/* Simulated map with pins */}
          <View style={styles.yourLocation}>
            <View style={styles.yourLocationDot} />
            <View style={styles.yourLocationRing} />
            <Text style={styles.youLabel}>You</Text>
          </View>
          
          {/* Radius circle */}
          <View style={[styles.radiusCircle, { width: radius * 30, height: radius * 30 }]} />
          
          {/* Wish pins */}
          {filteredWishes.slice(0, 5).map((wish, index) => (
            <TouchableOpacity
              key={wish.id}
              style={[
                styles.wishPin,
                { 
                  top: 80 + (index * 35) % 150,
                  left: 60 + (index * 50) % 200,
                }
              ]}
              onPress={() => router.push(`/(main)/wish-detail?id=${wish.id}`)}
            >
              <View style={[styles.pinHead, wish.urgent && styles.pinHeadUrgent]}>
                <Text style={styles.pinEmoji}>🧹</Text>
              </View>
              <View style={styles.pinTail} />
              <View style={styles.pinLabel}>
                <Text style={styles.pinDistance}>{wish.distance}km</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.mapOverlay}>
          <Ionicons name="map" size={40} color={COLORS.textMuted} />
          <Text style={styles.mapOverlayText}>Interactive map coming soon</Text>
        </View>
      </View>
    </View>
  );

  const renderListView = () => (
    <ScrollView 
      style={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {filteredWishes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Wishes Nearby</Text>
          <Text style={styles.emptyText}>Try increasing the radius to find more wishes in your area.</Text>
        </View>
      ) : (
        filteredWishes.map((wish) => (
          <TouchableOpacity 
            key={wish.id} 
            style={styles.wishCard}
            onPress={() => router.push(`/(main)/wish-detail?id=${wish.id}`)}
            activeOpacity={0.7}
          >
            {/* Header */}
            <View style={styles.wishHeader}>
              <View style={styles.wishServiceRow}>
                <Text style={styles.wishService}>{wish.service}</Text>
                {wish.urgent && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="flash" size={10} color="#FFF" />
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>
              <Text style={styles.wishBudget}>{wish.budget}</Text>
            </View>

            {/* Description */}
            <Text style={styles.wishDescription} numberOfLines={2}>{wish.description}</Text>

            {/* Photos indicator */}
            {wish.photos.length > 0 && (
              <View style={styles.photosRow}>
                <Ionicons name="images-outline" size={14} color={COLORS.primary} />
                <Text style={styles.photosText}>{wish.photos.length} photo{wish.photos.length > 1 ? 's' : ''} attached</Text>
              </View>
            )}

            {/* Customer info */}
            <View style={styles.customerRow}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerInitial}>{wish.customer[0]}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{wish.customer}</Text>
                <View style={styles.customerMeta}>
                  <Ionicons name="star" size={12} color={COLORS.warning} />
                  <Text style={styles.customerRating}>{wish.customerRating}</Text>
                  <Text style={styles.customerJobs}>• {wish.customerJobs} jobs</Text>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.wishFooter}>
              <View style={styles.wishMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="navigate" size={14} color={COLORS.primary} />
                  <Text style={[styles.metaText, { color: COLORS.primary, fontWeight: '600' }]}>{wish.distance} km</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{wish.postedTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{wish.preferredDate}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Wishes</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Radius Controller */}
      <View style={styles.radiusController}>
        <View style={styles.radiusHeader}>
          <View style={styles.radiusLabelRow}>
            <Ionicons name="locate" size={18} color={COLORS.primary} />
            <Text style={styles.radiusLabel}>Search Radius</Text>
          </View>
          <View style={styles.radiusValue}>
            <Text style={styles.radiusNumber}>{radius}</Text>
            <Text style={styles.radiusUnit}>km</Text>
          </View>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={radius}
          onValueChange={setRadius}
          minimumTrackTintColor={COLORS.primary}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={COLORS.primary}
        />
        <View style={styles.radiusMarks}>
          <Text style={styles.radiusMark}>1km</Text>
          <Text style={styles.radiusMark}>5km</Text>
          <Text style={styles.radiusMark}>10km</Text>
        </View>
      </View>

      {/* Results Info & Sort */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsCount}>
          {filteredWishes.length} wish{filteredWishes.length !== 1 ? 'es' : ''} found
        </Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons name="list" size={18} color={viewMode === 'list' ? '#FFF' : COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'map' && styles.viewBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons name="map" size={18} color={viewMode === 'map' ? '#FFF' : COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {[
          { key: 'distance', label: 'Nearest' },
          { key: 'budget', label: 'Highest Budget' },
          { key: 'time', label: 'Most Recent' },
        ].map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[styles.sortBtn, sortBy === option.key && styles.sortBtnActive]}
            onPress={() => setSortBy(option.key as any)}
          >
            <Text style={[styles.sortBtnText, sortBy === option.key && styles.sortBtnTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {viewMode === 'list' ? renderListView() : renderMapView()}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusController: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radiusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radiusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  radiusValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  radiusNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
  radiusUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  radiusMark: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  viewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewBtnActive: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  sortLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginRight: 4,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortBtnActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sortBtnTextActive: {
    color: COLORS.primary,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
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
  wishCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  wishServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  wishService: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  wishBudget: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
    flexShrink: 0,
    minWidth: 90,
    textAlign: 'right',
  },
  wishDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 10,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  photosText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customerInitial: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  customerRating: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerJobs: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  wishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishMeta: {
    flexDirection: 'row',
    gap: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    position: 'relative',
  },
  mapGrid: {
    flex: 1,
    position: 'relative',
  },
  yourLocation: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    alignItems: 'center',
  },
  yourLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  yourLocationRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    top: -12,
    left: -12,
  },
  youLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  radiusCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '10',
    transform: [{ translateX: -75 }, { translateY: -75 }],
  },
  wishPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinHead: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinHeadUrgent: {
    borderColor: COLORS.error,
  },
  pinEmoji: {
    fontSize: 16,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.cardBg,
    marginTop: -1,
  },
  pinLabel: {
    backgroundColor: COLORS.text,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  pinDistance: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  mapOverlayText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
