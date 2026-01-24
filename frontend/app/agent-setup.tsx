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
  pink: '#EC4899',
  orange: '#F97316',
  teal: '#14B8A6',
  indigo: '#6366F1',
};

type AgentType = 'mobile' | 'skilled' | null;
type VehicleType = 'motorbike' | 'scooter' | 'car';

// Mobile Genie Services
const MOBILE_SERVICES = [
  { id: 'delivery', label: 'Deliveries', icon: 'basket' as const, desc: 'Groceries, food, beverages, medicines' },
  { id: 'courier', label: 'Courier', icon: 'document-text' as const, desc: 'Documents, packages, forgotten items' },
  { id: 'rides', label: 'Rides', icon: 'car' as const, desc: 'Pick up & drop people' },
  { id: 'errands', label: 'Errands', icon: 'clipboard' as const, desc: 'Shopping, bill payments, queuing' },
  { id: 'surprise', label: 'Surprise Delivery', icon: 'gift' as const, desc: 'Gifts & special occasions' },
];

// Skilled Genie Categories with Subcategories
const SKILL_CATEGORIES = [
  {
    id: 'home_services',
    label: 'Home Services',
    icon: 'home' as const,
    color: COLORS.primary,
    skills: [
      { id: 'house_cleaning', label: 'House Cleaning' },
      { id: 'kitchen_cleaning', label: 'Kitchen Cleaning' },
      { id: 'chef_cook', label: 'Chef / Cook' },
      { id: 'laundry', label: 'Laundry / Ironing' },
      { id: 'gardener', label: 'Gardener' },
      { id: 'pet_care', label: 'Pet Care' },
    ],
  },
  {
    id: 'technical',
    label: 'Technical',
    icon: 'construct' as const,
    color: COLORS.secondary,
    skills: [
      { id: 'electrician', label: 'Electrician' },
      { id: 'plumber', label: 'Plumber' },
      { id: 'ac_repair', label: 'AC Repair / Service' },
      { id: 'mechanic_2wheeler', label: 'Mechanic (Two-wheeler)' },
      { id: 'mechanic_4wheeler', label: 'Mechanic (Four-wheeler)' },
      { id: 'welder', label: 'Welder' },
      { id: 'electronics_repair', label: 'Electronics Repair' },
      { id: 'computer_repair', label: 'Computer / Laptop Repair' },
      { id: 'mobile_repair', label: 'Mobile Repair' },
    ],
  },
  {
    id: 'construction',
    label: 'Construction & Renovation',
    icon: 'hammer' as const,
    color: COLORS.amber,
    skills: [
      { id: 'mason', label: 'Mason / Brick Layer' },
      { id: 'painter', label: 'Painter (Interior/Exterior)' },
      { id: 'plastering', label: 'Plastering Worker' },
      { id: 'carpenter', label: 'Carpenter' },
      { id: 'tiler', label: 'Tiler / Flooring' },
      { id: 'false_ceiling', label: 'False Ceiling' },
      { id: 'waterproofing', label: 'Waterproofing' },
    ],
  },
  {
    id: 'outdoor',
    label: 'Outdoor & Land',
    icon: 'leaf' as const,
    color: COLORS.success,
    skills: [
      { id: 'tree_cutting', label: 'Tree Cutting / Trimming' },
      { id: 'coconut_climber', label: 'Coconut Tree Climber' },
      { id: 'grass_cutting', label: 'Grass Cutting' },
      { id: 'land_clearing', label: 'Land Clearing' },
      { id: 'landscaping', label: 'Landscaping' },
      { id: 'pressure_washing', label: 'Pressure Washing' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative & Media',
    icon: 'camera' as const,
    color: COLORS.pink,
    skills: [
      { id: 'photographer', label: 'Photographer' },
      { id: 'videographer', label: 'Videographer' },
      { id: 'graphic_designer', label: 'Graphic Designer' },
      { id: 'event_decorator', label: 'Event Decorator' },
      { id: 'mehendi_artist', label: 'Mehendi Artist' },
      { id: 'makeup_artist', label: 'Makeup Artist' },
    ],
  },
  {
    id: 'installation',
    label: 'Specialized Installation',
    icon: 'settings' as const,
    color: COLORS.indigo,
    skills: [
      { id: 'mosquito_net', label: 'Mosquito Net Installation' },
      { id: 'curtains', label: 'Curtain / Blinds Installation' },
      { id: 'furniture_assembly', label: 'Furniture Assembly' },
      { id: 'modular_kitchen', label: 'Modular Kitchen' },
      { id: 'cctv', label: 'CCTV / Security Systems' },
      { id: 'solar_panel', label: 'Solar Panel Installation' },
      { id: 'tv_appliance', label: 'TV / Appliance Installation' },
    ],
  },
];

const VEHICLES = [
  { type: 'motorbike' as VehicleType, label: 'Motor Bike', icon: 'bicycle' as const },
  { type: 'scooter' as VehicleType, label: 'Scooter', icon: 'speedometer' as const },
  { type: 'car' as VehicleType, label: 'Car', icon: 'car' as const },
];

export default function AgentSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  // Step tracking
  const [step, setStep] = useState(1); // 1: Agent Type, 2: Details
  
  // Agent type
  const [agentType, setAgentType] = useState<AgentType>(null);
  
  // Mobile Genie fields
  const [vehicleType, setVehicleType] = useState<VehicleType>('scooter');
  const [isElectric, setIsElectric] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  // Skilled Genie fields
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [skilledVehicleType, setSkilledVehicleType] = useState<VehicleType>('scooter');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(s => s !== skillId)
        : [...prev, skillId]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!agentType) {
        setError('Please select your Genie type');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      router.back();
    }
  };

  const handleComplete = async () => {
    setError('');

    if (agentType === 'mobile') {
      if (selectedServices.length === 0) {
        setError('Please select at least one service');
        return;
      }
    } else if (agentType === 'skilled') {
      if (selectedSkills.length === 0) {
        setError('Please select at least one skill');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await api.registerAsAgent({
        phone: user?.phone || '',
        agent_type: agentType || 'mobile',
        vehicle_type: agentType === 'mobile' ? vehicleType : (hasVehicle ? skilledVehicleType : null),
        services: agentType === 'mobile' ? selectedServices : [],
        skills: agentType === 'skilled' ? selectedSkills : [],
        has_vehicle: agentType === 'skilled' ? hasVehicle : true,
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

  // Step 1: Choose Agent Type
  const renderStep1 = () => (
    <>
      <Text style={styles.sectionTitle}>What kind of Genie are you?</Text>
      
      {/* Mobile Genie */}
      <TouchableOpacity
        style={[
          styles.agentTypeCard,
          agentType === 'mobile' && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
        ]}
        onPress={() => setAgentType('mobile')}
      >
        <View style={[styles.agentTypeIconBg, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name="bicycle" size={36} color={COLORS.primary} />
        </View>
        <View style={styles.agentTypeContent}>
          <Text style={[styles.agentTypeTitle, agentType === 'mobile' && { color: COLORS.primary }]}>
            Mobile Genie
          </Text>
          <Text style={styles.agentTypeDesc}>I have a vehicle (bike/scooter/car)</Text>
          <View style={styles.agentTypeTags}>
            <View style={styles.tag}><Text style={styles.tagText}>Deliveries</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Rides</Text></View>
            <View style={styles.tag}><Text style={styles.tagText}>Errands</Text></View>
          </View>
        </View>
        <View style={[styles.radioOuter, agentType === 'mobile' && { borderColor: COLORS.primary }]}>
          {agentType === 'mobile' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
        </View>
      </TouchableOpacity>

      {/* Skilled Genie */}
      <TouchableOpacity
        style={[
          styles.agentTypeCard,
          agentType === 'skilled' && { borderColor: COLORS.amber, backgroundColor: COLORS.amber + '08' },
        ]}
        onPress={() => setAgentType('skilled')}
      >
        <View style={[styles.agentTypeIconBg, { backgroundColor: COLORS.amber + '15' }]}>
          <Ionicons name="construct" size={36} color={COLORS.amber} />
        </View>
        <View style={styles.agentTypeContent}>
          <Text style={[styles.agentTypeTitle, agentType === 'skilled' && { color: COLORS.amber }]}>
            Skilled Genie
          </Text>
          <Text style={styles.agentTypeDesc}>I have a trade or professional skill</Text>
          <View style={styles.agentTypeTags}>
            <View style={[styles.tag, { backgroundColor: COLORS.amber + '15' }]}>
              <Text style={[styles.tagText, { color: COLORS.amber }]}>Electrician</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: COLORS.amber + '15' }]}>
              <Text style={[styles.tagText, { color: COLORS.amber }]}>Plumber</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: COLORS.amber + '15' }]}>
              <Text style={[styles.tagText, { color: COLORS.amber }]}>+40 more</Text>
            </View>
          </View>
        </View>
        <View style={[styles.radioOuter, agentType === 'skilled' && { borderColor: COLORS.amber }]}>
          {agentType === 'skilled' && <View style={[styles.radioInner, { backgroundColor: COLORS.amber }]} />}
        </View>
      </TouchableOpacity>
    </>
  );

  // Step 2: Mobile Genie Details
  const renderMobileGenieDetails = () => (
    <>
      <Text style={styles.sectionTitle}>Your Vehicle</Text>
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
              size={28}
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

      {/* Electric Vehicle Toggle */}
      <TouchableOpacity 
        style={styles.electricToggleCard}
        onPress={() => setIsElectric(!isElectric)}
      >
        <View style={[styles.electricIconBg, isElectric && { backgroundColor: COLORS.success + '20' }]}>
          <Ionicons 
            name="leaf" 
            size={24} 
            color={isElectric ? COLORS.success : COLORS.textSecondary} 
          />
        </View>
        <View style={styles.electricToggleContent}>
          <Text style={styles.electricToggleTitle}>Electric Vehicle</Text>
          <Text style={styles.electricToggleSubtext}>
            {isElectric ? 'Yes, my vehicle is electric ⚡' : 'Is your vehicle electric?'}
          </Text>
        </View>
        <View style={[styles.toggle, isElectric && { backgroundColor: COLORS.success }]}>
          <View style={[styles.toggleDot, isElectric && { transform: [{ translateX: 20 }] }]} />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Services You Want to Offer</Text>
      <Text style={styles.sectionSubtitle}>Select all that apply</Text>
      
      {MOBILE_SERVICES.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={[
            styles.serviceCard,
            selectedServices.includes(service.id) && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
          ]}
          onPress={() => toggleService(service.id)}
        >
          <View style={[
            styles.serviceIconBg,
            selectedServices.includes(service.id) && { backgroundColor: COLORS.primary },
          ]}>
            <Ionicons
              name={service.icon}
              size={22}
              color={selectedServices.includes(service.id) ? COLORS.white : COLORS.primary}
            />
          </View>
          <View style={styles.serviceContent}>
            <Text style={styles.serviceLabel}>{service.label}</Text>
            <Text style={styles.serviceDesc}>{service.desc}</Text>
          </View>
          <View style={[
            styles.checkbox,
            selectedServices.includes(service.id) && styles.checkboxChecked,
          ]}>
            {selectedServices.includes(service.id) && (
              <Ionicons name="checkmark" size={14} color={COLORS.white} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  // Step 2: Skilled Genie Details
  const renderSkilledGenieDetails = () => (
    <>
      <Text style={styles.sectionTitle}>Select Your Skills</Text>
      <Text style={styles.sectionSubtitle}>Tap a category to expand, then select your skills</Text>
      
      {SKILL_CATEGORIES.map((category) => (
        <View key={category.id} style={styles.categoryContainer}>
          <TouchableOpacity
            style={[
              styles.categoryHeader,
              expandedCategory === category.id && { backgroundColor: category.color + '10', borderColor: category.color },
            ]}
            onPress={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
          >
            <View style={[styles.categoryIconBg, { backgroundColor: category.color + '20' }]}>
              <Ionicons name={category.icon} size={22} color={category.color} />
            </View>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <View style={styles.categoryRight}>
              {category.skills.filter(s => selectedSkills.includes(s.id)).length > 0 && (
                <View style={[styles.countBadge, { backgroundColor: category.color }]}>
                  <Text style={styles.countText}>
                    {category.skills.filter(s => selectedSkills.includes(s.id)).length}
                  </Text>
                </View>
              )}
              <Ionicons
                name={expandedCategory === category.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textSecondary}
              />
            </View>
          </TouchableOpacity>
          
          {expandedCategory === category.id && (
            <View style={styles.skillsGrid}>
              {category.skills.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={[
                    styles.skillChip,
                    selectedSkills.includes(skill.id) && { backgroundColor: category.color, borderColor: category.color },
                  ]}
                  onPress={() => toggleSkill(skill.id)}
                >
                  <Text style={[
                    styles.skillChipText,
                    selectedSkills.includes(skill.id) && { color: COLORS.white },
                  ]}>
                    {skill.label}
                  </Text>
                  {selectedSkills.includes(skill.id) && (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Vehicle for commuting */}
      <View style={styles.vehicleSection}>
        <TouchableOpacity
          style={styles.hasVehicleRow}
          onPress={() => setHasVehicle(!hasVehicle)}
        >
          <View style={[styles.checkbox, hasVehicle && { backgroundColor: COLORS.amber, borderColor: COLORS.amber }]}>
            {hasVehicle && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
          </View>
          <View style={styles.hasVehicleText}>
            <Text style={styles.hasVehicleTitle}>I have a vehicle for commuting</Text>
            <Text style={styles.hasVehicleSubtext}>Optional, but helps reach more customers</Text>
          </View>
        </TouchableOpacity>

        {hasVehicle && (
          <View style={styles.vehicleGrid}>
            {VEHICLES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.type}
                style={[
                  styles.vehicleCard,
                  styles.vehicleCardSmall,
                  skilledVehicleType === vehicle.type && { backgroundColor: COLORS.amber, borderColor: COLORS.amber },
                ]}
                onPress={() => setSkilledVehicleType(vehicle.type)}
              >
                <Ionicons
                  name={vehicle.icon}
                  size={22}
                  color={skilledVehicleType === vehicle.type ? COLORS.white : COLORS.amber}
                />
                <Text style={[
                  styles.vehicleLabel,
                  styles.vehicleLabelSmall,
                  skilledVehicleType === vehicle.type && { color: COLORS.white },
                ]}>
                  {vehicle.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
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
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {step === 1 ? 'Genie Type' : agentType === 'mobile' ? 'Mobile Genie Setup' : 'Skilled Genie Setup'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Choose how you want to fulfill wishes' 
                : agentType === 'mobile' 
                  ? 'Set up your vehicle and services'
                  : 'Select your professional skills'
              }
            </Text>
          </View>

          {/* Content */}
          {step === 1 && renderStep1()}
          {step === 2 && agentType === 'mobile' && renderMobileGenieDetails()}
          {step === 2 && agentType === 'skilled' && renderSkilledGenieDetails()}

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Action Button */}
          {step === 1 ? (
            <TouchableOpacity
              style={[styles.actionButton, !agentType && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!agentType}
            >
              <Text style={styles.actionButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: agentType === 'mobile' ? COLORS.primary : COLORS.amber },
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.actionButtonText}>Complete Setup</Text>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  agentTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  agentTypeIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentTypeContent: {
    flex: 1,
    marginLeft: 14,
  },
  agentTypeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  agentTypeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  agentTypeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '500',
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
  vehicleGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  vehicleCardSmall: {
    padding: 12,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginTop: 8,
  },
  vehicleLabelSmall: {
    fontSize: 12,
    marginTop: 4,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  serviceIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceContent: {
    flex: 1,
    marginLeft: 12,
  },
  serviceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  serviceDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.white,
    marginTop: -1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.border,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  skillChipText: {
    fontSize: 13,
    color: COLORS.text,
  },
  vehicleSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hasVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hasVehicleText: {
    flex: 1,
    marginLeft: 12,
  },
  hasVehicleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  hasVehicleSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
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
