import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#F8FAFC',
  cardBg: '#FFFFFF',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
};

// Generate Carto map tile URL
const getCartoTileUrl = (lat: number, lon: number, zoom: number = 15) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x}/${y}.png`;
};

// Generate 3x3 grid of map tiles
const generateMapTiles = (lat: number, lon: number, zoom: number = 15) => {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  
  const tiles: string[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push(`https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${x + dx}/${y + dy}.png`);
    }
  }
  return tiles;
};

interface TrackingData {
  tracking_available: boolean;
  message?: string;
  wish_id?: string;
  wish_status?: string;
  wish_title?: string;
  wish_type?: string;
  genie?: {
    user_id: string;
    name: string;
    phone: string | null;
    picture: string | null;
    rating: number;
  };
  genie_location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    updated_at?: string;
    is_online: boolean;
  } | null;
  destination?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  eta_minutes?: number;
  distance_km?: number;
}

export default function TrackingDemoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const wishId = (params.wishId as string) || 'demo_wish_001';
  
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [mapTiles, setMapTiles] = useState<string[]>([]);
  
  // Demo mode: Use mock data if API fails
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const DEMO_DATA: TrackingData = {
    tracking_available: true,
    wish_id: 'demo_wish_001',
    wish_status: 'in_progress',
    wish_title: 'Home Cleaning Service',
    wish_type: 'cleaning',
    genie: {
      user_id: 'demo_genie',
      name: 'Rahul Kumar',
      phone: '+91 98765 43210',
      picture: null,
      rating: 4.8,
    },
    genie_location: {
      latitude: 12.9716,
      longitude: 77.5946,
      accuracy: 10,
      heading: 45,
      speed: 15,
      updated_at: new Date().toISOString(),
      is_online: true,
    },
    destination: {
      lat: 12.9800,
      lng: 77.6000,
      address: 'Indiranagar, Bangalore',
    },
    eta_minutes: 8,
    distance_km: 2.5,
  };
  
  const fetchTrackingData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.trackWishGenie(wishId);
      setTrackingData(response.data);
      setIsDemoMode(false);
      
      // Update map tiles based on Genie's location
      if (response.data.genie_location) {
        const tiles = generateMapTiles(
          response.data.genie_location.latitude,
          response.data.genie_location.longitude
        );
        setMapTiles(tiles);
      }
    } catch (err: any) {
      console.log('API error, using demo mode:', err.message);
      // Use demo data if API fails
      setTrackingData(DEMO_DATA);
      setIsDemoMode(true);
      
      if (DEMO_DATA.genie_location) {
        const tiles = generateMapTiles(
          DEMO_DATA.genie_location.latitude,
          DEMO_DATA.genie_location.longitude
        );
        setMapTiles(tiles);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [wishId]);
  
  useEffect(() => {
    fetchTrackingData();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchTrackingData, 5000);
    return () => clearInterval(interval);
  }, [fetchTrackingData]);
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchTrackingData();
  };
  
  const handleCall = () => {
    if (trackingData?.genie?.phone) {
      Linking.openURL(`tel:${trackingData.genie.phone}`);
    }
  };
  
  const handleChat = () => {
    // Navigate to chat screen (would need room_id in real implementation)
    router.push('/chat/demo_room');
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
        return COLORS.primary;
      case 'in_progress':
        return COLORS.warning;
      case 'completed':
        return COLORS.success;
      default:
        return COLORS.textMuted;
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'accepted':
        return 'Genie Accepted';
      case 'in_progress':
        return 'On The Way';
      case 'matched':
        return 'Genie Matched';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading tracking info...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!trackingData?.tracking_available) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Genie</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="location-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.errorTitle}>Tracking Not Available</Text>
          <Text style={styles.errorText}>
            {trackingData?.message || 'No Genie has been assigned yet.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const genie = trackingData.genie;
  const genieLocation = trackingData.genie_location;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Genie</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Ionicons name="information-circle" size={18} color="#FFF" />
            <Text style={styles.demoBannerText}>Demo Mode - Showing sample data</Text>
          </View>
        )}
        
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <View style={styles.mapTilesGrid}>
            {mapTiles.map((tile, index) => (
              <Image
                key={index}
                source={{ uri: tile }}
                style={styles.mapTile}
                resizeMode="cover"
              />
            ))}
          </View>
          
          {/* Genie Location Marker */}
          <View style={styles.genieMarkerContainer}>
            <View style={styles.genieMarkerPulse} />
            <View style={styles.genieMarker}>
              <Ionicons name="bicycle" size={20} color="#FFF" />
            </View>
          </View>
          
          {/* Online Status Indicator */}
          {genieLocation?.is_online && (
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Live</Text>
            </View>
          )}
        </View>
        
        {/* ETA Card */}
        <View style={styles.etaCard}>
          <View style={styles.etaMain}>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <View style={styles.etaRow}>
              <Text style={styles.etaValue}>
                {trackingData.eta_minutes ? `${trackingData.eta_minutes} min` : '--'}
              </Text>
              {trackingData.distance_km && (
                <Text style={styles.etaDistance}>{trackingData.distance_km} km away</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trackingData.wish_status || '') + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(trackingData.wish_status || '') }]}>
              {getStatusLabel(trackingData.wish_status || '')}
            </Text>
          </View>
        </View>
        
        {/* Genie Info Card */}
        <View style={styles.genieCard}>
          <View style={styles.genieHeader}>
            <View style={styles.genieAvatar}>
              {genie?.picture ? (
                <Image source={{ uri: genie.picture }} style={styles.genieAvatarImage} />
              ) : (
                <Ionicons name="person" size={32} color={COLORS.primary} />
              )}
            </View>
            <View style={styles.genieInfo}>
              <Text style={styles.genieName}>{genie?.name || 'Your Genie'}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{genie?.rating?.toFixed(1) || '5.0'}</Text>
              </View>
            </View>
          </View>
          
          {/* Contact Actions */}
          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.contactBtn} onPress={handleCall}>
              <View style={[styles.contactIconBg, { backgroundColor: COLORS.success + '15' }]}>
                <Ionicons name="call" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.contactBtnText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactBtn} onPress={handleChat}>
              <View style={[styles.contactIconBg, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="chatbubble" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.contactBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Wish Details */}
        <View style={styles.wishCard}>
          <Text style={styles.wishCardTitle}>Service Details</Text>
          <View style={styles.wishDetail}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.wishDetailText}>{trackingData.wish_title || 'Service Request'}</Text>
          </View>
          {trackingData.destination?.address && (
            <View style={styles.wishDetail}>
              <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.wishDetailText}>{trackingData.destination.address}</Text>
            </View>
          )}
        </View>
        
        {/* Location Debug Info (for demo) */}
        {genieLocation && (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>Location Data</Text>
            <Text style={styles.debugText}>
              📍 {genieLocation.latitude?.toFixed(6)}, {genieLocation.longitude?.toFixed(6)}
            </Text>
            {genieLocation.speed && (
              <Text style={styles.debugText}>🚗 Speed: {(genieLocation.speed * 3.6).toFixed(1)} km/h</Text>
            )}
            {genieLocation.updated_at && (
              <Text style={styles.debugText}>
                🕐 Updated: {new Date(genieLocation.updated_at).toLocaleTimeString()}
              </Text>
            )}
          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning,
    paddingVertical: 8,
    gap: 6,
  },
  demoBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  mapContainer: {
    height: 280,
    backgroundColor: COLORS.cardBg,
    position: 'relative',
    overflow: 'hidden',
  },
  mapTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SCREEN_WIDTH * 3,
    height: SCREEN_WIDTH * 3,
    marginLeft: -SCREEN_WIDTH,
    marginTop: -SCREEN_WIDTH + 140,
  },
  mapTile: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  genieMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genieMarkerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '30',
  },
  genieMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  etaCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: -30,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  etaMain: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 8,
  },
  etaValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  etaDistance: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  genieCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  genieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genieAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  genieAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  genieInfo: {
    flex: 1,
    marginLeft: 14,
  },
  genieName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  contactActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  contactIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  wishCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wishCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  wishDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  wishDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  debugCard: {
    backgroundColor: COLORS.text + '08',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
