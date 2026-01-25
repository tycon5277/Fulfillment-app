import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Premium Dark Theme
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
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  gold: '#FBBF24',
};

// Skill categories
const SKILL_CATEGORIES = [
  {
    id: 'home_services',
    title: 'Home Services',
    emoji: '🏠',
    color: '#F59E0B',
    skills: [
      { id: 'plumbing', name: 'Plumbing', emoji: '🔧', description: 'Pipes, faucets & water systems' },
      { id: 'electrical', name: 'Electrical', emoji: '⚡', description: 'Wiring, fixtures & repairs' },
      { id: 'carpentry', name: 'Carpentry', emoji: '🪚', description: 'Wood work & furniture' },
      { id: 'painting', name: 'Painting', emoji: '🎨', description: 'Interior & exterior painting' },
      { id: 'cleaning', name: 'Deep Cleaning', emoji: '✨', description: 'Professional cleaning' },
      { id: 'ac_repair', name: 'AC Repair', emoji: '❄️', description: 'AC service & repair' },
    ],
  },
  {
    id: 'tech_services',
    title: 'Tech Services',
    emoji: '💻',
    color: '#3B82F6',
    skills: [
      { id: 'computer_repair', name: 'Computer Repair', emoji: '🖥️', description: 'PC & laptop repair' },
      { id: 'phone_repair', name: 'Phone Repair', emoji: '📱', description: 'Mobile device repair' },
      { id: 'networking', name: 'Networking', emoji: '🌐', description: 'WiFi & network setup' },
      { id: 'smart_home', name: 'Smart Home', emoji: '🏡', description: 'IoT & automation' },
    ],
  },
  {
    id: 'creative_services',
    title: 'Creative Services',
    emoji: '🎨',
    color: '#EC4899',
    skills: [
      { id: 'photography', name: 'Photography', emoji: '📸', description: 'Events & portraits' },
      { id: 'videography', name: 'Videography', emoji: '🎬', description: 'Video production' },
      { id: 'graphic_design', name: 'Graphic Design', emoji: '🖼️', description: 'Digital design' },
      { id: 'music', name: 'Music', emoji: '🎵', description: 'Lessons & performance' },
    ],
  },
  {
    id: 'wellness_services',
    title: 'Wellness & Beauty',
    emoji: '💆',
    color: '#34D399',
    skills: [
      { id: 'massage', name: 'Massage', emoji: '💆', description: 'Therapeutic massage' },
      { id: 'yoga', name: 'Yoga', emoji: '🧘', description: 'Yoga instruction' },
      { id: 'personal_training', name: 'Personal Training', emoji: '💪', description: 'Fitness coaching' },
      { id: 'beauty', name: 'Beauty Services', emoji: '💅', description: 'Hair, makeup & nails' },
    ],
  },
  {
    id: 'tutoring',
    title: 'Tutoring & Education',
    emoji: '📚',
    color: '#8B5CF6',
    skills: [
      { id: 'math', name: 'Mathematics', emoji: '🔢', description: 'Math tutoring' },
      { id: 'science', name: 'Science', emoji: '🔬', description: 'Science subjects' },
      { id: 'languages', name: 'Languages', emoji: '🗣️', description: 'Language learning' },
      { id: 'music_lessons', name: 'Music Lessons', emoji: '🎹', description: 'Instrument teaching' },
    ],
  },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', years: '0-1 years', emoji: '🌱', color: '#34D399' },
  { id: 'intermediate', label: 'Intermediate', years: '1-3 years', emoji: '🌿', color: '#3B82F6' },
  { id: 'expert', label: 'Expert', years: '3-5 years', emoji: '🌳', color: '#8B5CF6' },
  { id: 'master', label: 'Master', years: '5+ years', emoji: '👑', color: '#F59E0B' },
];

export default function SkilledSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const animateStepChange = (newStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: newStep > step ? -50 : 50, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(newStep);
      slideAnim.setValue(newStep > step ? 50 : -50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleNext = () => {
    if (step < 4) {
      animateStepChange(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      animateStepChange(step - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Update user profile with skilled genie data
      await api.updateProfile({
        agent_type: 'skilled',
        agent_skills: selectedSkills,
        // Additional fields can be added here
      });
      
      // Navigate to main app
      router.replace('/(main)/home');
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedSkills.length > 0;
      case 2: return experienceLevel !== '';
      case 3: return hourlyRate !== '';
      case 4: return true;
    }
    return false;
  };

  const getProgressWidth = () => `${(step / 4) * 100}%`;

  // Step 1: Skills Selection
  const renderSkillsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>🔮</Text>
        <Text style={styles.stepTitle}>Choose Your Magic Powers</Text>
        <Text style={styles.stepSubtitle}>Select the skills you'll offer as a Skilled Genie</Text>
      </View>

      <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
        {SKILL_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryEmoji}>{category.emoji}</Text>
              <Text style={styles.categoryTitle}>{category.title}</Text>
            </View>
            <View style={styles.skillsGrid}>
              {category.skills.map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[
                      styles.skillCard,
                      isSelected && styles.skillCardSelected,
                      isSelected && { borderColor: category.color },
                    ]}
                    onPress={() => toggleSkill(skill.id)}
                    activeOpacity={0.8}
                  >
                    {isSelected && (
                      <View style={[styles.skillCheck, { backgroundColor: category.color }]}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                    )}
                    <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                    <Text style={[styles.skillName, isSelected && { color: category.color }]}>
                      {skill.name}
                    </Text>
                    <Text style={styles.skillDescription}>{skill.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedSkills.length > 0 && (
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionText}>{selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected</Text>
        </View>
      )}
    </View>
  );

  // Step 2: Experience Level
  const renderExperienceStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>⭐</Text>
        <Text style={styles.stepTitle}>Your Experience Level</Text>
        <Text style={styles.stepSubtitle}>How seasoned are you in your craft?</Text>
      </View>

      <View style={styles.experienceContainer}>
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = experienceLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.experienceCard,
                isSelected && styles.experienceCardSelected,
                isSelected && { borderColor: level.color },
              ]}
              onPress={() => setExperienceLevel(level.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isSelected ? [level.color + '30', level.color + '10'] : ['transparent', 'transparent']}
                style={styles.experienceGradient}
              >
                <View style={styles.experienceLeft}>
                  <Text style={styles.experienceEmoji}>{level.emoji}</Text>
                  <View>
                    <Text style={[styles.experienceLabel, isSelected && { color: level.color }]}>
                      {level.label}
                    </Text>
                    <Text style={styles.experienceYears}>{level.years}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={[styles.experienceCheck, { backgroundColor: level.color }]}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Step 3: Pricing
  const renderPricingStep = () => (
    <KeyboardAvoidingView 
      style={styles.stepContent}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>💰</Text>
        <Text style={styles.stepTitle}>Set Your Rate</Text>
        <Text style={styles.stepSubtitle}>How much do you charge per hour?</Text>
      </View>

      <View style={styles.pricingContainer}>
        <View style={styles.rateInputContainer}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.rateInput}
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholder="500"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="numeric"
          />
          <Text style={styles.rateLabel}>/hour</Text>
        </View>

        <View style={styles.ratePresets}>
          {['300', '500', '800', '1000', '1500'].map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[styles.presetButton, hourlyRate === rate && styles.presetButtonActive]}
              onPress={() => setHourlyRate(rate)}
            >
              <Text style={[styles.presetText, hourlyRate === rate && styles.presetTextActive]}>
                ₹{rate}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.earningsPreview}>
          <LinearGradient
            colors={[COLORS.green + '20', COLORS.green + '05']}
            style={styles.earningsGradient}
          >
            <Ionicons name="trending-up" size={24} color={COLORS.green} />
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsTitle}>Potential Daily Earnings</Text>
              <Text style={styles.earningsValue}>
                ₹{hourlyRate ? parseInt(hourlyRate) * 4 : 0} - ₹{hourlyRate ? parseInt(hourlyRate) * 8 : 0}
              </Text>
              <Text style={styles.earningsNote}>Based on 4-8 hours of work</Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // Step 4: Bio & Portfolio
  const renderBioStep = () => (
    <KeyboardAvoidingView 
      style={styles.stepContent}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>✨</Text>
        <Text style={styles.stepTitle}>Tell Your Story</Text>
        <Text style={styles.stepSubtitle}>Help customers know you better</Text>
      </View>

      <ScrollView style={styles.bioContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>About You (Optional)</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell customers about your experience, specialties, and what makes you unique..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Portfolio Link (Optional)</Text>
          <View style={styles.portfolioInputContainer}>
            <Ionicons name="link" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.portfolioInput}
              value={portfolio}
              onChangeText={setPortfolio}
              placeholder="https://your-portfolio.com"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[COLORS.primary + '20', COLORS.magenta + '10']}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryTitle}>🎉 You're Almost Ready!</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Skills:</Text>
              <Text style={styles.summaryValue}>{selectedSkills.length} selected</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Experience:</Text>
              <Text style={styles.summaryValue}>
                {EXPERIENCE_LEVELS.find(l => l.id === experienceLevel)?.label || '-'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Hourly Rate:</Text>
              <Text style={styles.summaryValue}>₹{hourlyRate || '0'}/hr</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Skilled Genie Setup</Text>
          <Text style={styles.headerSubtitle}>Step {step} of 4</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: getProgressWidth() }]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.magenta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>
      </View>

      {/* Step Content */}
      <Animated.View 
        style={[
          styles.contentContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        {step === 1 && renderSkillsStep()}
        {step === 2 && renderExperienceStep()}
        {step === 3 && renderPricingStep()}
        {step === 4 && renderBioStep()}
      </Animated.View>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.actionButton, !canProceed() && styles.actionButtonDisabled]}
          onPress={step === 4 ? handleComplete : handleNext}
          disabled={!canProceed() || isSubmitting}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={canProceed() ? [COLORS.primary, COLORS.magenta] : [COLORS.cardBorder, COLORS.cardBorder]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Text style={styles.actionText}>
              {isSubmitting ? 'Setting up...' : step === 4 ? 'Complete Setup ✨' : 'Continue'}
            </Text>
            {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressGradient: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  stepEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Skills Step
  categoriesScroll: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    position: 'relative',
  },
  skillCardSelected: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  skillCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  skillDescription: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  selectionBadge: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // Experience Step
  experienceContainer: {
    gap: 12,
    paddingTop: 20,
  },
  experienceCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
  },
  experienceCardSelected: {
    borderWidth: 2,
  },
  experienceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  experienceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  experienceEmoji: {
    fontSize: 32,
  },
  experienceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  experienceYears: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  experienceCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Pricing Step
  pricingContainer: {
    paddingTop: 20,
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.green,
    marginRight: 8,
  },
  rateInput: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 120,
    textAlign: 'center',
  },
  rateLabel: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  ratePresets: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  presetButtonActive: {
    backgroundColor: COLORS.green + '20',
    borderColor: COLORS.green,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetTextActive: {
    color: COLORS.green,
  },
  earningsPreview: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  earningsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.green,
  },
  earningsNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  // Bio Step
  bioContainer: {
    flex: 1,
    paddingTop: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  bioInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  portfolioInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  portfolioInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 16,
  },
  summaryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Bottom Action
  bottomAction: {
    padding: 20,
    paddingBottom: 32,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});
