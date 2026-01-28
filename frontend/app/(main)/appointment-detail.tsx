import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuthStore } from '../../src/store';
import { getUserCategory, MOCK_APPOINTMENTS } from '../../src/skillMockData';

const COLORS = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  primary: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const appointmentId = params.id as string;
  const appointmentStatus = params.status as string;
  
  // Get user's category and appointments
  const userSkills = user?.agent_skills || [];
  const userCategory = getUserCategory(userSkills);
  const categoryAppointments = MOCK_APPOINTMENTS[userCategory] || MOCK_APPOINTMENTS['home_services'] || [];
  
  // Find the specific appointment
  const appointment = useMemo(() => {
    return categoryAppointments.find((apt: any) => apt.id === appointmentId);
  }, [categoryAppointments, appointmentId]);
  
  // Reschedule modal state
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: COLORS.success + '15', text: COLORS.success, icon: 'checkmark-circle', label: 'Completed' };
      case 'in_progress':
        return { bg: COLORS.warning + '15', text: COLORS.warning, icon: 'time', label: 'In Progress' };
      case 'upcoming':
        return { bg: COLORS.primary + '15', text: COLORS.primary, icon: 'calendar', label: 'Upcoming' };
      default:
        return { bg: COLORS.textMuted + '15', text: COLORS.textMuted, icon: 'help', label: status };
    }
  };
  
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewDate(selectedDate);
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setNewTime(selectedTime);
    }
  };
  
  const handleReschedule = () => {
    // In a real app, this would make an API call
    setRescheduleSuccess(true);
    setTimeout(() => {
      setShowReschedule(false);
      setRescheduleSuccess(false);
    }, 2000);
  };
  
  if (!appointment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Appointment Not Found</Text>
          <Text style={styles.emptyText}>This appointment may have been cancelled or removed.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const statusStyle = getStatusStyle(appointment.status);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
          <Ionicons name={statusStyle.icon as any} size={24} color={statusStyle.text} />
          <Text style={[styles.statusBannerText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
        
        {/* Main Info Card */}
        <View style={styles.card}>
          <Text style={styles.serviceName}>{appointment.service}</Text>
          <Text style={styles.customerName}>with {appointment.customer}</Text>
          
          <View style={styles.divider} />
          
          {/* Date & Time */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{appointment.time}</Text>
              <Text style={styles.infoSubtext}>Duration: {appointment.duration}</Text>
            </View>
          </View>
          
          {/* Location */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{appointment.location}</Text>
            </View>
            <TouchableOpacity style={styles.mapButton}>
              <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Earnings */}
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="cash-outline" size={20} color={COLORS.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Earnings</Text>
              <Text style={[styles.infoValue, styles.earningsValue]}>₹{appointment.earnings.toLocaleString()}</Text>
            </View>
          </View>
        </View>
        
        {/* Actions Card - Only for Upcoming */}
        {appointment.status === 'upcoming' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actions</Text>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionItem} onPress={() => setShowReschedule(true)}>
                <View style={[styles.actionIconBg, { backgroundColor: COLORS.primary + '15' }]}>
                  <Ionicons name="calendar" size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.actionLabel}>Reschedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <View style={[styles.actionIconBg, { backgroundColor: COLORS.success + '15' }]}>
                  <Ionicons name="chatbubble" size={22} color={COLORS.success} />
                </View>
                <Text style={styles.actionLabel}>Chat</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <View style={[styles.actionIconBg, { backgroundColor: COLORS.warning + '15' }]}>
                  <Ionicons name="call" size={22} color={COLORS.warning} />
                </View>
                <Text style={styles.actionLabel}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <View style={[styles.actionIconBg, { backgroundColor: COLORS.error + '15' }]}>
                  <Ionicons name="close-circle" size={22} color={COLORS.error} />
                </View>
                <Text style={styles.actionLabel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Start Job Button - Only for Upcoming */}
        {appointment.status === 'upcoming' && (
          <TouchableOpacity style={styles.startJobBtn}>
            <Ionicons name="play-circle" size={22} color="#FFF" />
            <Text style={styles.startJobText}>Start Job</Text>
          </TouchableOpacity>
        )}
        
        {/* Mark Complete Button - Only for In Progress */}
        {appointment.status === 'in_progress' && (
          <TouchableOpacity style={[styles.startJobBtn, { backgroundColor: COLORS.success }]}>
            <Ionicons name="checkmark-circle" size={22} color="#FFF" />
            <Text style={styles.startJobText}>Mark as Complete</Text>
          </TouchableOpacity>
        )}
        
        {/* Completed Message */}
        {appointment.status === 'completed' && (
          <View style={styles.completedCard}>
            <Ionicons name="checkmark-done-circle" size={48} color={COLORS.success} />
            <Text style={styles.completedTitle}>Job Completed</Text>
            <Text style={styles.completedText}>This appointment has been completed successfully.</Text>
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
      
      {/* Reschedule Modal */}
      <Modal
        visible={showReschedule}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReschedule(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {rescheduleSuccess ? (
              <View style={styles.successContent}>
                <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                <Text style={styles.successTitle}>Rescheduled!</Text>
                <Text style={styles.successText}>Your appointment has been updated.</Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reschedule Appointment</Text>
                  <TouchableOpacity onPress={() => setShowReschedule(false)}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalSubtitle}>{appointment.service}</Text>
                
                {/* Date Picker */}
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerLabel}>New Date</Text>
                    <Text style={styles.pickerValue}>{formatDate(newDate)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={newDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
                
                {/* Time Picker */}
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerLabel}>New Time</Text>
                    <Text style={styles.pickerValue}>{formatTime(newTime)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
                
                {showTimePicker && (
                  <DateTimePicker
                    value={newTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn}
                    onPress={() => setShowReschedule(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.confirmBtn}
                    onPress={handleReschedule}
                  >
                    <Text style={styles.confirmBtnText}>Confirm Reschedule</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
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
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  customerName: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  infoSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionItem: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  startJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  startJobText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  completedCard: {
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: 12,
  },
  completedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  pickerContent: {
    flex: 1,
    marginLeft: 12,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  pickerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: 16,
  },
  successText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
