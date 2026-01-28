import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store';
import { getUserCategory } from '../../src/skillMockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  primary: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  star: '#FBBF24',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: '5', label: '5 ⭐' },
  { key: '4', label: '4 ⭐' },
  { key: '3', label: '3 ⭐' },
  { key: 'low', label: '1-2 ⭐' },
];

// Category-based reviews
const REVIEWS_BY_CATEGORY: { [key: string]: any[] } = {
  home_services: [
    { id: 'r1', customer: 'Priya Patel', rating: 5, service: 'Deep House Cleaning', date: '2 days ago', comment: 'Absolutely amazing work! My house has never looked this clean. Very professional and thorough.', helpful: 12 },
    { id: 'r2', customer: 'Amit Kumar', rating: 5, service: 'Kitchen Cleaning', date: '1 week ago', comment: 'Great attention to detail. The kitchen sparkles now. Will definitely book again!', helpful: 8 },
    { id: 'r3', customer: 'Sunita Verma', rating: 4, service: 'Bathroom Cleaning', date: '2 weeks ago', comment: 'Good work overall. Minor spots missed but came back to fix them. Appreciate the dedication.', helpful: 5 },
    { id: 'r4', customer: 'Rahul Sharma', rating: 5, service: 'Full House Cleaning', date: '3 weeks ago', comment: 'Best cleaning service I have ever used. On time, professional, and excellent results.', helpful: 15 },
  ],
  culinary: [
    { id: 'r1', customer: 'Party Host', rating: 5, service: 'Birthday Party Cooking', date: '3 days ago', comment: 'The food was absolutely delicious! All 50 guests loved it. Perfect for our celebration.', helpful: 18 },
    { id: 'r2', customer: 'Office Manager', rating: 5, service: 'Tiffin Service', date: '1 week ago', comment: 'Consistently tasty food. Our team loves the variety and freshness every day.', helpful: 12 },
    { id: 'r3', customer: 'Fitness Client', rating: 4, service: 'Diet Meal Prep', date: '2 weeks ago', comment: 'Great macro-balanced meals. Taste could be slightly better but nutrition is on point.', helpful: 7 },
    { id: 'r4', customer: 'BBQ Party Host', rating: 5, service: 'BBQ Night', date: '1 month ago', comment: 'Amazing grilling skills! The kebabs were perfectly cooked. Great entertainment too!', helpful: 22 },
  ],
  drone_services: [
    { id: 'r1', customer: 'Kapoor Wedding', rating: 5, service: 'Wedding Aerial Shoot', date: '1 week ago', comment: 'Breathtaking aerial footage of our wedding! The Baraat shot from above was magical.', helpful: 25 },
    { id: 'r2', customer: 'DLF Builders', rating: 5, service: 'Real Estate Drone', date: '2 weeks ago', comment: 'Professional work. The property videos helped us close deals faster. Highly recommended!', helpful: 14 },
    { id: 'r3', customer: 'Event Organizer', rating: 4, service: 'Event Aerial Coverage', date: '3 weeks ago', comment: 'Good coverage overall. Some shots were slightly shaky but editing fixed it.', helpful: 6 },
  ],
  repair_maintenance: [
    { id: 'r1', customer: 'Vikram Singh', rating: 5, service: 'AC Repair', date: '4 days ago', comment: 'Fixed my AC in no time! Very knowledgeable and fair pricing. Cooling perfectly now.', helpful: 10 },
    { id: 'r2', customer: 'Amit Kumar', rating: 5, service: 'Plumbing Work', date: '1 week ago', comment: 'Excellent plumbing work. No more leaks! Clean work with no mess left behind.', helpful: 8 },
    { id: 'r3', customer: 'Sanjay Gupta', rating: 4, service: 'Electrical Wiring', date: '2 weeks ago', comment: 'Good electrical work. Took slightly longer than expected but quality is excellent.', helpful: 5 },
  ],
  photography_video: [
    { id: 'r1', customer: 'Sharma Wedding', rating: 5, service: 'Wedding Photography', date: '5 days ago', comment: 'Captured every precious moment beautifully! The candid shots are my favorite.', helpful: 20 },
    { id: 'r2', customer: 'FashionBrand', rating: 5, service: 'Product Photoshoot', date: '2 weeks ago', comment: 'Professional studio quality. Our products look amazing on the website now.', helpful: 12 },
  ],
  wellness_beauty: [
    { id: 'r1', customer: 'Bride Priya', rating: 5, service: 'Bridal Makeup', date: '1 week ago', comment: 'Made me feel like a princess! Makeup lasted all day and looked perfect in photos.', helpful: 30 },
    { id: 'r2', customer: 'Meera Kapoor', rating: 5, service: 'Hair & Facial', date: '2 weeks ago', comment: 'Relaxing spa experience at home. Skin feels rejuvenated. Booking monthly now!', helpful: 15 },
  ],
  pet_services: [
    { id: 'r1', customer: 'Bruno Owner', rating: 5, service: 'Dog Grooming', date: '3 days ago', comment: 'Bruno looks so handsome! Very patient with my energetic Labrador. Great grooming skills.', helpful: 8 },
    { id: 'r2', customer: 'Cat Parent', rating: 5, service: 'Pet Sitting', date: '1 week ago', comment: 'Trusted our Milo completely. Daily updates and photos. Will use again for sure!', helpful: 12 },
  ],
  education: [
    { id: 'r1', customer: 'Parent Khanna', rating: 5, service: 'Math Tutoring', date: '1 week ago', comment: 'My son grades improved from C to A! Patient teaching style that really connects.', helpful: 18 },
    { id: 'r2', customer: 'Teen Coder', rating: 5, service: 'Coding Class', date: '2 weeks ago', comment: 'Made coding fun and easy to understand. Built my first website in just 4 classes!', helpful: 14 },
  ],
  tech_services: [
    { id: 'r1', customer: 'Laptop Owner', rating: 5, service: 'Laptop Repair', date: '5 days ago', comment: 'Fixed my laptop same day! SSD upgrade made it super fast. Fair pricing too.', helpful: 10 },
    { id: 'r2', customer: 'Home Owner', rating: 5, service: 'CCTV Installation', date: '2 weeks ago', comment: 'Professional installation. Camera quality is excellent and app works perfectly.', helpful: 8 },
  ],
};

export default function ReviewsDetailScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Get user's category
  const userSkills = user?.agent_skills || [];
  const userCategory = getUserCategory(userSkills);
  const allReviews = REVIEWS_BY_CATEGORY[userCategory] || REVIEWS_BY_CATEGORY['home_services'] || [];

  // Calculate rating stats
  const overallRating = user?.partner_rating || 4.8;
  const totalReviews = allReviews.length * 25; // Mock multiplier
  
  const ratingBreakdown = {
    5: Math.round(totalReviews * 0.72),
    4: Math.round(totalReviews * 0.18),
    3: Math.round(totalReviews * 0.06),
    2: Math.round(totalReviews * 0.03),
    1: Math.round(totalReviews * 0.01),
  };

  // Filter reviews
  const filteredReviews = allReviews.filter(review => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'low') return review.rating <= 2;
    return review.rating === parseInt(selectedFilter);
  });

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? 'star' : 'star-outline'}
        size={14}
        color={COLORS.star}
      />
    ));
  };

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <View key={stars} style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{stars}</Text>
        <Ionicons name="star" size={12} color={COLORS.star} />
        <View style={styles.ratingBarTrack}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Overall Rating Card */}
        <View style={styles.overallCard}>
          <View style={styles.overallLeft}>
            <Text style={styles.overallRating}>{overallRating.toFixed(1)}</Text>
            <View style={styles.overallStars}>
              {renderStars(Math.round(overallRating))}
            </View>
            <Text style={styles.overallCount}>{totalReviews} reviews</Text>
          </View>
          <View style={styles.overallRight}>
            {[5, 4, 3, 2, 1].map(stars => 
              renderRatingBar(stars, ratingBreakdown[stars as keyof typeof ratingBreakdown], totalReviews)
            )}
          </View>
        </View>

        {/* Achievement Badges */}
        <View style={styles.badgesCard}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.badgesGrid}>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>⭐</Text>
              <Text style={styles.badgeLabel}>Top Rated</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>🏆</Text>
              <Text style={styles.badgeLabel}>100+ Jobs</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>⚡</Text>
              <Text style={styles.badgeLabel}>Quick Response</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>💯</Text>
              <Text style={styles.badgeLabel}>Reliable</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterTab,
                selectedFilter === tab.key && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(tab.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === tab.key && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>
            {selectedFilter === 'all' ? 'All Reviews' : `${selectedFilter} Star Reviews`} ({filteredReviews.length})
          </Text>

          {filteredReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitial}>{review.customer[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewerName}>{review.customer}</Text>
                    <Text style={styles.reviewService}>{review.service}</Text>
                  </View>
                </View>
                <View style={styles.reviewRating}>
                  <View style={styles.starsRow}>{renderStars(review.rating)}</View>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <View style={styles.reviewFooter}>
                <TouchableOpacity style={styles.helpfulBtn}>
                  <Ionicons name="thumbs-up-outline" size={14} color={COLORS.textMuted} />
                  <Text style={styles.helpfulText}>Helpful ({review.helpful})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.replyBtn}>
                  <Ionicons name="chatbubble-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.replyText}>Reply</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    padding: 16,
  },
  overallCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  overallLeft: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  overallRating: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text,
  },
  overallStars: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  overallCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  overallRight: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
    gap: 6,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 12,
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: COLORS.star,
    borderRadius: 3,
  },
  ratingBarCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    width: 30,
    textAlign: 'right',
  },
  badgesCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.star + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  reviewsSection: {
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reviewService: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  reviewRating: {
    alignItems: 'flex-end',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  helpfulText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  replyText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
