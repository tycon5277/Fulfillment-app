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
  red: '#EF4444',
  orange: '#F97316',
  teal: '#14B8A6',
  indigo: '#6366F1',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  gold: '#FBBF24',
};

// ✨ COMPREHENSIVE SKILL CATEGORIES - The Magic Powers! ✨
const SKILL_CATEGORIES = [
  // 🏠 HOME SERVICES - Everything to make homes shine
  {
    id: 'home_services',
    title: 'Home Services',
    subtitle: 'Make homes sparkle & shine',
    emoji: '🏠',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
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
    gradient: ['#3B82F6', '#2563EB'],
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

  // 🚗 VEHICLE SERVICES
  {
    id: 'vehicle_services',
    title: 'Vehicle Services',
    subtitle: 'Keep vehicles running smooth',
    emoji: '🚗',
    color: '#EF4444',
    gradient: ['#EF4444', '#DC2626'],
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
      { id: 'driver', name: 'Driver on Demand', emoji: '🧑‍✈️', description: 'Personal driver service' },
    ],
  },

  // 💻 TECH SERVICES
  {
    id: 'tech_services',
    title: 'Tech Services',
    subtitle: 'Digital wizardry at your service',
    emoji: '💻',
    color: '#06B6D4',
    gradient: ['#06B6D4', '#0891B2'],
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
    subtitle: 'Green thumbs unite',
    emoji: '🌿',
    color: '#22C55E',
    gradient: ['#22C55E', '#16A34A'],
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
    gradient: ['#EC4899', '#DB2777'],
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
    gradient: ['#F97316', '#EA580C'],
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
    subtitle: 'Share knowledge, inspire minds',
    emoji: '📚',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
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
    gradient: ['#D946EF', '#C026D3'],
    skills: [
      { id: 'dj', name: 'DJ Services', emoji: '🎧', description: 'Music & entertainment' },
      { id: 'event_decor', name: 'Event Decoration', emoji: '🎈', description: 'Party & event decor' },
      { id: 'balloon_decor', name: 'Balloon Decoration', emoji: '🎈', description: 'Balloon arrangements' },
      { id: 'flower_decor', name: 'Flower Decoration', emoji: '💐', description: 'Floral arrangements' },
      { id: 'catering', name: 'Catering', emoji: '🍽️', description: 'Food & beverage service' },
      { id: 'photography', name: 'Photography', emoji: '📸', description: 'Event photography' },
      { id: 'videography', name: 'Videography', emoji: '🎬', description: 'Video production' },
      { id: 'anchor', name: 'Event Anchor', emoji: '🎤', description: 'MC & hosting' },
      { id: 'magic_show', name: 'Magician', emoji: '🪄', description: 'Magic performances' },
      { id: 'clown', name: 'Clown & Entertainer', emoji: '🤡', description: 'Kids entertainment' },
      { id: 'live_music', name: 'Live Music', emoji: '🎸', description: 'Live band & singers' },
      { id: 'standup', name: 'Stand-up Comedy', emoji: '😂', description: 'Comedy performances' },
      { id: 'game_host', name: 'Game Host', emoji: '🎲', description: 'Party games & activities' },
    ],
  },

  // 🍳 CULINARY SERVICES
  {
    id: 'culinary',
    title: 'Culinary Services',
    subtitle: 'Kitchen wizards at work',
    emoji: '🍳',
    color: '#EF4444',
    gradient: ['#F87171', '#EF4444'],
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
    gradient: ['#6366F1', '#4F46E5'],
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
    subtitle: 'Rare talents & mystical arts',
    emoji: '✨',
    color: '#FBBF24',
    gradient: ['#FBBF24', '#F59E0B'],
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
    subtitle: 'Caring hands for loved ones',
    emoji: '👶',
    color: '#14B8A6',
    gradient: ['#14B8A6', '#0D9488'],
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
  { id: 'beginner', label: 'Beginner', years: '0-1 years', emoji: '🌱', color: '#34D399', xpBonus: '1x' },
  { id: 'intermediate', label: 'Intermediate', years: '1-3 years', emoji: '🌿', color: '#3B82F6', xpBonus: '1.5x' },
  { id: 'expert', label: 'Expert', years: '3-5 years', emoji: '🌳', color: '#8B5CF6', xpBonus: '2x' },
  { id: 'master', label: 'Master Genie', years: '5+ years', emoji: '👑', color: '#F59E0B', xpBonus: '3x' },
];

const SERVICE_AREAS = [
  { id: '5km', label: '5 km', description: 'Nearby areas', emoji: '📍' },
  { id: '10km', label: '10 km', description: 'Local city', emoji: '🏙️' },
  { id: '25km', label: '25 km', description: 'Extended area', emoji: '🌆' },
  { id: 'city', label: 'Entire City', description: 'City-wide', emoji: '🗺️' },
];

export default function SkilledSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [serviceArea, setServiceArea] = useState<string>('10km');
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
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
    try {
      await api.registerAgent({
        phone: user?.phone || '',
        agent_type: 'skilled',
        skills: selectedSkills,
        services: [],
        has_vehicle: false,
      });
      
      router.replace('/(main)/skilled-home');
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

  // Step 1: Skills Selection with Categories
  const renderSkillsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepEmoji}>🔮</Text>
        <Text style={styles.stepTitle}>Choose Your Magic Powers</Text>
        <Text style={styles.stepSubtitle}>Select all skills you can offer as a Skilled Genie</Text>
      </View>

      <ScrollView style={styles.categoriesScroll} showsVerticalScrollIndicator={false}>
        {SKILL_CATEGORIES.map((category) => {
          const isExpanded = expandedCategory === category.id;
          const selectedCount = getSelectedSkillsCount(category.id);
          
          return (
            <View key={category.id} style={styles.categorySection}>
              <TouchableOpacity 
                style={[
                  styles.categoryHeader,
                  isExpanded && styles.categoryHeaderExpanded,
                  selectedCount > 0 && { borderColor: category.color }
                ]}
                onPress={() => toggleCategory(category.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isExpanded ? category.gradient : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.categoryGradient}
                >
                  <View style={styles.categoryLeft}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <View>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    {selectedCount > 0 && (
                      <View style={[styles.selectedBadge, { backgroundColor: category.color }]}>
                        <Text style={styles.selectedBadgeText}>{selectedCount}</Text>
                      </View>
                    )}
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={COLORS.textSecondary} 
                    />
                  </View>
                </LinearGradient>
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
                        ]}
                        onPress={() => toggleSkill(skill.id)}
                        activeOpacity={0.8}
                      >
                        {isSelected && (
                          <View style={[styles.skillCheck, { backgroundColor: category.color }]}>
                            <Ionicons name="checkmark" size={10} color="#FFF" />
                          </View>
                        )}
                        <Text style={styles.skillEmoji}>{skill.emoji}</Text>
                        <Text style={[styles.skillName, isSelected && { color: category.color }]}>
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
          <LinearGradient
            colors={[COLORS.primary, COLORS.magenta]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectionGradient}
          >
            <Ionicons name="sparkles" size={16} color="#FFF" />
            <Text style={styles.selectionText}>{selectedSkills.length} power{selectedSkills.length > 1 ? 's' : ''} selected</Text>
          </LinearGradient>
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
                <View style={styles.experienceRightSection}>
                  <View style={[styles.xpBadge, { backgroundColor: level.color + '30' }]}>
                    <Text style={[styles.xpBadgeText, { color: level.color }]}>{level.xpBonus} XP</Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.experienceCheck, { backgroundColor: level.color }]}>
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb" size={20} color={COLORS.amber} />
        <Text style={styles.tipText}>
          Higher experience levels unlock premium requests & earn more XP per job!
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
              placeholder="500"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.rateLabel}>/hour</Text>
          </View>

          <View style={styles.ratePresets}>
            {['300', '500', '800', '1000', '1500', '2000'].map((rate) => (
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

  // Step 4: Bio & Summary
  const renderBioStep = () => (
    <KeyboardAvoidingView 
      style={styles.stepContent}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.bioContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepEmoji}>✨</Text>
          <Text style={styles.stepTitle}>Tell Your Story</Text>
          <Text style={styles.stepSubtitle}>Help customers know you better</Text>
        </View>

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
            <Text style={styles.summaryTitle}>🎉 Your Genie Profile</Text>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Magic Powers:</Text>
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
              <Text style={[styles.summaryValue, { color: COLORS.green }]}>₹{hourlyRate || '0'}/hr</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Service Area:</Text>
              <Text style={styles.summaryValue}>
                {SERVICE_AREAS.find(a => a.id === serviceArea)?.label || '-'}
              </Text>
            </View>

            <View style={styles.readyBanner}>
              <Text style={styles.readyText}>🧞 Ready to grant wishes!</Text>
            </View>
          </LinearGradient>
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
          <Animated.View style={[styles.progressFill, { width: getProgressWidth() as any }]}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.magenta]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressGradient}
            />
          </Animated.View>
        </View>
        <View style={styles.progressSteps}>
          {['🔮', '⭐', '💰', '✨'].map((emoji, index) => (
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
          <LinearGradient
            colors={canProceed() ? [COLORS.primary, COLORS.magenta] : [COLORS.cardBorder, COLORS.cardBorder]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionGradient}
          >
            <Text style={styles.actionText}>
              {isSubmitting ? 'Setting up...' : step === 4 ? 'Start Granting Wishes ✨' : 'Continue'}
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
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  progressStepActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '20',
  },
  progressStepEmoji: {
    fontSize: 16,
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
  // Category Styles
  categoriesScroll: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 12,
  },
  categoryHeader: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.cardBg,
  },
  categoryHeaderExpanded: {
    borderColor: COLORS.primary,
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
  categoryEmoji: {
    fontSize: 28,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
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
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginTop: -2,
  },
  skillCard: {
    width: (SCREEN_WIDTH - 72) / 3,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
    position: 'relative',
    alignItems: 'center',
  },
  skillCardSelected: {
    backgroundColor: COLORS.backgroundSecondary,
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
  },
  selectionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  // Experience Step
  experienceContainer: {
    gap: 12,
    paddingTop: 16,
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
  experienceRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  xpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: COLORS.amber + '15',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    gap: 12,
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    paddingHorizontal: 14,
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
    marginBottom: 24,
  },
  earningsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
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
    color: COLORS.green,
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
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  areaCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
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
    minHeight: 100,
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
    backgroundColor: COLORS.green + '20',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  readyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.green,
  },
  // Bottom Action
  bottomAction: {
    padding: 20,
    paddingBottom: 28,
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
