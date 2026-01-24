import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

// Mobile Genie Theme - Dark with Neon Green
const COLORS = {
  background: '#0A0A0A',
  cardBg: '#1A1A1A',
  cardBorder: '#2A2A2A',
  primary: '#10B981',      // Neon Green
  primaryLight: '#34D399',
  primaryDark: '#059669',
  secondary: '#8B5CF6',    // Purple
  accent1: '#EC4899',      // Pink
  accent2: '#F59E0B',      // Yellow/Amber
  accent3: '#3B82F6',      // Blue
  accent4: '#06B6D4',      // Cyan
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#22C55E',
  error: '#EF4444',
  border: '#374151',
};

type VehicleType = 'motorbike' | 'scooter' | 'car';

const VEHICLES = [
  { type: 'motorbike' as VehicleType, label: 'Motor Bike', icon: 'bicycle' as const },
  { type: 'scooter' as VehicleType, label: 'Scooter', icon: 'speedometer' as const },
  { type: 'car' as VehicleType, label: 'Car', icon: 'car' as const },
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
  { id: 'brown', label: 'Brown', color: '#92400E' },
  { id: 'grey', label: 'Grey', color: '#6B7280' },
];

const MOBILE_SERVICES = [
  { id: 'delivery', label: 'Deliveries', icon: 'basket' as const, desc: 'Groceries, food, beverages', color: COLORS.primary },
  { id: 'courier', label: 'Courier', icon: 'document-text' as const, desc: 'Documents, packages', color: COLORS.accent3 },
  { id: 'rides', label: 'Rides', icon: 'car' as const, desc: 'Pick up & drop people', color: COLORS.secondary },
  { id: 'errands', label: 'Errands', icon: 'clipboard' as const, desc: 'Shopping, bill payments', color: COLORS.accent2 },
  { id: 'surprise', label: 'Surprise', icon: 'gift' as const, desc: 'Gifts & special occasions', color: COLORS.accent1 },
];

export default function AgentSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  // Step tracking: 1=Vehicle Type, 2=Vehicle Details, 3=Services
  const [step, setStep] = useState(1);
  
  // Vehicle type & electric
  const [vehicleType, setVehicleType] = useState<VehicleType>('scooter');
  const [isElectric, setIsElectric] = useState(false);
  
  // Vehicle details
  const [regNumber, setRegNumber] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('white');
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);
  
  // Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      setStep(2);
    } else if (step === 2) {
      if (!regNumber.trim()) {
        setError('Please enter vehicle registration number');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
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
      <Text style={styles.stepTitle}>What's your ride? 🏍️</Text>
      <Text style={styles.stepSubtitle}>Select your vehicle type</Text>
      
      <View style={styles.vehicleGrid}>
        {VEHICLES.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.type}
            style={[
              styles.vehicleCard,
              vehicleType === vehicle.type && styles.vehicleCardSelected,
            ]}
            onPress={() => setVehicleType(vehicle.type)}
          >
            <View style={[
              styles.vehicleIconBg,
              vehicleType === vehicle.type && { backgroundColor: COLORS.primary },
            ]}>
              <Ionicons
                name={vehicle.icon}
                size={32}
                color={vehicleType === vehicle.type ? COLORS.background : COLORS.primary}
              />
            </View>
            <Text style={[
              styles.vehicleLabel,
              vehicleType === vehicle.type && { color: COLORS.primary },
            ]}>
              {vehicle.label}
            </Text>
            {vehicleType === vehicle.type && (
              <View style={styles.selectedCheck}>
                <Ionicons name="checkmark" size={14} color={COLORS.background} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Electric Vehicle Toggle */}
      <TouchableOpacity 
        style={styles.electricCard}
        onPress={() => setIsElectric(!isElectric)}
      >
        <View style={[styles.electricIconBg, isElectric && { backgroundColor: COLORS.success + '30' }]}>
          <Ionicons name="flash" size={24} color={isElectric ? COLORS.success : COLORS.textMuted} />
        </View>
        <View style={styles.electricContent}>
          <Text style={styles.electricTitle}>Electric Vehicle ⚡</Text>
          <Text style={styles.electricSubtext}>
            {isElectric ? 'Yes! Eco-warrior mode ON' : 'Is your vehicle electric?'}
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
      <Text style={styles.stepTitle}>Vehicle Details 📋</Text>
      <Text style={styles.stepSubtitle}>Help wishers identify your ride</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Registration Number *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="card" size={20} color={COLORS.textMuted} />
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
          <Text style={styles.inputLabel}>Make (Brand)</Text>
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
        <Text style={styles.inputLabel}>Vehicle Colour</Text>
        <View style={styles.colorGrid}>
          {VEHICLE_COLORS.map((vc) => (
            <TouchableOpacity
              key={vc.id}
              style={[
                styles.colorOption,
                vehicleColor === vc.id && styles.colorOptionSelected,
              ]}
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

      {/* Photo Placeholder */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Vehicle Photos (Coming Soon)</Text>
        <View style={styles.photoGrid}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={24} color={COLORS.textMuted} />
              <Text style={styles.photoPlaceholderText}>Add</Text>
            </View>
          ))}
        </View>
        <Text style={styles.photoHint}>📸 Photo upload will be enabled soon</Text>
      </View>
    </>
  );

  // Step 3: Services Selection
  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Pick Your Gigs 🎯</Text>
      <Text style={styles.stepSubtitle}>What wishes do you want to fulfill?</Text>
      
      {MOBILE_SERVICES.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.serviceCard,
            selectedServices.includes(service.id) && { 
              borderColor: service.color,
              backgroundColor: service.color + '15',
            },
          ]}
          onPress={() => toggleService(service.id)}
        >
          <View style={[styles.serviceIconBg, { backgroundColor: service.color + '25' }]}>
            <Ionicons name={service.icon} size={24} color={service.color} />
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceLabel}>{service.label}</Text>
            <Text style={styles.serviceDesc}>{service.desc}</Text>
          </View>
          <View style={[
            styles.serviceCheckbox,
            selectedServices.includes(service.id) && { 
              backgroundColor: service.color,
              borderColor: service.color,
            },
          ]}>
            {selectedServices.includes(service.id) && (
              <Ionicons name="checkmark" size={16} color={COLORS.background} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

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
                <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>Step {step} of 3</Text>
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
          {step < 3 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.background} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Let's Go! 🚀</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.cardBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
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
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  vehicleIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  selectedCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  electricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  electricIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  electricContent: {
    flex: 1,
    marginLeft: 14,
  },
  electricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  electricSubtext: {
    fontSize: 13,
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
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
  },
  colorOptionSelected: {
    backgroundColor: COLORS.cardBg,
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
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  photoPlaceholderText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  photoHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  serviceIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceContent: {
    flex: 1,
    marginLeft: 14,
  },
  serviceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  serviceDesc: {
    fontSize: 13,
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
    backgroundColor: COLORS.error + '20',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.background,
  },
});
