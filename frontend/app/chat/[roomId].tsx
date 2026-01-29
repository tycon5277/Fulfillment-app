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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
  };
  wisher?: {
    name: string;
    phone?: string;
    rating?: number;
  };
}

export default function ChatDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { roomId, dealId, wishId, wishTitle, wishBudget, customerName, customerRating } = params;
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Deal states - simplified
  const [currentDealId, setCurrentDealId] = useState<string | null>(dealId as string || null);
  const [dealStatus, setDealStatus] = useState<'pending' | 'accepted' | 'in_progress' | 'completed'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const price = wishBudget ? parseInt(wishBudget as string) : (room?.wish?.remuneration || 0);

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

  // Load data
  useEffect(() => {
    loadData();
  }, [roomId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Try to fetch room from API
      const response = await api.getChatRooms();
      const foundRoom = response.data.find((r: ChatRoom) => r.room_id === roomId);
      
      if (foundRoom) {
        setRoom(foundRoom);
      } else {
        // Use params from navigation
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
          },
          wisher: {
            name: (customerName as string) || 'Customer',
            rating: customerRating ? parseFloat(customerRating as string) : 4.8,
          },
        });
      }

      // Try to fetch messages
      try {
        const msgResponse = await api.getChatMessages(roomId as string);
        setMessages(msgResponse.data || []);
      } catch {
        setMessages([]);
      }
    } catch (error) {
      // Fallback
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

    // Add message locally first for instant feedback
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

  // Simple deal actions
  const handleAcceptDeal = async () => {
    setIsProcessing(true);
    try {
      if (currentDealId) {
        await api.acceptDeal(currentDealId);
      }
      setDealStatus('accepted');
      await sendMessage('✅ Deal Accepted! I will be there as scheduled.');
      Alert.alert('Deal Accepted!', 'You can now start the job when ready.');
    } catch (error) {
      setDealStatus('accepted');
      await sendMessage('✅ Deal Accepted! I will be there as scheduled.');
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
      Alert.alert('Job Started', 'Customer has been notified.');
    } catch (error) {
      setDealStatus('in_progress');
      await sendMessage('🚀 Job Started!');
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
      await sendMessage('🎉 Job Completed! Thank you for choosing my services.');
      Alert.alert('🎉 Job Completed!', `Great work! You earned ₹${price}`);
    } catch (error) {
      setDealStatus('completed');
      await sendMessage('🎉 Job Completed!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCall = () => {
    const phone = room?.wisher?.phone || '+919876543210';
    Linking.openURL(`tel:${phone}`);
  };

  const handleGoBack = () => {
    // Just navigate back without changing online status
    router.back();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
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

      {/* Deal Info Banner - Simple */}
      <View style={styles.dealBanner}>
        <View style={styles.dealBannerLeft}>
          <Ionicons name="briefcase" size={18} color={COLORS.primary} />
          <Text style={styles.dealBannerTitle} numberOfLines={1}>
            {room?.wish_title || 'Service Request'}
          </Text>
        </View>
        <Text style={styles.dealBannerPrice}>₹{price}</Text>
      </View>

      {/* Simple Action Button - Based on Status */}
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

          {dealStatus === 'accepted' && (
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

        {/* Input Area - Fixed at bottom */}
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

      {/* Complete Confirmation Modal */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmModalIcon}>
              <Ionicons name="checkmark-done-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.confirmModalTitle}>Complete Job?</Text>
            <Text style={styles.confirmModalText}>
              Are you sure you've finished this job? The customer will be notified.
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
                <Text style={styles.confirmModalConfirmText}>Yes, Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Header
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

  // Deal Banner
  dealBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dealBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  dealBannerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  dealBannerPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },

  // Action Bar - Simple buttons
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

  // Chat Container
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
  },

  // Date Separator
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

  // Messages
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

  // Input Container - FIXED
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmModal: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
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
});
