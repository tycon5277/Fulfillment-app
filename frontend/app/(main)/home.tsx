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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore, PartnerStats } from '../../src/store';
import * as api from '../../src/api';
import THEME from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock location for when GPS is not available
const MOCK_LOCATION = {
  latitude: 12.9716,
  longitude: 77.5946,
};

// Dark map style
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d1d2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a2a3e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d1d2e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e1a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1d1d2e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1d1d2e' }] },
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
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const isMobileGenie = user?.agent_type === 'mobile';

  // Pulse animation for online status
  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
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

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

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
          <Text style={styles.loadingEmoji}>🧞</Text>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate level and XP
  const totalTasks = stats?.total_tasks || 0;
  const currentLevel = Math.floor(totalTasks / 10) + 1;
  const xpInLevel = (totalTasks % 10) * 100;
  const xpNeeded = 1000;

  // Get vehicle display
  const getVehicleDisplay = () => {
    const make = user?.agent_vehicle_make || '';
    const model = user?.agent_vehicle_model || '';
    if (make && model) return `${make} ${model}`;
    if (make) return make;
    if (model) return model;
    return user?.agent_vehicle?.charAt(0).toUpperCase() + (user?.agent_vehicle || '').slice(1) || 'Vehicle';
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
              <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] || 'Genie'}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, isOnline ? styles.statusOnline : styles.statusOffline]} />
                <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
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
            </TouchableOpacity>
          </View>

          {/* Map Card */}
          <View style={styles.mapCard}>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                customMapStyle={DARK_MAP_STYLE}
                showsUserLocation={false}
                showsMyLocationButton={false}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
              >
                {/* Pulse circle when online */}
                {isOnline && (
                  <Circle
                    center={location}
                    radius={200}
                    fillColor="rgba(52, 211, 153, 0.1)"
                    strokeColor="rgba(52, 211, 153, 0.3)"
                    strokeWidth={1}
                  />
                )}
                <Circle
                  center={location}
                  radius={80}
                  fillColor="rgba(6, 182, 212, 0.15)"
                  strokeColor="rgba(6, 182, 212, 0.4)"
                  strokeWidth={2}
                />
                {/* Custom marker */}
                <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.markerContainer}>
                    {isOnline && (
                      <Animated.View 
                        style={[
                          styles.markerPulse,
                          { 
                            transform: [{ scale: pulseAnim }],
                            opacity: pulseAnim.interpolate({
                              inputRange: [1, 1.5],
                              outputRange: [0.6, 0],
                            }),
                          }
                        ]} 
                      />
                    )}
                    <View style={[styles.markerDot, isOnline && styles.markerDotOnline]}>
                      <Ionicons 
                        name={user?.agent_vehicle === 'car' ? 'car' : 'bicycle'} 
                        size={14} 
                        color="#FFF" 
                      />
                    </View>
                  </View>
                </Marker>
              </MapView>
              
              {/* Map overlay info */}
              <View style={styles.mapOverlay}>
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={12} color={THEME.primary} />
                  <Text style={styles.locationText}>
                    {locationError ? 'Demo Location' : 'Your Location'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Go Online Button - Distinctive Design */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                onPress={toggleOnlineStatus}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={statusLoading}
                activeOpacity={1}
                style={styles.onlineButtonWrapper}
              >
                {isOnline ? (
                  <LinearGradient
                    colors={['#34D399', '#10B981']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.onlineButton}
                  >
                    {statusLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <View style={styles.onlineIndicator}>
                          <View style={styles.onlineDot} />
                        </View>
                        <Text style={styles.onlineButtonText}>ONLINE</Text>
                        <Text style={styles.onlineSubtext}>Tap to go offline</Text>
                      </>
                    )}
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.onlineButton}
                  >
                    {statusLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <Ionicons name="power" size={28} color="#FFF" />
                        <Text style={styles.offlineButtonText}>GO ONLINE</Text>
                        <Text style={styles.offlineSubtext}>Start accepting wishes</Text>
                      </>
                    )}
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>₹{stats?.today_earnings?.toFixed(0) || '0'}</Text>
              <Text style={styles.quickStatLabel}>Today</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{totalTasks}</Text>
              <Text style={styles.quickStatLabel}>Completed</Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatValue}>{stats?.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.quickStatLabel}>Rating</Text>
            </View>
          </View>

          {/* Level Progress */}
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>{currentLevel}</Text>
              </View>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>Level {currentLevel}</Text>
                <Text style={styles.levelSubtitle}>{xpInLevel} / {xpNeeded} XP</Text>
              </View>
              <View style={styles.xpBadge}>
                <Ionicons name="flash" size={14} color={THEME.accent2} />
                <Text style={styles.xpBadgeText}>+100 XP</Text>
              </View>
            </View>
            <View style={styles.xpBarTrack}>
              <View style={[styles.xpBarFill, { width: `${(xpInLevel / xpNeeded) * 100}%` }]} />
            </View>
          </View>

          {/* Vehicle Info */}
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIcon}>
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
                  <Ionicons name="leaf" size={12} color={THEME.success} />
                  <Text style={styles.evText}>EV</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/orders')}
            >
              <View style={[styles.actionIcon, { backgroundColor: THEME.accent3 + '20' }]}>
                <Ionicons name="cube-outline" size={24} color={THEME.accent3} />
              </View>
              <Text style={styles.actionLabel}>Tasks</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/wishes')}
            >
              <View style={[styles.actionIcon, { backgroundColor: THEME.secondary + '20' }]}>
                <Ionicons name="sparkles-outline" size={24} color={THEME.secondary} />
              </View>
              <Text style={styles.actionLabel}>Wishes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/deliveries')}
            >
              <View style={[styles.actionIcon, { backgroundColor: THEME.accent2 + '20' }]}>
                <Ionicons name="rocket-outline" size={24} color={THEME.accent2} />
              </View>
              <Text style={styles.actionLabel}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(main)/profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: THEME.accent1 + '20' }]}>
                <Ionicons name="wallet-outline" size={24} color={THEME.accent1} />
              </View>
              <Text style={styles.actionLabel}>Earnings</Text>
            </TouchableOpacity>
          </View>

          {/* Services */}
          {(user?.agent_services && user.agent_services.length > 0) && (
            <>
              <Text style={styles.sectionTitle}>Your Services</Text>
              <View style={styles.servicesRow}>
                {user.agent_services.map((service: string) => (
                  <View key={service} style={styles.serviceChip}>
                    <Text style={styles.serviceEmoji}>{getServiceEmoji(service)}</Text>
                    <Text style={styles.serviceText}>
                      {service.charAt(0).toUpperCase() + service.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

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

// Helper function
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
    fontSize: 48,
    marginBottom: 12,
  },
  loadingText: {
    color: THEME.textSecondary,
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
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: THEME.success,
  },
  statusOffline: {
    backgroundColor: THEME.textMuted,
  },
  statusText: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  profileBtn: {},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: THEME.cardBorder,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.cardBg,
    borderWidth: 2,
    borderColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  // Map Card
  mapCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  mapContainer: {
    height: 180,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg + 'E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: THEME.text,
    fontWeight: '500',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.success,
  },
  markerDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: THEME.cardBg,
  },
  markerDotOnline: {
    backgroundColor: THEME.success,
  },
  // Online Button
  onlineButtonWrapper: {
    margin: 12,
  },
  onlineButton: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  onlineButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 2,
  },
  onlineSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  offlineButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 8,
    letterSpacing: 1,
  },
  offlineSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: THEME.cardBorder,
  },
  quickStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
  },
  quickStatLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  // Level Card
  levelCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.secondary,
  },
  levelInfo: {
    flex: 1,
    marginLeft: 12,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
  },
  levelSubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.accent2 + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.accent2,
  },
  xpBarTrack: {
    height: 6,
    backgroundColor: THEME.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: THEME.secondary,
    borderRadius: 3,
  },
  // Vehicle Card
  vehicleCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 22,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  vehicleReg: {
    fontSize: 13,
    color: THEME.textMuted,
    marginTop: 1,
  },
  evBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  evText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.success,
  },
  // Section
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginBottom: 12,
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: THEME.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.textSecondary,
  },
  // Services
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    gap: 6,
  },
  serviceEmoji: {
    fontSize: 14,
  },
  serviceText: {
    fontSize: 13,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
});
