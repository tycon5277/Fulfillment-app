import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

const COLORS = {
  primary: '#7C3AED',
  secondary: '#0EA5E9',
  background: '#F8F9FA',
  white: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  success: '#22C55E',
  border: '#E0E0E0',
};

type VehicleType = 'bike' | 'scooter' | 'car';

const VEHICLES: { type: VehicleType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'bike', label: 'Bicycle', icon: 'bicycle' },
  { type: 'scooter', label: 'Scooter', icon: 'speedometer' },
  { type: 'car', label: 'Car', icon: 'car' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [vehicleType, setVehicleType] = useState<VehicleType>('scooter');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.registerAsAgent({
        vehicle_type: vehicleType,
        phone: phone.trim(),
      });

      setUser(response.data.user);
      router.replace('/(main)/home');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-add" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.title}>Become an Agent</Text>
            <Text style={styles.subtitle}>
              Hi {user?.name}, complete your registration to start fulfilling orders
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Your Vehicle</Text>
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
                  <Ionicons
                    name={vehicle.icon}
                    size={32}
                    color={vehicleType === vehicle.type ? COLORS.white : COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.vehicleLabel,
                      vehicleType === vehicle.type && styles.vehicleLabelSelected,
                    ]}
                  >
                    {vehicle.label}
                  </Text>
                  {vehicleType === vehicle.type && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Start Earning</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>Agent Benefits</Text>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.benefitText}>Flexible working hours</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.benefitText}>Earn per delivery + tips</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.benefitText}>Weekly payouts</Text>
            </View>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
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
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  vehicleCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 8,
  },
  vehicleLabelSelected: {
    color: COLORS.white,
  },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
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
    color: '#EF4444',
    fontSize: 14,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  benefits: {
    marginTop: 32,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
