import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GameModal from '../../src/components/GameModal';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  cyan: '#06B6D4',
  green: '#34D399',
  amber: '#F59E0B',
  magenta: '#D946EF',
  pink: '#EC4899',
  blue: '#3B82F6',
  red: '#F87171',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  headerBg: '#1E3A5F',
};

// Wish states flow: waiting → incoming → negotiating → contract → in_progress → completed
type WishState = 'waiting' | 'incoming' | 'negotiating' | 'contract' | 'in_progress' | 'completed';

// Mock incoming wish request
const MOCK_INCOMING_WISH = {
  id: 'wish_001',
  wisher: {
    name: 'Priya Sharma',
    avatar: 'P',
    rating: 4.8,
    totalWishes: 12,
    phone: '+91 98765 43210',
  },
  category: 'Groceries',
  emoji: '🛒',
  title: 'Monthly Groceries Shopping',
  description: 'Need help buying groceries from Big Bazaar. Will share the list once connected. Approximately 15-20 items.',
  budget: { min: 200, max: 400 },
  location: {
    pickup: 'Big Bazaar, Sector 18',
    dropoff: 'Tower B, DLF Cyber City',
    distance: 3.2,
  },
  estimatedTime: '45-60 mins',
  postedAt: '2 min ago',
  xpReward: 120,
};

// Mock chat messages
const INITIAL_MESSAGES = [
  { id: '1', sender: 'wisher', text: 'Hi! Thanks for accepting. Can you help me with groceries?', time: '10:30 AM' },
  { id: '2', sender: 'genie', text: 'Yes, absolutely! What items do you need?', time: '10:31 AM' },
];

export default function WishesScreen() {
  const router = useRouter();
  const { user, isOnline } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [wishState, setWishState] = useState<WishState>('waiting');
  const [activeTab, setActiveTab] = useState<'chat' | 'terms'>('chat');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  
  // Contract terms
  const [agreedPrice, setAgreedPrice] = useState('');
  const [agreedItems, setAgreedItems] = useState('');
  const [agreedTime, setAgreedTime] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  
  // Modals
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  // Reset wish state when going offline
  useEffect(() => {
    if (!isOnline) {
      // If offline and in incoming state, reset to waiting
      if (wishState === 'incoming') {
        setWishState('waiting');
        pulseAnim.setValue(1);
        ringAnim.setValue(0);
      }
      // Note: If already negotiating or beyond, keep the state (active wish in progress)
    }
  }, [isOnline]);

  // Simulate incoming wish after 3 seconds - ONLY when online AND waiting
  useEffect(() => {
    if (wishState === 'waiting' && isOnline) {
      const timer = setTimeout(() => {
        if (isOnline) { // Double check still online
          setWishState('incoming');
          startIncomingAnimation();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wishState, isOnline]);

  const startIncomingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleAcceptWish = () => {
    setShowAcceptModal(true);
  };

  const confirmAccept = () => {
    setShowAcceptModal(false);
    setWishState('negotiating');
    pulseAnim.stopAnimation();
    ringAnim.stopAnimation();
  };

  const handleDeclineWish = () => {
    setShowDeclineModal(true);
  };

  const confirmDecline = () => {
    setShowDeclineModal(false);
    setWishState('waiting');
    pulseAnim.setValue(1);
    ringAnim.setValue(0);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, {
        id: Date.now().toString(),
        sender: 'genie',
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setNewMessage('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleProposeTerms = () => {
    setActiveTab('terms');
  };

  const handleSendContract = () => {
    if (!agreedPrice) {
      return;
    }
    setShowContractModal(true);
  };

  const confirmContract = () => {
    setShowContractModal(false);
    setWishState('contract');
  };

  const handleStartWish = () => {
    setWishState('in_progress');
  };

  const handleCompleteWish = () => {
    setShowCompleteModal(true);
  };

  const confirmComplete = () => {
    setShowCompleteModal(false);
    setWishState('completed');
  };

  const handleNavigate = () => {
    router.push({
      pathname: '/navigation',
      params: { 
        type: 'wish',
        orderId: MOCK_INCOMING_WISH.id,
        title: MOCK_INCOMING_WISH.title,
      }
    });
  };

  const handleBackToWaiting = () => {
    setWishState('waiting');
    setMessages(INITIAL_MESSAGES);
    setAgreedPrice('');
    setAgreedItems('');
    setAgreedTime('');
    setSpecialNotes('');
  };

  // WAITING STATE
  const renderWaitingState = () => (
    <View style={styles.waitingContainer}>
      <View style={styles.waitingContent}>
        <View style={styles.waitingIconContainer}>
          <LinearGradient
            colors={[COLORS.primary + '30', COLORS.magenta + '20']}
            style={styles.waitingIconGradient}
          >
            <Text style={styles.waitingEmoji}>✨</Text>
          </LinearGradient>
        </View>
        <Text style={styles.waitingTitle}>Waiting for Wishes</Text>
        <Text style={styles.waitingSubtitle}>
          You'll receive wish requests from nearby wishers.{'\n'}Stay online to get connected!
        </Text>
        
        <View style={styles.waitingStats}>
          <View style={styles.waitingStat}>
            <Ionicons name="flash" size={20} color={COLORS.amber} />
            <Text style={styles.waitingStatValue}>Quick Response</Text>
            <Text style={styles.waitingStatLabel}>= More Wishes</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // INCOMING STATE
  const renderIncomingState = () => (
    <View style={styles.incomingContainer}>
      <Animated.View style={[styles.incomingCard, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.magenta]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.incomingHeader}
        >
          <Text style={styles.incomingLabel}>✨ NEW WISH REQUEST</Text>
        </LinearGradient>
        
        <View style={styles.incomingBody}>
          {/* Wisher Info */}
          <View style={styles.wisherInfoRow}>
            <View style={styles.wisherAvatar}>
              <Text style={styles.wisherAvatarText}>{MOCK_INCOMING_WISH.wisher.avatar}</Text>
            </View>
            <View style={styles.wisherDetails}>
              <Text style={styles.wisherName}>{MOCK_INCOMING_WISH.wisher.name}</Text>
              <Text style={styles.wisherRating}>⭐ {MOCK_INCOMING_WISH.wisher.rating} • {MOCK_INCOMING_WISH.wisher.totalWishes} wishes</Text>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryEmoji}>{MOCK_INCOMING_WISH.emoji}</Text>
            </View>
          </View>
          
          {/* Wish Details */}
          <Text style={styles.wishTitle}>{MOCK_INCOMING_WISH.title}</Text>
          <Text style={styles.wishDescription}>{MOCK_INCOMING_WISH.description}</Text>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={18} color={COLORS.cyan} />
              <Text style={styles.statText}>{MOCK_INCOMING_WISH.location.distance} km</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={18} color={COLORS.amber} />
              <Text style={styles.statText}>{MOCK_INCOMING_WISH.estimatedTime}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={18} color={COLORS.magenta} />
              <Text style={styles.statText}>+{MOCK_INCOMING_WISH.xpReward} XP</Text>
            </View>
          </View>
          
          {/* Budget Row */}
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Wisher's Budget</Text>
            <Text style={styles.budgetValue}>₹{MOCK_INCOMING_WISH.budget.min} - ₹{MOCK_INCOMING_WISH.budget.max}</Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineWish}>
              <Ionicons name="close" size={22} color={COLORS.red} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptWish}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.magenta]}
                style={styles.acceptBtnGradient}
              >
                <Ionicons name="chatbubbles" size={20} color="#FFF" />
                <Text style={styles.acceptBtnText}>Start Negotiation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );

  // NEGOTIATING STATE - Chat & Terms Discussion
  const renderNegotiatingState = () => (
    <View style={styles.connectedContainer}>
      {/* Header */}
      <LinearGradient colors={[COLORS.headerBg, COLORS.background]} style={styles.connectedHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowDeclineModal(true)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>💬 Negotiating</Text>
            <Text style={styles.headerSubtitle}>Discuss terms with {MOCK_INCOMING_WISH.wisher.name}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={20} color={COLORS.green} />
          </TouchableOpacity>
        </View>
        
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statusStep, styles.statusStepActive]}>
            <Text style={styles.statusStepText}>1. Negotiate</Text>
          </View>
          <View style={styles.statusLine} />
          <View style={styles.statusStep}>
            <Text style={styles.statusStepTextInactive}>2. Contract</Text>
          </View>
          <View style={styles.statusLine} />
          <View style={styles.statusStep}>
            <Text style={styles.statusStepTextInactive}>3. Fulfill</Text>
          </View>
        </View>
        
        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Ionicons name="chatbubbles" size={18} color={activeTab === 'chat' ? COLORS.cyan : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
            onPress={() => setActiveTab('terms')}
          >
            <Ionicons name="document-text" size={18} color={activeTab === 'terms' ? COLORS.cyan : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>Propose Terms</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {activeTab === 'chat' ? (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <View 
                key={msg.id} 
                style={[styles.messageBubble, msg.sender === 'genie' ? styles.messageSent : styles.messageReceived]}
              >
                <Text style={styles.messageText}>{msg.text}</Text>
                <Text style={styles.messageTime}>{msg.time}</Text>
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
          
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textMuted}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Ionicons name="send" size={18} color={COLORS.cyan} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.proposeTermsBtn} onPress={handleProposeTerms}>
            <LinearGradient colors={[COLORS.green, COLORS.cyan]} style={styles.proposeTermsBtnGradient}>
              <Ionicons name="document-text" size={18} color="#FFF" />
              <Text style={styles.proposeTermsBtnText}>Ready? Propose Terms</Text>
            </LinearGradient>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      ) : (
        <ScrollView style={styles.termsContainer} showsVerticalScrollIndicator={false}>
          {/* Wish Summary Card */}
          <View style={styles.wishSummaryCard}>
            <View style={styles.wishSummaryHeader}>
              <Text style={styles.wishSummaryEmoji}>{MOCK_INCOMING_WISH.emoji}</Text>
              <View style={styles.wishSummaryInfo}>
                <Text style={styles.wishSummaryTitle}>{MOCK_INCOMING_WISH.title}</Text>
                <Text style={styles.wishSummaryWisher}>For {MOCK_INCOMING_WISH.wisher.name}</Text>
              </View>
            </View>
            <Text style={styles.wishSummaryDesc}>{MOCK_INCOMING_WISH.description}</Text>
            <View style={styles.wisherBudgetHint}>
              <Ionicons name="wallet-outline" size={16} color={COLORS.amber} />
              <Text style={styles.wisherBudgetText}>Wisher's budget: ₹{MOCK_INCOMING_WISH.budget.min} - ₹{MOCK_INCOMING_WISH.budget.max}</Text>
            </View>
          </View>
          
          {/* Price Offer */}
          <View style={styles.termsCard}>
            <Text style={styles.termsTitle}>💰 Your Offer</Text>
            <Text style={styles.termsSubtitle}>Enter the price you've agreed upon in the chat</Text>
            
            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Enter amount"
                placeholderTextColor={COLORS.textMuted}
                value={agreedPrice}
                onChangeText={setAgreedPrice}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What's included? (Optional)</Text>
              <TextInput
                style={[styles.termsInput, styles.termsInputMulti]}
                placeholder="Brief summary of items/tasks..."
                placeholderTextColor={COLORS.textMuted}
                value={agreedItems}
                onChangeText={setAgreedItems}
                multiline
                numberOfLines={2}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.sendContractBtn, !agreedPrice && styles.sendContractBtnDisabled]}
              onPress={handleSendContract}
              disabled={!agreedPrice}
            >
              <LinearGradient 
                colors={agreedPrice ? [COLORS.green, COLORS.cyan] : [COLORS.textMuted, COLORS.textMuted]} 
                style={styles.sendContractBtnGradient}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                <Text style={styles.sendContractBtnText}>Confirm & Send to Wisher</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );

  // CONTRACT STATE - Waiting for wisher approval
  const renderContractState = () => (
    <View style={styles.connectedContainer}>
      <LinearGradient colors={[COLORS.headerBg, COLORS.background]} style={styles.connectedHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setWishState('negotiating')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>📄 Contract Sent</Text>
            <Text style={styles.headerSubtitle}>Waiting for {MOCK_INCOMING_WISH.wisher.name}'s approval</Text>
          </View>
        </View>
        
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statusStep, styles.statusStepDone]}>
            <Ionicons name="checkmark" size={14} color={COLORS.green} />
          </View>
          <View style={[styles.statusLine, styles.statusLineDone]} />
          <View style={[styles.statusStep, styles.statusStepActive]}>
            <Text style={styles.statusStepText}>2. Contract</Text>
          </View>
          <View style={styles.statusLine} />
          <View style={styles.statusStep}>
            <Text style={styles.statusStepTextInactive}>3. Fulfill</Text>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.contractReviewContainer}>
        <View style={styles.contractCard}>
          <View style={styles.contractHeader}>
            <Text style={styles.contractEmoji}>📋</Text>
            <Text style={styles.contractTitle}>Contract Summary</Text>
          </View>
          
          <View style={styles.contractRow}>
            <Text style={styles.contractLabel}>Wisher</Text>
            <Text style={styles.contractValue}>{MOCK_INCOMING_WISH.wisher.name}</Text>
          </View>
          
          <View style={styles.contractRow}>
            <Text style={styles.contractLabel}>Wish</Text>
            <Text style={styles.contractValue}>{MOCK_INCOMING_WISH.title}</Text>
          </View>
          
          <View style={styles.contractRow}>
            <Text style={styles.contractLabel}>Agreed Price</Text>
            <Text style={[styles.contractValue, styles.contractPrice]}>₹{agreedPrice}</Text>
          </View>
          
          {agreedItems ? (
            <View style={styles.contractRow}>
              <Text style={styles.contractLabel}>Items/Tasks</Text>
              <Text style={styles.contractValue}>{agreedItems}</Text>
            </View>
          ) : null}
          
          {agreedTime ? (
            <View style={styles.contractRow}>
              <Text style={styles.contractLabel}>Est. Time</Text>
              <Text style={styles.contractValue}>{agreedTime}</Text>
            </View>
          ) : null}
          
          {specialNotes ? (
            <View style={styles.contractRow}>
              <Text style={styles.contractLabel}>Notes</Text>
              <Text style={styles.contractValue}>{specialNotes}</Text>
            </View>
          ) : null}
          
          <View style={styles.contractStatus}>
            <View style={styles.statusIndicator}>
              <View style={styles.statusPulse} />
              <Text style={styles.statusText}>Waiting for approval...</Text>
            </View>
          </View>
        </View>
        
        {/* Simulate wisher approval (for demo) */}
        <TouchableOpacity style={styles.simulateBtn} onPress={handleStartWish}>
          <Text style={styles.simulateBtnText}>🎭 Simulate: Wisher Approved</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // IN_PROGRESS STATE - Actively fulfilling the wish
  const renderInProgressState = () => (
    <View style={styles.connectedContainer}>
      <LinearGradient colors={[COLORS.headerBg, COLORS.background]} style={styles.connectedHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>🚀 In Progress</Text>
            <Text style={styles.headerSubtitle}>Fulfilling {MOCK_INCOMING_WISH.wisher.name}'s wish</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={20} color={COLORS.green} />
          </TouchableOpacity>
        </View>
        
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statusStep, styles.statusStepDone]}>
            <Ionicons name="checkmark" size={14} color={COLORS.green} />
          </View>
          <View style={[styles.statusLine, styles.statusLineDone]} />
          <View style={[styles.statusStep, styles.statusStepDone]}>
            <Ionicons name="checkmark" size={14} color={COLORS.green} />
          </View>
          <View style={[styles.statusLine, styles.statusLineDone]} />
          <View style={[styles.statusStep, styles.statusStepActive]}>
            <Text style={styles.statusStepText}>3. Fulfill</Text>
          </View>
        </View>
      </LinearGradient>
      
      <ScrollView style={styles.inProgressContainer}>
        {/* Wish Card */}
        <View style={styles.activeWishCard}>
          <View style={styles.activeWishHeader}>
            <Text style={styles.activeWishEmoji}>{MOCK_INCOMING_WISH.emoji}</Text>
            <View style={styles.activeWishInfo}>
              <Text style={styles.activeWishTitle}>{MOCK_INCOMING_WISH.title}</Text>
              <Text style={styles.activeWishPrice}>₹{agreedPrice} • +{MOCK_INCOMING_WISH.xpReward} XP</Text>
            </View>
          </View>
        </View>
        
        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Locations</Text>
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: COLORS.cyan }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationAddress}>{MOCK_INCOMING_WISH.location.pickup}</Text>
              </View>
            </View>
            <View style={styles.locationLine} />
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: COLORS.green }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Drop-off</Text>
                <Text style={styles.locationAddress}>{MOCK_INCOMING_WISH.location.dropoff}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Contract Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Contract Details</Text>
          <View style={styles.contractSummaryCard}>
            {agreedItems ? <Text style={styles.contractSummaryText}>• {agreedItems}</Text> : null}
            {agreedTime ? <Text style={styles.contractSummaryText}>• Time: {agreedTime}</Text> : null}
            {specialNotes ? <Text style={styles.contractSummaryText}>• Notes: {specialNotes}</Text> : null}
          </View>
        </View>
        
        <View style={{ height: 150 }} />
      </ScrollView>
      
      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.navBtn} onPress={handleNavigate}>
          <LinearGradient colors={[COLORS.cyan, COLORS.blue]} style={styles.navBtnGradient}>
            <Ionicons name="navigate" size={20} color="#FFF" />
            <Text style={styles.navBtnText}>Navigate</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteWish}>
          <LinearGradient colors={[COLORS.green, '#16A34A']} style={styles.completeBtnGradient}>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <Text style={styles.completeBtnText}>Complete Wish</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // COMPLETED STATE
  const renderCompletedState = () => (
    <View style={styles.completedContainer}>
      <View style={styles.completedContent}>
        <View style={styles.completedIconContainer}>
          <LinearGradient colors={[COLORS.green + '30', COLORS.cyan + '20']} style={styles.completedIconGradient}>
            <Text style={styles.completedEmoji}>🎉</Text>
          </LinearGradient>
        </View>
        <Text style={styles.completedTitle}>Wish Granted!</Text>
        <Text style={styles.completedSubtitle}>
          You've successfully fulfilled {MOCK_INCOMING_WISH.wisher.name}'s wish
        </Text>
        
        <View style={styles.rewardCard}>
          <View style={styles.rewardRow}>
            <Text style={styles.rewardLabel}>Earned</Text>
            <Text style={styles.rewardValue}>₹{agreedPrice || '350'}</Text>
          </View>
          <View style={styles.rewardDivider} />
          <View style={styles.rewardRow}>
            <Text style={styles.rewardLabel}>XP Gained</Text>
            <Text style={styles.rewardXP}>+{MOCK_INCOMING_WISH.xpReward} XP</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.newWishBtn} onPress={handleBackToWaiting}>
          <LinearGradient colors={[COLORS.primary, COLORS.magenta]} style={styles.newWishBtnGradient}>
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.newWishBtnText}>Find More Wishes</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // OFFLINE STATE
  const renderOfflineState = () => (
    <View style={styles.offlineContainer}>
      <LinearGradient colors={[COLORS.cardBg, COLORS.backgroundSecondary]} style={styles.offlineGradient}>
        <View style={styles.offlineIconContainer}>
          <Ionicons name="moon" size={64} color={COLORS.textMuted} />
        </View>
        <Text style={styles.offlineTitle}>You're Offline</Text>
        <Text style={styles.offlineSubtitle}>
          Go online from the Home screen to start receiving wish requests
        </Text>
        <TouchableOpacity style={styles.goOnlineButton} onPress={() => router.push('/(main)/home')}>
          <LinearGradient colors={[COLORS.primary, COLORS.magenta]} style={styles.goOnlineGradient}>
            <Ionicons name="power" size={18} color="#FFF" />
            <Text style={styles.goOnlineText}>Go to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Determine what to render based on state
  const renderContent = () => {
    // If offline and no active wish (waiting or incoming), show offline
    if (!isOnline && (wishState === 'waiting' || wishState === 'incoming')) {
      return renderOfflineState();
    }
    
    switch (wishState) {
      case 'waiting':
        return renderWaitingState();
      case 'incoming':
        return renderIncomingState();
      case 'negotiating':
        return renderNegotiatingState();
      case 'contract':
        return renderContractState();
      case 'in_progress':
        return renderInProgressState();
      case 'completed':
        return renderCompletedState();
      default:
        return renderWaitingState();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header for waiting/offline states */}
      {(wishState === 'waiting' || wishState === 'incoming' || !isOnline) && wishState !== 'negotiating' && wishState !== 'contract' && wishState !== 'in_progress' && wishState !== 'completed' && (
        <LinearGradient colors={[COLORS.headerBg, COLORS.background]} style={styles.header}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.mainHeaderTitle}>✨ Wishes</Text>
            <Text style={styles.mainHeaderSubtitle}>
              {isOnline ? 'Grant wishes, earn magic!' : 'You are currently offline'}
            </Text>
          </View>
        </LinearGradient>
      )}
      
      {renderContent()}
      
      {/* Modals */}
      <GameModal
        visible={showAcceptModal}
        type="confirm"
        title="Start Negotiation?"
        message={`You'll be connected with ${MOCK_INCOMING_WISH.wisher.name} to discuss terms and pricing before committing.`}
        emoji="💬"
        primaryButtonText="Yes, Let's Talk!"
        secondaryButtonText="Go Back"
        onPrimaryPress={confirmAccept}
        onSecondaryPress={() => setShowAcceptModal(false)}
        onClose={() => setShowAcceptModal(false)}
      />
      
      <GameModal
        visible={showDeclineModal}
        type="warning"
        title="Decline This Wish?"
        message="You'll be returned to the waiting queue for new wishes."
        emoji="🤔"
        primaryButtonText="Yes, Decline"
        secondaryButtonText="Keep Negotiating"
        onPrimaryPress={confirmDecline}
        onSecondaryPress={() => setShowDeclineModal(false)}
        onClose={() => setShowDeclineModal(false)}
      />
      
      <GameModal
        visible={showContractModal}
        type="confirm"
        title="Send Contract?"
        message={`This will send a contract to ${MOCK_INCOMING_WISH.wisher.name} for ₹${agreedPrice}. They'll need to approve before you start.`}
        emoji="📄"
        primaryButtonText="Send Contract"
        secondaryButtonText="Edit Terms"
        onPrimaryPress={confirmContract}
        onSecondaryPress={() => setShowContractModal(false)}
        onClose={() => setShowContractModal(false)}
      />
      
      <GameModal
        visible={showCompleteModal}
        type="success"
        title="Complete This Wish?"
        message="Make sure you've delivered everything as agreed in the contract."
        emoji="✅"
        primaryButtonText="Yes, Complete!"
        secondaryButtonText="Not Yet"
        onPrimaryPress={confirmComplete}
        onSecondaryPress={() => setShowCompleteModal(false)}
        onClose={() => setShowCompleteModal(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  mainHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  mainHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  
  // Waiting State
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  waitingContent: {
    alignItems: 'center',
  },
  waitingIconContainer: {
    marginBottom: 24,
  },
  waitingIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingEmoji: {
    fontSize: 50,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  waitingSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  waitingStats: {
    marginTop: 32,
    alignItems: 'center',
  },
  waitingStat: {
    alignItems: 'center',
    gap: 6,
  },
  waitingStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  waitingStatLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  
  // Incoming State
  incomingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    justifyContent: 'center',
  },
  incomingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  incomingHeader: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  incomingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  incomingBody: {
    padding: 20,
  },
  wisherInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
  },
  wisherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wisherAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  wisherDetails: {
    marginLeft: 12,
    flex: 1,
  },
  wisherName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  wisherRating: {
    fontSize: 13,
    color: COLORS.amber,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '30',
    borderRadius: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  wishTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  wishDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.green + '15',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  budgetLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  budgetValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.green,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.red + '15',
    gap: 8,
  },
  declineBtnText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  acceptBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Connected/Negotiating State
  connectedContainer: {
    flex: 1,
  },
  connectedHeader: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  statusStep: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
  },
  statusStepActive: {
    backgroundColor: COLORS.primary + '30',
  },
  statusStepDone: {
    backgroundColor: COLORS.green + '20',
    width: 28,
    height: 28,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusStepText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statusStepTextInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  statusLine: {
    width: 20,
    height: 2,
    backgroundColor: COLORS.cardBorder,
  },
  statusLineDone: {
    backgroundColor: COLORS.green,
  },
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.cyan,
  },
  
  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  messageSent: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proposeTermsBtn: {
    margin: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  proposeTermsBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  proposeTermsBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Terms
  termsContainer: {
    flex: 1,
    padding: 16,
  },
  termsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
  },
  termsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  termsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  termsInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  termsInputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendContractBtn: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendContractBtnDisabled: {
    opacity: 0.5,
  },
  sendContractBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  sendContractBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Contract Review
  contractReviewContainer: {
    flex: 1,
    padding: 16,
  },
  contractCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
  },
  contractHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  contractEmoji: {
    fontSize: 28,
  },
  contractTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  contractRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  contractLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  contractValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  contractPrice: {
    color: COLORS.green,
    fontSize: 18,
  },
  contractStatus: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.amber,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.amber,
    fontWeight: '500',
  },
  simulateBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
  },
  simulateBtnText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  
  // In Progress
  inProgressContainer: {
    flex: 1,
    padding: 16,
  },
  activeWishCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  activeWishHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeWishEmoji: {
    fontSize: 36,
  },
  activeWishInfo: {
    flex: 1,
  },
  activeWishTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeWishPrice: {
    fontSize: 14,
    color: COLORS.green,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: COLORS.cardBorder,
    marginLeft: 5,
    marginVertical: 4,
  },
  contractSummaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
  },
  contractSummaryText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  navBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  navBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  navBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  completeBtn: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  completeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  completeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Completed
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedContent: {
    alignItems: 'center',
  },
  completedIconContainer: {
    marginBottom: 24,
  },
  completedIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedEmoji: {
    fontSize: 50,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  rewardCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.green,
  },
  rewardXP: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.amber,
  },
  rewardDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 16,
  },
  newWishBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  newWishBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  newWishBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Offline
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  offlineGradient: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  offlineIconContainer: {
    marginBottom: 20,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  goOnlineButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  goOnlineGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  goOnlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
