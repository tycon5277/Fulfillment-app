import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore, PartnerStats } from '../../src/store';
import * as api from '../../src/api';
import THEME from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RADAR_SIZE = SCREEN_WIDTH - 64;

// Mock location for when GPS is not available
const MOCK_LOCATION = {
  latitude: 9.9312,
  longitude: 76.2673,
};

// Inspirational quotes for Genies
const INSPIRATION_QUOTES = [
  "Every wish fulfilled makes the world brighter ✨",
  "You're not just delivering, you're making dreams come true 🌟",
  "Today's wishes become tomorrow's smiles 😊",
  "Be the magic someone needs today 🪄",
  "Small acts, big impacts. Keep going! 💪",
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [location, setLocation] = useState(MOCK_LOCATION);
  const [locationError, setLocationError] = useState(false);
  const [currentQuote] = useState(() => 
    INSPIRATION_QUOTES[Math.floor(Math.random() * INSPIRATION_QUOTES.length)]
  );
  
  // Animation refs
  const radarPulse1 = useRef(new Animated.Value(0)).current;
  const radarPulse2 = useRef(new Animated.Value(0)).current;
  const radarPulse3 = useRef(new Animated.Value(0)).current;
  const radarSweep = useRef(new Animated.Value(0)).current;
  const dotPulse = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const wishFloat1 = useRef(new Animated.Value(0)).current;
  const wishFloat2 = useRef(new Animated.Value(0)).current;
  const wishFloat3 = useRef(new Animated.Value(0)).current;

  const isMobileGenie = user?.agent_type === 'mobile';

  // Radar animations
  useEffect(() => {
    const createPulseAnimation = (value: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Sweep animation
    const sweepAnimation = Animated.loop(
      Animated.timing(radarSweep, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Wish floating animations
    const createFloatAnimation = (value: Animated.Value, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulseAnimation(radarPulse1, 0);
    const pulse2 = createPulseAnimation(radarPulse2, 833);
    const pulse3 = createPulseAnimation(radarPulse3, 1666);
    
    const dotAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const float1 = createFloatAnimation(wishFloat1, 2000);
    const float2 = createFloatAnimation(wishFloat2, 2500);
    const float3 = createFloatAnimation(wishFloat3, 1800);

    if (isOnline) {
      pulse1.start();
      pulse2.start();
      pulse3.start();
      sweepAnimation.start();
      dotAnimation.start();
      float1.start();
      float2.start();
      float3.start();
    }
    glowAnimation.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      pulse3.stop();
      sweepAnimation.stop();
      dotAnimation.stop();
      glowAnimation.stop();
      float1.stop();
      float2.stop();
      float3.stop();
    };
  }, [isOnline]);

  // Get location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError(true);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (error) {
        console.log('Location error, using mock:', error);
        setLocationError(true);
      }
    })();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.getPartnerStats();
      setStats(response.data);
      setIsOnline(response.data.status === 'available');
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await api.getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUser();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchUser()]);
    setRefreshing(false);
  }, []);

  const toggleOnlineStatus = async () => {
    setStatusLoading(true);
    const newStatus = isOnline ? 'offline' : 'available';
    try {
      await api.updatePartnerStatus(newStatus);
      setIsOnline(!isOnline);
      await fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ opacity: glowAnim }}>
            <Text style={styles.loadingEmoji}>🧞</Text>
          </Animated.View>
          <Text style={styles.loadingText}>Summoning your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate level and XP
  const totalTasks = stats?.total_tasks || 0;
  const currentLevel = Math.floor(totalTasks / 10) + 1;
  const xpInLevel = (totalTasks % 10) * 100;
  const xpNeeded = 1000;
  const tasksToNextLevel = 10 - (totalTasks % 10);

  // Get vehicle display
  const getVehicleDisplay = () => {
    const make = user?.agent_vehicle_make || '';
    const model = user?.agent_vehicle_model || '';
    if (make && model) return `${make} ${model}`;
    if (make) return make;
    if (model) return model;
    return (user?.agent_vehicle || 'Vehicle').charAt(0).toUpperCase() + (user?.agent_vehicle || '').slice(1);
  };

  // Get level title
  const getLevelTitle = () => {
    if (currentLevel < 5) return 'Rookie Genie';
    if (currentLevel < 10) return 'Rising Genie';
    if (currentLevel < 20) return 'Star Genie';
    if (currentLevel < 50) return 'Master Genie';
    return 'Legendary Genie';
  };

  // Mobile Genie Dashboard
  if (isMobileGenie) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={THEME.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] || 'Genie'} 👋</Text>
              <Text style={styles.levelTitle}>{getLevelTitle()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => router.push('/(main)/profile')}
            >
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[THEME.primary, THEME.primaryDark]}
                  style={styles.avatarPlaceholder}
                >
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'G'}</Text>
                </LinearGradient>
              )}
              <View style={[styles.statusIndicator, isOnline ? styles.statusOnline : styles.statusOffline]} />
            </TouchableOpacity>
          </View>

          {/* Level & Coins Bar */}
          <View style={styles.levelBar}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelIcon}>⚡</Text>
              <Text style={styles.levelBadgeText}>Lvl {currentLevel}</Text>
            </View>
            <View style={styles.xpMiniBar}>
              <View style={[styles.xpMiniFill, { width: `${(xpInLevel / xpNeeded) * 100}%` }]} />
            </View>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinText}>{Math.floor(stats?.total_earnings || 0)}</Text>
            </View>
          </View>

          {/* Radar Map Card - Hero Section */}
          <View style={styles.radarCard}>
            {/* Background glow effect */}
            <Animated.View style={[styles.radarGlow, { opacity: glowAnim }]} />
            
            <View style={styles.radarContainer}>
              {/* Radar grid lines */}
              <View style={styles.radarGrid}>
                <View style={styles.gridLineH} />
                <View style={styles.gridLineV} />
              </View>
              
              {/* Radar rings */}
              <View style={[styles.radarRing, { width: RADAR_SIZE * 0.3, height: RADAR_SIZE * 0.3 }]} />
              <View style={[styles.radarRing, { width: RADAR_SIZE * 0.55, height: RADAR_SIZE * 0.55 }]} />
              <View style={[styles.radarRing, { width: RADAR_SIZE * 0.8, height: RADAR_SIZE * 0.8 }]} />
              <View style={[styles.radarRing, { width: RADAR_SIZE * 1.0, height: RADAR_SIZE * 1.0 }]} />
              
              {/* Animated pulse rings */}
              {isOnline && (
                <>
                  <Animated.View style={[
                    styles.radarPulse,
                    {
                      width: RADAR_SIZE,
                      height: RADAR_SIZE,
                      transform: [{ scale: radarPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1.1] }) }],
                      opacity: radarPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                    }
                  ]} />
                  <Animated.View style={[
                    styles.radarPulse,
                    {
                      width: RADAR_SIZE,
                      height: RADAR_SIZE,
                      transform: [{ scale: radarPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1.1] }) }],
                      opacity: radarPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                    }
                  ]} />
                  <Animated.View style={[
                    styles.radarPulse,
                    {
                      width: RADAR_SIZE,
                      height: RADAR_SIZE,
                      transform: [{ scale: radarPulse3.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1.1] }) }],
                      opacity: radarPulse3.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
                    }
                  ]} />
                </>
              )}
              
              {/* Radar sweep line */}
              {isOnline && (
                <Animated.View style={[
                  styles.radarSweep,
                  {
                    transform: [{
                      rotate: radarSweep.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    }],
                  }
                ]}>
                  <LinearGradient
                    colors={['transparent', THEME.primary + '60', THEME.primary]}
                    style={styles.sweepGradient}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                  />
                </Animated.View>
              )}
              
              {/* Center dot (you) */}
              <Animated.View style={[
                styles.centerDotOuter,
                isOnline && { transform: [{ scale: dotPulse }] }
              ]}>
                <View style={styles.centerDot}>
                  <View style={styles.centerDotInner} />
                </View>
              </Animated.View>

              {/* Nearby wishes indicators - floating */}
              {isOnline && (
                <>
                  <Animated.View style={[
                    styles.wishDot, 
                    { 
                      top: '20%', 
                      left: '25%',
                      transform: [{ translateY: wishFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
                    }
                  ]}>
                    <Text style={styles.wishDotEmoji}>🛒</Text>
                  </Animated.View>
                  <Animated.View style={[
                    styles.wishDot, 
                    { 
                      top: '30%', 
                      right: '20%',
                      transform: [{ translateY: wishFloat2.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
                    }
                  ]}>
                    <Text style={styles.wishDotEmoji}>🎁</Text>
                  </Animated.View>
                  <Animated.View style={[
                    styles.wishDot, 
                    { 
                      bottom: '25%', 
                      left: '18%',
                      transform: [{ translateY: wishFloat3.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) }],
                    }
                  ]}>
                    <Text style={styles.wishDotEmoji}>📦</Text>
                  </Animated.View>
                  <Animated.View style={[
                    styles.wishDot, 
                    { 
                      bottom: '35%', 
                      right: '25%',
                      transform: [{ translateY: wishFloat1.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
                    }
                  ]}>
                    <Text style={styles.wishDotEmoji}>🍔</Text>
                  </Animated.View>
                </>
              )}
            </View>
            
            {/* Radar info bar */}
            <View style={styles.radarInfo}>
              <View style={styles.radarStatusContainer}>
                <View style={[styles.radarStatusDot, isOnline ? styles.statusOnlineSmall : styles.statusOfflineSmall]} />
                <Text style={styles.radarStatusText}>
                  {isOnline ? 'Scanning for wishes nearby...' : 'Go online to discover wishes'}
                </Text>
              </View>
              <View style={styles.locationBadge}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{locationError ? 'Demo' : 'Live'}</Text>
              </View>
            </View>

            {/* Online Toggle Button */}
            <TouchableOpacity 
              style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
              onPress={toggleOnlineStatus}
              disabled={statusLoading}
              activeOpacity={0.8}
            >
              {statusLoading ? (
                <ActivityIndicator color={isOnline ? THEME.background : THEME.primary} size="small" />
              ) : isOnline ? (
                <LinearGradient
                  colors={[THEME.primary, THEME.primaryDark]}
                  style={styles.onlineButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.onlineEmoji}>📡</Text>
                  <Text style={styles.onlineButtonTextActive}>ONLINE - SCANNING</Text>
                </LinearGradient>
              ) : (
                <>
                  <Text style={styles.offlineEmoji}>🔌</Text>
                  <Text style={styles.onlineButtonText}>TAP TO GO ONLINE</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Inspiration Quote */}
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>{currentQuote}</Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>₹{stats?.today_earnings?.toFixed(0) || '0'}</Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBlue]}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statValue}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Wishes Granted</Text>
            </View>
            <View style={[styles.statCard, styles.statCardGold]}>
              <Text style={styles.statEmoji}>⭐</Text>
              <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Your Rating</Text>
            </View>
            <View style={[styles.statCard, styles.statCardPink]}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{stats?.active_count || 0}</Text>
              <Text style={styles.statLabel}>Active Now</Text>
            </View>
          </View>

          {/* XP Progress Card */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <View style={styles.xpTitleRow}>
                <Text style={styles.xpLevelEmoji}>🏆</Text>
                <View>
                  <Text style={styles.xpTitle}>Level {currentLevel} Progress</Text>
                  <Text style={styles.xpSubtitle}>{tasksToNextLevel} more wishes to level up!</Text>
                </View>
              </View>
              <View style={styles.xpValueContainer}>
                <Text style={styles.xpAmount}>{xpInLevel}</Text>
                <Text style={styles.xpTotal}>/{xpNeeded}</Text>
              </View>
            </View>
            <View style={styles.xpBarTrack}>
              <LinearGradient
                colors={[THEME.primary, THEME.primaryLight]}
                style={[styles.xpBarFill, { width: `${(xpInLevel / xpNeeded) * 100}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <View style={styles.xpRewardRow}>
              <Text style={styles.xpRewardLabel}>Next level reward:</Text>
              <View style={styles.xpRewardBadge}>
                <Text style={styles.xpRewardEmoji}>🎁</Text>
                <Text style={styles.xpRewardText}>₹50 Bonus</Text>
              </View>
            </View>
          </View>

          {/* Vehicle Card */}
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <View style={styles.vehicleIconBg}>
                <Text style={styles.vehicleEmoji}>
                  {user?.agent_vehicle === 'car' ? '🚗' : user?.agent_vehicle === 'motorbike' ? '🏍️' : '🛵'}
                </Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{getVehicleDisplay()}</Text>
                <Text style={styles.vehicleReg}>{user?.agent_vehicle_registration || 'N/A'}</Text>
              </View>
              {user?.agent_is_electric && (
                <View style={styles.evBadge}>
                  <Text style={styles.evEmoji}>⚡</Text>
                  <Text style={styles.evText}>EV</Text>
                </View>
              )}
            </View>
          </View>

          {/* Services */}
          <Text style={styles.sectionTitle}>🎯 Your Services</Text>
          <View style={styles.servicesRow}>
            {(user?.agent_services || []).map((service: string) => (
              <View key={service} style={[styles.serviceChip, { backgroundColor: getServiceColor(service) + '20', borderColor: getServiceColor(service) + '40' }]}>
                <Text style={styles.serviceEmoji}>{getServiceEmoji(service)}</Text>
                <Text style={[styles.serviceChipText, { color: getServiceColor(service) }]}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Text>
              </View>
            ))}
            {(!user?.agent_services || user.agent_services.length === 0) && (
              <Text style={styles.noServicesText}>No services selected</Text>
            )}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/orders')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: THEME.primary + '20' }]}>
                <Text style={styles.actionEmoji}>📦</Text>
              </View>
              <Text style={styles.actionLabel}>Tasks</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/wishes')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: THEME.secondary + '20' }]}>
                <Text style={styles.actionEmoji}>⭐</Text>
              </View>
              <Text style={styles.actionLabel}>Wishes</Text>
              <View style={[styles.actionBadge, { backgroundColor: THEME.secondary }]}>
                <Text style={styles.actionBadgeText}>5</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/deliveries')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: THEME.accent2 + '20' }]}>
                <Text style={styles.actionEmoji}>🚀</Text>
              </View>
              <Text style={styles.actionLabel}>Active</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Challenge */}
          <View style={styles.challengeCard}>
            <LinearGradient
              colors={[THEME.accent2 + '25', THEME.accent2 + '10']}
              style={styles.challengeGradient}
            >
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeEmoji}>🏆</Text>
                <Text style={styles.challengeTitle}>Daily Challenge</Text>
                <View style={styles.challengeTimer}>
                  <Ionicons name="time-outline" size={14} color={THEME.accent2} />
                  <Text style={styles.challengeTimerText}>8h left</Text>
                </View>
              </View>
              <Text style={styles.challengeDesc}>Complete 5 deliveries today</Text>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeBarTrack}>
                  <LinearGradient
                    colors={[THEME.accent2, '#FFD700']}
                    style={[styles.challengeBarFill, { width: '40%' }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.challengeCount}>2/5</Text>
              </View>
              <View style={styles.challengeRewardRow}>
                <Text style={styles.challengeRewardLabel}>Rewards:</Text>
                <View style={styles.challengeRewards}>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardEmoji}>⚡</Text>
                    <Text style={styles.rewardText}>+50 XP</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardEmoji}>💰</Text>
                    <Text style={styles.rewardText}>₹100</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Streak Card */}
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View>
                <Text style={styles.streakTitle}>3 Day Streak!</Text>
                <Text style={styles.streakSubtitle}>You're on fire! Keep going!</Text>
              </View>
            </View>
            <View style={styles.streakDays}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <View key={index} style={[styles.streakDay, index < 3 && styles.streakDayActive]}>
                  <Text style={[styles.streakDayText, index < 3 && styles.streakDayTextActive]}>{day}</Text>
                  {index < 3 && <Text style={styles.streakDayCheck}>✓</Text>}
                </View>
              ))}
            </View>
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Skilled Genie placeholder
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F0FDFA' }]}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>🔧</Text>
        <Text style={[styles.greeting, { color: '#134E4A' }]}>Skilled Genie Dashboard</Text>
        <Text style={[styles.loadingText, { color: '#0D9488' }]}>Coming soon!</Text>
      </View>
    </SafeAreaView>
  );
}

// Helper functions
function getServiceEmoji(service: string): string {
  switch (service) {
    case 'delivery': return '🛒';
    case 'courier': return '📦';
    case 'rides': return '🚗';
    case 'errands': return '📋';
    case 'surprise': return '🎁';
    default: return '⭐';
  }
}

function getServiceColor(service: string): string {
  switch (service) {
    case 'delivery': return THEME.primary;
    case 'courier': return THEME.accent3;
    case 'rides': return THEME.secondary;
    case 'errands': return THEME.accent2;
    case 'surprise': return THEME.accent1;
    default: return THEME.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  loadingText: {
    color: THEME.textSecondary,
    marginTop: 8,
    fontSize: 15,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {},
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.text,
  },
  levelTitle: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  profileBtn: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.white,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: THEME.background,
  },
  statusOnline: {
    backgroundColor: THEME.success,
  },
  statusOffline: {
    backgroundColor: THEME.error,
  },
  // Level Bar
  levelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent2 + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  levelIcon: {
    fontSize: 14,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.accent2,
  },
  xpMiniBar: {
    flex: 1,
    height: 6,
    backgroundColor: THEME.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpMiniFill: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 3,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    gap: 4,
  },
  coinIcon: {
    fontSize: 14,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
  },
  // Radar Card
  radarCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    overflow: 'hidden',
  },
  radarGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: THEME.primary,
    opacity: 0.05,
    borderRadius: 200,
  },
  radarContainer: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  radarGrid: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLineH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: THEME.primary + '15',
  },
  gridLineV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: THEME.primary + '15',
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: THEME.primary + '25',
  },
  radarPulse: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  radarSweep: {
    position: 'absolute',
    width: '50%',
    height: 4,
    right: '50%',
    overflow: 'visible',
  },
  sweepGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  centerDotOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.primary + '60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.primary,
  },
  wishDot: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.cardBg,
    borderWidth: 2,
    borderColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  wishDotEmoji: {
    fontSize: 16,
  },
  radarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  radarStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radarStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnlineSmall: {
    backgroundColor: THEME.success,
  },
  statusOfflineSmall: {
    backgroundColor: THEME.error,
  },
  radarStatusText: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  locationIcon: {
    fontSize: 10,
  },
  locationText: {
    fontSize: 11,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  onlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.cardBorder,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    overflow: 'hidden',
  },
  onlineButtonActive: {
    padding: 0,
  },
  onlineButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
    gap: 10,
  },
  onlineEmoji: {
    fontSize: 18,
  },
  offlineEmoji: {
    fontSize: 18,
  },
  onlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textSecondary,
  },
  onlineButtonTextActive: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.white,
  },
  // Quote Card
  quoteCard: {
    backgroundColor: THEME.primary + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary,
  },
  quoteText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardGreen: {
    borderColor: THEME.primary + '40',
  },
  statCardBlue: {
    borderColor: THEME.accent3 + '40',
  },
  statCardGold: {
    borderColor: THEME.accent2 + '40',
  },
  statCardPink: {
    borderColor: THEME.accent1 + '40',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  // XP Card
  xpCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  xpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpLevelEmoji: {
    fontSize: 28,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  xpSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  xpValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  xpAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.primary,
  },
  xpTotal: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  xpBarTrack: {
    height: 12,
    backgroundColor: THEME.cardBorder,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  xpRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpRewardLabel: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent2 + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  xpRewardEmoji: {
    fontSize: 12,
  },
  xpRewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.accent2,
  },
  // Vehicle Card
  vehicleCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: THEME.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 28,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 14,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
  },
  vehicleReg: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  evBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  evEmoji: {
    fontSize: 14,
  },
  evText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.success,
  },
  // Section
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
  },
  // Services
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  serviceEmoji: {
    fontSize: 16,
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noServicesText: {
    fontSize: 14,
    color: THEME.textMuted,
    fontStyle: 'italic',
  },
  // Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    position: 'relative',
  },
  actionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionEmoji: {
    fontSize: 26,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
  },
  actionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: THEME.primary,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.white,
  },
  // Challenge
  challengeCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  challengeGradient: {
    padding: 18,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  challengeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.accent2,
    flex: 1,
  },
  challengeTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  challengeTimerText: {
    fontSize: 12,
    color: THEME.accent2,
    fontWeight: '600',
  },
  challengeDesc: {
    fontSize: 15,
    color: THEME.text,
    marginBottom: 14,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  challengeBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: THEME.cardBorder,
    borderRadius: 5,
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  challengeCount: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.accent2,
  },
  challengeRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeRewardLabel: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginRight: 10,
  },
  challengeRewards: {
    flexDirection: 'row',
    gap: 14,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardEmoji: {
    fontSize: 14,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
  },
  // Streak
  streakCard: {
    backgroundColor: THEME.accent1 + '12',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.accent1 + '25',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  streakEmoji: {
    fontSize: 36,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.accent1,
  },
  streakSubtitle: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakDay: {
    width: 36,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakDayActive: {
    backgroundColor: THEME.accent1,
  },
  streakDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  streakDayTextActive: {
    color: THEME.white,
  },
  streakDayCheck: {
    fontSize: 10,
    color: THEME.white,
    marginTop: 2,
  },
});
