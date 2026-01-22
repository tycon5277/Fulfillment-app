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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

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
};

type PartnerType = 'agent' | 'vendor' | 'promoter' | null;
type VehicleType = 'bike' | 'scooter' | 'car';

const PARTNER_TYPES = [
  {
    type: 'agent' as PartnerType,
    title: 'Agent',
    icon: 'bicycle' as const,
    color: COLORS.primary,
    description: 'Deliver food, groceries, medicine, provide rides & run errands',
  },
  {
    type: 'vendor' as PartnerType,
    title: 'Vendor',
    icon: 'storefront' as const,
    color: COLORS.secondary,
    description: 'Bring your offline shop online - grocery, restaurant, pharmacy & more',
  },
  {
    type: 'promoter' as PartnerType,
    title: 'Promoter',
    icon: 'megaphone' as const,
    color: COLORS.amber,
    description: 'Organize trips, events, sell tickets & promote services',
  },
];

const VEHICLES = [
  { type: 'bike' as VehicleType, label: 'Bike', icon: 'bicycle' as const },
  { type: 'scooter' as VehicleType, label: 'Scooter', icon: 'speedometer' as const },
  { type: 'car' as VehicleType, label: 'Car', icon: 'car' as const },
];

const AGENT_SERVICES = [
  { id: 'delivery', label: 'Food & Groceries', icon: 'fast-food' as const },
  { id: 'courier', label: 'Courier & Documents', icon: 'document-text' as const },
  { id: 'rides', label: 'Rides & Transport', icon: 'car' as const },
  { id: 'errands', label: 'Errands & Tasks', icon: 'clipboard' as const },
];

const SHOP_TYPES = [
  'Grocery Store', 'Restaurant', 'Pharmacy', 'Supermarket', 'Bakery',
  'Farm Produce', 'Fish & Seafood', 'Plant Nursery', 'Spare Parts',
  'Milk Vendor', 'Ice Cream', 'Other'
];

const PROMOTER_TYPES = [
  { id: 'trip_organizer', label: 'Trip Organizer', description: 'Organize bus trips, tours, excursions' },
  { id: 'event_organizer', label: 'Event Organizer', description: 'Sports events, concerts, local events' },
  { id: 'service_provider', label: 'Service Provider', description: 'Offer services & experiences' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  // Step management
  const [step, setStep] = useState(1); // 1: Choose type, 2: Fill details
  const [partnerType, setPartnerType] = useState<PartnerType>(null);
  
  // Common fields
  const [phone, setPhone] = useState('');
  
  // Agent fields
  const [vehicleType, setVehicleType] = useState<VehicleType>('scooter');
  const [selectedServices, setSelectedServices] = useState<string[]>(['delivery']);
  
  // Vendor fields
  const [shopName, setShopName] = useState('');
  const [shopType, setShopType] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [canDeliver, setCanDeliver] = useState(false);
  
  // Promoter fields
  const [businessName, setBusinessName] = useState('');
  const [promoterType, setPromoterType] = useState('');
  const [promoterDescription, setPromoterDescription] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSelectPartnerType = (type: PartnerType) => {
    setPartnerType(type);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setPartnerType(null);
    }
  };

  const validateAndSubmit = async () => {
    setError('');
    
    if (!phone.trim() || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    if (partnerType === 'agent') {
      if (selectedServices.length === 0) {
        setError('Please select at least one service');
        return;
      }
    } else if (partnerType === 'vendor') {
      if (!shopName.trim()) {
        setError('Please enter your shop name');
        return;
      }
      if (!shopType) {
        setError('Please select your shop type');
        return;
      }
      if (!shopAddress.trim()) {
        setError('Please enter your shop address');
        return;
      }
    } else if (partnerType === 'promoter') {
      if (!businessName.trim()) {
        setError('Please enter your business name');
        return;
      }
      if (!promoterType) {
        setError('Please select your promoter type');
        return;
      }
      if (!promoterDescription.trim()) {
        setError('Please describe your services');
        return;
      }
    }

    setIsLoading(true);

    try {
      let response;
      
      if (partnerType === 'agent') {
        response = await api.registerAsAgent({
          phone: phone.trim(),
          vehicle_type: vehicleType,
          services: selectedServices,
        });
      } else if (partnerType === 'vendor') {
        response = await api.registerAsVendor({
          phone: phone.trim(),
          shop_name: shopName.trim(),
          shop_type: shopType,
          shop_address: shopAddress.trim(),
          can_deliver: canDeliver,
          categories: [],
        });
      } else if (partnerType === 'promoter') {
        response = await api.registerAsPromoter({
          phone: phone.trim(),
          business_name: businessName.trim(),
          promoter_type: promoterType,
          description: promoterDescription.trim(),
        });
      }

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

  // Step 1: Choose Partner Type
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="people" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.title}>Join QuickWish</Text>
            <Text style={styles.subtitle}>
              Hi {user?.name}, choose how you want to fulfill wishes
            </Text>
          </View>

          <View style={styles.partnerTypesContainer}>
            {PARTNER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.type}
                style={styles.partnerTypeCard}
                onPress={() => handleSelectPartnerType(type.type)}
              >
                <View style={[styles.partnerTypeIcon, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon} size={32} color={type.color} />
                </View>
                <View style={styles.partnerTypeInfo}>
                  <Text style={styles.partnerTypeTitle}>{type.title}</Text>
                  <Text style={styles.partnerTypeDescription}>{type.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Registration Details
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Header based on type */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { 
              backgroundColor: partnerType === 'agent' ? COLORS.primary : 
                             partnerType === 'vendor' ? COLORS.secondary : COLORS.amber 
            }]}>
              <Ionicons 
                name={partnerType === 'agent' ? 'bicycle' : partnerType === 'vendor' ? 'storefront' : 'megaphone'} 
                size={32} 
                color={COLORS.white} 
              />
            </View>
            <Text style={styles.title}>
              {partnerType === 'agent' ? 'Become an Agent' : 
               partnerType === 'vendor' ? 'Register Your Shop' : 'Become a Promoter'}
            </Text>
          </View>

          {/* Phone Number (Common) */}
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

          {/* Agent-specific fields */}
          {partnerType === 'agent' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Vehicle</Text>
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
                        size={28}
                        color={vehicleType === vehicle.type ? COLORS.white : COLORS.primary}
                      />
                      <Text style={[
                        styles.vehicleLabel,
                        vehicleType === vehicle.type && styles.vehicleLabelSelected,
                      ]}>
                        {vehicle.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services You Offer</Text>
                <View style={styles.servicesGrid}>
                  {AGENT_SERVICES.map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceCard,
                        selectedServices.includes(service.id) && styles.serviceCardSelected,
                      ]}
                      onPress={() => toggleService(service.id)}
                    >
                      <Ionicons
                        name={service.icon}
                        size={24}
                        color={selectedServices.includes(service.id) ? COLORS.white : COLORS.primary}
                      />
                      <Text style={[
                        styles.serviceLabel,
                        selectedServices.includes(service.id) && styles.serviceLabelSelected,
                      ]}>
                        {service.label}
                      </Text>
                      {selectedServices.includes(service.id) && (
                        <View style={styles.checkMark}>
                          <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Vendor-specific fields */}
          {partnerType === 'vendor' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shop Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="storefront" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your shop name"
                    placeholderTextColor={COLORS.textSecondary}
                    value={shopName}
                    onChangeText={setShopName}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shop Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsRow}>
                    {SHOP_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.chip, shopType === type && styles.chipSelected]}
                        onPress={() => setShopType(type)}
                      >
                        <Text style={[styles.chipText, shopType === type && styles.chipTextSelected]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Shop Address</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="location" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your shop address"
                    placeholderTextColor={COLORS.textSecondary}
                    value={shopAddress}
                    onChangeText={setShopAddress}
                    multiline
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.toggleRow}
                onPress={() => setCanDeliver(!canDeliver)}
              >
                <View style={styles.toggleInfo}>
                  <Ionicons name="bicycle" size={24} color={COLORS.secondary} />
                  <View>
                    <Text style={styles.toggleTitle}>I can deliver orders myself</Text>
                    <Text style={styles.toggleSubtext}>You'll handle your own deliveries</Text>
                  </View>
                </View>
                <View style={[styles.toggle, canDeliver && styles.toggleActive]}>
                  <View style={[styles.toggleDot, canDeliver && styles.toggleDotActive]} />
                </View>
              </TouchableOpacity>
            </>
          )}

          {/* Promoter-specific fields */}
          {partnerType === 'promoter' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="business" size={20} color={COLORS.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your business name"
                    placeholderTextColor={COLORS.textSecondary}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>What do you promote?</Text>
                {PROMOTER_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.promoterTypeCard, promoterType === type.id && styles.promoterTypeCardSelected]}
                    onPress={() => setPromoterType(type.id)}
                  >
                    <View style={styles.promoterTypeInfo}>
                      <Text style={[styles.promoterTypeTitle, promoterType === type.id && styles.promoterTypeTitleSelected]}>
                        {type.label}
                      </Text>
                      <Text style={styles.promoterTypeDesc}>{type.description}</Text>
                    </View>
                    <View style={[styles.radioOuter, promoterType === type.id && styles.radioOuterSelected]}>
                      {promoterType === type.id && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Describe Your Services</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Tell us about what you offer (trips, events, services...)"
                    placeholderTextColor={COLORS.textSecondary}
                    value={promoterDescription}
                    onChangeText={setPromoterDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </>
          )}

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={validateAndSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Complete Registration</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: COLORS.text,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  partnerTypesContainer: {
    gap: 12,
  },
  partnerTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  partnerTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerTypeInfo: {
    flex: 1,
  },
  partnerTypeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  partnerTypeDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 12,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 0,
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  vehicleCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  vehicleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 6,
  },
  vehicleLabelSelected: {
    color: COLORS.white,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  serviceCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 6,
    textAlign: 'center',
  },
  serviceLabelSelected: {
    color: COLORS.white,
  },
  checkMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.success,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  promoterTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  promoterTypeCardSelected: {
    borderColor: COLORS.amber,
    backgroundColor: COLORS.amber + '10',
  },
  promoterTypeInfo: {
    flex: 1,
  },
  promoterTypeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  promoterTypeTitleSelected: {
    color: COLORS.amber,
  },
  promoterTypeDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.amber,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.amber,
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
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
