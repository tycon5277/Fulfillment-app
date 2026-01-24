import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../../src/api';

const COLORS = {
  primary: '#F59E0B',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#22C55E',
  danger: '#EF4444',
  border: '#E5E7EB',
  blue: '#0EA5E9',
  purple: '#7C3AED',
};

interface PromoterEvent {
  event_id: string;
  event_type: string;
  title: string;
  description: string;
  date?: string;
  location?: { lat: number; lng: number };
  price: number;
  total_slots: number;
  booked_slots: number;
  status: string;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<PromoterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [eventType, setEventType] = useState('trip');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [totalSlots, setTotalSlots] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await api.getPromoterEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  const handleAddEvent = async () => {
    if (!title.trim() || !description.trim() || !price || !totalSlots) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await api.createEvent({
        event_type: eventType,
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        total_slots: parseInt(totalSlots),
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setTotalSlots('');
      setEventType('trip');
      fetchEvents();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert('Cancel Event', 'Are you sure you want to cancel this event?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteEvent(eventId);
            fetchEvents();
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel event');
          }
        },
      },
    ]);
  };

  const getEventTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'trip': return 'bus';
      case 'event': return 'calendar';
      case 'service': return 'briefcase';
      default: return 'megaphone';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'trip': return COLORS.blue;
      case 'event': return COLORS.primary;
      case 'service': return COLORS.purple;
      default: return COLORS.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptyText}>Create your first trip, event or service</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.emptyButtonText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          events.map((event) => (
            <View key={event.event_id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={[styles.eventIconBg, { backgroundColor: getEventTypeColor(event.event_type) + '20' }]}>
                  <Ionicons name={getEventTypeIcon(event.event_type)} size={24} color={getEventTypeColor(event.event_type)} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventType}>
                    {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, event.status === 'active' && styles.activeBadge]}>
                  <Text style={[styles.statusText, event.status === 'active' && styles.activeText]}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>

              <View style={styles.eventStats}>
                <View style={styles.statItem}>
                  <Ionicons name="ticket" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.statText}>
                    {event.booked_slots}/{event.total_slots} booked
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="cash" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.statText}>₹{event.price}/person</Text>
                </View>
              </View>

              <View style={styles.eventActions}>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
                {event.status === 'active' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleDeleteEvent(event.event_id)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Event Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Event Type *</Text>
              <View style={styles.typeSelector}>
                {['trip', 'event', 'service'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeOption, eventType === type && styles.typeOptionSelected]}
                    onPress={() => setEventType(type)}
                  >
                    <Ionicons
                      name={getEventTypeIcon(type)}
                      size={20}
                      color={eventType === type ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[styles.typeOptionText, eventType === type && styles.typeOptionTextSelected]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Weekend Trip to Hills"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your event, trip or service..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Price per person"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.inputLabel}>Total Slots *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Max participants"
                    value={totalSlots}
                    onChangeText={setTotalSlots}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleAddEvent}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>Create Event</Text>
              )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  eventCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
    marginLeft: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  eventType: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeText: {
    color: COLORS.success,
  },
  eventDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventStats: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  viewButton: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 13,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  typeOptionTextSelected: {
    color: COLORS.white,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
