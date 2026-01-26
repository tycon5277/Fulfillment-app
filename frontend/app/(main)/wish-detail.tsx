import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

// Mock wish data
const MOCK_WISH = {
  id: 'w1',
  service: 'Bathroom Deep Clean',
  category: 'cleaning',
  customer: 'Amit Kumar',
  customerPhone: '+91 98765 43210',
  customerRating: 4.8,
  customerJobs: 12,
  customerSince: 'Member since Jan 2024',
  description: 'Need thorough cleaning of 2 bathrooms. Tiles, fixtures, and glass partitions need special attention. There are some hard water stains on the glass that have been there for a while. Would appreciate if you can bring necessary cleaning supplies.',
  photos: [
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
    'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400',
    'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=400',
  ],
  budget: '₹800 - ₹1,000',
  budgetMin: 800,
  budgetMax: 1000,
  location: 'Tower B, Flat 402, Sector 21, Gurgaon',
  area: 'Sector 21, Gurgaon',
  distance: '1.2 km',
  lat: 28.4595,
  lng: 77.0266,
  urgent: true,
  postedTime: '5 min ago',
  estimatedDuration: '2-3 hours',
  preferredDate: 'Today, Jan 26',
  preferredTime: '2:00 PM - 6:00 PM',
  additionalNotes: 'Please bring your own cleaning supplies. I have pets so use pet-safe products.',
};

export default function WishDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedTime, setSelectedTime] = useState('');
  const [proposedPrice, setProposedPrice] = useState(MOCK_WISH.budgetMax.toString());
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const wish = MOCK_WISH;

  const handleAcceptWish = () => {
    setShowAppointmentModal(true);
  };

  const handleConfirmAppointment = () => {
    setShowAppointmentModal(false);
    // Navigate to chat or confirmation
    router.push('/(main)/skilled-chats');
  };

  const handleChat = () => {
    router.push('/(main)/skilled-chats');
  };

  const handleNavigate = () => {
    // Open maps
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wish Details</Text>
        <TouchableOpacity style={styles.shareBtn}>
          <Ionicons name="share-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Service Info */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceTitleRow}>
                <Text style={styles.serviceTitle}>{wish.service}</Text>
                {wish.urgent && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="flash" size={12} color="#FFF" />
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>
              <Text style={styles.postedTime}>Posted {wish.postedTime}</Text>
            </View>
            <View style={styles.budgetSection}>
              <Text style={styles.budgetLabel}>Budget</Text>
              <Text style={styles.budget}>{wish.budget}</Text>
            </View>
          </View>
        </View>

        {/* Photos */}
        {wish.photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>📷 Photos from Customer</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosContainer}
            >
              {wish.photos.map((photo, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.photoWrapper}
                  onPress={() => setActivePhotoIndex(index)}
                >
                  <Image source={{ uri: photo }} style={styles.photo} />
                  {index === 0 && (
                    <View style={styles.photoBadge}>
                      <Text style={styles.photoBadgeText}>{wish.photos.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.description}>{wish.description}</Text>
            {wish.additionalNotes && (
              <View style={styles.notesBox}>
                <Ionicons name="information-circle" size={18} color={COLORS.warning} />
                <Text style={styles.notesText}>{wish.additionalNotes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Location with Map */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <View style={styles.locationCard}>
            {/* Simple Map Placeholder */}
            <View style={styles.mapPreview}>
              <View style={styles.mapPlaceholder}>
                <View style={styles.mapPin}>
                  <Ionicons name="location" size={24} color={COLORS.error} />
                </View>
                <View style={styles.mapLines}>
                  <View style={styles.mapLineH} />
                  <View style={styles.mapLineV} />
                </View>
              </View>
              <TouchableOpacity style={styles.expandMapBtn} onPress={handleNavigate}>
                <Ionicons name="expand-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationAddress}>{wish.location}</Text>
              <View style={styles.distanceRow}>
                <Ionicons name="navigate" size={16} color={COLORS.primary} />
                <Text style={styles.distanceText}>{wish.distance} away</Text>
                <TouchableOpacity style={styles.directionsBtn} onPress={handleNavigate}>
                  <Text style={styles.directionsBtnText}>Get Directions</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 Schedule Preference</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleItem}>
              <Ionicons name="calendar" size={20} color={COLORS.primary} />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Preferred Date</Text>
                <Text style={styles.scheduleValue}>{wish.preferredDate}</Text>
              </View>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Preferred Time</Text>
                <Text style={styles.scheduleValue}>{wish.preferredTime}</Text>
              </View>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Ionicons name="hourglass" size={20} color={COLORS.primary} />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLabel}>Est. Duration</Text>
                <Text style={styles.scheduleValue}>{wish.estimatedDuration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerInitial}>{wish.customer[0]}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{wish.customer}</Text>
                <Text style={styles.customerSince}>{wish.customerSince}</Text>
              </View>
              <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
                <Ionicons name="chatbubble" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.customerStats}>
              <View style={styles.customerStatItem}>
                <Ionicons name="star" size={16} color={COLORS.warning} />
                <Text style={styles.customerStatValue}>{wish.customerRating}</Text>
                <Text style={styles.customerStatLabel}>Rating</Text>
              </View>
              <View style={styles.customerStatDivider} />
              <View style={styles.customerStatItem}>
                <Ionicons name="briefcase" size={16} color={COLORS.primary} />
                <Text style={styles.customerStatValue}>{wish.customerJobs}</Text>
                <Text style={styles.customerStatLabel}>Jobs</Text>
              </View>
              <View style={styles.customerStatDivider} />
              <View style={styles.customerStatItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.customerStatValue}>100%</Text>
                <Text style={styles.customerStatLabel}>Paid</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.chatActionBtn} onPress={handleChat}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.primary} />
          <Text style={styles.chatActionText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptWish}>
          <Text style={styles.acceptBtnText}>Accept & Book Appointment</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Appointment Modal */}
      <Modal
        visible={showAppointmentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAppointmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Book Appointment</Text>
              <TouchableOpacity onPress={() => setShowAppointmentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Select Date</Text>
                <View style={styles.dateOptions}>
                  {['today', 'tomorrow', 'custom'].map((date) => (
                    <TouchableOpacity
                      key={date}
                      style={[styles.dateOption, selectedDate === date && styles.dateOptionActive]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[styles.dateOptionText, selectedDate === date && styles.dateOptionTextActive]}>
                        {date === 'today' ? 'Today' : date === 'tomorrow' ? 'Tomorrow' : 'Other Day'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Select Time Slot</Text>
                <View style={styles.timeOptions}>
                  {['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'].map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[styles.timeOption, selectedTime === time && styles.timeOptionActive]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text style={[styles.timeOptionText, selectedTime === time && styles.timeOptionTextActive]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Proposal */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Your Price</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={proposedPrice}
                    onChangeText={setProposedPrice}
                    keyboardType="numeric"
                    placeholder="Enter your price"
                  />
                </View>
                <Text style={styles.priceHint}>Customer budget: {wish.budget}</Text>
              </View>

              {/* Summary */}
              <View style={styles.modalSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service</Text>
                  <Text style={styles.summaryValue}>{wish.service}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>{selectedDate === 'today' ? 'Today' : selectedDate === 'tomorrow' ? 'Tomorrow' : 'TBD'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Time</Text>
                  <Text style={styles.summaryValue}>{selectedTime || 'Not selected'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Your Price</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.success, fontWeight: '700' }]}>₹{proposedPrice}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.confirmBtn, (!selectedTime || !proposedPrice) && styles.confirmBtnDisabled]}
              onPress={handleConfirmAppointment}
              disabled={!selectedTime || !proposedPrice}
            >
              <Text style={styles.confirmBtnText}>Send Appointment Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  postedTime: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  budgetSection: {
    alignItems: 'flex-end',
  },
  budgetLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  budget: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.success,
  },
  photosSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  photosContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 140,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  photoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  photoBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  section: {
    marginBottom: 16,
  },
  descriptionCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  notesBox: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 12,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 10,
    gap: 10,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    lineHeight: 18,
  },
  locationCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  mapPreview: {
    height: 120,
    backgroundColor: '#E8F4FD',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPin: {
    zIndex: 2,
  },
  mapLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  mapLineH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: COLORS.border,
  },
  mapLineV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.border,
  },
  expandMapBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfo: {
    padding: 14,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 10,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionsBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  scheduleCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  scheduleValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  customerCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerSince: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chatBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 14,
  },
  customerStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  customerStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  customerStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  customerStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
  },
  chatActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    gap: 8,
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  dateOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  dateOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dateOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dateOptionTextActive: {
    color: '#FFF',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  timeOptionTextActive: {
    color: '#FFF',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 14,
  },
  priceHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  modalSummary: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
