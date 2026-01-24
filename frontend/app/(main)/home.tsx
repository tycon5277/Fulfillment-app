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
const RADAR_SIZE = SCREEN_WIDTH - 80;

// Mock location for when GPS is not available
const MOCK_LOCATION = {
  latitude: 9.9312,
  longitude: 76.2673,
};

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
  
  // Animation refs
  const radarPulse1 = useRef(new Animated.Value(0)).current;
  const radarPulse2 = useRef(new Animated.Value(0)).current;
  const radarPulse3 = useRef(new Animated.Value(0)).current;
  const dotPulse = useRef(new Animated.Value(1)).current;

  const isMobileGenie = user?.agent_type === 'mobile';

  // Radar animation
  useEffect(() => {
    const createPulseAnimation = (value: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 2000,
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

    const pulse1 = createPulseAnimation(radarPulse1, 0);
    const pulse2 = createPulseAnimation(radarPulse2, 666);
    const pulse3 = createPulseAnimation(radarPulse3, 1333);
    
    const dotAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    if (isOnline) {
      pulse1.start();
      pulse2.start();
      pulse3.start();
      dotAnimation.start();
    }

    return () => {
      pulse1.stop();
      pulse2.stop();
      pulse3.stop();
      dotAnimation.stop();
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
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
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
            <View>
              <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0]} 👋</Text>
              <View style={styles.levelRow}>
                <View style={styles.levelBadge}>
                  <Ionicons name="flash" size={12} color={THEME.accent2} />
                  <Text style={styles.levelBadgeText}>Lvl {currentLevel}</Text>
                </View>
                <View style={styles.coinBadge}>
                  <Text style={styles.coinIcon}>🪙</Text>
                  <Text style={styles.coinText}>{Math.floor((stats?.total_earnings || 0))}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => router.push('/(main)/profile')}
            >
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'G'}</Text>
                </View>
              )}
              <View style={[styles.statusIndicator, isOnline ? styles.statusOnline : styles.statusOffline]} />
            </TouchableOpacity>
          </View>

          {/* Radar Map Card */}
          <View style={styles.radarCard}>
            <View style={styles.radarContainer}>
              {/* Radar rings */}
              <View style={styles.radarRing} />
              <View style={[styles.radarRing, styles.radarRing2]} />
              <View style={[styles.radarRing, styles.radarRing3]} />
              
              {/* Animated pulse rings */}
              {isOnline && (
                <>
                  <Animated.View style={[
                    styles.radarPulse,
                    {
                      transform: [{ scale: radarPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.2] }) }],
                      opacity: radarPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                    }
                  ]} />
                  <Animated.View style={[
                    styles.radarPulse,
                    {
                      transform: [{ scale: radarPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.2] }) }],
                      opacity: radarPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                    }
                  ]} />
                  <Animated.View style={[
                    styles.radarPulse,
                    {
                      transform: [{ scale: radarPulse3.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.2] }) }],
                      opacity: radarPulse3.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
                    }
                  ]} />
                </>
              )}
              
              {/* Center dot (you) */}
              <Animated.View style={[
                styles.centerDot,
                isOnline && { transform: [{ scale: dotPulse }] }
              ]}>
                <View style={styles.centerDotInner} />
              </Animated.View>

              {/* Nearby wishes indicators */}
              {isOnline && (
                <>
                  <View style={[styles.wishDot, { top: '25%', left: '30%' }]}>
                    <Ionicons name="basket" size={10} color={THEME.primary} />
                  </View>
                  <View style={[styles.wishDot, { top: '35%', right: '25%' }]}>
                    <Ionicons name="gift" size={10} color={THEME.accent1} />
                  </View>
                  <View style={[styles.wishDot, { bottom: '30%', left: '20%' }]}>
                    <Ionicons name="car" size={10} color={THEME.secondary} />
                  </View>
                </>
              )}
            </View>
            
            <View style={styles.radarInfo}>
              <View style={styles.radarStatus}>
                <View style={[styles.radarStatusDot, isOnline ? styles.radarStatusOnline : styles.radarStatusOffline]} />
                <Text style={styles.radarStatusText}>
                  {isOnline ? 'Scanning for wishes...' : 'Go online to scan'}
                </Text>
              </View>
              <Text style={styles.locationText}>
                📍 {locationError ? 'Mock Location' : 'Live GPS'}
              </Text>
            </View>

            {/* Online Toggle */}
            <TouchableOpacity 
              style={[styles.onlineButton, isOnline && styles.onlineButtonActive]}
              onPress={toggleOnlineStatus}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <ActivityIndicator color={isOnline ? THEME.background : THEME.primary} size="small" />
              ) : (
                <>
                  <Ionicons 
                    name={isOnline ? "radio" : "radio-outline"} 
                    size={20} 
                    color={isOnline ? THEME.background : THEME.primary} 
                  />
                  <Text style={[styles.onlineButtonText, isOnline && styles.onlineButtonTextActive]}>
                    {isOnline ? "ONLINE" : "GO ONLINE"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* XP Progress Card */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeader}>
              <View style={styles.xpLeft}>
                <Text style={styles.xpTitle}>⚡ Level {currentLevel}</Text>
                <Text style={styles.xpSubtitle}>{tasksToNextLevel} tasks to level up!</Text>
              </View>
              <View style={styles.xpRight}>
                <Text style={styles.xpAmount}>{xpInLevel}</Text>
                <Text style={styles.xpTotal}>/ {xpNeeded} XP</Text>
              </View>
            </View>
            <View style={styles.xpBarContainer}>
              <View style={styles.xpBarTrack}>
                <View style={[styles.xpBarFill, { width: `${(xpInLevel / xpNeeded) * 100}%` }]} />
                <View style={[styles.xpBarGlow, { width: `${(xpInLevel / xpNeeded) * 100}%` }]} />
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>💰</Text>
              </View>
              <Text style={styles.statValue}>₹{stats?.today_earnings?.toFixed(0) || '0'}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBlue]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>✅</Text>
              </View>
              <Text style={styles.statValue}>{totalTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={[styles.statCard, styles.statCardAmber]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>⭐</Text>
              </View>
              <Text style={styles.statValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={[styles.statCard, styles.statCardPink]}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statEmoji}>🔥</Text>
              </View>
              <Text style={styles.statValue}>{stats?.active_count || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
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
              <View key={service} style={[styles.serviceChip, { backgroundColor: getServiceColor(service) + '25' }]}>
                <Text style={styles.serviceEmoji}>{getServiceEmoji(service)}</Text>
                <Text style={[styles.serviceChipText, { color: getServiceColor(service) }]}>
                  {service.charAt(0).toUpperCase() + service.slice(1)}
                </Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/orders')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: THEME.primary + '25' }]}>
                <Text style={styles.actionEmoji}>📦</Text>
              </View>
              <Text style={styles.actionLabel}>Orders</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/wishes')}
            >
              <View style={[styles.actionIconBg, { backgroundColor: THEME.secondary + '25' }]}>
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
            >
              <View style={[styles.actionIconBg, { backgroundColor: THEME.accent2 + '25' }]}>
                <Text style={styles.actionEmoji}>🚀</Text>
              </View>
              <Text style={styles.actionLabel}>Active</Text>
            </TouchableOpacity>
          </View>

          {/* Daily Challenge */}
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeEmoji}>🏆</Text>
              <Text style={styles.challengeTitle}>Daily Challenge</Text>
              <View style={styles.challengeTimer}>
                <Ionicons name="time-outline" size={12} color={THEME.accent2} />
                <Text style={styles.challengeTimerText}>8h left</Text>
              </View>
            </View>
            <Text style={styles.challengeDesc}>Complete 5 deliveries today</Text>
            <View style={styles.challengeProgress}>
              <View style={styles.challengeBarTrack}>
                <View style={[styles.challengeBarFill, { width: '40%' }]} />
              </View>
              <Text style={styles.challengeCount}>2/5</Text>
            </View>
            <View style={styles.challengeRewardRow}>
              <Text style={styles.challengeRewardLabel}>Reward:</Text>
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
          </View>

          {/* Streak Card */}
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <View>
                <Text style={styles.streakTitle}>3 Day Streak!</Text>
                <Text style={styles.streakSubtitle}>Keep it going!</Text>
              </View>
            </View>
            <View style={styles.streakDays}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <View key={index} style={[styles.streakDay, index < 3 && styles.streakDayActive]}>
                  <Text style={[styles.streakDayText, index < 3 && styles.streakDayTextActive]}>{day}</Text>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // Skilled Genie placeholder
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F0FDFA' }]}>
      <View style={styles.loadingContainer}>
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
  loadingText: {
    color: THEME.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent2 + '25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.accent2,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  coinIcon: {
    fontSize: 12,
  },
  coinText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
  },
  profileBtn: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.background,
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
    backgroundColor: THEME.online,
  },
  statusOffline: {
    backgroundColor: THEME.offline,
  },
  // Radar styles
  radarCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  radarContainer: {
    width: '100%',
    aspectRatio: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  radarRing: {
    position: 'absolute',
    width: '60%',
    aspectRatio: 1,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: THEME.primary + '30',
  },
  radarRing2: {
    width: '80%',
  },
  radarRing3: {
    width: '100%',
  },
  radarPulse: {
    position: 'absolute',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  centerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.primary + '40',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.cardBg,
    borderWidth: 2,
    borderColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  radarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radarStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radarStatusOnline: {
    backgroundColor: THEME.online,
  },
  radarStatusOffline: {
    backgroundColor: THEME.offline,
  },
  radarStatusText: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  locationText: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  onlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.cardBorder,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  onlineButtonActive: {
    backgroundColor: THEME.primary,
  },
  onlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.primary,
  },
  onlineButtonTextActive: {
    color: THEME.background,
  },
  // XP Card
  xpCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  xpLeft: {},
  xpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  xpSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  xpRight: {
    alignItems: 'flex-end',
  },
  xpAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.primary,
  },
  xpTotal: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  xpBarContainer: {
    position: 'relative',
  },
  xpBarTrack: {
    height: 10,
    backgroundColor: THEME.cardBorder,
    borderRadius: 5,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: THEME.primary,
    borderRadius: 5,
  },
  xpBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: THEME.primary + '50',
    borderRadius: 5,
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  statCardPrimary: {
    borderColor: THEME.primary + '30',
  },
  statCardBlue: {
    borderColor: THEME.accent3 + '30',
  },
  statCardAmber: {
    borderColor: THEME.accent2 + '30',
  },
  statCardPink: {
    borderColor: THEME.accent1 + '30',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 28,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: THEME.text,
  },
  statLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  // Vehicle Card
  vehicleCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 24,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  vehicleReg: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginTop: 2,
  },
  evBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  evEmoji: {
    fontSize: 12,
  },
  evText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.success,
  },
  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 12,
  },
  // Services
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  serviceEmoji: {
    fontSize: 14,
  },
  serviceChipText: {
    fontSize: 13,
    fontWeight: '600',
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    position: 'relative',
  },
  actionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionEmoji: {
    fontSize: 24,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.background,
  },
  // Challenge
  challengeCard: {
    backgroundColor: THEME.accent2 + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.accent2 + '30',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.accent2,
    flex: 1,
  },
  challengeTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeTimerText: {
    fontSize: 12,
    color: THEME.accent2,
  },
  challengeDesc: {
    fontSize: 15,
    color: THEME.text,
    marginBottom: 12,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  challengeBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: THEME.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  challengeBarFill: {
    height: '100%',
    backgroundColor: THEME.accent2,
    borderRadius: 4,
  },
  challengeCount: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.accent2,
  },
  challengeRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeRewardLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginRight: 8,
  },
  challengeRewards: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: THEME.accent1 + '15',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.accent1 + '30',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.accent1,
  },
  streakSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  streakDays: {
    flexDirection: 'row',
    gap: 4,
  },
  streakDay: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakDayActive: {
    backgroundColor: THEME.accent1,
  },
  streakDayText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  streakDayTextActive: {
    color: THEME.white,
  },
});
