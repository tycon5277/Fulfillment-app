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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 🎨 CLAYMORPHISM CREAM/WARM THEME - Friendly & Professional
const COLORS = {
  // Base colors
  background: '#FDF8F3',         // Warm cream background
  backgroundSecondary: '#F5EDE4', // Slightly darker cream
  cardBg: '#FFFFFF',             // Pure white cards
  cardBorder: '#E8DFD5',         // Soft warm border
  
  // Primary accent colors
  primary: '#D97706',            // Warm amber/orange
  primaryLight: '#F59E0B',       // Lighter amber
  secondary: '#92400E',          // Deep warm brown
  
  // State colors
  success: '#059669',            // Emerald green
  error: '#DC2626',              // Red
  warning: '#D97706',            // Amber
  
  // Text colors
  text: '#44403C',               // Warm dark gray
  textSecondary: '#78716C',      // Medium warm gray
  textMuted: '#A8A29E',          // Light warm gray
  textLight: '#D6D3D1',          // Very light gray
  
  // Accent colors for categories
  amber: '#F59E0B',
  blue: '#3B82F6',
  indigo: '#6366F1',
  gold: '#FBBF24',
  red: '#EF4444',
  pink: '#EC4899',
  cyan: '#06B6D4',
  green: '#22C55E',
  orange: '#F97316',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  magenta: '#D946EF',
  
  // Claymorphism shadow colors
  shadowLight: 'rgba(255, 255, 255, 0.8)',
  shadowDark: 'rgba(0, 0, 0, 0.08)',
};

// Claymorphism shadow style helper
const clayShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

const clayInnerShadow = {
  shadowColor: '#FFF',
  shadowOffset: { width: -2, height: -2 },
  shadowOpacity: 0.5,
  shadowRadius: 4,
};

// ✨ COMPREHENSIVE SKILL CATEGORIES
const SKILL_CATEGORIES = [
  // 🏠 HOME SERVICES
  {
    id: 'home_services',
    title: 'Home Services',
    subtitle: 'Cleaning & maintenance',
    emoji: '🏠',
    color: '#F59E0B',
    skills: [
      { id: 'deep_cleaning', name: 'Deep Cleaning', emoji: '🧹', description: 'Professional home deep clean' },
      { id: 'regular_cleaning', name: 'Regular Cleaning', emoji: '✨', description: 'Daily/weekly home cleaning' },
      { id: 'kitchen_cleaning', name: 'Kitchen Cleaning', emoji: '🍳', description: 'Kitchen & appliance cleaning' },
      { id: 'bathroom_cleaning', name: 'Bathroom Cleaning', emoji: '🚿', description: 'Bathroom sanitization' },
      { id: 'carpet_cleaning', name: 'Carpet Cleaning', emoji: '🧽', description: 'Deep carpet & rug cleaning' },
      { id: 'sofa_cleaning', name: 'Sofa & Upholstery', emoji: '🛋️', description: 'Furniture deep cleaning' },
      { id: 'laundry', name: 'Laundry & Ironing', emoji: '👔', description: 'Wash, dry & iron clothes' },
      { id: 'dishwashing', name: 'Dishwashing', emoji: '🍽️', description: 'Utensil cleaning service' },
      { id: 'window_cleaning', name: 'Window Cleaning', emoji: '🪟', description: 'Glass & window cleaning' },
      { id: 'organizing', name: 'Home Organizing', emoji: '📦', description: 'Declutter & organize spaces' },
      { id: 'mattress_cleaning', name: 'Mattress Cleaning', emoji: '🛏️', description: 'Mattress sanitization' },
      { id: 'chimney_cleaning', name: 'Chimney Cleaning', emoji: '🔥', description: 'Chimney & exhaust cleaning' },
    ],
  },
  
  // 🔧 REPAIR & MAINTENANCE
  {
    id: 'repair_maintenance',
    title: 'Repair & Maintenance',
    subtitle: 'Fix anything, anywhere',
    emoji: '🔧',
    color: '#3B82F6',
    skills: [
      { id: 'plumbing', name: 'Plumbing', emoji: '🚰', description: 'Pipes, taps & water systems' },
      { id: 'electrical', name: 'Electrical Work', emoji: '⚡', description: 'Wiring, switches & fixtures' },
      { id: 'carpentry', name: 'Carpentry', emoji: '🪚', description: 'Wood work & furniture repair' },
      { id: 'painting', name: 'Painting', emoji: '🎨', description: 'Interior & exterior painting' },
      { id: 'ac_repair', name: 'AC Repair & Service', emoji: '❄️', description: 'AC installation & repair' },
      { id: 'refrigerator', name: 'Refrigerator Repair', emoji: '🧊', description: 'Fridge & freezer repair' },
      { id: 'washing_machine', name: 'Washing Machine', emoji: '🌀', description: 'Washer repair & service' },
      { id: 'tv_repair', name: 'TV Repair', emoji: '📺', description: 'Television repair & mounting' },
      { id: 'microwave', name: 'Microwave & Oven', emoji: '🍕', description: 'Kitchen appliance repair' },
      { id: 'geyser', name: 'Geyser & Water Heater', emoji: '🔥', description: 'Water heater service' },
      { id: 'fan_repair', name: 'Fan & Cooler Repair', emoji: '💨', description: 'Ceiling fan & cooler service' },
      { id: 'inverter', name: 'Inverter & UPS', emoji: '🔋', description: 'Power backup solutions' },
      { id: 'furniture_assembly', name: 'Furniture Assembly', emoji: '🪑', description: 'Assemble IKEA & flat-pack' },
      { id: 'door_lock', name: 'Door & Lock Repair', emoji: '🔐', description: 'Locks, doors & handles' },
      { id: 'waterproofing', name: 'Waterproofing', emoji: '💧', description: 'Leak repair & waterproofing' },
    ],
  },

  // 🧑‍✈️ DRIVER ON DEMAND
  {
    id: 'driver_services',
    title: 'Driver on Demand',
    subtitle: 'Professional driving services',
    emoji: '🧑‍✈️',
    color: '#6366F1',
    skills: [
      { id: 'personal_driver', name: 'Personal Driver', emoji: '👨‍✈️', description: 'Daily commute & errands' },
      { id: 'outstation_driver', name: 'Outstation Driver', emoji: '🛣️', description: 'Long distance travel' },
      { id: 'corporate_driver', name: 'Corporate Chauffeur', emoji: '💼', description: 'Executive transport' },
      { id: 'airport_transfer', name: 'Airport Transfers', emoji: '✈️', description: 'Airport pickup & drop' },
      { id: 'night_driver', name: 'Night Driver', emoji: '🌙', description: 'Late night driving' },
      { id: 'wedding_driver', name: 'Wedding Chauffeur', emoji: '💒', description: 'Wedding ceremonies' },
      { id: 'vip_driver', name: 'VIP Driver', emoji: '⭐', description: 'Premium escort service' },
      { id: 'female_driver', name: 'Female Driver', emoji: '👩‍✈️', description: 'Women safety driving' },
      { id: 'elderly_driver', name: 'Elderly Assistance', emoji: '👴', description: 'Senior citizen transport' },
      { id: 'medical_transport', name: 'Medical Transport', emoji: '🏥', description: 'Hospital visits' },
    ],
  },

  // 🚗 LUXURY CAR & VEHICLE HIRE
  {
    id: 'luxury_hire',
    title: 'Luxury Car & Vehicle Hire',
    subtitle: 'Premium rides for special occasions',
    emoji: '🚗',
    color: '#FBBF24',
    skills: [
      { id: 'wedding_car', name: 'Wedding Car Hire', emoji: '💒', description: 'Decorated marriage cars' },
      { id: 'luxury_sedan', name: 'Luxury Sedan', emoji: '🚘', description: 'Mercedes, BMW, Audi' },
      { id: 'vintage_car', name: 'Vintage Cars', emoji: '🚙', description: 'Classic & vintage vehicles' },
      { id: 'limousine', name: 'Limousine', emoji: '🎩', description: 'Stretch limo service' },
      { id: 'sports_car', name: 'Sports Car Hire', emoji: '🏎️', description: 'Ferrari, Lamborghini' },
      { id: 'suv_hire', name: 'Premium SUV', emoji: '🚙', description: 'Fortuner, Endeavour, Range Rover' },
      { id: 'party_bus', name: 'Party Bus', emoji: '🎉', description: 'Party & celebrations' },
      { id: 'convertible', name: 'Convertible', emoji: '🌞', description: 'Open-top cars' },
      { id: 'rolls_royce', name: 'Rolls Royce', emoji: '👑', description: 'Ultimate luxury' },
      { id: 'photoshoot_car', name: 'Photoshoot Cars', emoji: '📸', description: 'For photography sessions' },
    ],
  },

  // 🚛 COMMERCIAL VEHICLES
  {
    id: 'commercial_vehicles',
    title: 'Commercial Vehicles',
    subtitle: 'Heavy duty transport solutions',
    emoji: '🚛',
    color: '#EF4444',
    skills: [
      { id: 'truck_driver', name: 'Truck Driver', emoji: '🚚', description: 'Heavy goods transport' },
      { id: 'tempo_driver', name: 'Tempo/Mini Truck', emoji: '🛻', description: 'Small goods transport' },
      { id: 'container_driver', name: 'Container Driver', emoji: '📦', description: 'Container transport' },
      { id: 'tanker_driver', name: 'Tanker Driver', emoji: '⛽', description: 'Liquid transport' },
      { id: 'bus_driver', name: 'Bus Driver', emoji: '🚌', description: 'Passenger bus service' },
      { id: 'school_bus', name: 'School Bus Driver', emoji: '🚸', description: 'School transport' },
      { id: 'tractor_driver', name: 'Tractor Driver', emoji: '🚜', description: 'Agricultural transport' },
      { id: 'crane_operator', name: 'Crane Operator', emoji: '🏗️', description: 'Heavy machinery' },
      { id: 'forklift', name: 'Forklift Operator', emoji: '📋', description: 'Warehouse operations' },
      { id: 'jcb_operator', name: 'JCB Operator', emoji: '🏗️', description: 'Construction machinery' },
    ],
  },

  // 📸 PHOTOGRAPHY & VIDEOGRAPHY
  {
    id: 'photography_video',
    title: 'Photography & Videography',
    subtitle: 'Capture memories beautifully',
    emoji: '📸',
    color: '#EC4899',
    skills: [
      { id: 'wedding_photography', name: 'Wedding Photography', emoji: '💒', description: 'Marriage ceremonies' },
      { id: 'portrait_photo', name: 'Portrait Photography', emoji: '🖼️', description: 'Professional portraits' },
      { id: 'event_photography', name: 'Event Photography', emoji: '🎉', description: 'Parties & events' },
      { id: 'product_photography', name: 'Product Photography', emoji: '📦', description: 'E-commerce photos' },
      { id: 'fashion_photography', name: 'Fashion Photography', emoji: '👗', description: 'Fashion shoots' },
      { id: 'food_photography', name: 'Food Photography', emoji: '🍔', description: 'Restaurant & food' },
      { id: 'real_estate_photo', name: 'Real Estate Photos', emoji: '🏠', description: 'Property photography' },
      { id: 'wedding_video', name: 'Wedding Videography', emoji: '🎬', description: 'Marriage videos' },
      { id: 'corporate_video', name: 'Corporate Videos', emoji: '💼', description: 'Business videos' },
      { id: 'music_video', name: 'Music Videos', emoji: '🎵', description: 'Music production' },
      { id: 'documentary', name: 'Documentary', emoji: '🎥', description: 'Documentary filming' },
      { id: 'live_streaming', name: 'Live Streaming', emoji: '📺', description: 'Live event streaming' },
      { id: 'video_editing', name: 'Video Editing', emoji: '✂️', description: 'Post-production editing' },
      { id: 'photo_editing', name: 'Photo Editing', emoji: '🖌️', description: 'Photo retouching' },
    ],
  },

  // 🚁 DRONE SERVICES
  {
    id: 'drone_services',
    title: 'Drone Services',
    subtitle: 'Aerial photography & more',
    emoji: '🚁',
    color: '#06B6D4',
    skills: [
      { id: 'drone_photography', name: 'Aerial Photography', emoji: '📸', description: 'Drone photos from above' },
      { id: 'drone_videography', name: 'Aerial Videography', emoji: '🎬', description: 'Cinematic drone videos' },
      { id: 'drone_wedding', name: 'Wedding Drone', emoji: '💒', description: 'Wedding aerial shots' },
      { id: 'drone_survey', name: 'Land Survey', emoji: '🗺️', description: 'Property mapping' },
      { id: 'drone_inspection', name: 'Building Inspection', emoji: '🏗️', description: 'Structure inspection' },
      { id: 'drone_events', name: 'Event Coverage', emoji: '🎉', description: 'Event aerial coverage' },
      { id: 'drone_real_estate', name: 'Real Estate Drone', emoji: '🏠', description: 'Property showcase' },
      { id: 'fpv_drone', name: 'FPV Racing Drone', emoji: '🏎️', description: 'Action sports coverage' },
      { id: 'drone_agriculture', name: 'Agricultural Drone', emoji: '🌾', description: 'Crop monitoring' },
      { id: 'drone_delivery', name: 'Drone Delivery', emoji: '📦', description: 'Small item delivery' },
    ],
  },

  // 🛠️ VEHICLE SERVICES
  {
    id: 'vehicle_services',
    title: 'Vehicle Services',
    subtitle: 'Keep vehicles running smooth',
    emoji: '🛠️',
    color: '#EF4444',
    skills: [
      { id: 'car_wash', name: 'Car Washing', emoji: '🚿', description: 'Interior & exterior car wash' },
      { id: 'car_detailing', name: 'Car Detailing', emoji: '✨', description: 'Premium car detailing' },
      { id: 'bike_wash', name: 'Bike Washing', emoji: '🏍️', description: 'Two-wheeler cleaning' },
      { id: 'car_service', name: 'Car Service', emoji: '🔧', description: 'General car maintenance' },
      { id: 'bike_repair', name: 'Bike Repair', emoji: '🛠️', description: 'Two-wheeler repair' },
      { id: 'puncture', name: 'Puncture Repair', emoji: '🔩', description: 'Tyre puncture service' },
      { id: 'battery_service', name: 'Battery Service', emoji: '🔋', description: 'Jump start & battery change' },
      { id: 'denting_painting', name: 'Denting & Painting', emoji: '🎨', description: 'Body work & painting' },
      { id: 'car_polish', name: 'Car Polishing', emoji: '💎', description: 'Paint protection & polish' },
      { id: 'ac_service_car', name: 'Car AC Service', emoji: '❄️', description: 'Vehicle AC repair' },
    ],
  },

  // 💻 TECH SERVICES
  {
    id: 'tech_services',
    title: 'Tech Services',
    subtitle: 'Digital solutions',
    emoji: '💻',
    color: '#06B6D4',
    skills: [
      { id: 'computer_repair', name: 'Computer Repair', emoji: '🖥️', description: 'PC & laptop repair' },
      { id: 'phone_repair', name: 'Phone Repair', emoji: '📱', description: 'Mobile device repair' },
      { id: 'tablet_repair', name: 'Tablet Repair', emoji: '📲', description: 'iPad & tablet service' },
      { id: 'data_recovery', name: 'Data Recovery', emoji: '💾', description: 'Lost data retrieval' },
      { id: 'virus_removal', name: 'Virus Removal', emoji: '🛡️', description: 'Malware & virus cleaning' },
      { id: 'software_install', name: 'Software Install', emoji: '💿', description: 'OS & software setup' },
      { id: 'networking', name: 'WiFi & Networking', emoji: '🌐', description: 'Network setup & repair' },
      { id: 'smart_home', name: 'Smart Home Setup', emoji: '🏡', description: 'IoT & automation' },
      { id: 'cctv', name: 'CCTV Installation', emoji: '📹', description: 'Security camera setup' },
      { id: 'printer', name: 'Printer Service', emoji: '🖨️', description: 'Printer repair & setup' },
      { id: 'gaming_setup', name: 'Gaming Setup', emoji: '🎮', description: 'Gaming PC & console setup' },
      { id: 'website', name: 'Website Development', emoji: '🌍', description: 'Build websites & apps' },
    ],
  },

  // 🌿 GARDEN & OUTDOOR
  {
    id: 'garden_outdoor',
    title: 'Garden & Outdoor',
    subtitle: 'Green spaces & pest control',
    emoji: '🌿',
    color: '#22C55E',
    skills: [
      { id: 'gardening', name: 'Gardening', emoji: '🌱', description: 'Plant care & garden maintenance' },
      { id: 'lawn_mowing', name: 'Lawn Mowing', emoji: '🌾', description: 'Grass cutting & lawn care' },
      { id: 'tree_trimming', name: 'Tree Trimming', emoji: '🌳', description: 'Tree & hedge trimming' },
      { id: 'landscaping', name: 'Landscaping', emoji: '🏞️', description: 'Garden design & setup' },
      { id: 'pest_control', name: 'Pest Control', emoji: '🐜', description: 'Insect & rodent control' },
      { id: 'termite', name: 'Termite Treatment', emoji: '🪲', description: 'Anti-termite service' },
      { id: 'tank_cleaning', name: 'Water Tank Cleaning', emoji: '💧', description: 'Tank sanitization' },
      { id: 'solar_cleaning', name: 'Solar Panel Cleaning', emoji: '☀️', description: 'Solar maintenance' },
      { id: 'terrace_garden', name: 'Terrace Garden', emoji: '🌻', description: 'Rooftop garden setup' },
      { id: 'irrigation', name: 'Irrigation Setup', emoji: '🚿', description: 'Drip & sprinkler systems' },
    ],
  },

  // 💆 WELLNESS & BEAUTY
  {
    id: 'wellness_beauty',
    title: 'Wellness & Beauty',
    subtitle: 'Pamper & rejuvenate',
    emoji: '💆',
    color: '#EC4899',
    skills: [
      { id: 'massage', name: 'Massage Therapy', emoji: '💆', description: 'Relaxation & therapeutic' },
      { id: 'spa_home', name: 'Home Spa', emoji: '🧖', description: 'Spa treatments at home' },
      { id: 'haircut_men', name: 'Men\'s Haircut', emoji: '💈', description: 'Haircut & grooming' },
      { id: 'haircut_women', name: 'Women\'s Haircut', emoji: '💇‍♀️', description: 'Haircut & styling' },
      { id: 'facial', name: 'Facial & Cleanup', emoji: '✨', description: 'Skin care treatments' },
      { id: 'makeup', name: 'Makeup Artist', emoji: '💄', description: 'Professional makeup' },
      { id: 'mehendi', name: 'Mehendi Artist', emoji: '🖐️', description: 'Henna designs' },
      { id: 'manicure', name: 'Manicure & Pedicure', emoji: '💅', description: 'Nail care services' },
      { id: 'waxing', name: 'Waxing & Threading', emoji: '🧴', description: 'Hair removal services' },
      { id: 'yoga', name: 'Yoga Instructor', emoji: '🧘', description: 'Yoga classes at home' },
      { id: 'personal_trainer', name: 'Personal Trainer', emoji: '💪', description: 'Fitness coaching' },
      { id: 'physiotherapy', name: 'Physiotherapy', emoji: '🏃', description: 'Physical therapy' },
      { id: 'dietician', name: 'Dietician', emoji: '🥗', description: 'Nutrition consulting' },
    ],
  },

  // 🐾 PET SERVICES
  {
    id: 'pet_services',
    title: 'Pet Services',
    subtitle: 'For your furry friends',
    emoji: '🐾',
    color: '#F97316',
    skills: [
      { id: 'pet_grooming', name: 'Pet Grooming', emoji: '🛁', description: 'Bath & grooming' },
      { id: 'dog_walking', name: 'Dog Walking', emoji: '🐕', description: 'Daily walks & exercise' },
      { id: 'pet_sitting', name: 'Pet Sitting', emoji: '🏠', description: 'Pet care at your home' },
      { id: 'pet_boarding', name: 'Pet Boarding', emoji: '🐶', description: 'Overnight pet care' },
      { id: 'pet_training', name: 'Pet Training', emoji: '🎓', description: 'Behavior training' },
      { id: 'vet_visit', name: 'Vet Visit Assist', emoji: '🏥', description: 'Vet transportation' },
      { id: 'aquarium', name: 'Aquarium Cleaning', emoji: '🐠', description: 'Fish tank maintenance' },
      { id: 'bird_care', name: 'Bird Care', emoji: '🦜', description: 'Bird feeding & care' },
    ],
  },

  // 📚 EDUCATION & TUTORING
  {
    id: 'education',
    title: 'Education & Tutoring',
    subtitle: 'Share knowledge',
    emoji: '📚',
    color: '#8B5CF6',
    skills: [
      { id: 'math_tutor', name: 'Mathematics', emoji: '🔢', description: 'Math tutoring all levels' },
      { id: 'science_tutor', name: 'Science', emoji: '🔬', description: 'Physics, Chemistry, Biology' },
      { id: 'english_tutor', name: 'English', emoji: '📖', description: 'Language & literature' },
      { id: 'hindi_tutor', name: 'Hindi', emoji: '🇮🇳', description: 'Hindi language tutoring' },
      { id: 'coding_tutor', name: 'Coding', emoji: '👨‍💻', description: 'Programming classes' },
      { id: 'music_lessons', name: 'Music Lessons', emoji: '🎹', description: 'Instrument & vocal' },
      { id: 'art_lessons', name: 'Art & Drawing', emoji: '🎨', description: 'Art classes' },
      { id: 'dance_lessons', name: 'Dance Classes', emoji: '💃', description: 'Dance instruction' },
      { id: 'foreign_lang', name: 'Foreign Languages', emoji: '🗣️', description: 'Learn new languages' },
      { id: 'exam_prep', name: 'Exam Preparation', emoji: '📝', description: 'Competitive exam prep' },
      { id: 'nursery_teach', name: 'Nursery Teaching', emoji: '👶', description: 'Early childhood education' },
      { id: 'special_needs', name: 'Special Needs', emoji: '🤗', description: 'Special education' },
    ],
  },

  // 🎉 EVENTS & ENTERTAINMENT
  {
    id: 'events_entertainment',
    title: 'Events & Entertainment',
    subtitle: 'Make celebrations magical',
    emoji: '🎉',
    color: '#D946EF',
    skills: [
      { id: 'dj', name: 'DJ Services', emoji: '🎧', description: 'Music & entertainment' },
      { id: 'event_decor', name: 'Event Decoration', emoji: '🎈', description: 'Party & event decor' },
      { id: 'balloon_decor', name: 'Balloon Decoration', emoji: '🎈', description: 'Balloon arrangements' },
      { id: 'flower_decor', name: 'Flower Decoration', emoji: '💐', description: 'Floral arrangements' },
      { id: 'catering', name: 'Catering', emoji: '🍽️', description: 'Food & beverage service' },
      { id: 'anchor', name: 'Event Anchor', emoji: '🎤', description: 'MC & hosting' },
      { id: 'magic_show', name: 'Magician', emoji: '🪄', description: 'Magic performances' },
      { id: 'clown', name: 'Clown & Entertainer', emoji: '🤡', description: 'Kids entertainment' },
      { id: 'live_music', name: 'Live Music', emoji: '🎸', description: 'Live band & singers' },
      { id: 'standup', name: 'Stand-up Comedy', emoji: '😂', description: 'Comedy performances' },
      { id: 'game_host', name: 'Game Host', emoji: '🎲', description: 'Party games & activities' },
      { id: 'puppet_show', name: 'Puppet Show', emoji: '🎭', description: 'Kids puppet shows' },
    ],
  },

  // 🍳 CULINARY SERVICES
  {
    id: 'culinary',
    title: 'Culinary Services',
    subtitle: 'Kitchen experts',
    emoji: '🍳',
    color: '#EF4444',
    skills: [
      { id: 'home_cook', name: 'Home Cook', emoji: '👨‍🍳', description: 'Daily meals preparation' },
      { id: 'party_cook', name: 'Party Cooking', emoji: '🎉', description: 'Cooking for events' },
      { id: 'baking', name: 'Baking & Cakes', emoji: '🎂', description: 'Custom cakes & baking' },
      { id: 'tiffin', name: 'Tiffin Service', emoji: '🍱', description: 'Packed meal delivery' },
      { id: 'bbq', name: 'BBQ & Grill', emoji: '🍖', description: 'Barbecue specialist' },
      { id: 'bartending', name: 'Bartending', emoji: '🍸', description: 'Mixology & drinks' },
      { id: 'diet_meal', name: 'Diet Meal Prep', emoji: '🥗', description: 'Healthy meal preparation' },
      { id: 'ethnic_cuisine', name: 'Regional Cuisine', emoji: '🍛', description: 'Traditional cooking' },
    ],
  },

  // 🚚 SHIFTING & LOGISTICS
  {
    id: 'shifting',
    title: 'Shifting & Logistics',
    subtitle: 'Move with ease',
    emoji: '🚚',
    color: '#6366F1',
    skills: [
      { id: 'packers_movers', name: 'Packers & Movers', emoji: '📦', description: 'Full home shifting' },
      { id: 'furniture_moving', name: 'Furniture Moving', emoji: '🛋️', description: 'Heavy item moving' },
      { id: 'office_shifting', name: 'Office Shifting', emoji: '🏢', description: 'Commercial moves' },
      { id: 'loading_unloading', name: 'Loading/Unloading', emoji: '💪', description: 'Manual labor service' },
      { id: 'courier_service', name: 'Courier Service', emoji: '📬', description: 'Parcel delivery' },
      { id: 'storage', name: 'Storage Solutions', emoji: '🏪', description: 'Temporary storage' },
      { id: 'junk_removal', name: 'Junk Removal', emoji: '🗑️', description: 'Waste & debris removal' },
    ],
  },

  // ✨ SPECIAL & UNIQUE SERVICES
  {
    id: 'special_services',
    title: 'Special & Unique',
    subtitle: 'Rare talents & arts',
    emoji: '✨',
    color: '#FBBF24',
    skills: [
      { id: 'astrology', name: 'Astrology', emoji: '🔮', description: 'Horoscope & predictions' },
      { id: 'vastu', name: 'Vastu Consultant', emoji: '🏛️', description: 'Vastu shastra advice' },
      { id: 'tarot', name: 'Tarot Reading', emoji: '🃏', description: 'Card readings' },
      { id: 'numerology', name: 'Numerology', emoji: '🔢', description: 'Number analysis' },
      { id: 'pandit', name: 'Pandit Services', emoji: '🙏', description: 'Puja & rituals' },
      { id: 'wedding_priest', name: 'Wedding Priest', emoji: '💒', description: 'Marriage ceremonies' },
      { id: 'interior_consult', name: 'Interior Design', emoji: '🏠', description: 'Design consulting' },
      { id: 'feng_shui', name: 'Feng Shui', emoji: '☯️', description: 'Energy balancing' },
      { id: 'handwriting', name: 'Handwriting Expert', emoji: '✍️', description: 'Calligraphy & analysis' },
      { id: 'restoration', name: 'Antique Restoration', emoji: '🏺', description: 'Vintage item repair' },
      { id: 'notary', name: 'Notary Service', emoji: '📜', description: 'Document attestation' },
      { id: 'translation', name: 'Translation', emoji: '🌐', description: 'Language translation' },
    ],
  },

  // 👶 CARE SERVICES
  {
    id: 'care_services',
    title: 'Care Services',
    subtitle: 'Caring for loved ones',
    emoji: '👶',
    color: '#14B8A6',
    skills: [
      { id: 'babysitting', name: 'Babysitting', emoji: '👶', description: 'Child care service' },
      { id: 'nanny', name: 'Nanny', emoji: '👩‍👧', description: 'Full-time child care' },
      { id: 'elder_care', name: 'Elder Care', emoji: '👴', description: 'Senior citizen care' },
      { id: 'nurse_care', name: 'Home Nursing', emoji: '👩‍⚕️', description: 'Medical assistance' },
      { id: 'companion', name: 'Companionship', emoji: '🤝', description: 'Social companion' },
      { id: 'patient_attendant', name: 'Patient Attendant', emoji: '🏥', description: 'Hospital assistance' },
      { id: 'new_mom', name: 'New Mom Care', emoji: '🤱', description: 'Postnatal care' },
    ],
  },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', years: '0-1 years', emoji: '🌱', color: '#22C55E' },
  { id: 'intermediate', label: 'Intermediate', years: '1-3 years', emoji: '🌿', color: '#3B82F6' },
  { id: 'expert', label: 'Expert', years: '3-5 years', emoji: '🌳', color: '#8B5CF6' },
  { id: 'master', label: 'Master', years: '5+ years', emoji: '👑', color: '#F59E0B' },
];

const SERVICE_AREAS = [
  { id: '5km', label: '5 km', description: 'Nearby areas', emoji: '📍' },
  { id: '10km', label: '10 km', description: 'Local city', emoji: '🏙️' },
  { id: '25km', label: '25 km', description: 'Extended area', emoji: '🌆' },
  { id: 'city', label: 'Entire City', description: 'City-wide', emoji: '🗺️' },
];

// Social platforms for linking
const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', placeholder: '@username or profile URL' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', placeholder: 'Channel URL' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', placeholder: 'Profile or Page URL' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#000000', placeholder: '@username or profile URL' },
  { id: 'website', name: 'Website', icon: 'globe-outline', color: '#6366F1', placeholder: 'https://your-website.com' },
];

export default function SkilledSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null); // Track which category is selected
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [serviceArea, setServiceArea] = useState<string>('10km');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<{[key: string]: string}>({});
  const [certifications, setCertifications] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStoryTab, setActiveStoryTab] = useState<'bio' | 'social' | 'certifications'>('bio');

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  // Get the category ID for a skill
  const getCategoryForSkill = (skillId: string): string | null => {
    for (const category of SKILL_CATEGORIES) {
      if (category.skills.some(s => s.id === skillId)) {
        return category.id;
      }
    }
    return null;
  };

  // Toggle skill with category restriction
  const toggleSkill = (skillId: string, categoryId: string) => {
    // If no category is selected yet, or this skill is from the selected category
    if (!selectedCategoryId || selectedCategoryId === categoryId) {
      if (selectedSkills.includes(skillId)) {
        // Removing a skill
        const newSkills = selectedSkills.filter(id => id !== skillId);
        setSelectedSkills(newSkills);
        // If no skills left, reset the selected category
        if (newSkills.length === 0) {
          setSelectedCategoryId(null);
        }
      } else {
        // Adding a skill
        setSelectedSkills([...selectedSkills, skillId]);
        setSelectedCategoryId(categoryId);
      }
    } else {
      // User trying to select from a different category - show alert
      const currentCategoryName = SKILL_CATEGORIES.find(c => c.id === selectedCategoryId)?.title || 'current category';
      const newCategoryName = SKILL_CATEGORIES.find(c => c.id === categoryId)?.title || 'this category';
      
      Alert.alert(
        '🚫 Cannot Mix Categories',
        `You've already selected skills from "${currentCategoryName}". You cannot select skills from "${newCategoryName}" at the same time.\n\nTo change categories, first deselect all skills from the current category.`,
        [{ text: 'Got it', style: 'default' }]
      );
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
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
    setError(null);
    try {
      console.log('🚀 Registering Skilled Genie with skills:', selectedSkills);
      
      // Register as agent
      const registerResponse = await api.registerAsAgent({
        phone: user?.phone || '',
        agent_type: 'skilled',
        skills: selectedSkills,
        services: [],
        has_vehicle: false,
      });
      
      console.log('✅ Registration successful:', registerResponse.data);
      
      // CRITICAL: Fetch the updated user data and update the store BEFORE navigation
      // This ensures the tab bar and filtering logic have the correct user data
      const meResponse = await api.getMe();
      const updatedUser = meResponse.data;
      
      console.log('👤 Updated user data:', {
        partner_type: updatedUser.partner_type,
        agent_type: updatedUser.agent_type,
        agent_skills: updatedUser.agent_skills,
      });
      
      // Update the local store with fresh user data
      setUser(updatedUser);
      
      // Small delay to ensure state is propagated before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now navigate
      router.replace('/(main)/skilled-home');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err?.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedSkills.length > 0;
      case 2: return experienceLevel !== '';
      case 3: return hourlyRate !== '' && serviceArea !== '';
      case 4: return true;
    }
    return false;
  };

  const getProgressWidth = () => `${(step / 4) * 100}%`;

  const getSelectedSkillsCount = (categoryId: string) => {
    const category = SKILL_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return 0;
    return category.skills.filter(s => selectedSkills.includes(s.id)).length;
  };

  const addCertification = () => {
    setCertifications([...certifications, '']);
  };

  const updateCertification = (index: number, value: string) => {
    const updated = [...certifications];
    updated[index] = value;
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter((_, i) => i !== index));
    }
  };

  // Step 1: Skills Selection with Categories
  const renderSkillsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>✨</Text>
        <Text style={styles.stepTitle}>Choose Your Expertise</Text>
        <Text style={styles.stepSubtitle}>Select skills from ONE category that you specialize in</Text>
        {selectedCategoryId && (
          <View style={styles.categoryLockedBadge}>
            <Ionicons name="lock-closed" size={14} color={COLORS.primary} />
            <Text style={styles.categoryLockedText}>
              Locked to: {SKILL_CATEGORIES.find(c => c.id === selectedCategoryId)?.title}
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
        {SKILL_CATEGORIES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const selectedCount = getSelectedSkillsCount(category.id);
          const isLocked = selectedCategoryId && selectedCategoryId !== category.id;
          
          return (
            <View key={category.id} style={styles.categorySection}>
              <TouchableOpacity 
                style={[
                  styles.categoryHeader,
                  isExpanded && styles.categoryHeaderExpanded,
                  selectedCount > 0 && { borderColor: category.color },
                  isLocked && styles.categoryHeaderLocked,
                ]}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.categoryGradient,
                  isExpanded && { backgroundColor: category.color + '15' }
                ]}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryEmojiContainer, { backgroundColor: category.color + '20' }]}>
                      <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    </View>
                    <View>
                      <Text style={[styles.categoryTitle, isLocked && styles.categoryTitleLocked]}>
                        {category.title}
                      </Text>
                      <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    {isLocked && (
                      <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
                    )}
                    {selectedCount > 0 && (
                      <View style={[styles.selectedBadge, { backgroundColor: category.color }]}>
                        <Text style={styles.selectedBadgeText}>{selectedCount}</Text>
                      </View>
                    )}
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={isLocked ? COLORS.textMuted : COLORS.textSecondary} 
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
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
                          isLocked && styles.skillCardLocked,
                        ]}
                        onPress={() => toggleSkill(skill.id, category.id)}
                        activeOpacity={isLocked ? 1 : 0.8}
                      >
                        {isSelected && (
                          <View style={[styles.skillCheck, { backgroundColor: category.color }]}>
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        )}
                        <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                        <Text style={[
                          styles.skillName, 
                          isSelected && { color: category.color },
                          isLocked && styles.skillNameLocked
                        ]}>
                          {skill.name}
                        </Text>
                        <Text style={styles.skillDescription} numberOfLines={2}>{skill.description}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 120 }} />
      </ScrollView>

      {selectedSkills.length > 0 && (
        <View style={styles.selectionBadge}>
          <View style={styles.selectionGradient}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
            <Text style={styles.selectionText}>{selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected</Text>
          </View>
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
              <View style={[
                styles.experienceGradient,
                isSelected && { backgroundColor: level.color + '10' }
              ]}>
                <View style={styles.experienceLeft}>
                  <View style={[styles.experienceEmojiContainer, { backgroundColor: level.color + '20' }]}>
                    <Text style={styles.experienceEmoji}>{level.emoji}</Text>
                  </View>
                  <View>
                    <Text style={[styles.experienceLabel, isSelected && { color: level.color }]}>
                      {level.label}
                    </Text>
                    <Text style={styles.experienceYears}>{level.years}</Text>
                  </View>
                </View>
                <View style={styles.experienceRightSection}>
                  {isSelected && (
                    <View style={[styles.experienceCheck, { backgroundColor: level.color }]}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={20} color={COLORS.primary} />
        <Text style={styles.tipText}>
          Your experience level helps customers find the right professional for their needs!
        </Text>
      </View>
    </View>
  );

  // Step 3: Pricing & Service Area
  const renderPricingStep = () => (
    <KeyboardAvoidingView 
      style={styles.stepContent}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
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
              placeholder="80"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.rateLabel}>/hour</Text>
          </View>

          <View style={styles.ratePresets}>
            {['80', '150', '200', '300', '500', '800'].map((rate) => (
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
            <Ionicons name="trending-up" size={24} color={COLORS.success} />
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsTitle}>Potential Daily Earnings</Text>
              <Text style={styles.earningsValue}>
                ₹{hourlyRate ? parseInt(hourlyRate) * 4 : 0} - ₹{hourlyRate ? parseInt(hourlyRate) * 8 : 0}
              </Text>
              <Text style={styles.earningsNote}>Based on 4-8 hours of work</Text>
            </View>
          </View>
        </View>

        {/* Service Area */}
        <View style={styles.serviceAreaSection}>
          <Text style={styles.sectionLabel}>📍 Service Area</Text>
          <Text style={styles.sectionDescription}>How far will you travel for jobs?</Text>
          
          <View style={styles.serviceAreaGrid}>
            {SERVICE_AREAS.map((area) => {
              const isSelected = serviceArea === area.id;
              return (
                <TouchableOpacity
                  key={area.id}
                  style={[styles.areaCard, isSelected && styles.areaCardSelected]}
                  onPress={() => setServiceArea(area.id)}
                >
                  <Text style={styles.areaEmoji}>{area.emoji}</Text>
                  <Text style={[styles.areaLabel, isSelected && styles.areaLabelSelected]}>{area.label}</Text>
                  <Text style={styles.areaDescription}>{area.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // Step 4: Bio, Social & Certifications with Tabs
  const renderBioStep = () => (
    <KeyboardAvoidingView 
      style={styles.stepContent}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.bioContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepEmoji}>📝</Text>
          <Text style={styles.stepTitle}>Tell Your Story</Text>
          <Text style={styles.stepSubtitle}>Build trust and attract more customers</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.storyTabContainer}>
          <TouchableOpacity 
            style={[styles.storyTab, activeStoryTab === 'bio' && styles.storyTabActive]}
            onPress={() => setActiveStoryTab('bio')}
          >
            <Ionicons name="person-outline" size={18} color={activeStoryTab === 'bio' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.storyTabText, activeStoryTab === 'bio' && styles.storyTabTextActive]}>Bio</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.storyTab, activeStoryTab === 'social' && styles.storyTabActive]}
            onPress={() => setActiveStoryTab('social')}
          >
            <Ionicons name="share-social-outline" size={18} color={activeStoryTab === 'social' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.storyTabText, activeStoryTab === 'social' && styles.storyTabTextActive]}>Social</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.storyTab, activeStoryTab === 'certifications' && styles.storyTabActive]}
            onPress={() => setActiveStoryTab('certifications')}
          >
            <Ionicons name="ribbon-outline" size={18} color={activeStoryTab === 'certifications' ? COLORS.primary : COLORS.textMuted} />
            <Text style={[styles.storyTabText, activeStoryTab === 'certifications' && styles.storyTabTextActive]}>Certs</Text>
          </TouchableOpacity>
        </View>

        {/* Bio Tab */}
        {activeStoryTab === 'bio' && (
          <View style={styles.tabContent}>
            <View style={styles.bioTipCard}>
              <View style={styles.bioTipHeader}>
                <Ionicons name="bulb" size={20} color={COLORS.primary} />
                <Text style={styles.bioTipTitle}>Why a good bio matters</Text>
              </View>
              <Text style={styles.bioTipText}>
                • Customers are 3x more likely to book professionals with detailed bios{'\n'}
                • Share your unique skills, experience, and what you're passionate about{'\n'}
                • Mention specific services you excel at and any special techniques you use{'\n'}
                • A friendly, professional tone builds instant trust
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>About You</Text>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                placeholder="Hi! I'm a professional with 5+ years of experience. I specialize in deep cleaning and use eco-friendly products. I'm known for my attention to detail and punctuality. I love transforming spaces and leaving customers happy!"
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/500</Text>
            </View>
          </View>
        )}

        {/* Social Links Tab */}
        {activeStoryTab === 'social' && (
          <View style={styles.tabContent}>
            <View style={styles.bioTipCard}>
              <View style={styles.bioTipHeader}>
                <Ionicons name="share-social" size={20} color={COLORS.primary} />
                <Text style={styles.bioTipTitle}>Showcase your work</Text>
              </View>
              <Text style={styles.bioTipText}>
                Link your social profiles to show customers your portfolio, reviews, and previous work. This builds credibility and helps you stand out!
              </Text>
            </View>

            {SOCIAL_PLATFORMS.map((platform) => (
              <View key={platform.id} style={styles.socialInputGroup}>
                <View style={styles.socialLabelRow}>
                  <Ionicons name={platform.icon as any} size={20} color={platform.color} />
                  <Text style={styles.socialLabel}>{platform.name}</Text>
                </View>
                <TextInput
                  style={styles.socialInput}
                  value={socialLinks[platform.id] || ''}
                  onChangeText={(text) => setSocialLinks({...socialLinks, [platform.id]: text})}
                  placeholder={platform.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  keyboardType={platform.id === 'website' ? 'url' : 'default'}
                />
              </View>
            ))}
          </View>
        )}

        {/* Certifications Tab */}
        {activeStoryTab === 'certifications' && (
          <View style={styles.tabContent}>
            <View style={styles.bioTipCard}>
              <View style={styles.bioTipHeader}>
                <Ionicons name="ribbon" size={20} color={COLORS.primary} />
                <Text style={styles.bioTipTitle}>Add your credentials</Text>
              </View>
              <Text style={styles.bioTipText}>
                List any certifications, awards, or achievements that showcase your expertise. Examples:{'\n'}
                • "Certified Electrician - ITI Diploma 2020"{'\n'}
                • "Google Digital Marketing Certificate"{'\n'}
                • "5 Star Rating on Urban Company - 200+ jobs"
              </Text>
            </View>

            {certifications.map((cert, index) => (
              <View key={index} style={styles.certInputGroup}>
                <View style={styles.certInputRow}>
                  <Ionicons name="medal-outline" size={20} color={COLORS.primary} />
                  <TextInput
                    style={styles.certInput}
                    value={cert}
                    onChangeText={(text) => updateCertification(index, text)}
                    placeholder="Enter certification or achievement"
                    placeholderTextColor={COLORS.textMuted}
                  />
                  {certifications.length > 1 && (
                    <TouchableOpacity onPress={() => removeCertification(index)} style={styles.removeCertBtn}>
                      <Ionicons name="close-circle" size={22} color={COLORS.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addCertButton} onPress={addCertification}>
              <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addCertText}>Add Another Certification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>🎉 Your Profile Summary</Text>
          
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
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>₹{hourlyRate || '0'}/hr</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Service Area:</Text>
            <Text style={styles.summaryValue}>
              {SERVICE_AREAS.find(a => a.id === serviceArea)?.label || '-'}
            </Text>
          </View>

          <View style={styles.readyBanner}>
            <Text style={styles.readyText}>✨ Ready to start serving customers!</Text>
          </View>
        </View>
        <View style={{ height: 100 }} />
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
          <Animated.View style={[styles.progressFill, { width: getProgressWidth() as any }]} />
        </View>
        <View style={styles.progressSteps}>
          {['✨', '⭐', '💰', '📝'].map((emoji, index) => (
            <View 
              key={index} 
              style={[
                styles.progressStep, 
                index + 1 <= step && styles.progressStepActive
              ]}
            >
              <Text style={styles.progressStepEmoji}>{emoji}</Text>
            </View>
          ))}
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
          <Text style={styles.actionText}>
            {isSubmitting ? 'Setting up...' : step === 4 ? 'Complete Setup ✨' : 'Continue'}
          </Text>
          {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
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
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...clayShadow,
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
    height: 8,
    backgroundColor: COLORS.cardBorder,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    ...clayShadow,
  },
  progressStepActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
  },
  progressStepEmoji: {
    fontSize: 18,
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
    paddingVertical: 16,
  },
  stepEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  categoryLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    gap: 6,
  },
  categoryLockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Category Styles
  categoriesScroll: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
    ...clayShadow,
  },
  categoryHeaderExpanded: {
    borderColor: COLORS.primary,
  },
  categoryHeaderLocked: {
    opacity: 0.6,
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  categoryTitleLocked: {
    color: COLORS.textMuted,
  },
  categorySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: -2,
  },
  skillCard: {
    width: (SCREEN_WIDTH - 72) / 3,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    alignItems: 'center',
    ...clayShadow,
  },
  skillCardSelected: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  skillCardLocked: {
    opacity: 0.5,
  },
  skillCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  skillName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  skillNameLocked: {
    color: COLORS.textMuted,
  },
  skillDescription: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  selectionBadge: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    ...clayShadow,
  },
  selectionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: COLORS.primary + '15',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Experience Step
  experienceContainer: {
    gap: 12,
    paddingTop: 16,
  },
  experienceCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
    ...clayShadow,
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
  experienceEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  experienceEmoji: {
    fontSize: 28,
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
  experienceRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  experienceCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    gap: 12,
    ...clayShadow,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // Pricing Step
  pricingContainer: {
    paddingTop: 10,
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    ...clayShadow,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.success,
    marginRight: 8,
  },
  rateInput: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 100,
    textAlign: 'center',
  },
  rateLabel: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  ratePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    ...clayShadow,
  },
  presetButtonActive: {
    backgroundColor: COLORS.success + '15',
    borderColor: COLORS.success,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetTextActive: {
    color: COLORS.success,
  },
  earningsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 14,
    ...clayShadow,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.success,
  },
  earningsNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  serviceAreaSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  serviceAreaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  areaCard: {
    width: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    ...clayShadow,
  },
  areaCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  areaEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  areaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  areaLabelSelected: {
    color: COLORS.primary,
  },
  areaDescription: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  // Bio Step
  bioContainer: {
    flex: 1,
    paddingTop: 10,
  },
  storyTabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    ...clayShadow,
  },
  storyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  storyTabActive: {
    backgroundColor: COLORS.primary + '15',
  },
  storyTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  storyTabTextActive: {
    color: COLORS.primary,
  },
  tabContent: {
    marginBottom: 16,
  },
  bioTipCard: {
    backgroundColor: COLORS.primary + '08',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  bioTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  bioTipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bioTipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    ...clayShadow,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  socialInputGroup: {
    marginBottom: 14,
  },
  socialLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  socialInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    ...clayShadow,
  },
  certInputGroup: {
    marginBottom: 12,
  },
  certInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    gap: 10,
    ...clayShadow,
  },
  certInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: COLORS.text,
  },
  removeCertBtn: {
    padding: 4,
  },
  addCertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
  },
  addCertText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginTop: 10,
    ...clayShadow,
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
    paddingVertical: 10,
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
  readyBanner: {
    marginTop: 16,
    backgroundColor: COLORS.success + '15',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  // Bottom Action
  bottomAction: {
    padding: 20,
    paddingBottom: 28,
    backgroundColor: COLORS.background,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
    ...clayShadow,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.cardBorder,
    opacity: 0.6,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
  },
});
