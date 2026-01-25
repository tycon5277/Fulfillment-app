import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GameModal from '../../src/components/GameModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  primary: '#8B5CF6',
  cyan: '#06B6D4',
  green: '#34D399',
  amber: '#F59E0B',
  magenta: '#D946EF',
  blue: '#3B82F6',
  red: '#F87171',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  headerBg: '#1E3A5F',
};

const FILTER_TABS = [
  { id: 'all', label: 'All', icon: 'grid-outline' },
  { id: 'urgent', label: 'Urgent', icon: 'flash' },
  { id: 'nearby', label: 'Nearby', icon: 'location' },
  { id: 'highpay', label: 'High Pay', icon: 'trending-up' },
];

const MOCK_REQUESTS = [
  {
    id: 'r1',
    service: 'Computer Repair',
    category: 'Tech Services',
    emoji: '🖥️',
    customer: 'Neha Gupta',
    customerRating: 4.8,
    description: 'Laptop not turning on after water spill. Need urgent help to recover data.',
    location: 'Sector 15, Gurgaon',
    budget: { min: 800, max: 1200 },
    distance: 2.5,
    urgent: true,
    postedTime: '5 min ago',
    estimatedDuration: '2-3 hours',
  },
  {
    id: 'r2',
    service: 'AC Service',
    category: 'Home Services',
    emoji: '❄️',
    customer: 'Vikram Singh',
    customerRating: 4.5,
    description: 'AC making loud noise and not cooling properly. Regular service needed.',
    location: 'DLF Phase 2',
    budget: { min: 400, max: 600 },
    distance: 4.2,
    urgent: false,
    postedTime: '15 min ago',
    estimatedDuration: '1-2 hours',
  },
  {
    id: 'r3',
    service: 'Plumbing Work',
    category: 'Home Services',
    emoji: '🔧',
    customer: 'Ritu Agarwal',
    customerRating: 4.9,
    description: 'Kitchen sink is leaking badly. Need immediate repair.',
    location: 'MG Road',
    budget: { min: 500, max: 800 },
    distance: 1.8,
    urgent: true,
    postedTime: '8 min ago',
    estimatedDuration: '1 hour',
  },
  {
    id: 'r4',
    service: 'Electrical Repair',
    category: 'Home Services',
    emoji: '⚡',
    customer: 'Deepak Kumar',
    customerRating: 4.7,
    description: 'Multiple switches and outlets not working in bedroom. Need electrician.',
    location: 'Cyber Hub',
    budget: { min: 600, max: 1000 },
    distance: 3.5,
    urgent: false,
    postedTime: '30 min ago',
    estimatedDuration: '2 hours',
  },
  {
    id: 'r5',
    service: 'Photography',
    category: 'Creative Services',
    emoji: '📸',
    customer: 'Anjali Mehta',
    customerRating: 5.0,
    description: 'Need photographer for small birthday party this weekend.',
    location: 'Golf Course Road',
    budget: { min: 2000, max: 3500 },
    distance: 5.2,
    urgent: false,
    postedTime: '1 hour ago',
    estimatedDuration: '4 hours',
  },
];

export default function ServiceRequestsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const filteredRequests = MOCK_REQUESTS.filter((req) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return req.urgent;
    if (activeFilter === 'nearby') return req.distance <= 3;
    if (activeFilter === 'highpay') return req.budget.max >= 1000;
    return true;
  });

  const handleRequestPress = (request: any) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleAcceptRequest = () => {
    setShowDetailModal(false);
    setShowAcceptModal(true);
  };

  const confirmAccept = () => {
    setShowAcceptModal(false);
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push('/(main)/my-jobs');
  };

  const totalEarnings = filteredRequests.reduce((acc, req) => acc + req.budget.max, 0);
  const urgentCount = filteredRequests.filter((req) => req.urgent).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.headerBg, COLORS.background]}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: headerAnim }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Service Requests</Text>
              <Text style={styles.headerSubtitle}>Find jobs that match your skills</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="briefcase" size={18} color={COLORS.cyan} />
              <Text style={styles.statValue}>{filteredRequests.length}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flash" size={18} color={COLORS.amber} />
              <Text style={styles.statValue}>{urgentCount}</Text>
              <Text style={styles.statLabel}>Urgent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="wallet" size={18} color={COLORS.green} />
              <Text style={styles.statValue}>₹{totalEarnings.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Potential</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? '#FFF' : COLORS.textSecondary}
                />
                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Requests List */}
      <ScrollView
        style={styles.requestsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {filteredRequests.map((request) => (
          <TouchableOpacity
            key={request.id}
            style={styles.requestCard}
            onPress={() => handleRequestPress(request)}
            activeOpacity={0.8}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceIconContainer}>
                  <Text style={styles.serviceEmoji}>{request.emoji}</Text>
                </View>
                <View>
                  <Text style={styles.serviceName}>{request.service}</Text>
                  <Text style={styles.serviceCategory}>{request.category}</Text>
                </View>
              </View>
              {request.urgent && (
                <View style={styles.urgentBadge}>
                  <Ionicons name="flash" size={12} color="#FFF" />
                  <Text style={styles.urgentText}>Urgent</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={2}>
              {request.description}
            </Text>

            {/* Customer Info */}
            <View style={styles.customerInfo}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerInitial}>{request.customer[0]}</Text>
              </View>
              <Text style={styles.customerName}>{request.customer}</Text>
              <View style={styles.customerRating}>
                <Ionicons name="star" size={12} color={COLORS.amber} />
                <Text style={styles.ratingText}>{request.customerRating}</Text>
              </View>
            </View>

            {/* Meta Info */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{request.distance} km</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{request.estimatedDuration}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="hourglass-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{request.postedTime}</Text>
              </View>
            </View>

            {/* Budget & Action */}
            <View style={styles.cardFooter}>
              <View style={styles.budgetContainer}>
                <Text style={styles.budgetLabel}>Budget</Text>
                <Text style={styles.budgetValue}>
                  ₹{request.budget.min} - ₹{request.budget.max}
                </Text>
              </View>
              <TouchableOpacity style={styles.viewDetailsBtn}>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Service Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalServiceIcon}>
                    <Text style={styles.modalEmoji}>{selectedRequest.emoji}</Text>
                  </View>
                  <View style={styles.modalServiceInfo}>
                    <Text style={styles.modalServiceName}>{selectedRequest.service}</Text>
                    <Text style={styles.modalCategory}>{selectedRequest.category}</Text>
                  </View>
                  {selectedRequest.urgent && (
                    <View style={[styles.urgentBadge, { marginLeft: 'auto' }]}>
                      <Ionicons name="flash" size={12} color="#FFF" />
                      <Text style={styles.urgentText}>Urgent</Text>
                    </View>
                  )}
                </View>

                {/* Full Description */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalDescription}>{selectedRequest.description}</Text>
                </View>

                {/* Customer Card */}
                <View style={styles.customerCard}>
                  <View style={styles.customerCardLeft}>
                    <View style={styles.customerAvatarLarge}>
                      <Text style={styles.customerInitialLarge}>{selectedRequest.customer[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.customerNameLarge}>{selectedRequest.customer}</Text>
                      <View style={styles.customerRatingLarge}>
                        <Ionicons name="star" size={14} color={COLORS.amber} />
                        <Text style={styles.ratingTextLarge}>{selectedRequest.customerRating} rating</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.chatBtn}>
                    <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={20} color={COLORS.cyan} />
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{selectedRequest.location}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="navigate" size={20} color={COLORS.green} />
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>{selectedRequest.distance} km away</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time" size={20} color={COLORS.amber} />
                    <Text style={styles.detailLabel}>Est. Duration</Text>
                    <Text style={styles.detailValue}>{selectedRequest.estimatedDuration}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="wallet" size={20} color={COLORS.magenta} />
                    <Text style={styles.detailLabel}>Budget</Text>
                    <Text style={styles.detailValue}>₹{selectedRequest.budget.min} - ₹{selectedRequest.budget.max}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.declineButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={handleAcceptRequest}
                  >
                    <LinearGradient
                      colors={[COLORS.green, '#16A34A']}
                      style={styles.acceptButtonGradient}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                      <Text style={styles.acceptButtonText}>Accept Job</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Game Modals */}
      <GameModal
        visible={showAcceptModal}
        type="confirm"
        title="Accept This Job?"
        message={`You're about to accept the ${selectedRequest?.service} job from ${selectedRequest?.customer}. Make sure you can complete it on time.`}
        emoji="🤝"
        primaryButtonText="Yes, Accept"
        secondaryButtonText="Go Back"
        onPrimaryPress={confirmAccept}
        onSecondaryPress={() => setShowAcceptModal(false)}
      />

      <GameModal
        visible={showSuccessModal}
        type="success"
        title="Job Accepted!"
        message="Great! The customer has been notified. Check 'My Jobs' to see the details and start the job."
        emoji="🎉"
        xpReward={50}
        primaryButtonText="Go to My Jobs"
        onPrimaryPress={handleSuccessClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {},
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  filterContainer: {
    paddingVertical: 14,
    paddingLeft: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    marginRight: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceEmoji: {
    fontSize: 26,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  serviceCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  customerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.amber,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  budgetContainer: {},
  budgetLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalServiceIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  modalEmoji: {
    fontSize: 32,
  },
  modalServiceInfo: {
    flex: 1,
  },
  modalServiceName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  customerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  customerAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitialLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  customerNameLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerRatingLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingTextLarge: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  detailItem: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
