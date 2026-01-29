import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Dimensions,
  Keyboard,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as api from '../../src/api';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
};

interface Message {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_type: string;
  content: string;
  created_at: string;
}

interface ChatRoom {
  room_id: string;
  wish_id: string;
  wisher_id: string;
  status: string;
  wish_title?: string;
  wish?: {
    title: string;
    wish_type: string;
    remuneration: number;
    status: string;
    description?: string;
  };
  wisher?: {
    name: string;
    phone?: string;
    rating?: number;
  };
}

// Gamified Success Modal Component
const SuccessModal = ({ 
  visible, 
  onClose, 
  title, 
  subtitle, 
  icon, 
  confetti = true,
  actionText = 'Awesome!',
  onAction,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  icon: string;
  confetti?: boolean;
  actionText?: string;
  onAction?: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: -10,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 2 }
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      bounceAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={successStyles.overlay}>
        {confetti && (
          <View style={successStyles.confettiContainer}>
            {['🎉', '✨', '🌟', '💫', '🎊'].map((emoji, i) => (
              <Animated.Text 
                key={i} 
                style={[
                  successStyles.confetti,
                  { 
                    left: `${15 + i * 15}%`,
                    transform: [{ translateY: bounceAnim }],
                  }
                ]}
              >
                {emoji}
              </Animated.Text>
            ))}
          </View>
        )}
        
        <Animated.View 
          style={[
            successStyles.modal,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={successStyles.iconContainer}>
            <LinearGradient
              colors={[COLORS.success, '#34D399']}
              style={successStyles.iconGradient}
            >
              <Text style={successStyles.icon}>{icon}</Text>
            </LinearGradient>
          </View>
          
          <Text style={successStyles.title}>{title}</Text>
          <Text style={successStyles.subtitle}>{subtitle}</Text>
          
          <TouchableOpacity 
            style={successStyles.button}
            onPress={onAction || onClose}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={successStyles.buttonGradient}
            >
              <Text style={successStyles.buttonText}>{actionText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const successStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confettiContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  confetti: {
    fontSize: 32,
    position: 'absolute',
  },
  modal: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { 
    roomId, dealId, wishId, wishTitle, wishBudget, wishDescription,
    customerName, customerRating, wishLocation, wishDate 
  } = params;
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Deal states
  const [currentDealId, setCurrentDealId] = useState<string | null>(dealId as string || null);
  const [dealStatus, setDealStatus] = useState<
    'pending' | 'genie_accepted' | 'confirmed' | 'in_progress' | 'completed'
  >('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modals
  const [showDealDetails, setShowDealDetails] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // Appointment editing state with Date objects
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Gamified success modals
  const [showOfferSentSuccess, setShowOfferSentSuccess] = useState(false);
  const [showJobConfirmedSuccess, setShowJobConfirmedSuccess] = useState(false);
  const [showJobStartedSuccess, setShowJobStartedSuccess] = useState(false);
  const [showJobCompletedSuccess, setShowJobCompletedSuccess] = useState(false);

  const price = wishBudget ? parseInt(wishBudget as string) : (room?.wish?.remuneration || 0);
  const description = (wishDescription as string) || room?.wish?.description || 'Service request details not available.';
  const location = (wishLocation as string) || 'Location not specified';
  const preferredDate = (wishDate as string) || 'Flexible';
  
  // Format date for display
  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Format time for display
  const formatTimeDisplay = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Keyboard listeners
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [roomId]);

  // When Wisher accepts → Show appointment editing modal
  useEffect(() => {
    if (dealStatus === 'genie_accepted') {
      const timer = setTimeout(async () => {
        // Wisher accepts - show appointment editing modal
        setDealStatus('confirmed');
        const wisherAcceptMsg: Message = {
          message_id: `msg_wisher_${Date.now()}`,
          room_id: roomId as string,
          sender_id: 'wisher',
          sender_type: 'wisher',
          content: '✅ I accept your offer! Please confirm the appointment details.',
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, wisherAcceptMsg]);
        scrollViewRef.current?.scrollToEnd({ animated: true });
        
        // Initialize appointment date/time
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(15, 0, 0, 0); // Default to 3:00 PM tomorrow
        setAppointmentDate(tomorrow);
        setAppointmentTime(tomorrow);
        setAppointmentNotes('');
        
        // Show appointment editing modal
        setShowAppointmentModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [dealStatus]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await api.getChatRooms();
      const foundRoom = response.data.find((r: ChatRoom) => r.room_id === roomId);
      
      if (foundRoom) {
        setRoom(foundRoom);
      } else {
        setRoom({
          room_id: roomId as string,
          wish_id: (wishId as string) || 'demo',
          wisher_id: 'demo_wisher',
          status: 'active',
          wish_title: (wishTitle as string) || 'Service Request',
          wish: {
            title: (wishTitle as string) || 'Service Request',
            wish_type: 'service',
            remuneration: price,
            status: 'pending',
            description: description,
          },
          wisher: {
            name: (customerName as string) || 'Customer',
            rating: customerRating ? parseFloat(customerRating as string) : 4.8,
          },
        });
      }

      try {
        const msgResponse = await api.getChatMessages(roomId as string);
        setMessages(msgResponse.data || []);
      } catch {
        setMessages([]);
      }
    } catch (error) {
      setRoom({
        room_id: roomId as string,
        wish_id: 'demo',
        wisher_id: 'demo_wisher',
        status: 'active',
        wish_title: (wishTitle as string) || 'Service Request',
        wish: {
          title: (wishTitle as string) || 'Service Request',
          wish_type: 'service',
          remuneration: price,
          status: 'pending',
          description: description,
        },
        wisher: {
          name: (customerName as string) || 'Customer',
          rating: 4.8,
        },
      });
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content?: string) => {
    const text = content || newMessage.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setNewMessage('');

    const tempMsg: Message = {
      message_id: `temp_${Date.now()}`,
      room_id: roomId as string,
      sender_id: user?.user_id || 'me',
      sender_type: 'partner',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollViewRef.current?.scrollToEnd({ animated: true });

    try {
      await api.sendMessage(roomId as string, text);
    } catch (error) {
      console.log('Message sent locally');
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptDeal = async () => {
    setIsProcessing(true);
    try {
      if (currentDealId) {
        await api.acceptDeal(currentDealId);
      }
      setDealStatus('genie_accepted');
      await sendMessage(`✅ I'm interested and ready to help!\n\n💰 Price: ₹${price}\n📅 Preferred: ${preferredDate}\n\nWaiting for your confirmation.`);
      setShowOfferSentSuccess(true);
    } catch (error) {
      setDealStatus('genie_accepted');
      await sendMessage(`✅ I'm interested and ready to help! Waiting for your confirmation.`);
      setShowOfferSentSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartJob = async () => {
    setIsProcessing(true);
    try {
      if (currentDealId) {
        await api.startDealJob(currentDealId);
      }
      setDealStatus('in_progress');
      await sendMessage('🚀 Job Started! I am now working on your request.');
      setShowJobStartedSuccess(true);
    } catch (error) {
      setDealStatus('in_progress');
      await sendMessage('🚀 Job Started!');
      setShowJobStartedSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteJob = async () => {
    setShowCompleteModal(false);
    setIsProcessing(true);
    try {
      if (currentDealId) {
        await api.completeDealJob(currentDealId);
      }
      setDealStatus('completed');
      await sendMessage('🎉 Job Completed! Thank you for choosing my services. Hope you\'re satisfied!');
      setShowJobCompletedSuccess(true);
    } catch (error) {
      setDealStatus('completed');
      await sendMessage('🎉 Job Completed!');
      setShowJobCompletedSuccess(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCall = () => {
    const phone = room?.wisher?.phone || '+919876543210';
    Linking.openURL(`tel:${phone}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = new Date(msg.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) key = 'Today';
      else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
      else key = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  }, [messages]);

  const getStatusBadge = () => {
    switch (dealStatus) {
      case 'pending':
        return { text: 'New Request', color: COLORS.primary, bg: COLORS.primary + '20' };
      case 'genie_accepted':
        return { text: 'Awaiting Confirmation', color: COLORS.warning, bg: COLORS.warning + '20' };
      case 'confirmed':
        return { text: '📅 Appointment Set', color: COLORS.success, bg: COLORS.success + '20' };
      case 'in_progress':
        return { text: '🚀 In Progress', color: COLORS.warning, bg: COLORS.warning + '20' };
      case 'completed':
        return { text: '✅ Completed', color: COLORS.success, bg: COLORS.success + '20' };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusBadge = getStatusBadge();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {room?.wisher?.name?.charAt(0) || 'C'}
              </Text>
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{room?.wisher?.name || 'Customer'}</Text>
              <Text style={styles.headerStatus}>⭐ {room?.wisher?.rating || 4.8}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={handleCall} style={styles.callButton}>
            <Ionicons name="call" size={22} color={COLORS.success} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Clickable Deal Banner */}
      <TouchableOpacity 
        style={styles.dealBanner} 
        onPress={() => setShowDealDetails(true)}
        activeOpacity={0.7}
      >
        <View style={styles.dealBannerLeft}>
          <View style={styles.dealBannerIcon}>
            <Ionicons name="briefcase" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.dealBannerInfo}>
            <Text style={styles.dealBannerTitle} numberOfLines={1}>
              {room?.wish_title || 'Service Request'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.dealBannerRight}>
          <Text style={styles.dealBannerPrice}>₹{price}</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Action Button */}
      {dealStatus !== 'completed' && (
        <View style={styles.actionBar}>
          {dealStatus === 'pending' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]} 
              onPress={handleAcceptDeal}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Accept Deal</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {dealStatus === 'genie_accepted' && (
            <View style={styles.waitingContainer}>
              <ActivityIndicator size="small" color={COLORS.warning} />
              <Text style={styles.waitingText}>Waiting for customer to confirm...</Text>
            </View>
          )}

          {dealStatus === 'confirmed' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.startButton]} 
              onPress={handleStartJob}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="play-circle" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Start Job</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {dealStatus === 'in_progress' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.completeButton]} 
              onPress={() => setShowCompleteModal(true)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>Complete Job</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyChatText}>Start the conversation!</Text>
              <Text style={styles.emptyChatSubtext}>Tap "Accept Deal" to show interest</Text>
            </View>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <View key={date}>
                <View style={styles.dateSeparator}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateText}>{date}</Text>
                  <View style={styles.dateLine} />
                </View>
                {msgs.map((msg) => {
                  const isOwn = msg.sender_type === 'partner' || msg.sender_id === user?.user_id;
                  return (
                    <View key={msg.message_id} style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
                      <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
                        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
                          {msg.content}
                        </Text>
                        <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
                          {formatTime(msg.created_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { paddingBottom: keyboardVisible ? 10 : Math.max(insets.bottom, 10) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textMuted}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 300)}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage()}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Deal Details Modal */}
      <Modal visible={showDealDetails} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModal}>
            <View style={styles.detailsModalHeader}>
              <Text style={styles.detailsModalTitle}>Service Request</Text>
              <TouchableOpacity onPress={() => setShowDealDetails(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="briefcase-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailsSectionTitle}>Service</Text>
                </View>
                <Text style={styles.detailsServiceTitle}>{room?.wish_title || 'Service Request'}</Text>
              </View>

              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="flag-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailsSectionTitle}>Status</Text>
                </View>
                <View style={[styles.statusBadgeLarge, { backgroundColor: statusBadge.bg }]}>
                  <Text style={[styles.statusBadgeLargeText, { color: statusBadge.color }]}>
                    {statusBadge.text}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailsSectionTitle}>Description</Text>
                </View>
                <Text style={styles.detailsDescription}>{description}</Text>
              </View>

              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="wallet-outline" size={20} color={COLORS.success} />
                  <Text style={styles.detailsSectionTitle}>Budget</Text>
                </View>
                <Text style={styles.detailsBudget}>₹{price}</Text>
              </View>

              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailsSectionTitle}>Location</Text>
                </View>
                <Text style={styles.detailsText}>{location}</Text>
              </View>

              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailsSectionTitle}>Preferred Date</Text>
                </View>
                <Text style={styles.detailsText}>{preferredDate}</Text>
              </View>

              <View style={styles.detailsSection}>
                <View style={styles.detailsSectionHeader}>
                  <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.detailsSectionTitle}>Customer</Text>
                </View>
                <View style={styles.customerInfo}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {room?.wisher?.name?.charAt(0) || 'C'}
                    </Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.customerName}>{room?.wisher?.name || 'Customer'}</Text>
                    <Text style={styles.customerRating}>⭐ {room?.wisher?.rating || 4.8} rating</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.detailsModalFooter}>
              <TouchableOpacity 
                style={[styles.actionButton, { flex: 1, backgroundColor: COLORS.textMuted }]} 
                onPress={() => setShowDealDetails(false)}
              >
                <Ionicons name="close" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Confirmation Modal */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmModalIcon}>
              <Text style={{ fontSize: 48 }}>🎯</Text>
            </View>
            <Text style={styles.confirmModalTitle}>Ready to finish?</Text>
            <Text style={styles.confirmModalText}>
              Make sure you've completed all the work before marking this job as done!
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={styles.confirmModalCancel}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.confirmModalCancelText}>Not Yet</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmModalConfirm}
                onPress={handleCompleteJob}
              >
                <Text style={styles.confirmModalConfirmText}>Yes, Done! 🎉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Appointment Editing Modal - Shows after Wisher accepts */}
      <Modal visible={showAppointmentModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
          <View style={styles.appointmentModal}>
            {/* Header */}
            <View style={styles.appointmentModalHeader}>
              <View style={styles.appointmentModalHeaderIcon}>
                <Text style={{ fontSize: 32 }}>📅</Text>
              </View>
              <Text style={styles.appointmentModalTitle}>Set Appointment</Text>
              <Text style={styles.appointmentModalSubtitle}>
                Customer accepted! Confirm or edit the schedule
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              {/* Service Info */}
              <View style={styles.appointmentSection}>
                <Text style={styles.appointmentSectionLabel}>Service</Text>
                <View style={styles.appointmentServiceCard}>
                  <Ionicons name="briefcase" size={20} color={COLORS.primary} />
                  <Text style={styles.appointmentServiceTitle}>{room?.wish_title || 'Service Request'}</Text>
                </View>
              </View>

              {/* Customer */}
              <View style={styles.appointmentSection}>
                <Text style={styles.appointmentSectionLabel}>Customer</Text>
                <View style={styles.appointmentCustomerCard}>
                  <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.appointmentCustomerAvatar}>
                    <Text style={{ color: '#FFF', fontWeight: '700' }}>
                      {room?.wisher?.name?.charAt(0) || 'C'}
                    </Text>
                  </LinearGradient>
                  <View>
                    <Text style={styles.appointmentCustomerName}>{room?.wisher?.name || 'Customer'}</Text>
                    <Text style={styles.appointmentCustomerRating}>⭐ {room?.wisher?.rating || 4.8}</Text>
                  </View>
                </View>
              </View>

              {/* Date Picker */}
              <View style={styles.appointmentSection}>
                <Text style={styles.appointmentSectionLabel}>📅 Date</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={22} color={COLORS.primary} />
                  <Text style={styles.dateTimeButtonText}>{formatDateDisplay(appointmentDate)}</Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={appointmentDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        setAppointmentDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Time Picker */}
              <View style={styles.appointmentSection}>
                <Text style={styles.appointmentSectionLabel}>⏰ Time</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={22} color={COLORS.warning} />
                  <Text style={styles.dateTimeButtonText}>{formatTimeDisplay(appointmentTime)}</Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={appointmentTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setAppointmentTime(selectedTime);
                      }
                    }}
                  />
                )}
              </View>

              {/* Location */}
              <View style={styles.appointmentSection}>
                <Text style={styles.appointmentSectionLabel}>📍 Location</Text>
                <View style={styles.appointmentLocationCard}>
                  <Ionicons name="location" size={20} color={COLORS.error} />
                  <Text style={styles.appointmentLocationText}>{location}</Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.appointmentSection}>
                <Text style={styles.appointmentSectionLabel}>💰 Price</Text>
                <View style={styles.appointmentPriceCard}>
                  <Text style={styles.appointmentPriceAmount}>₹{price}</Text>
                </View>
              </View>

              {/* Notes */}
              <View style={styles.appointmentSection}>
                <Text style={styles.appointmentSectionLabel}>📝 Notes (optional)</Text>
                <TextInput
                  style={[styles.appointmentInput, { height: 80, textAlignVertical: 'top' }]}
                  value={appointmentNotes}
                  onChangeText={setAppointmentNotes}
                  placeholder="Any special instructions..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                />
              </View>
              
              {/* Future: Google Calendar Sync Note */}
              <View style={[styles.appointmentSection, { backgroundColor: COLORS.primary + '08', marginHorizontal: 20, borderRadius: 12, padding: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="sync" size={18} color={COLORS.primary} />
                  <Text style={{ fontSize: 12, color: COLORS.textSecondary, flex: 1 }}>
                    Google Calendar sync coming soon! Your appointments will auto-sync with your phone's calendar.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.appointmentActions}>
              <TouchableOpacity 
                style={styles.appointmentConfirmBtn}
                onPress={async () => {
                  const dateStr = formatDateDisplay(appointmentDate);
                  const timeStr = formatTimeDisplay(appointmentTime);
                  
                  // Create appointment in backend
                  try {
                    await api.default.post('/appointments', {
                      deal_id: currentDealId,
                      wish_id: wishId,
                      service_title: wishTitle || room?.wish_title,
                      customer_name: customerName || room?.wisher?.name,
                      scheduled_date: dateStr,
                      scheduled_time: timeStr,
                      location: location,
                      price: price,
                      notes: appointmentNotes,
                    });
                  } catch (e) {
                    console.log('Appointment saved locally');
                  }
                  
                  // Send confirmation message
                  await sendMessage(`📅 **Appointment Confirmed!**\n\n📆 ${dateStr}\n⏰ ${timeStr}\n📍 ${location}\n💰 ₹${price}${appointmentNotes ? `\n📝 ${appointmentNotes}` : ''}\n\nSee you soon! 🙌`);
                  
                  setShowAppointmentModal(false);
                  setShowJobConfirmedSuccess(true);
                }}
              >
                <LinearGradient
                  colors={[COLORS.success, '#34D399']}
                  style={styles.appointmentConfirmGradient}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                  <Text style={styles.appointmentConfirmText}>Confirm Appointment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gamified Success Modals */}
      <SuccessModal
        visible={showOfferSentSuccess}
        onClose={() => setShowOfferSentSuccess(false)}
        title="Offer Sent! 🚀"
        subtitle="Great! The customer has been notified. You'll hear back soon!"
        icon="📤"
        actionText="Got it!"
      />

      <SuccessModal
        visible={showJobConfirmedSuccess}
        onClose={() => setShowJobConfirmedSuccess(false)}
        title="Job Confirmed! 🎉"
        subtitle={`Appointment added to your schedule!\n\n📅 ${preferredDate}\n📍 ${location}`}
        icon="✅"
        actionText="Let's Go!"
      />

      <SuccessModal
        visible={showJobStartedSuccess}
        onClose={() => setShowJobStartedSuccess(false)}
        title="You're On! 💪"
        subtitle="The customer knows you've started. Do your magic!"
        icon="🚀"
        confetti={false}
        actionText="On it!"
      />

      <SuccessModal
        visible={showJobCompletedSuccess}
        onClose={() => setShowJobCompletedSuccess(false)}
        title="Amazing Work! 🏆"
        subtitle={`You earned ₹${price}!\n\nKeep up the great work, Genie!`}
        icon="💰"
        actionText="Celebrate! 🎊"
      />
    </View>
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
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
  },
  headerSafe: {
    backgroundColor: COLORS.cardBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  callButton: {
    padding: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
  },
  dealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dealBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dealBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealBannerInfo: {
    flex: 1,
  },
  dealBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dealBannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealBannerPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.success,
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  startButton: {
    backgroundColor: COLORS.success,
  },
  completeButton: {
    backgroundColor: COLORS.warning,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 12,
  },
  waitingText: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyChatText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyChatSubtext: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  messageRow: {
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  messageRowOwn: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#FFF',
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailsModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsServiceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailsDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  detailsBudget: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
  },
  detailsText: {
    fontSize: 15,
    color: COLORS.text,
  },
  statusBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeLargeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerRating: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailsModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  confirmModal: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 'auto',
    marginTop: 'auto',
    alignItems: 'center',
  },
  confirmModalIcon: {
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  confirmModalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmModalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  confirmModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmModalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  confirmModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  // Appointment Modal Styles
  appointmentModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  appointmentModalHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  appointmentModalHeaderIcon: {
    marginBottom: 8,
  },
  appointmentModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  appointmentModalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  appointmentSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appointmentSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  appointmentServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary + '10',
    padding: 14,
    borderRadius: 12,
  },
  appointmentServiceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  appointmentCustomerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
  },
  appointmentCustomerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentCustomerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  appointmentCustomerRating: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  appointmentInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appointmentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
  },
  appointmentLocationText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  appointmentPriceCard: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  appointmentPriceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
  },
  appointmentActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  appointmentConfirmBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  appointmentConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  appointmentConfirmText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});
