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
  Alert,
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
  error: '#EF4444',
};

type PartnerType = 'agent' | 'vendor' | 'promoter' | null;
type VehicleType = 'bike' | 'scooter' | 'car';

const PARTNER_TYPES = [
  {
    type: 'agent' as PartnerType,
    title: 'Agent',
    icon: 'bicycle' as const,
    color: COLORS.primary,
    description: 'Deliveries, rides, errands & services',
  },
  {
    type: 'vendor' as PartnerType,
    title: 'Vendor',
    icon: 'storefront' as const,
    color: COLORS.secondary,
    description: 'Bring your shop online',
  },
  {
    type: 'promoter' as PartnerType,
    title: 'Promoter',
    icon: 'megaphone' as const,
    color: COLORS.amber,
    description: 'Organize trips & events',
  },
];

const VEHICLES = [
  { type: 'bike' as VehicleType, label: 'Bike', icon: 'bicycle' as const },
  { type: 'scooter' as VehicleType, label: 'Scooter', icon: 'speedometer' as const },
  { type: 'car' as VehicleType, label: 'Car', icon: 'car' as const },
];

const AGENT_SERVICES = [
  { id: 'delivery', label: 'Delivery', icon: 'fast-food' as const },
  { id: 'courier', label: 'Courier', icon: 'document-text' as const },
  { id: 'rides', label: 'Rides', icon: 'car' as const },
  { id: 'errands', label: 'Errands', icon: 'clipboard' as const },
];

const SHOP_TYPES = [
  'Grocery', 'Restaurant', 'Pharmacy', 'Supermarket', 'Bakery',
  'Farm Produce', 'Fish & Seafood', 'Plant Nursery', 'Spare Parts', 'Other'
];

const PROMOTER_TYPES = [
  { id: 'trip_organizer', label: 'Trip Organizer' },
  { id: 'event_organizer', label: 'Event Organizer' },
  { id: 'service_provider', label: 'Service Provider' },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  // Partner type
  const [partnerType, setPartnerType] = useState<PartnerType>(null);
  
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

  const validateAndSubmit = async () => {
    setError('');
    
    if (!partnerType) {
      setError('Please select your role');
      return;
    }

    // Validate role-specific fields
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
    } else if (partnerType === 'promoter') {
      if (!businessName.trim()) {
        setError('Please enter your business name');
        return;
      }
      if (!promoterType) {
        setError('Please select your promoter type');
        return;
      }
    }

    setIsLoading(true);

    try {
      let response;
      if (partnerType === 'agent') {
        response = await api.registerAsAgent({
          phone: user?.phone || '',
          vehicle_type: vehicleType,
          services: selectedServices,
        });
      } else if (partnerType === 'vendor') {
        response = await api.registerAsVendor({
          phone: user?.phone || '',
          shop_name: shopName.trim(),
          shop_type: shopType,
          shop_address: shopAddress.trim() || user?.address || '',
          can_deliver: canDeliver,
          categories: [],
        });
      } else if (partnerType === 'promoter') {
        response = await api.registerAsPromoter({
          phone: user?.phone || '',
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

  const getRoleColor = () => {
    switch (partnerType) {
      case 'agent': return COLORS.primary;
      case 'vendor': return COLORS.secondary;
      case 'promoter': return COLORS.amber;
      default: return COLORS.primary;
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Choose Your Role</Text>
            <Text style={styles.subtitle}>
              How do you want to use Quickwish Genie?
            </Text>
          </View>

          {/* Partner Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>I want to be a...</Text>
            <View style={styles.partnerTypeGrid}>
              {PARTNER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.type}
                  style={[
                    styles.partnerTypeCard,
                    partnerType === type.type && { borderColor: type.color, backgroundColor: type.color + '10' },
                  ]}
                  onPress={() => setPartnerType(type.type)}
                >
                  <View style={[styles.partnerTypeIcon, { backgroundColor: type.color + '20' }]}>
                    <Ionicons name={type.icon} size={28} color={type.color} />
                  </View>
                  <Text style={[styles.partnerTypeTitle, partnerType === type.type && { color: type.color }]}>
                    {type.title}
                  </Text>
                  <Text style={styles.partnerTypeDesc}>{type.description}</Text>
                  {partnerType === type.type && (
                    <View style={[styles.checkCircle, { backgroundColor: type.color }]}>
                      <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Role-specific fields */}
          {partnerType === 'agent' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Agent Details</Text>
              
              <Text style={styles.inputLabel}>Your Vehicle *</Text>
              <View style={styles.vehicleGrid}>
                {VEHICLES.map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.type}
                    style={[
                      styles.vehicleCard,
                      vehicleType === vehicle.type && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                    ]}
                    onPress={() => setVehicleType(vehicle.type)}
                  >
                    <Ionicons
                      name={vehicle.icon}
                      size={24}
                      color={vehicleType === vehicle.type ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[
                      styles.vehicleLabel,
                      vehicleType === vehicle.type && { color: COLORS.white },
                    ]}>
                      {vehicle.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Services You Offer *</Text>
              <View style={styles.servicesGrid}>
                {AGENT_SERVICES.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      selectedServices.includes(service.id) && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                    ]}
                    onPress={() => toggleService(service.id)}
                  >
                    <Ionicons
                      name={service.icon}
                      size={20}
                      color={selectedServices.includes(service.id) ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[
                      styles.serviceLabel,
                      selectedServices.includes(service.id) && { color: COLORS.white },
                    ]}>
                      {service.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {partnerType === 'vendor' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shop Details</Text>
              
              <Text style={styles.inputLabel}>Shop Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="storefront-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your shop name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={shopName}
                  onChangeText={setShopName}
                />
              </View>

              <Text style={styles.inputLabel}>Shop Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipsRow}>
                  {SHOP_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, shopType === type && { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary }]}
                      onPress={() => setShopType(type)}
                    >
                      <Text style={[styles.chipText, shopType === type && { color: COLORS.white }]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.inputLabel}>Shop Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter shop address (or same as profile)"
                  placeholderTextColor={COLORS.textSecondary}
                  value={shopAddress}
                  onChangeText={setShopAddress}
                />
              </View>

              <TouchableOpacity 
                style={styles.toggleRow}
                onPress={() => setCanDeliver(!canDeliver)}
              >
                <View style={styles.toggleInfo}>
                  <Ionicons name="bicycle-outline" size={22} color={COLORS.secondary} />
                  <Text style={styles.toggleTitle}>I can deliver orders myself</Text>
                </View>
                <View style={[styles.toggle, canDeliver && { backgroundColor: COLORS.success }]}>
                  <View style={[styles.toggleDot, canDeliver && { transform: [{ translateX: 20 }] }]} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {partnerType === 'promoter' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Details</Text>
              
              <Text style={styles.inputLabel}>Business Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your business name"
                  placeholderTextColor={COLORS.textSecondary}
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>

              <Text style={styles.inputLabel}>What do you promote? *</Text>
              <View style={styles.promoterTypeGrid}>
                {PROMOTER_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.promoterTypeCard,
                      promoterType === type.id && { backgroundColor: COLORS.amber, borderColor: COLORS.amber },
                    ]}
                    onPress={() => setPromoterType(type.id)}
                  >
                    <Text style={[
                      styles.promoterTypeText,
                      promoterType === type.id && { color: COLORS.white },
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Describe Your Services</Text>
              <View style={[styles.inputContainer, { alignItems: 'flex-start', paddingTop: 12 }]}>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Tell us about what you offer..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={promoterDescription}
                  onChangeText={setPromoterDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          )}

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          {partnerType && (
            <TouchableOpacity
              style={[
                styles.submitButton, 
                { backgroundColor: getRoleColor() },
                isLoading && styles.submitButtonDisabled
              ]}
              onPress={validateAndSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Complete Registration</Text>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
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
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
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
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  partnerTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  partnerTypeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  partnerTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  partnerTypeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  partnerTypeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  checkCircle: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
  vehicleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 6,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 8,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.text,
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
    fontWeight: '500',
    color: COLORS.text,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 2,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  promoterTypeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  promoterTypeCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  promoterTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
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
