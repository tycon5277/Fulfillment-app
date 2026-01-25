import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
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
  primary: '#06B6D4',
  primaryDark: '#0891B2',
  secondary: '#8B5CF6',
  accent1: '#EC4899',
  accent2: '#F59E0B',
  accent3: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#34D399',
  error: '#F87171',
  gold: '#FBBF24',
};

type VehicleType = 'motorbike' | 'scooter' | 'car';

const VEHICLES = [
  { 
    type: 'motorbike' as VehicleType, 
    label: 'Motor Bike', 
    emoji: '🏍️',
    description: 'Fast & Agile',
    gradient: ['#EF4444', '#F97316'] as const,
    perks: ['Fastest deliveries', 'Easy parking'],
  },
  { 
    type: 'scooter' as VehicleType, 
    label: 'Scooter', 
    emoji: '🛵',
    description: 'Efficient & Popular',
    gradient: ['#06B6D4', '#3B82F6'] as const,
    perks: ['Fuel efficient', 'Most popular'],
  },
  { 
    type: 'car' as VehicleType, 
    label: 'Car', 
    emoji: '🚗',
    description: 'Spacious & Premium',
    gradient: ['#8B5CF6', '#A78BFA'] as const,
    perks: ['Premium rides', 'Large orders'],
  },
];

const VEHICLE_COLORS = [
  { id: 'white', label: 'White', color: '#FFFFFF' },
  { id: 'black', label: 'Black', color: '#1F2937' },
  { id: 'silver', label: 'Silver', color: '#9CA3AF' },
  { id: 'red', label: 'Red', color: '#EF4444' },
  { id: 'blue', label: 'Blue', color: '#3B82F6' },
  { id: 'green', label: 'Green', color: '#22C55E' },
  { id: 'yellow', label: 'Yellow', color: '#F59E0B' },
  { id: 'orange', label: 'Orange', color: '#F97316' },
];

const SERVICES = [
  { id: 'delivery', label: 'Deliveries', emoji: '📦', desc: 'Food, groceries, packages', color: '#06B6D4', xp: '+50 XP' },
  { id: 'courier', label: 'Courier', emoji: '📄', desc: 'Documents & parcels', color: '#3B82F6', xp: '+40 XP' },
  { id: 'rides', label: 'Rides', emoji: '🚕', desc: 'Passenger transport', color: '#8B5CF6', xp: '+60 XP' },
  { id: 'errands', label: 'Errands', emoji: '🛒', desc: 'Shopping & tasks', color: '#F59E0B', xp: '+45 XP' },
  { id: 'surprise', label: 'Surprise', emoji: '🎁', desc: 'Gift deliveries', color: '#EC4899', xp: '+55 XP' },
  { id: 'beverages', label: 'Beverages 21+', emoji: '🍺', desc: 'Alcohol & tobacco (18+ only)', color: '#EF4444', xp: '+75 XP', special: true },
];

export default function AgentSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [vehicleType, setVehicleType] = useState<VehicleType>('scooter');
  const [isElectric, setIsElectric] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('white');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Animations
  const progressAnim = useRef(new Animated.Value(1)).current;

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      Animated.timing(progressAnim, { toValue: 2, duration: 300, useNativeDriver: false }).start();
      setStep(2);
    } else if (step === 2) {
      if (!regNumber.trim()) {
        setError('Please enter vehicle registration number');
        return;
      }
      Animated.timing(progressAnim, { toValue: 3, duration: 300, useNativeDriver: false }).start();
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      Animated.timing(progressAnim, { toValue: step - 1, duration: 300, useNativeDriver: false }).start();
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    setError('');
    if (selectedServices.length === 0) {
      setError('Please select at least one service');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.registerAsAgent({
        phone: user?.phone || '',
        agent_type: 'mobile',
        vehicle_type: vehicleType,
        is_electric: isElectric,
        vehicle_registration: regNumber.trim().toUpperCase(),
        vehicle_make: vehicleMake.trim(),
        vehicle_model: vehicleModel.trim(),
        vehicle_color: vehicleColor,
        services: selectedServices,
        skills: [],
        has_vehicle: true,
      });

      if (response?.data?.user) {
        setUser(response.data.user);
        router.replace('/(main)/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Vehicle Type Selection
  const renderStep1 = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>🪄</Text>
        <Text style={styles.stepTitle}>Choose Your Carpet</Text>
        <Text style={styles.stepSubtitle}>What magical ride will carry you?</Text>
      </View>
      
      <View style={styles.vehicleGrid}>
        {VEHICLES.map((vehicle) => {
          const isSelected = vehicleType === vehicle.type;
          return (
            <TouchableOpacity
              key={vehicle.type}
              activeOpacity={0.9}
              onPress={() => setVehicleType(vehicle.type)}
            >
              <View style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}>
                {isSelected && (
                  <View style={styles.vehicleSelectedBadge}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
                <LinearGradient
                  colors={isSelected ? vehicle.gradient : [COLORS.cardBg, COLORS.cardBg]}
                  style={styles.vehicleGradient}
                >
                  <Text style={styles.vehicleEmoji}>{vehicle.emoji}</Text>
                </LinearGradient>
                <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                  {vehicle.label}
                </Text>
                <Text style={styles.vehicleDesc}>{vehicle.description}</Text>
                {isSelected && (
                  <View style={styles.perksContainer}>
                    {vehicle.perks.map((perk, i) => (
                      <View key={i} style={styles.perkBadge}>
                        <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
                        <Text style={styles.perkText}>{perk}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Electric Vehicle Toggle */}
      <TouchableOpacity 
        style={[styles.electricCard, isElectric && styles.electricCardActive]}
        onPress={() => setIsElectric(!isElectric)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isElectric ? ['#22C55E', '#16A34A'] : [COLORS.cardBg, COLORS.cardBg]}
          style={styles.electricIconBg}
        >
          <Ionicons name="flash" size={24} color={isElectric ? '#FFF' : COLORS.textMuted} />
        </LinearGradient>
        <View style={styles.electricContent}>
          <Text style={[styles.electricTitle, isElectric && { color: COLORS.success }]}>
            Electric Vehicle ⚡
          </Text>
          <Text style={styles.electricSubtext}>
            {isElectric ? 'Eco-warrior bonus: +10% earnings!' : 'Is your vehicle electric?'}
          </Text>
        </View>
        <View style={[styles.toggleTrack, isElectric && styles.toggleTrackActive]}>
          <View style={[styles.toggleThumb, isElectric && styles.toggleThumbActive]} />
        </View>
      </TouchableOpacity>
    </>
  );

  // Step 2: Vehicle Details
  const renderStep2 = () => (
    <>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>📋</Text>
        <Text style={styles.stepTitle}>Carpet Details</Text>
        <Text style={styles.stepSubtitle}>Tell us about your magical ride</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Registration Number *</Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputIcon}>
            <Ionicons name="card" size={20} color={COLORS.primary} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="KL-07-AB-1234"
            placeholderTextColor={COLORS.textMuted}
            value={regNumber}
            onChangeText={(text) => setRegNumber(text.toUpperCase())}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Brand</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Honda"
              placeholderTextColor={COLORS.textMuted}
              value={vehicleMake}
              onChangeText={setVehicleMake}
            />
          </View>
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Model</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Activa 6G"
              placeholderTextColor={COLORS.textMuted}
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Vehicle Color</Text>
        <View style={styles.colorGrid}>
          {VEHICLE_COLORS.map((vc) => (
            <TouchableOpacity
              key={vc.id}
              style={[styles.colorOption, vehicleColor === vc.id && styles.colorOptionSelected]}
              onPress={() => setVehicleColor(vc.id)}
            >
              <View style={[styles.colorCircle, { backgroundColor: vc.color }]}>
                {vehicleColor === vc.id && (
                  <Ionicons 
                    name="checkmark" 
                    size={16} 
                    color={vc.id === 'white' || vc.id === 'yellow' ? '#000' : '#FFF'} 
                  />
                )}
              </View>
              <Text style={styles.colorLabel}>{vc.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  // Step 3: Services Selection
  const renderStep3 = () => {
    const totalXP = selectedServices.reduce((sum, s) => {
      const service = SERVICES.find(srv => srv.id === s);
      return sum + (service ? parseInt(service.xp.replace(/\D/g, '')) : 0);
    }, 0);

    return (
      <>
        <View style={styles.stepHeader}>
          <Text style={styles.stepEmoji}>🎯</Text>
          <Text style={styles.stepTitle}>Choose Your Quests</Text>
          <Text style={styles.stepSubtitle}>What wishes will you fulfill?</Text>
        </View>

        {/* XP Counter */}
        <View style={styles.xpCounter}>
          <LinearGradient
            colors={['#F59E0B', '#FBBF24']}
            style={styles.xpBadge}
          >
            <Ionicons name="star" size={16} color="#FFF" />
            <Text style={styles.xpText}>{totalXP} XP</Text>
          </LinearGradient>
          <Text style={styles.xpLabel}>Starting Bonus</Text>
        </View>
        
        {SERVICES.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          return (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, isSelected && { borderColor: service.color }]}
              onPress={() => toggleService(service.id)}
              activeOpacity={0.9}
            >
              <View style={[styles.serviceEmojiBg, { backgroundColor: service.color + '20' }]}>
                <Text style={styles.serviceEmoji}>{service.emoji}</Text>
              </View>
              <View style={styles.serviceContent}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceLabel}>{service.label}</Text>
                  <View style={[styles.xpTag, { backgroundColor: service.color + '20' }]}>
                    <Text style={[styles.xpTagText, { color: service.color }]}>{service.xp}</Text>
                  </View>
                </View>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
              </View>
              <View style={[
                styles.serviceCheckbox,
                isSelected && { backgroundColor: service.color, borderColor: service.color },
              ]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </>
    );
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: progressAnim.interpolate({
                        inputRange: [1, 2, 3],
                        outputRange: ['33%', '66%', '100%'],
                      }) 
                    }
                  ]} 
                />
              </View>
              <View style={styles.stepsRow}>
                {['Carpet', 'Details', 'Quests'].map((label, i) => (
                  <View key={i} style={styles.stepDot}>
                    <View style={[
                      styles.stepCircle,
                      step > i && styles.stepCircleComplete,
                      step === i + 1 && styles.stepCircleActive,
                    ]}>
                      {step > i + 1 ? (
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      ) : (
                        <Text style={[styles.stepNumber, step >= i + 1 && { color: '#FFF' }]}>{i + 1}</Text>
                      )}
                    </View>
                    <Text style={[styles.stepLabel, step >= i + 1 && { color: COLORS.text }]}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={step < 3 ? handleNext : handleComplete}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={step === 3 ? ['#06B6D4', '#3B82F6'] : ['#3B82F6', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {step < 3 ? 'Continue' : 'Start Your Journey 🚀'}
                  </Text>
                  {step < 3 && (
                    <View style={styles.buttonArrow}>
                      <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </View>
                  )}
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  stepDot: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  stepCircleComplete: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    minWidth: (SCREEN_WIDTH - 64) / 3,
  },
  vehicleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSecondary,
  },
  vehicleSelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleEmoji: {
    fontSize: 28,
  },
  vehicleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  vehicleLabelSelected: {
    color: COLORS.primary,
  },
  vehicleDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  perksContainer: {
    gap: 4,
  },
  perkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perkText: {
    fontSize: 9,
    color: COLORS.success,
    fontWeight: '500',
  },
  electricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  electricCardActive: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  electricIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  electricContent: {
    flex: 1,
    marginLeft: 14,
  },
  electricTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  electricSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleTrack: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.cardBorder,
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: COLORS.success,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.text,
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 14,
    backgroundColor: COLORS.backgroundSecondary,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  xpCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  xpLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  serviceEmojiBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceEmoji: {
    fontSize: 24,
  },
  serviceContent: {
    flex: 1,
    marginLeft: 14,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  xpTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  serviceDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  serviceCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
