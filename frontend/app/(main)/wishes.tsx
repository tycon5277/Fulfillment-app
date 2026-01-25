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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// Wish states
type WishState = 'waiting' | 'incoming' | 'connected' | 'in_progress';

// Mock incoming wish request (simulating direct ping)
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

// Mock active wish (when connected)
const MOCK_ACTIVE_WISH = {
  id: 'wish_002',
  wisher: {
    name: 'Rahul Verma',
    avatar: 'R',
    rating: 4.9,
    phone: '+91 87654 32109',
  },
  category: 'Surprise',
  emoji: '🎁',
  title: 'Birthday Surprise for Wife',
  description: 'Need a cake from Theobroma and flowers from the nearby florist. It\'s her birthday today!',
  budget: { min: 500, max: 800 },
  items: [
    { name: 'Chocolate Truffle Cake (1kg)', status: 'pending' },
    { name: 'Red Roses Bouquet (24 stems)', status: 'pending' },
    { name: 'Birthday Card', status: 'pending' },
  ],
  location: {
    pickup: 'Theobroma, Cyber Hub',
    dropoff: 'Apt 1204, Palm Springs',
    distance: 4.5,
  },
  status: 'shopping', // shopping | picked_up | delivering | delivered
  earnings: 650,
  xpReward: 150,
  connectedAt: '15 min ago',
};

// Mock chat messages
const MOCK_MESSAGES = [
  { id: '1', sender: 'wisher', text: 'Hi! Thanks for accepting my wish 🙏', time: '2:30 PM' },
  { id: '2', sender: 'genie', text: 'Hello! Happy to help. I\'m heading to Theobroma now.', time: '2:31 PM' },
  { id: '3', sender: 'wisher', text: 'Great! Please get the chocolate truffle cake. Make sure they write "Happy Birthday Neha" on it', time: '2:32 PM' },
  { id: '4', sender: 'genie', text: 'Got it! Any specific message style?', time: '2:33 PM' },
  { id: '5', sender: 'wisher', text: 'Simple cursive would be perfect. Thank you!', time: '2:34 PM' },
];

export default function WishesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [wishState, setWishState] = useState<WishState>('waiting');
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');
  const [isOnline, setIsOnline] = useState(true);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Check online status from user profile
  useEffect(() => {
    if (user) {
      setIsOnline(user.partner_status === 'available');
    }
  }, [user]);

  // Simulate incoming wish after 3 seconds (for demo) - only when online
  useEffect(() => {
    if (wishState === 'waiting' && isOnline) {
      const timer = setTimeout(() => {
        setWishState('incoming');
        startIncomingAnimation();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [wishState, isOnline]);

  const startIncomingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
    
    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    ).start();
  };

  const handleAcceptWish = () => {
    setShowAcceptModal(true);
  };

  const confirmAccept = () => {
    setShowAcceptModal(false);
    setWishState('connected');
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

  const handleNavigate = () => {
    router.push({
      pathname: '/navigation',
      params: { 
        type: 'wish',
        orderId: MOCK_ACTIVE_WISH.id,
        title: MOCK_ACTIVE_WISH.title,
      }
    });
  };

  // WAITING STATE - No active wish, waiting for incoming request
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
        
        <View style={styles.tipCard}>
          <Ionicons name="bulb" size={20} color={COLORS.amber} />
          <Text style={styles.tipText}>
            Tip: Stay in high-demand areas like malls and markets to receive more wish requests!
          </Text>
        </View>
      </View>
    </View>
  );

  // INCOMING STATE - New wish request received (direct ping)
  const renderIncomingState = () => (
    <ScrollView 
      style={styles.incomingScrollContainer} 
      contentContainerStyle={styles.incomingContainer}
      showsVerticalScrollIndicator={false}
    >
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
          <View style={styles.wisherInfo}>
            <View style={styles.wisherAvatar}>
              <Text style={styles.wisherAvatarText}>{MOCK_INCOMING_WISH.wisher.avatar}</Text>
            </View>
            <View style={styles.wisherDetails}>
              <Text style={styles.wisherName}>{MOCK_INCOMING_WISH.wisher.name}</Text>
              <View style={styles.wisherRating}>
                <Ionicons name="star" size={14} color={COLORS.amber} />
                <Text style={styles.wisherRatingText}>{MOCK_INCOMING_WISH.wisher.rating}</Text>
                <Text style={styles.wisherWishes}>• {MOCK_INCOMING_WISH.wisher.totalWishes} wishes</Text>
              </View>
            </View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryEmoji}>{MOCK_INCOMING_WISH.emoji}</Text>
              <Text style={styles.categoryText}>{MOCK_INCOMING_WISH.category}</Text>
            </View>
          </View>
          
          {/* Wish Details */}
          <Text style={styles.wishTitle}>{MOCK_INCOMING_WISH.title}</Text>
          <Text style={styles.wishDescription}>{MOCK_INCOMING_WISH.description}</Text>
          
          {/* Location & Earnings */}
          <View style={styles.incomingMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={COLORS.cyan} />
              <Text style={styles.metaText}>{MOCK_INCOMING_WISH.location.distance} km</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color={COLORS.amber} />
              <Text style={styles.metaText}>{MOCK_INCOMING_WISH.estimatedTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flash" size={16} color={COLORS.magenta} />
              <Text style={styles.metaText}>+{MOCK_INCOMING_WISH.xpReward} XP</Text>
            </View>
          </View>
          
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Wisher's Budget</Text>
            <Text style={styles.budgetValue}>
              ₹{MOCK_INCOMING_WISH.budget.min} - ₹{MOCK_INCOMING_WISH.budget.max}
            </Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.incomingActions}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineWish}>
              <Ionicons name="close" size={24} color={COLORS.red} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptWish}>
              <LinearGradient
                colors={[COLORS.green, '#16A34A']}
                style={styles.acceptBtnGradient}
              >
                <Ionicons name="checkmark" size={24} color="#FFF" />
                <Text style={styles.acceptBtnText}>Accept Wish</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // CONNECTED STATE - Active connection with wisher
  const renderConnectedState = () => (
    <View style={styles.connectedContainer}>
      {/* Header with Wisher Info */}
      <LinearGradient
        colors={[COLORS.headerBg, COLORS.background]}
        style={styles.connectedHeader}
      >
        <View style={styles.connectedHeaderTop}>
          <View style={styles.connectedWisher}>
            <View style={styles.connectedAvatar}>
              <Text style={styles.connectedAvatarText}>{MOCK_ACTIVE_WISH.wisher.avatar}</Text>
              <View style={styles.onlineDot} />
            </View>
            <View>
              <Text style={styles.connectedName}>{MOCK_ACTIVE_WISH.wisher.name}</Text>
              <Text style={styles.connectedStatus}>Connected {MOCK_ACTIVE_WISH.connectedAt}</Text>
            </View>
          </View>
          <View style={styles.connectedActions}>
            <TouchableOpacity style={styles.actionIconBtn}>
              <Ionicons name="call" size={20} color={COLORS.green} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Wish Summary */}
        <View style={styles.wishSummary}>
          <Text style={styles.wishSummaryEmoji}>{MOCK_ACTIVE_WISH.emoji}</Text>
          <View style={styles.wishSummaryInfo}>
            <Text style={styles.wishSummaryTitle}>{MOCK_ACTIVE_WISH.title}</Text>
            <View style={styles.wishSummaryMeta}>
              <Text style={styles.wishSummaryEarnings}>₹{MOCK_ACTIVE_WISH.earnings}</Text>
              <Text style={styles.wishSummaryXP}>+{MOCK_ACTIVE_WISH.xpReward} XP</Text>
            </View>
          </View>
        </View>
        
        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Ionicons name="list" size={18} color={activeTab === 'details' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Ionicons name="chatbubbles" size={18} color={activeTab === 'chat' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {activeTab === 'details' ? (
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
          {/* Items Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Items to Get</Text>
            {MOCK_ACTIVE_WISH.items.map((item, index) => (
              <TouchableOpacity key={index} style={styles.itemRow}>
                <View style={[styles.checkbox, item.status === 'done' && styles.checkboxDone]}>
                  {item.status === 'done' && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
                <Text style={[styles.itemText, item.status === 'done' && styles.itemTextDone]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Locations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Locations</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.cyan }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationAddress}>{MOCK_ACTIVE_WISH.location.pickup}</Text>
                </View>
              </View>
              <View style={styles.locationLine} />
              <View style={styles.locationRow}>
                <View style={[styles.locationDot, { backgroundColor: COLORS.green }]} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>Drop-off</Text>
                  <Text style={styles.locationAddress}>{MOCK_ACTIVE_WISH.location.dropoff}</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Instructions</Text>
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsText}>{MOCK_ACTIVE_WISH.description}</Text>
            </View>
          </View>
          
          <View style={{ height: 120 }} />
        </ScrollView>
      ) : (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View 
                key={msg.id} 
                style={[
                  styles.messageBubble,
                  msg.sender === 'genie' ? styles.messageSent : styles.messageReceived
                ]}
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
              <LinearGradient
                colors={[COLORS.primary, COLORS.magenta]}
                style={styles.sendBtnGradient}
              >
                <Ionicons name="send" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
      
      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigate}>
          <LinearGradient
            colors={[COLORS.cyan, COLORS.blue]}
            style={styles.navigateBtnGradient}
          >
            <Ionicons name="navigate" size={20} color="#FFF" />
            <Text style={styles.navigateBtnText}>Navigate to Pickup</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // OFFLINE STATE - Genie is offline
  const renderOfflineState = () => (
    <View style={styles.offlineContainer}>
      <LinearGradient
        colors={[COLORS.cardBg, COLORS.backgroundSecondary]}
        style={styles.offlineGradient}
      >
        <View style={styles.offlineIconContainer}>
          <Ionicons name="moon" size={64} color={COLORS.textMuted} />
        </View>
        <Text style={styles.offlineTitle}>You're Offline</Text>
        <Text style={styles.offlineSubtitle}>
          Go online from the Home screen to start receiving wish requests from nearby wishers
        </Text>
        <TouchableOpacity 
          style={styles.goOnlineButton}
          onPress={() => router.push('/(main)/home')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.magenta]}
            style={styles.goOnlineGradient}
          >
            <Ionicons name="power" size={18} color="#FFF" />
            <Text style={styles.goOnlineText}>Go to Home</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Header */}
      {(wishState === 'waiting' || !isOnline) && (
        <LinearGradient
          colors={[COLORS.headerBg, COLORS.background]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>✨ Wishes</Text>
            <Text style={styles.headerSubtitle}>
              {isOnline ? 'Grant wishes, earn magic!' : 'You are currently offline'}
            </Text>
          </View>
        </LinearGradient>
      )}
      
      {/* Render based on state - Show offline if not online */}
      {!isOnline && renderOfflineState()}
      {isOnline && wishState === 'waiting' && renderWaitingState()}
      {isOnline && wishState === 'incoming' && renderIncomingState()}
      {isOnline && (wishState === 'connected' || wishState === 'in_progress') && renderConnectedState()}
      
      {/* Game Modals */}
      <GameModal
        visible={showAcceptModal}
        type="confirm"
        title="Accept This Wish?"
        message={`You'll be connected with ${MOCK_INCOMING_WISH.wisher.name}. You can chat and coordinate the wish details.`}
        emoji="🤝"
        primaryButtonText="Yes, Connect!"
        secondaryButtonText="Go Back"
        onPrimaryPress={confirmAccept}
        onSecondaryPress={() => setShowAcceptModal(false)}
      />
      
      <GameModal
        visible={showDeclineModal}
        type="warning"
        title="Decline Wish?"
        message="The wish will be offered to another Genie. Your response rate may be affected."
        emoji="😔"
        primaryButtonText="Yes, Decline"
        secondaryButtonText="Keep It"
        onPrimaryPress={confirmDecline}
        onSecondaryPress={() => setShowDeclineModal(false)}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  
  // Waiting State
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    fontSize: 56,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: '800',
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
  },
  waitingStat: {
    alignItems: 'center',
  },
  waitingStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  waitingStatLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber + '15',
    borderRadius: 14,
    padding: 16,
    marginTop: 32,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.amber,
    lineHeight: 20,
  },
  
  // Incoming State
  incomingScrollContainer: {
    flex: 1,
  },
  incomingContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  incomingCard: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  incomingHeader: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  incomingLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  incomingBody: {
    padding: 20,
  },
  wisherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    color: '#FFF',
  },
  wisherDetails: {
    flex: 1,
    marginLeft: 12,
  },
  wisherName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  wisherRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  wisherRatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.amber,
  },
  wisherWishes: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
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
  incomingMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
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
  incomingActions: {
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.red,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Connected State
  connectedContainer: {
    flex: 1,
  },
  connectedHeader: {
    paddingTop: 10,
    paddingBottom: 0,
  },
  connectedHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  connectedWisher: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  connectedAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.headerBg,
  },
  connectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  connectedStatus: {
    fontSize: 12,
    color: COLORS.green,
    marginTop: 2,
  },
  connectedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.green + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  wishSummaryEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  wishSummaryInfo: {
    flex: 1,
  },
  wishSummaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  wishSummaryMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  wishSummaryEarnings: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.green,
  },
  wishSummaryXP: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.magenta,
  },
  tabSwitcher: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  chatBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  chatBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  
  // Details Tab
  detailsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  itemTextDone: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  locationCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 2,
  },
  locationLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.cardBorder,
    marginLeft: 5,
    marginVertical: 4,
  },
  instructionsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  
  // Chat Tab
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    marginBottom: 8,
  },
  messageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.cardBg,
    borderBottomLeftRadius: 4,
  },
  messageSent: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    gap: 10,
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
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Bottom Action
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  navigateBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  navigateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  navigateBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
