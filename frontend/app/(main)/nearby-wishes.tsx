import React, { useState, useRef } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Mock wishes data based on user's skills
const MOCK_WISHES = [
  {
    id: 'w1',
    service: 'Bathroom Deep Clean',
    category: 'cleaning',
    customer: 'Amit Kumar',
    customerPhoto: null,
    customerRating: 4.8,
    customerJobs: 12,
    description: 'Need thorough cleaning of 2 bathrooms. Tiles, fixtures, and glass partitions need special attention.',
    photos: ['photo1.jpg', 'photo2.jpg'],
    budget: '₹800 - ₹1,000',
    budgetMin: 800,
    budgetMax: 1000,
    location: 'Sector 21, Gurgaon',
    distance: 1.2,
    lat: 28.4595,
    lng: 77.0266,
    urgent: true,
    postedTime: '5 min ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Today',
    preferredTime: 'Afternoon',
  },
  {
    id: 'w2',
    service: 'Full House Cleaning',
    category: 'cleaning',
    customer: 'Sunita Verma',
    customerPhoto: null,
    customerRating: 4.9,
    customerJobs: 24,
    description: '3BHK apartment needs deep cleaning before a family function. All rooms, kitchen, and bathrooms.',
    photos: [],
    budget: '₹2,500 - ₹3,500',
    budgetMin: 2500,
    budgetMax: 3500,
    location: 'DLF Phase 3, Sector 24',
    distance: 2.8,
    lat: 28.4720,
    lng: 77.0890,
    urgent: false,
    postedTime: '15 min ago',
    estimatedDuration: '5-6 hours',
    preferredDate: 'Tomorrow',
    preferredTime: 'Morning',
  },
  {
    id: 'w3',
    service: 'Kitchen Deep Clean',
    category: 'cleaning',
    customer: 'Priya Patel',
    customerPhoto: null,
    customerRating: 4.7,
    customerJobs: 8,
    description: 'Kitchen cleaning including chimney, cabinets, and appliances. Haven\'t been cleaned in months.',
    photos: ['photo1.jpg'],
    budget: '₹1,200 - ₹1,500',
    budgetMin: 1200,
    budgetMax: 1500,
    location: 'Cyber Hub, Gurgaon',
    distance: 3.5,
    lat: 28.4940,
    lng: 77.0880,
    urgent: false,
    postedTime: '32 min ago',
    estimatedDuration: '3-4 hours',
    preferredDate: 'This Week',
    preferredTime: 'Flexible',
  },
  {
    id: 'w4',
    service: 'Sofa & Carpet Cleaning',
    category: 'cleaning',
    customer: 'Rahul Sharma',
    customerPhoto: null,
    customerRating: 4.6,
    customerJobs: 5,
    description: 'Large L-shaped sofa and 2 carpets need professional cleaning. Pet stains on carpet.',
    photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
    budget: '₹1,800 - ₹2,200',
    budgetMin: 1800,
    budgetMax: 2200,
    location: 'Golf Course Road',
    distance: 4.2,
    lat: 28.4580,
    lng: 77.1020,
    urgent: true,
    postedTime: '45 min ago',
    estimatedDuration: '2-3 hours',
    preferredDate: 'Today',
    preferredTime: 'Evening',
  },
  {
    id: 'w5',
    service: 'Office Cleaning',
    category: 'cleaning',
    customer: 'TechStart Inc',
    customerPhoto: null,
    customerRating: 4.9,
    customerJobs: 30,
    description: 'Weekly office cleaning for a 2000 sq ft office. 20 workstations, 2 meeting rooms, pantry.',
    photos: [],
    budget: '₹3,000 - ₹4,000',
    budgetMin: 3000,
    budgetMax: 4000,
    location: 'Udyog Vihar, Phase 4',
    distance: 5.8,
    lat: 28.4950,
    lng: 77.0540,
    urgent: false,
    postedTime: '1 hr ago',
    estimatedDuration: '4-5 hours',
    preferredDate: 'Saturday',
    preferredTime: 'Morning',
  },
  {
    id: 'w6',
    service: 'Move-out Cleaning',
    category: 'cleaning',
    customer: 'Neha Gupta',
    customerPhoto: null,
    customerRating: 4.5,
    customerJobs: 3,
    description: 'Complete cleaning of 2BHK flat before move-out. Need to get security deposit back.',
    photos: ['photo1.jpg'],
    budget: '₹2,000 - ₹2,500',
    budgetMin: 2000,
    budgetMax: 2500,
    location: 'Sohna Road',
    distance: 7.2,
    lat: 28.4220,
    lng: 77.0650,
    urgent: true,
    postedTime: '2 hrs ago',
    estimatedDuration: '4-5 hours',
    preferredDate: 'Jan 28',
    preferredTime: 'Full Day',
  },
];

export default function NearbyWishesScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useState(5);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'distance' | 'budget' | 'time'>('distance');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filteredWishes = MOCK_WISHES.filter(w => w.distance <= radius).sort((a, b) => {
    if (sortBy === 'distance') return a.distance - b.distance;
    if (sortBy === 'budget') return b.budgetMax - a.budgetMax;
    return 0;
  });

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
