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

// Use Carto basemaps with desert/sandal color (light voyager with sepia tint)
const getCartoTileUrl = (lat: number, lon: number, zoom: number = 15) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  // Using Carto voyager basemap with warmer tones
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`;
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
  const [mapTiles, setMapTiles] = useState<string[]>([]);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulse2Anim = useRef(new Animated.Value(1)).current;
  const pulse3Anim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const dotGlow = useRef(new Animated.Value(0.5)).current;

  const isMobileGenie = user?.agent_type === 'mobile';

  // Generate map tiles for current location using Carto (dark theme)
  useEffect(() => {
    const generateMapTiles = () => {
      const zoom = 15;
      const lat = location.latitude;
      const lon = location.longitude;
      
      // Calculate tile coordinates
      const n = Math.pow(2, zoom);
      const x = Math.floor((lon + 180) / 360 * n);
      const latRad = lat * Math.PI / 180;
      const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
      
      // Generate 3x3 grid of Carto dark matter tiles
      const tiles: string[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          // Using Carto dark_all basemap - free to use with attribution
          tiles.push(`https://basemaps.cartocdn.com/dark_all/${zoom}/${x + dx}/${y + dy}.png`);
        }
      }
      setMapTiles(tiles);
    };
    
    generateMapTiles();
  }, [location]);

  // Pulse animation for location indicator
  useEffect(() => {
    if (isOnline) {
      // Multi-ring pulse animation
      const createPulse = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 2.5,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const p1 = createPulse(pulseAnim, 0);
      const p2 = createPulse(pulse2Anim, 700);
      const p3 = createPulse(pulse3Anim, 1400);
      
      p1.start();
      p2.start();
      p3.start();

      // Dot glow
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotGlow, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(dotGlow, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      return () => {
        p1.stop();
        p2.stop();
        p3.stop();
      };
    } else {
      pulseAnim.setValue(1);
      pulse2Anim.setValue(1);
      pulse3Anim.setValue(1);
      dotGlow.setValue(0.5);
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
      console.log('User data received:', JSON.stringify(response.data, null, 2));
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
  const totalTasks = stats?.total_tasks || user?.agent_total_deliveries || 0;
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
    if (user?.agent_vehicle) {
      return user.agent_vehicle.charAt(0).toUpperCase() + user.agent_vehicle.slice(1);
    }
    return 'Not set';
  };

  // Get vehicle type emoji
  const getVehicleEmoji = () => {
    const vehicleType = user?.agent_vehicle?.toLowerCase();
    if (vehicleType === 'car') return '🚗';
    if (vehicleType === 'motorbike') return '🏍️';
    return '🛵';
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
          {/* Header with Avatar */}
          <TouchableOpacity 
            style={styles.header}
            onPress={() => router.push('/(main)/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              {/* Avatar */}
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarText}>{user?.name?.charAt(0) || 'G'}</Text>
                </View>
              )}
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>Hey, {user?.name?.split(' ')[0] || 'Genie'}</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, isOnline ? styles.statusOnline : styles.statusOffline]} />
                  <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={THEME.textMuted} />
          </TouchableOpacity>

          {/* Map Card with Real OpenStreetMap */}
          <View style={styles.mapCard}>
            <View style={styles.mapContainer}>
              {/* Carto Dark Map Tiles Grid */}
              <View style={styles.mapTilesContainer}>
                {mapTiles.length > 0 ? (
                  <View style={styles.tilesGrid}>
                    {mapTiles.map((tile, index) => (
                      <Image 
                        key={index}
                        source={{ uri: tile }}
                        style={styles.mapTile}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="map-outline" size={40} color={THEME.textMuted} />
                    <Text style={styles.mapPlaceholderText}>Loading map...</Text>
                  </View>
                )}
              </View>

              {/* Pulse rings when online */}
              {isOnline && (
                <>
                  <Animated.View 
                    style={[
                      styles.pulseRing,
                      { 
                        transform: [{ scale: pulseAnim }],
                        opacity: pulseAnim.interpolate({
                          inputRange: [1, 2.5],
                          outputRange: [0.4, 0],
                        }),
                      }
                    ]} 
                  />
                  <Animated.View 
                    style={[
                      styles.pulseRing,
                      { 
                        transform: [{ scale: pulse2Anim }],
                        opacity: pulse2Anim.interpolate({
                          inputRange: [1, 2.5],
                          outputRange: [0.4, 0],
                        }),
                      }
                    ]} 
                  />
                  <Animated.View 
                    style={[
                      styles.pulseRing,
                      { 
                        transform: [{ scale: pulse3Anim }],
                        opacity: pulse3Anim.interpolate({
                          inputRange: [1, 2.5],
                          outputRange: [0.4, 0],
                        }),
                      }
                    ]} 
                  />
                </>
              )}

              {/* Center location marker */}
              <View style={styles.locationMarkerContainer}>
                <Animated.View 
                  style={[
                    styles.locationGlow, 
                    isOnline && { opacity: dotGlow }
                  ]} 
                />
                <View style={[styles.locationMarker, isOnline && styles.locationMarkerOnline]}>
                  <Ionicons 
                    name={user?.agent_vehicle === 'car' ? 'car' : 'bicycle'} 
                    size={18} 
                    color="#FFF" 
                  />
                </View>
              </View>

              {/* Location info badge */}
              <View style={styles.mapBadgeContainer}>
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={12} color={THEME.primary} />
                  <Text style={styles.locationText}>
                    {locationError ? 'Demo Location' : 'Your Location'}
                  </Text>
                </View>
              </View>

              {/* Coordinates display */}
              <View style={styles.coordsContainer}>
                <Text style={styles.coordsText}>
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </Text>
              </View>
            </View>

            {/* Go Online Button - Distinctive Design */}
            <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
              <TouchableOpacity
                onPress={toggleOnlineStatus}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={statusLoading}
                activeOpacity={1}
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
                        <View style={styles.onlineDotContainer}>
                          <View style={styles.onlineDotOuter}>
                            <View style={styles.onlineDotInner} />
                          </View>
                        </View>
                        <View style={styles.buttonTextContainer}>
                          <Text style={styles.onlineButtonText}>ONLINE</Text>
                          <Text style={styles.onlineSubtext}>Tap to go offline</Text>
                        </View>
                      </>
                    )}
                  </LinearGradient>
                ) : (
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.offlineButton}
                  >
                    {statusLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <>
                        <View style={styles.powerIconContainer}>
                          <Ionicons name="power" size={32} color="#FFF" />
                        </View>
                        <View style={styles.buttonTextContainer}>
                          <Text style={styles.offlineButtonText}>GO ONLINE</Text>
                          <Text style={styles.offlineSubtext}>Start accepting wishes</Text>
                        </View>
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
              <Text style={styles.quickStatValue}>{(user?.agent_rating || stats?.rating || 5.0).toFixed(1)}</Text>
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

          {/* Vehicle Info - Enhanced */}
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeader}>
              <Text style={styles.vehicleSectionTitle}>Your Vehicle</Text>
              {user?.agent_is_electric && (
                <View style={styles.evBadge}>
                  <Ionicons name="leaf" size={12} color={THEME.success} />
                  <Text style={styles.evText}>Electric</Text>
                </View>
              )}
            </View>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIcon}>
                <Text style={styles.vehicleEmoji}>{getVehicleEmoji()}</Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{getVehicleDisplay()}</Text>
                <View style={styles.vehicleDetails}>
                  {user?.agent_vehicle_registration && (
                    <View style={styles.vehicleDetailItem}>
                      <Ionicons name="card-outline" size={12} color={THEME.textMuted} />
                      <Text style={styles.vehicleDetailText}>{user.agent_vehicle_registration}</Text>
                    </View>
                  )}
                  {user?.agent_vehicle_color && (
                    <View style={styles.vehicleDetailItem}>
                      <Ionicons name="color-palette-outline" size={12} color={THEME.textMuted} />
                      <Text style={styles.vehicleDetailText}>{user.agent_vehicle_color}</Text>
                    </View>
                  )}
                </View>
              </View>
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
                <Ionicons name="storefront-outline" size={24} color={THEME.accent3} />
              </View>
              <Text style={styles.actionLabel}>Hub Order</Text>
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
              <Text style={styles.actionLabel}>Deliveries</Text>
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
  // Header with Avatar
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: THEME.cardBg,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  headerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
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
  // Map Card - Larger
  mapCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  mapContainer: {
    height: 220,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapTilesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 768,
    height: 768,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -384,
    marginTop: -384,
  },
  mapTile: {
    width: 256,
    height: 256,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.backgroundSecondary,
  },
  mapPlaceholderText: {
    color: THEME.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: THEME.success,
  },
  locationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  locationGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: THEME.primary,
    opacity: 0.2,
  },
  locationMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: THEME.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  locationMarkerOnline: {
    backgroundColor: THEME.success,
  },
  mapBadgeContainer: {
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
  coordsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  coordsText: {
    fontSize: 10,
    color: THEME.textMuted,
    backgroundColor: THEME.cardBg + 'CC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // Button styles
  buttonWrapper: {
    margin: 12,
  },
  onlineButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineButton: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDotContainer: {
    marginRight: 14,
  },
  onlineDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  powerIconContainer: {
    marginRight: 14,
  },
  buttonTextContainer: {
    flex: 1,
  },
  onlineButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  onlineSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  offlineButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  offlineSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
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
  // Vehicle Card - Enhanced
  vehicleCard: {
    backgroundColor: THEME.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: THEME.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 26,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '600',
    color: THEME.text,
  },
  vehicleDetails: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 12,
  },
  vehicleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleDetailText: {
    fontSize: 12,
    color: THEME.textSecondary,
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
    fontSize: 11,
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
