import React, { useState } from 'react';
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

// Dark magical theme
const COLORS = {
  background: '#0D0D12',
  backgroundSecondary: '#13131A',
  cardBg: '#1A1A24',
  cardBorder: '#2A2A38',
  primary: '#06B6D4',
  secondary: '#8B5CF6',
  accent1: '#F472B6',
  accent2: '#FBBF24',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#34D399',
  error: '#F87171',
};

type GenieType = 'carpet' | 'skilled' | null;

const GENIE_TYPES = [
  {
    type: 'carpet' as GenieType,
    title: 'Carpet Genie',
    subtitle: 'Swift & Mobile',
    icon: '🧞‍♂️',
    carpetIcon: '🪄',
    gradientColors: ['#3B82F6', '#06B6D4', '#22D3EE'] as const,
    description: 'Zoom across the city on your magic carpet (vehicle)',
    features: [
      { icon: 'bicycle', text: 'Deliveries & Courier' },
      { icon: 'car', text: 'Rides & Pickups' },
      { icon: 'basket', text: 'Errands & Shopping' },
      { icon: 'gift', text: 'Surprise Deliveries' },
    ],
    tagline: 'Your vehicle is your flying carpet!',
    requirement: 'Requires: Bike, Scooter, or Car',
  },
  {
    type: 'skilled' as GenieType,
    title: 'Skilled Genie',
    subtitle: 'Expert & Professional',
    icon: '🔧',
    carpetIcon: '⭐',
    gradientColors: ['#8B5CF6', '#A78BFA', '#C4B5FD'] as const,
    description: 'Share your skills and grant professional wishes',
    features: [
      { icon: 'construct', text: 'Home Repairs' },
      { icon: 'color-palette', text: 'Painting & Design' },
      { icon: 'laptop', text: 'Tech Support' },
      { icon: 'fitness', text: 'Personal Training' },
    ],
    tagline: 'Your skills are your magic powers!',
    requirement: 'Requires: Professional Skills',
  },
];

export default function GenieTypeSelectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState<GenieType>(null);

  const handleContinue = () => {
    if (selectedType === 'carpet') {
      router.push('/agent-setup');
    } else if (selectedType === 'skilled') {
      router.push('/skilled-setup');
    }
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
            <Text style={styles.headerEmoji}>🧞</Text>
            <Text style={styles.title}>Choose Your Magic</Text>
            <Text style={styles.subtitle}>
              What kind of Genie will you become, {user?.name?.split(' ')[0]}?
            </Text>
          </View>
        </View>

        {/* Genie Type Cards */}
        <View style={styles.cardsContainer}>
          {GENIE_TYPES.map((genie) => (
            <TouchableOpacity
              key={genie.type}
              activeOpacity={0.9}
              onPress={() => setSelectedType(genie.type)}
            >
              <View
                style={[
                  styles.genieCard,
                  selectedType === genie.type && styles.genieCardSelected,
                ]}
              >
                {/* Card Header with Gradient */}
                <LinearGradient
                  colors={genie.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardHeader}
                >
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.genieEmoji}>{genie.icon}</Text>
                    <View style={styles.cardTitles}>
                      <Text style={styles.genieTitle}>{genie.title}</Text>
                      <Text style={styles.genieSubtitle}>{genie.subtitle}</Text>
                    </View>
                    {selectedType === genie.type && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      </View>
                    )}
                  </View>

                  {/* Floating carpet/star decoration */}
                  <Text style={styles.floatingIcon}>{genie.carpetIcon}</Text>
                </LinearGradient>

                {/* Card Body */}
                <View style={styles.cardBody}>
                  <Text style={styles.genieDescription}>{genie.description}</Text>

                  {/* Features Grid */}
                  <View style={styles.featuresGrid}>
                    {genie.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <View
                          style={[
                            styles.featureIcon,
                            {
                              backgroundColor:
                                selectedType === genie.type
                                  ? genie.gradientColors[0] + '25'
                                  : COLORS.cardBorder,
                            },
                          ]}
                        >
                          <Ionicons
                            name={feature.icon as any}
                            size={18}
                            color={
                              selectedType === genie.type
                                ? genie.gradientColors[0]
                                : COLORS.textMuted
                            }
                          />
                        </View>
                        <Text style={styles.featureText}>{feature.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Tagline */}
                  <View style={styles.taglineContainer}>
                    <Ionicons
                      name="sparkles"
                      size={16}
                      color={COLORS.accent2}
                    />
                    <Text style={styles.tagline}>{genie.tagline}</Text>
                  </View>

                  {/* Requirement */}
                  <Text style={styles.requirement}>{genie.requirement}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            You can always add more capabilities later from your profile settings.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !selectedType && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <LinearGradient
            colors={
              selectedType === 'carpet'
                ? ['#3B82F6', '#06B6D4']
                : selectedType === 'skilled'
                ? ['#8B5CF6', '#A78BFA']
                : ['#4B5563', '#6B7280']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButtonGradient}
          >
            <Text style={styles.continueButtonText}>
              {selectedType
                ? `Continue as ${
                    selectedType === 'carpet' ? 'Carpet Genie' : 'Skilled Genie'
                  }`
                : 'Select Your Genie Type'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

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
  },
  headerContent: {
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  genieCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  genieCardSelected: {
    borderColor: COLORS.primary,
  },
  cardHeader: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  genieEmoji: {
    fontSize: 40,
  },
  cardTitles: {
    flex: 1,
    marginLeft: 16,
  },
  genieTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  genieSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingIcon: {
    position: 'absolute',
    right: 20,
    bottom: -10,
    fontSize: 60,
    opacity: 0.3,
    transform: [{ rotate: '-15deg' }],
  },
  cardBody: {
    padding: 20,
  },
  genieDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    width: '48%',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accent2 + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.accent2,
    fontWeight: '600',
    flex: 1,
  },
  requirement: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
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
