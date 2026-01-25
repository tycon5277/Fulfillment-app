import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium Dark Theme
const COLORS = {
  background: '#08080C',
  backgroundSecondary: '#0F0F14',
  cardBg: '#16161E',
  cardBorder: '#252530',
  cardBorderActive: '#3B82F6',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  cyan: '#06B6D4',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  gold: '#FBBF24',
  success: '#34D399',
};

type GenieType = 'carpet' | 'skilled' | null;

const GENIE_TYPES = [
  {
    type: 'carpet' as GenieType,
    title: 'Carpet Genie',
    subtitle: 'Swift & Mobile',
    emoji: '🧞‍♂️',
    magicEmoji: '🪄',
    carpetEmoji: '🛸',
    gradientColors: ['#1E40AF', '#3B82F6', '#06B6D4'] as const,
    glowColor: '#3B82F6',
    description: 'Soar through the city on your magic carpet',
    features: [
      { icon: 'rocket', text: 'Lightning Deliveries', color: '#06B6D4' },
      { icon: 'car-sport', text: 'Premium Rides', color: '#3B82F6' },
      { icon: 'bag-handle', text: 'Smart Errands', color: '#8B5CF6' },
      { icon: 'gift', text: 'Surprise Magic', color: '#EC4899' },
    ],
    tagline: 'Your vehicle is your flying carpet!',
    earnings: '₹800 - ₹2,500/day',
  },
  {
    type: 'skilled' as GenieType,
    title: 'Skilled Genie',
    subtitle: 'Expert & Professional',
    emoji: '🔮',
    magicEmoji: '✨',
    carpetEmoji: '⚡',
    gradientColors: ['#5B21B6', '#8B5CF6', '#A78BFA'] as const,
    glowColor: '#8B5CF6',
    description: 'Cast spells with your professional expertise',
    features: [
      { icon: 'construct', text: 'Home Wizardry', color: '#F59E0B' },
      { icon: 'color-palette', text: 'Creative Arts', color: '#EC4899' },
      { icon: 'hardware-chip', text: 'Tech Sorcery', color: '#06B6D4' },
      { icon: 'fitness', text: 'Wellness Magic', color: '#34D399' },
    ],
    tagline: 'Your skills are your magic powers!',
    earnings: '₹1,000 - ₹5,000/day',
  },
];

export default function GenieTypeSelectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<GenieType>(null);
  
  // Animations
  const carpetScale = useRef(new Animated.Value(1)).current;
  const skilledScale = useRef(new Animated.Value(1)).current;
  const carpetGlow = useRef(new Animated.Value(0)).current;
  const skilledGlow = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selectedType === 'carpet') {
      Animated.parallel([
        Animated.spring(carpetScale, { toValue: 1.02, useNativeDriver: true }),
        Animated.timing(carpetGlow, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.spring(skilledScale, { toValue: 0.98, useNativeDriver: true }),
        Animated.timing(skilledGlow, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    } else if (selectedType === 'skilled') {
      Animated.parallel([
        Animated.spring(skilledScale, { toValue: 1.02, useNativeDriver: true }),
        Animated.timing(skilledGlow, { toValue: 1, duration: 300, useNativeDriver: false }),
        Animated.spring(carpetScale, { toValue: 0.98, useNativeDriver: true }),
        Animated.timing(carpetGlow, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(carpetScale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(skilledScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(carpetGlow, { toValue: 0, duration: 300, useNativeDriver: false }),
        Animated.timing(skilledGlow, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  }, [selectedType]);

  const handleContinue = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      if (selectedType === 'carpet') {
        router.push('/agent-setup');
      } else if (selectedType === 'skilled') {
        router.push('/skilled-setup');
      }
    });
  };

  const getScale = (type: GenieType) => {
    if (type === 'carpet') return carpetScale;
    return skilledScale;
  };

  const getGlow = (type: GenieType) => {
    if (type === 'carpet') return carpetGlow;
    return skilledGlow;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.magicCircle}>
              <Text style={styles.headerEmoji}>🧞</Text>
            </View>
            <Text style={styles.title}>Choose Your Magic</Text>
            <Text style={styles.subtitle}>
              What kind of Genie will you become?
            </Text>
          </View>
        </View>

        {/* Genie Type Cards */}
        <View style={styles.cardsContainer}>
          {GENIE_TYPES.map((genie) => {
            const isSelected = selectedType === genie.type;
            const scale = getScale(genie.type);
            const glowOpacity = getGlow(genie.type);

            return (
              <TouchableOpacity
                key={genie.type}
                activeOpacity={0.95}
                onPress={() => setSelectedType(genie.type)}
              >
                <Animated.View
                  style={[
                    styles.cardWrapper,
                    { transform: [{ scale }] },
                  ]}
                >
                  {/* Glow Effect */}
                  <Animated.View
                    style={[
                      styles.cardGlow,
                      {
                        backgroundColor: genie.glowColor,
                        opacity: glowOpacity.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.15],
                        }),
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.genieCard,
                      isSelected && styles.genieCardSelected,
                      isSelected && { borderColor: genie.glowColor },
                    ]}
                  >
                    {/* Selection Badge */}
                    {isSelected && (
                      <View style={[styles.selectedBadge, { backgroundColor: genie.glowColor }]}>
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                        <Text style={styles.selectedBadgeText}>SELECTED</Text>
                      </View>
                    )}

                    {/* Card Header with Gradient */}
                    <LinearGradient
                      colors={genie.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardHeader}
                    >
                      <View style={styles.headerRow}>
                        <View style={styles.emojiContainer}>
                          <Text style={styles.genieEmoji}>{genie.emoji}</Text>
                          <Text style={styles.magicEmoji}>{genie.magicEmoji}</Text>
                          <Text style={styles.carpetEmoji}>{genie.carpetEmoji}</Text>
                        </View>
                        <View style={styles.titleContainer}>
                          <Text style={styles.genieTitle}>{genie.title}</Text>
                          <Text style={styles.genieSubtitle}>{genie.subtitle}</Text>
                        </View>
                      </View>
                      <Text style={styles.genieDescription}>{genie.description}</Text>
                      
                      {/* Earnings Badge */}
                      <View style={styles.earningsBadge}>
                        <Ionicons name="trending-up" size={14} color="#FFF" />
                        <Text style={styles.earningsText}>{genie.earnings}</Text>
                      </View>
                    </LinearGradient>

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      {/* Features Grid */}
                      <View style={styles.featuresGrid}>
                        {genie.features.map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                              <Ionicons name={feature.icon as any} size={20} color={feature.color} />
                            </View>
                            <Text style={styles.featureText}>{feature.text}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Tagline */}
                      <View style={[styles.taglineContainer, isSelected && { backgroundColor: genie.glowColor + '20' }]}>
                        <Text style={styles.sparkle}>✨</Text>
                        <Text style={[styles.tagline, isSelected && { color: genie.glowColor }]}>
                          {genie.tagline}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.continueButton, !selectedType && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!selectedType}
          >
            <LinearGradient
              colors={
                selectedType === 'carpet'
                  ? ['#1E40AF', '#3B82F6', '#06B6D4']
                  : selectedType === 'skilled'
                  ? ['#5B21B6', '#8B5CF6', '#A78BFA']
                  : ['#374151', '#4B5563', '#6B7280']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              {selectedType ? (
                <>
                  <Text style={styles.continueButtonText}>
                    Continue as {selectedType === 'carpet' ? 'Carpet' : 'Skilled'} Genie
                  </Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </View>
                </>
              ) : (
                <Text style={styles.continueButtonText}>Select Your Genie Type</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerContent: {
    alignItems: 'center',
  },
  magicCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  headerEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  cardWrapper: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 30,
  },
  genieCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  genieCardSelected: {
    borderWidth: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  cardHeader: {
    padding: 20,
    paddingTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  genieEmoji: {
    fontSize: 32,
  },
  magicEmoji: {
    position: 'absolute',
    top: -5,
    right: -5,
    fontSize: 18,
  },
  carpetEmoji: {
    position: 'absolute',
    bottom: -5,
    left: -5,
    fontSize: 16,
  },
  titleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  genieTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  genieSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
  },
  genieDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 22,
  },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  earningsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  cardBody: {
    padding: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 10,
    width: '48%',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundSecondary,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  sparkle: {
    fontSize: 18,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: '600',
    flex: 1,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardBorder,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
});
