import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GameModal from '../src/components/GameModal';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Theme colors
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
  blue: '#3B82F6',
  magenta: '#D946EF',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

interface NavigationPoint {
  type: 'pickup' | 'dropoff';
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
  notes?: string;
}

export default function NavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse params
  const orderType = params.type as string || 'hub_order';
  const orderId = params.orderId as string || 'ORD-001';
  const title = params.title as string || 'Sweet Treats Bakery';
  
  // Navigation points
  const [currentStep, setCurrentStep] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(12);
  const [distance, setDistance] = useState(2.5);
  
  // Modal states
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Mock navigation points
  const navigationPoints: NavigationPoint[] = [
    {
      type: 'pickup',
      name: title || 'Sweet Treats Bakery',
      address: 'Shop 12, MG Road, Bangalore 560001',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      phone: '+91 98765 43210',
      notes: 'Ring the bell at gate 2',
    },
    {
      type: 'dropoff',
      name: 'Priya K.',
      address: '42, Palm Residency, Koramangala, Bangalore 560034',
      coordinates: { lat: 12.9352, lng: 77.6245 },
      phone: '+91 98765 12345',
      notes: 'Leave at security if not available',
    },
  ];

  const currentPoint = navigationPoints[currentStep];
  
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for current location
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Progress animation
    Animated.timing(progressAnim, {
      toValue: currentStep === 0 ? 0.5 : 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  // Open Google Maps
  const openGoogleMaps = () => {
    const { lat, lng } = currentPoint.coordinates;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to web
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      }
    });
  };

  // Call contact
  const callContact = () => {
    if (currentPoint.phone) {
      Linking.openURL(`tel:${currentPoint.phone.replace(/\s/g, '')}`);
    }
  };

  // Update status
  const handleStatusUpdate = () => {
    if (currentStep === 0) {
      setShowPickupModal(true);
    } else {
      setShowDeliveryModal(true);
    }
  };

  // Handle pickup confirmation
  const handlePickupConfirm = () => {
    setShowPickupModal(false);
    setCurrentStep(1);
    setEstimatedTime(15);
    setDistance(3.8);
  };

  // Handle delivery confirmation  
  const handleDeliveryConfirm = () => {
    setShowDeliveryModal(false);
    setShowSuccessModal(true);
  };

  // Handle completion
  const handleCompletion = () => {
    setShowSuccessModal(false);
    router.back();
  };

  // Map tile URL
  const getMapTileUrl = () => {
    const { lat, lng } = currentPoint.coordinates;
    const zoom = 15;
    return `https://basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${Math.floor((lng + 180) / 360 * Math.pow(2, zoom))}/${Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))}.png`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Navigation</Text>
          <Text style={styles.headerSubtitle}>{orderId}</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <Image
            source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${currentPoint.coordinates.lng},${currentPoint.coordinates.lat},14,0/400x250?access_token=pk.placeholder` }}
            style={styles.mapImage}
            defaultSource={{ uri: 'https://via.placeholder.com/400x250/1E293B/64748B?text=Loading+Map' }}
          />
          <View style={styles.mapOverlay}>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location" size={40} color={COLORS.primary} />
              <Text style={styles.mapText}>Map Preview</Text>
            </View>
          </View>
          
          {/* ETA Badge */}
          <View style={styles.etaBadge}>
            <Ionicons name="time" size={16} color={COLORS.amber} />
            <Text style={styles.etaText}>{estimatedTime} min</Text>
            <Text style={styles.etaDivider}>•</Text>
            <Text style={styles.etaDistance}>{distance} km</Text>
          </View>
        </View>

        {/* Journey Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={styles.progressPoint}>
              <View style={[styles.progressDot, currentStep >= 0 && styles.progressDotActive]}>
                <Ionicons name="storefront" size={14} color="#FFF" />
              </View>
              <Text style={[styles.progressLabel, currentStep === 0 && styles.progressLabelActive]}>
                Pickup
              </Text>
            </View>
            
            <View style={styles.progressLineContainer}>
              <View style={styles.progressLineBg} />
              <Animated.View 
                style={[
                  styles.progressLineFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['0%', '50%', '100%'],
                    }),
                  },
                ]} 
              />
            </View>
            
            <View style={styles.progressPoint}>
              <View style={[styles.progressDot, currentStep >= 1 && styles.progressDotActive]}>
                <Ionicons name="flag" size={14} color={currentStep >= 1 ? '#FFF' : COLORS.textMuted} />
              </View>
              <Text style={[styles.progressLabel, currentStep === 1 && styles.progressLabelActive]}>
                Drop-off
              </Text>
            </View>
          </View>
        </View>

        {/* Current Destination Card */}
        <View style={styles.destinationCard}>
          <View style={styles.destinationHeader}>
            <View style={[styles.destinationIcon, { backgroundColor: currentStep === 0 ? COLORS.cyan + '20' : COLORS.green + '20' }]}>
              <Ionicons 
                name={currentStep === 0 ? 'storefront' : 'location'} 
                size={24} 
                color={currentStep === 0 ? COLORS.cyan : COLORS.green} 
              />
            </View>
            <View style={styles.destinationInfo}>
              <Text style={styles.destinationType}>
                {currentStep === 0 ? 'PICKUP POINT' : 'DROP-OFF POINT'}
              </Text>
              <Text style={styles.destinationName}>{currentPoint.name}</Text>
            </View>
            <Animated.View style={[styles.liveIndicator, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.liveDot} />
            </Animated.View>
          </View>
          
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.addressText}>{currentPoint.address}</Text>
          </View>
          
          {currentPoint.notes && (
            <View style={styles.notesContainer}>
              <Ionicons name="information-circle" size={16} color={COLORS.amber} />
              <Text style={styles.notesText}>{currentPoint.notes}</Text>
            </View>
          )}

          {/* Contact Actions */}
          <View style={styles.contactActions}>
            <TouchableOpacity style={styles.contactButton} onPress={callContact}>
              <Ionicons name="call" size={20} color={COLORS.green} />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton}>
              <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
              <Text style={styles.contactButtonText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Options */}
        <Text style={styles.sectionTitle}>Navigate With</Text>
        
        <View style={styles.navOptions}>
          {/* In-House Navigation */}
          <TouchableOpacity style={styles.navOption} activeOpacity={0.9}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.magenta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.navOptionGradient}
            >
              <View style={styles.navOptionIcon}>
                <Ionicons name="navigate" size={28} color="#FFF" />
              </View>
              <View style={styles.navOptionInfo}>
                <Text style={styles.navOptionTitle}>In-App Navigation</Text>
                <Text style={styles.navOptionSubtitle}>Turn-by-turn directions</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Google Maps */}
          <TouchableOpacity style={styles.navOption} activeOpacity={0.9} onPress={openGoogleMaps}>
            <View style={styles.navOptionCard}>
              <View style={[styles.navOptionIcon, { backgroundColor: COLORS.green + '20' }]}>
                <Ionicons name="map" size={28} color={COLORS.green} />
              </View>
              <View style={styles.navOptionInfo}>
                <Text style={styles.navOptionTitleDark}>Google Maps</Text>
                <Text style={styles.navOptionSubtitleDark}>Open in external app</Text>
              </View>
              <Ionicons name="open-outline" size={20} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Status Info */}
        <View style={styles.statusInfo}>
          <View style={styles.statusRow}>
            <Ionicons name="people" size={18} color={COLORS.textMuted} />
            <Text style={styles.statusText}>Vendor & Customer can see your location</Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons name="sync" size={18} color={COLORS.textMuted} />
            <Text style={styles.statusText}>ETA updates automatically</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity 
          style={styles.actionButton} 
          activeOpacity={0.9}
          onPress={handleStatusUpdate}
        >
          <LinearGradient
            colors={currentStep === 0 ? [COLORS.cyan, COLORS.blue] : [COLORS.green, '#16A34A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Ionicons 
              name={currentStep === 0 ? 'checkmark-circle' : 'flag'} 
              size={22} 
              color="#FFF" 
            />
            <Text style={styles.actionText}>
              {currentStep === 0 ? 'Arrived at Pickup' : 'Complete Delivery'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Beautiful Game Modals */}
      <GameModal
        visible={showPickupModal}
        type="confirm"
        title="Confirm Pickup"
        message="Have you picked up the order?"
        emoji="📦"
        primaryButtonText="Yes, Picked Up"
        secondaryButtonText="Not Yet"
        onPrimaryPress={handlePickupConfirm}
        onSecondaryPress={() => setShowPickupModal(false)}
        onClose={() => setShowPickupModal(false)}
      />

      <GameModal
        visible={showDeliveryModal}
        type="confirm"
        title="Complete Delivery"
        message="Has the order been delivered successfully?"
        emoji="🎯"
        primaryButtonText="Yes, Delivered"
        secondaryButtonText="Not Yet"
        onPrimaryPress={handleDeliveryConfirm}
        onSecondaryPress={() => setShowDeliveryModal(false)}
        onClose={() => setShowDeliveryModal(false)}
      />

      <GameModal
        visible={showSuccessModal}
        type="success"
        title="Delivery Complete!"
        message="Amazing work, Genie! You've successfully completed this delivery."
        emoji="🎉"
        xpReward={85}
        coinsReward={120}
        primaryButtonText="Continue"
        onPrimaryPress={handleCompletion}
        onClose={handleCompletion}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  helpButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
    backgroundColor: COLORS.cardBg,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  etaBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  etaText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.amber,
  },
  etaDivider: {
    color: COLORS.textMuted,
  },
  etaDistance: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressSection: {
    padding: 20,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressPoint: {
    alignItems: 'center',
  },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: COLORS.green,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  progressLabelActive: {
    color: COLORS.green,
    fontWeight: '700',
  },
  progressLineContainer: {
    flex: 1,
    height: 4,
    marginHorizontal: 8,
    position: 'relative',
  },
  progressLineBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: COLORS.green,
    borderRadius: 2,
  },
  destinationCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  destinationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  destinationType: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.amber + '15',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.amber,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  navOptions: {
    paddingHorizontal: 16,
    gap: 10,
  },
  navOption: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  navOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  navOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 14,
  },
  navOptionIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navOptionInfo: {
    flex: 1,
  },
  navOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  navOptionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  navOptionTitleDark: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  navOptionSubtitleDark: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusInfo: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});
