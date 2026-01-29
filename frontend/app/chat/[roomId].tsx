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
  Animated,
  Linking,
  Image,
  Modal,
  Dimensions,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as api from '../../src/api';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#6366F1',
  primaryLight: '#818CF8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#F3F4F6',
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
  type?: 'text' | 'image' | 'voice' | 'system' | 'offer';
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface VoiceMessage {
  uri: string;
  duration: number;
}

interface ChatRoom {
  room_id: string;
  wish_id: string;
  wisher_id: string;
  partner_id?: string;
  agent_id?: string;
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

// Quick reply templates for Genie
const QUICK_REPLIES = [
  { id: 'omw', text: 'On my way! 🚗', icon: 'car' },
  { id: 'arrived', text: "I've arrived! 📍", icon: 'location' },
  { id: 'eta', text: 'Will reach in 10 mins', icon: 'time' },
  { id: 'confirm', text: 'Confirmed! ✅', icon: 'checkmark-circle' },
  { id: 'thanks', text: 'Thank you! 🙏', icon: 'heart' },
  { id: 'details', text: 'Can you share more details?', icon: 'help-circle' },
];

// Deal progress steps
const PROGRESS_STEPS = [
  { id: 'negotiating', label: 'Negotiating', icon: 'chatbubble-ellipses' },
  { id: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
  { id: 'in_progress', label: 'In Progress', icon: 'timer' },
  { id: 'completed', label: 'Completed', icon: 'trophy' },
];

export default function ChatDetailScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showWisherInfo, setShowWisherInfo] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);

  // Deal negotiation states
  const [dealStatus, setDealStatus] = useState<'negotiating' | 'offer_sent' | 'accepted' | 'in_progress' | 'completed'>('negotiating');
  const [showDealModal, setShowDealModal] = useState(false);
  const [dealOffer, setDealOffer] = useState({
    price: room?.wish?.remuneration || 1500,
    scheduledDate: 'Today',
    scheduledTime: '2:00 PM',
    notes: '',
  });
  const [counterOfferPrice, setCounterOfferPrice] = useState('');
  const [showCounterOfferInput, setShowCounterOfferInput] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Voice playback states
  const [voiceMessages, setVoiceMessages] = useState<Record<string, VoiceMessage>>({});
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Modals
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // Typing indicator
  const [isWisherTyping, setIsWisherTyping] = useState(false);
  const typingAnimation = useRef(new Animated.Value(0)).current;
  
  const wisherInfoHeight = useRef(new Animated.Value(0)).current;

  // Simulate typing indicator
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7 && room?.status === 'active') {
        setIsWisherTyping(true);
        setTimeout(() => setIsWisherTyping(false), 3000);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [room?.status]);

  // Typing animation
  useEffect(() => {
    if (isWisherTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(typingAnimation, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      typingAnimation.setValue(0);
    }
  }, [isWisherTyping]);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await api.getChatMessages(roomId as string);
      if (response.data && response.data.length > 0) {
        const enhancedMessages = response.data.map((msg: Message, idx: number) => ({
          ...msg,
          status: idx === response.data.length - 1 ? 'delivered' : 'read',
        }));
        setMessages(enhancedMessages);
      }
    } catch (error: any) {
      // Silently handle error - use empty messages or mock data
      console.log('Chat messages not found, using empty state');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await api.getChatRooms();
      const foundRoom = response.data.find((r: ChatRoom) => r.room_id === roomId);
      if (foundRoom) {
        setRoom(foundRoom);
      } else {
        // Create a mock room for demo purposes
        setRoom({
          room_id: roomId as string,
          wish_id: 'demo_wish',
          wisher_id: 'demo_wisher',
          status: 'active',
          wish_title: 'Service Request',
          wish: {
            title: 'Service Request',
            wish_type: 'service',
            remuneration: 1500,
            status: 'in_progress',
          },
          wisher: {
            name: 'Customer',
            phone: '+91 98765 43210',
            rating: 4.8,
          },
        });
      }
    } catch (error: any) {
      // Create a mock room on error
      console.log('Chat room not found, using demo data');
      setRoom({
        room_id: roomId as string,
        wish_id: 'demo_wish',
        wisher_id: 'demo_wisher',
        status: 'active',
        wish_title: 'Service Request',
        wish: {
          title: 'Service Request',
          wish_type: 'service',
          remuneration: 1500,
          status: 'in_progress',
        },
        wisher: {
          name: 'Customer',
          phone: '+91 98765 43210',
          rating: 4.8,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchRoom, fetchMessages]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const toggleWisherInfo = () => {
    const toValue = showWisherInfo ? 0 : 1;
    Animated.timing(wisherInfoHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setShowWisherInfo(!showWisherInfo);
  };

  const sendMessage = async (text?: string, type: 'text' | 'image' | 'voice' = 'text', mediaData?: any) => {
    const messageText = text || newMessage.trim();
    if ((!messageText && type === 'text') || !roomId) return;

    setIsSending(true);
    try {
      const response = await api.sendMessage(roomId as string, messageText || `[${type}]`);

      if (type === 'voice' && mediaData) {
        const newMessageId = response.data?.message_id || `voice_${Date.now()}`;
        setVoiceMessages(prev => ({
          ...prev,
          [newMessageId]: mediaData
        }));
      }

      setNewMessage('');
      setShowQuickReplies(false);
      setShowAttachmentOptions(false);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Voice Recording Functions
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record voice messages.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const duration = recordingDuration;
      setRecording(null);

      if (uri && duration >= 1) {
        const tempId = `voice_${Date.now()}`;
        setVoiceMessages(prev => ({
          ...prev,
          [tempId]: { uri, duration }
        }));
        await sendMessage(`🎤 Voice message (${duration}s)`, 'voice', { uri, duration });
      }

      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;

    try {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  };

  // Voice Playback
  const playVoiceMessage = async (messageId: string, messageContent: string) => {
    try {
      if (playingVoice === messageId) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setPlayingVoice(null);
        setPlaybackProgress(0);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const voiceData = voiceMessages[messageId];

      if (voiceData && voiceData.uri) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: voiceData.uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded) {
              if (status.didJustFinish) {
                setPlayingVoice(null);
                setPlaybackProgress(0);
              } else if (status.positionMillis && status.durationMillis) {
                setPlaybackProgress(status.positionMillis / status.durationMillis);
              }
            }
          }
        );

        soundRef.current = sound;
        setPlayingVoice(messageId);
      } else {
        // Simulate playback
        setPlayingVoice(messageId);
        const durationMatch = messageContent.match(/\((\d+)s\)/);
        const duration = durationMatch ? parseInt(durationMatch[1]) * 1000 : 3000;

        let progress = 0;
        const interval = setInterval(() => {
          progress += 100 / (duration / 100);
          setPlaybackProgress(progress / 100);
          if (progress >= 100) {
            clearInterval(interval);
            setPlayingVoice(null);
            setPlaybackProgress(0);
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error playing voice message:', error);
    }
  };

  // Image Picker
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permission.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await sendMessage('📷 Image', 'image', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
    setShowAttachmentOptions(false);
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permission.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await sendMessage('📷 Photo', 'image', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
    setShowAttachmentOptions(false);
  };

  const handleCall = () => {
    if (room?.wisher?.phone) {
      Linking.openURL(`tel:${room.wisher.phone}`);
    } else {
      Alert.alert('Phone Unavailable', 'Customer phone number is not available yet.');
    }
  };

  const handleShareLocation = () => {
    Alert.alert('Share Location', 'Your current location will be shared with the customer.');
    sendMessage('📍 Location shared');
  };

  const handleMarkComplete = () => {
    setShowCompleteModal(true);
  };

  const confirmComplete = async () => {
    try {
      // In production, call API to mark wish as complete
      Alert.alert('🎉 Job Completed!', 'Great work! The customer will be notified.');
      setShowCompleteModal(false);
      // Show rating modal
      setTimeout(() => setShowRatingModal(true), 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark as complete');
    }
  };

  const submitRating = () => {
    Alert.alert('Thank You!', 'Your feedback has been recorded.', [
      { text: 'OK', onPress: () => setShowRatingModal(false) }
    ]);
  };

  // Deal Negotiation Functions
  const handleSendOffer = async () => {
    const offerMessage = `💼 **DEAL OFFER**\n\n📋 Service: ${room?.wish_title || 'Service'}\n💰 Price: ₹${dealOffer.price}\n📅 Date: ${dealOffer.scheduledDate}\n⏰ Time: ${dealOffer.scheduledTime}${dealOffer.notes ? `\n📝 Notes: ${dealOffer.notes}` : ''}\n\n✅ Tap "Accept Deal" below to confirm`;
    
    await sendMessage(offerMessage);
    setDealStatus('offer_sent');
    setShowDealModal(false);
    Alert.alert('Offer Sent!', 'Waiting for customer to accept your offer.');
  };

  const handleAcceptDeal = async () => {
    setDealStatus('accepted');
    await sendMessage('✅ Deal Accepted! I will be there as scheduled. 🤝');
    Alert.alert('🎉 Deal Confirmed!', 'The customer has been notified. You can now start working on this job.', [
      { text: 'OK' }
    ]);
  };

  const handleStartJob = async () => {
    setDealStatus('in_progress');
    await sendMessage('🚀 Job Started! I am now working on your request.');
    Alert.alert('Job Started', 'Customer has been notified that you\'ve started working.');
  };

  const handleSendCounterOffer = async () => {
    if (!counterOfferPrice) {
      Alert.alert('Error', 'Please enter a price for your counter offer.');
      return;
    }
    
    const counterMessage = `💰 **COUNTER OFFER**\n\nI can do this for ₹${counterOfferPrice}\n\nPlease let me know if this works for you!`;
    await sendMessage(counterMessage);
    setShowCounterOfferInput(false);
    setCounterOfferPrice('');
  };

  const handleDeclineDeal = () => {
    Alert.alert(
      'Decline Deal?',
      'Are you sure you want to decline this deal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: async () => {
            await sendMessage('❌ I apologize, but I cannot take this job at the moment. Thank you for understanding.');
            router.back();
          }
        }
      ]
    );
  };

  // Render Deal Negotiation Card (shown in chat)
  const renderDealCard = () => {
    if (dealStatus === 'completed') return null;
    
    return (
      <View style={styles.dealCard}>
        {/* Deal Header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.dealCardHeader}
        >
          <Ionicons name="briefcase" size={20} color="#FFF" />
          <Text style={styles.dealCardHeaderText}>
            {dealStatus === 'negotiating' ? '💬 Negotiating' : 
             dealStatus === 'offer_sent' ? '📤 Offer Sent' :
             dealStatus === 'accepted' ? '✅ Deal Accepted' :
             '🔄 In Progress'}
          </Text>
        </LinearGradient>

        {/* Deal Details */}
        <View style={styles.dealCardBody}>
          <View style={styles.dealDetailRow}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.dealDetailText}>{room?.wish_title || 'Service Request'}</Text>
          </View>
          
          <View style={styles.dealDetailRow}>
            <Ionicons name="cash-outline" size={18} color={COLORS.success} />
            <Text style={[styles.dealDetailText, { color: COLORS.success, fontWeight: '700' }]}>
              ₹{room?.wish?.remuneration || dealOffer.price}
            </Text>
          </View>

          {/* Action Buttons based on status */}
          {dealStatus === 'negotiating' && (
            <View style={styles.dealActions}>
              <TouchableOpacity 
                style={styles.dealActionBtn}
                onPress={() => setShowDealModal(true)}
              >
                <Ionicons name="send" size={18} color="#FFF" />
                <Text style={styles.dealActionBtnText}>Send Offer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dealActionBtn, styles.dealActionBtnSecondary]}
                onPress={() => setShowCounterOfferInput(true)}
              >
                <Ionicons name="swap-horizontal" size={18} color={COLORS.primary} />
                <Text style={[styles.dealActionBtnText, { color: COLORS.primary }]}>Counter</Text>
              </TouchableOpacity>
            </View>
          )}

          {dealStatus === 'offer_sent' && (
            <View style={styles.dealWaiting}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.dealWaitingText}>Waiting for customer response...</Text>
            </View>
          )}

          {dealStatus === 'accepted' && (
            <View style={styles.dealActions}>
              <TouchableOpacity 
                style={[styles.dealActionBtn, { backgroundColor: COLORS.success }]}
                onPress={handleStartJob}
              >
                <Ionicons name="play-circle" size={18} color="#FFF" />
                <Text style={styles.dealActionBtnText}>Start Job</Text>
              </TouchableOpacity>
            </View>
          )}

          {dealStatus === 'in_progress' && (
            <View style={styles.dealActions}>
              <TouchableOpacity 
                style={[styles.dealActionBtn, { backgroundColor: COLORS.warning }]}
                onPress={handleMarkComplete}
              >
                <Ionicons name="checkmark-done-circle" size={18} color="#FFF" />
                <Text style={styles.dealActionBtnText}>Mark Complete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Counter Offer Input */}
        {showCounterOfferInput && (
          <View style={styles.counterOfferContainer}>
            <Text style={styles.counterOfferLabel}>Enter your price:</Text>
            <View style={styles.counterOfferRow}>
              <Text style={styles.counterOfferCurrency}>₹</Text>
              <TextInput
                style={styles.counterOfferInput}
                placeholder="1500"
                keyboardType="numeric"
                value={counterOfferPrice}
                onChangeText={setCounterOfferPrice}
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity 
                style={styles.counterOfferSend}
                onPress={handleSendCounterOffer}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowCounterOfferInput(false)}>
              <Text style={styles.counterOfferCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getCurrentStep = () => {
    const statusMap: Record<string, number> = {
      'active': 0,
      'negotiating': 0,
      'accepted': 1,
      'in_progress': 2,
      'completed': 3,
    };
    return statusMap[room?.status || 'active'] || 0;
  };

  const getMessageStatusIcon = (status?: string, isOwn?: boolean) => {
    if (!isOwn) return null;
    switch (status) {
      case 'sending':
        return <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.5)" />;
      case 'sent':
        return <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />;
      case 'read':
        return <Ionicons name="checkmark-done" size={14} color="#60A5FA" />;
      default:
        return <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" />;
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { [date: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = formatDate(msg.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  }, [messages]);

  const interpolatedHeight = wisherInfoHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const renderMessage = (message: Message) => {
    const isOwn = message.sender_id === user?.user_id || message.sender_type === 'partner';
    const isVoice = message.content.includes('🎤 Voice message');
    const isImage = message.content.includes('📷');
    const isSystem = message.content.includes('📍') || message.content.includes('✅');

    // System Message
    if (isSystem && !isOwn) {
      return (
        <View key={message.message_id} style={styles.systemMessageContainer}>
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{message.content}</Text>
          </View>
        </View>
      );
    }

    // Voice Message
    if (isVoice) {
      const durationMatch = message.content.match(/\((\d+)s\)/);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
      const isPlaying = playingVoice === message.message_id;

      return (
        <View key={message.message_id} style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
          <TouchableOpacity
            style={[styles.voiceMessage, isOwn ? styles.voiceMessageOwn : styles.voiceMessageOther]}
            onPress={() => playVoiceMessage(message.message_id, message.content)}
          >
            <View style={[styles.voicePlayButton, isOwn && styles.voicePlayButtonOwn]}>
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={20}
                color={isOwn ? '#fff' : COLORS.primary}
              />
            </View>
            <View style={styles.voiceWaveform}>
              {[...Array(15)].map((_, i) => {
                const barProgress = i / 15;
                const isActive = isPlaying && barProgress <= playbackProgress;
                return (
                  <View
                    key={i}
                    style={[
                      styles.voiceBar,
                      {
                        height: 8 + Math.sin(i * 0.8) * 12 + Math.random() * 4,
                        backgroundColor: isOwn
                          ? (isActive ? '#fff' : 'rgba(255,255,255,0.4)')
                          : (isActive ? COLORS.primary : '#C7D2FE'),
                      }
                    ]}
                  />
                );
              })}
            </View>
            <Text style={[styles.voiceDuration, isOwn && styles.voiceDurationOwn]}>
              {isPlaying ? `${Math.floor(playbackProgress * duration)}s` : `${duration}s`}
            </Text>
          </TouchableOpacity>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
              {formatTime(message.created_at)}
            </Text>
            {getMessageStatusIcon(message.status, isOwn)}
          </View>
        </View>
      );
    }

    // Regular Text Message
    return (
      <View key={message.message_id} style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {message.content}
          </Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
            {formatTime(message.created_at)}
          </Text>
          {getMessageStatusIcon(message.status, isOwn)}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} onPress={toggleWisherInfo}>
          <View style={styles.headerAvatar}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryLight]} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>
                {room?.wisher?.name?.charAt(0) || 'C'}
              </Text>
            </LinearGradient>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{room?.wisher?.name || 'Customer'}</Text>
            <Text style={styles.headerStatus}>
              {isWisherTyping ? '✍️ typing...' : 
               room?.status === 'completed' ? '🏆 Completed' : '💬 Tap for info'}
            </Text>
          </View>
          <Ionicons
            name={showWisherInfo ? "chevron-up" : "chevron-down"}
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenuModal(true)}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Expandable Wisher Info Panel */}
      <Animated.View style={[styles.wisherInfoPanel, { height: interpolatedHeight }]}>
        <View style={styles.wisherInfoContent}>
          <View style={styles.wisherStats}>
            <View style={styles.wisherStatItem}>
              <Text style={styles.wisherStatValue}>⭐ {room?.wisher?.rating || '5.0'}</Text>
              <Text style={styles.wisherStatLabel}>Rating</Text>
            </View>
            <View style={styles.wisherStatDivider} />
            <View style={styles.wisherStatItem}>
              <TouchableOpacity onPress={handleCall}>
                <Ionicons name="call" size={24} color={COLORS.success} />
              </TouchableOpacity>
              <Text style={styles.wisherStatLabel}>Call</Text>
            </View>
            <View style={styles.wisherStatDivider} />
            <View style={styles.wisherStatItem}>
              <TouchableOpacity onPress={handleShareLocation}>
                <Ionicons name="location" size={24} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.wisherStatLabel}>Location</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Deal Progress Tracker */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          {PROGRESS_STEPS.map((step, index) => {
            const currentStep = getCurrentStep();
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <React.Fragment key={step.id}>
                <View style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    isCompleted && styles.progressDotCompleted,
                    isCurrent && styles.progressDotCurrent,
                  ]}>
                    <Ionicons
                      name={step.icon as any}
                      size={12}
                      color={isCompleted || isCurrent ? '#fff' : COLORS.textMuted}
                    />
                  </View>
                  <Text style={[
                    styles.progressLabel,
                    (isCompleted || isCurrent) && styles.progressLabelActive
                  ]}>
                    {step.label}
                  </Text>
                </View>
                {index < PROGRESS_STEPS.length - 1 && (
                  <View style={[
                    styles.progressLine,
                    isCompleted && styles.progressLineCompleted,
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Quick Actions Bar */}
      <View style={styles.quickActionsBar}>
        <TouchableOpacity style={styles.quickAction} onPress={handleCall}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="call" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.quickActionText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleShareLocation}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="location" size={18} color={COLORS.success} />
          </View>
          <Text style={styles.quickActionText}>Location</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleMarkComplete}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="checkmark-done" size={18} color={COLORS.warning} />
          </View>
          <Text style={styles.quickActionText}>Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(main)/tracking-demo')}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="navigate" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.quickActionText}>Navigate</Text>
        </TouchableOpacity>
      </View>

      {/* Wish Info Banner */}
      {room?.wish_title && (
        <View style={styles.wishBanner}>
          <View style={styles.wishBannerIcon}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.wishBannerContent}>
            <Text style={styles.wishBannerTitle} numberOfLines={1}>
              {room.wish_title}
            </Text>
            {room.wish?.remuneration && (
              <Text style={styles.wishBannerPrice}>₹{room.wish.remuneration}</Text>
            )}
          </View>
        </View>
      )}

      {/* Deal Negotiation Card */}
      {renderDealCard()}

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyText}>Start the conversation!</Text>
            <Text style={styles.emptySubtext}>Introduce yourself and discuss the service details</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <View key={date}>
                <View style={styles.dateSeparator}>
                  <View style={styles.dateLine} />
                  <Text style={styles.dateText}>{date}</Text>
                  <View style={styles.dateLine} />
                </View>
                {msgs.map(renderMessage)}
              </View>
            ))}
            
            {/* Typing Indicator */}
            {isWisherTyping && (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <Animated.View style={[styles.typingDot, { opacity: typingAnimation }]} />
                  <Animated.View style={[styles.typingDot, { opacity: typingAnimation, marginLeft: 4 }]} />
                  <Animated.View style={[styles.typingDot, { opacity: typingAnimation, marginLeft: 4 }]} />
                </View>
                <Text style={styles.typingText}>Customer is typing...</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Quick Replies */}
        {showQuickReplies && (
          <View style={styles.quickRepliesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {QUICK_REPLIES.map((reply) => (
                <TouchableOpacity
                  key={reply.id}
                  style={styles.quickReplyButton}
                  onPress={() => sendMessage(reply.text)}
                >
                  <Ionicons name={reply.icon as any} size={16} color={COLORS.primary} />
                  <Text style={styles.quickReplyText}>{reply.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Attachment Options */}
        {showAttachmentOptions && (
          <View style={styles.attachmentOptions}>
            <TouchableOpacity style={styles.attachmentOption} onPress={takePhoto}>
              <View style={[styles.attachmentIconBg, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="camera" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.attachmentLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={pickImage}>
              <View style={[styles.attachmentIconBg, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="image" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.attachmentLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={handleShareLocation}>
              <View style={[styles.attachmentIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="location" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.attachmentLabel}>Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recording Overlay */}
        {isRecording && (
          <View style={styles.recordingOverlay}>
            <View style={styles.recordingContent}>
              <Animated.View style={[styles.recordingWave, {
                transform: [{ scale: typingAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }]
              }]}>
                <View style={styles.recordingDot} />
              </Animated.View>
              <Text style={styles.recordingTime}>{recordingDuration}s</Text>
              <Text style={styles.recordingHint}>Recording voice message...</Text>
            </View>
            <View style={styles.recordingActions}>
              <TouchableOpacity style={styles.cancelRecordingButton} onPress={cancelRecording}>
                <Ionicons name="close" size={24} color={COLORS.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording}>
                <Ionicons name="send" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Container */}
        {!isRecording && (
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
            >
              <Ionicons
                name={showAttachmentOptions ? "close" : "add-circle"}
                size={28}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={COLORS.textMuted}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.quickReplyToggle}
                onPress={() => setShowQuickReplies(!showQuickReplies)}
              >
                <Ionicons
                  name="flash"
                  size={20}
                  color={showQuickReplies ? COLORS.primary : COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>

            {newMessage.trim() ? (
              <TouchableOpacity
                style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                onPress={() => sendMessage()}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.voiceButton}
                onPress={startRecording}
              >
                <Ionicons name="mic" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Menu Modal */}
      <Modal visible={showMenuModal} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenuModal(false);
              handleCall();
            }}>
              <Ionicons name="call-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Call Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenuModal(false);
              handleShareLocation();
            }}>
              <Ionicons name="location-outline" size={20} color={COLORS.text} />
              <Text style={styles.menuItemText}>Share Location</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenuModal(false);
              handleMarkComplete();
            }}>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
              <Text style={[styles.menuItemText, { color: COLORS.success }]}>Mark Complete</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowMenuModal(false)}>
              <Ionicons name="flag-outline" size={20} color={COLORS.error} />
              <Text style={[styles.menuItemText, { color: COLORS.error }]}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Complete Confirmation Modal */}
      <Modal visible={showCompleteModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.completeModal}>
            <View style={styles.completeModalIcon}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.completeModalTitle}>Mark as Complete?</Text>
            <Text style={styles.completeModalSubtitle}>
              Confirm that you have completed this service. The customer will be notified.
            </Text>
            <View style={styles.completeModalActions}>
              <TouchableOpacity
                style={styles.completeModalCancel}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.completeModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completeModalConfirm}
                onPress={confirmComplete}
              >
                <Text style={styles.completeModalConfirmText}>Yes, Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModal}>
            <View style={styles.ratingHeader}>
              <Text style={styles.ratingEmoji}>⭐</Text>
              <Text style={styles.ratingTitle}>Rate the Customer</Text>
              <Text style={styles.ratingSubtitle}>How was your experience?</Text>
            </View>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? "#F59E0B" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {rating === 5 ? 'Excellent! 🌟' :
                 rating === 4 ? 'Great! 😊' :
                 rating === 3 ? 'Good 👍' :
                 rating === 2 ? 'Fair 😐' : 'Poor 😞'}
              </Text>
            )}

            <TextInput
              style={styles.reviewInput}
              placeholder="Any feedback? (optional)"
              placeholderTextColor={COLORS.textMuted}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              maxLength={300}
            />

            <View style={styles.ratingActions}>
              <TouchableOpacity
                style={styles.ratingSkipButton}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.ratingSkipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingSubmitButton, rating === 0 && styles.ratingSubmitDisabled]}
                onPress={submitRating}
                disabled={rating === 0}
              >
                <Text style={styles.ratingSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerAvatar: {
    position: 'relative',
  },
  avatarGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wisherInfoPanel: {
    backgroundColor: COLORS.cardBg,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  wisherInfoContent: {
    padding: 16,
  },
  wisherStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  wisherStatItem: {
    alignItems: 'center',
  },
  wisherStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  wisherStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  wisherStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  progressContainer: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressDotCompleted: {
    backgroundColor: COLORS.success,
  },
  progressDotCurrent: {
    backgroundColor: COLORS.primary,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  progressLabelActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
    marginBottom: 18,
  },
  progressLineCompleted: {
    backgroundColor: COLORS.success,
  },
  quickActionsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  wishBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  wishBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  wishBannerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishBannerTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: 10,
  },
  wishBannerPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
  },
  chatContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
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
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: 12,
    fontWeight: '500',
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
    borderRadius: 18,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  messageTimeOwn: {
    color: COLORS.textSecondary,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  systemMessageText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    minWidth: 180,
  },
  voiceMessageOwn: {
    backgroundColor: COLORS.primary,
  },
  voiceMessageOther: {
    backgroundColor: COLORS.cardBg,
  },
  voicePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voicePlayButtonOwn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 2,
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
    minWidth: 25,
  },
  voiceDurationOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  typingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  quickRepliesContainer: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickReplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickReplyText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
  attachmentOptions: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-around',
  },
  attachmentOption: {
    alignItems: 'center',
  },
  attachmentIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  attachmentLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  recordingOverlay: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  recordingContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordingWave: {
    marginBottom: 12,
  },
  recordingDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.error,
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  recordingHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  recordingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  cancelRecordingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopRecordingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    marginHorizontal: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  quickReplyToggle: {
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuModal: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  completeModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  completeModalIcon: {
    marginBottom: 16,
  },
  completeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  completeModalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  completeModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  completeModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  completeModalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  completeModalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
  },
  completeModalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  ratingModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  ratingHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  ratingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 6,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  reviewInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  ratingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingSkipButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  ratingSkipText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  ratingSubmitButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  ratingSubmitDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  ratingSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Deal Card Styles
  dealCard: {
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  dealCardHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  dealCardBody: {
    padding: 16,
  },
  dealDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  dealDetailText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  dealActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  dealActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  dealActionBtnSecondary: {
    backgroundColor: '#EEF2FF',
  },
  dealActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  dealWaiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  dealWaitingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  counterOfferContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
    marginTop: 12,
  },
  counterOfferLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  counterOfferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterOfferCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  counterOfferInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  counterOfferSend: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterOfferCancel: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 10,
  },
});
