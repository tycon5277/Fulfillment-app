import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  amber: '#F59E0B',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#22C55E',
  border: '#E0E0E0',
  error: '#EF4444',
  pink: '#EC4899',
};

type PartnerType = 'agent' | 'vendor' | 'promoter' | null;

const PARTNER_TYPES = [
  {
    type: 'agent' as PartnerType,
    title: 'Genie',
    icon: 'flash' as const,
    color: COLORS.primary,
    description: 'Fulfill wishes & earn money',
    subtext: 'Mobile services or skilled work',
  },
  {
    type: 'vendor' as PartnerType,
    title: 'Vendor',
    icon: 'storefront' as const,
    color: COLORS.secondary,
    description: 'Bring your shop online',
    subtext: 'Sell products locally',
  },
  {
    type: 'promoter' as PartnerType,
    title: 'Promoter',
    icon: 'megaphone' as const,
    color: COLORS.amber,
    description: 'Organize trips & events',
    subtext: 'Sell tickets & bookings',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [partnerType, setPartnerType] = useState<PartnerType>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!ageConfirmed) {
      setError('You must be 18 or older to register as a Genie');
      return;
    }
    
    if (!partnerType) {
      setError('Please select how you want to use Quickwish');
      return;
    }

    setError('');

    if (partnerType === 'agent') {
      router.push('/genie-type-select');
    } else if (partnerType === 'vendor') {
      router.push('/vendor-setup');
    } else if (partnerType === 'promoter') {
      router.push('/promoter-setup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
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
            <Text style={styles.title}>Choose Your Path</Text>
            <Text style={styles.subtitle}>
              Welcome {user?.name}! How do you want to earn with Quickwish?
            </Text>
          </View>

          {/* Age Confirmation */}
          <TouchableOpacity 
            style={styles.ageConfirmCard}
            onPress={() => setAgeConfirmed(!ageConfirmed)}
          >
            <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
              {ageConfirmed && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
            </View>
            <View style={styles.ageConfirmText}>
              <Text style={styles.ageConfirmTitle}>I confirm I am 18 years or older</Text>
              <Text style={styles.ageConfirmSubtext}>Required to become a Quickwish partner</Text>
            </View>
          </TouchableOpacity>

          {/* Partner Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I want to be a...</Text>
            
            {PARTNER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={[
                  styles.partnerTypeCard,
                  partnerType === type.type && { borderColor: type.color, backgroundColor: type.color + '08' },
                ]}
                onPress={() => setPartnerType(type.type)}
              >
                <View style={[styles.partnerTypeIcon, { backgroundColor: type.color + '15' }]}>
                  <Ionicons name={type.icon} size={32} color={type.color} />
                </View>
                <View style={styles.partnerTypeContent}>
                  <Text style={[styles.partnerTypeTitle, partnerType === type.type && { color: type.color }]}>
                    {type.title}
                  </Text>
                  <Text style={styles.partnerTypeDesc}>{type.description}</Text>
                  <Text style={styles.partnerTypeSubtext}>{type.subtext}</Text>
                </View>
                <View style={[styles.radioOuter, partnerType === type.type && { borderColor: type.color }]}>
                  {partnerType === type.type && (
                    <View style={[styles.radioInner, { backgroundColor: type.color }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Agent Info Card */}
          {partnerType === 'agent' && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                As a Genie, you can be a <Text style={styles.infoBold}>Mobile Genie</Text> (deliveries, rides, errands) 
                or a <Text style={styles.infoBold}>Skilled Genie</Text> (electrician, plumber, painter, etc.)
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!partnerType || !ageConfirmed) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!partnerType || !ageConfirmed}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
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
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  ageConfirmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  ageConfirmText: {
    flex: 1,
  },
  ageConfirmTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  ageConfirmSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  partnerTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  partnerTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerTypeContent: {
    flex: 1,
    marginLeft: 16,
  },
  partnerTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  partnerTypeDesc: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 2,
  },
  partnerTypeSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
});
