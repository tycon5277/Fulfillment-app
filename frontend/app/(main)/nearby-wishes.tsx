import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useAuthStore } from '../../src/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Warm Cream Theme for Skilled Genie
const COLORS = {
  background: '#FDF8F3',
  cardBg: '#FFFFFF',
  cardBorder: '#E8DFD5',
  primary: '#D97706',
  secondary: '#F59E0B',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  text: '#44403C',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  border: '#E8DFD5',
};

// =============================================================================
// MOCK ACCEPTED/IN-PROGRESS JOBS (shown when offline)
// =============================================================================
const MY_JOBS = [
  {
    id: 'my_job_1',
    service: 'Kitchen Deep Cleaning',
    category: 'Home Services',
    customer: 'Priya Sharma',
    customerRating: 4.9,
    description: 'Complete kitchen cleaning including chimney and cabinets.',
    budget: '₹1,500',
    budgetMin: 1500,
    budgetMax: 1500,
    location: 'Sector 29, Gurgaon',
    distance: 2.5,
    status: 'in_progress',
    statusLabel: 'In Progress',
    scheduledDate: 'Today, 2:00 PM',
    acceptedAt: '2 hours ago',
  },
  {
    id: 'my_job_2',
    service: 'Full House Cleaning',
    category: 'Home Services',
    customer: 'Amit Kumar',
    customerRating: 4.8,
    description: '3BHK apartment deep cleaning.',
    budget: '₹3,000',
    budgetMin: 3000,
    budgetMax: 3000,
    location: 'DLF Phase 3',
    distance: 4.2,
    status: 'accepted',
    statusLabel: 'Scheduled',
    scheduledDate: 'Tomorrow, 10:00 AM',
    acceptedAt: '1 day ago',
  },
  {
    id: 'my_job_3',
    service: 'Bathroom Renovation Cleaning',
    category: 'Home Services',
    customer: 'Sunita Verma',
    customerRating: 4.7,
    description: 'Post-renovation cleaning for 2 bathrooms.',
    budget: '₹1,200',
    budgetMin: 1200,
    budgetMax: 1200,
    location: 'Sector 56',
    distance: 3.8,
    status: 'completed',
    statusLabel: 'Completed',
    scheduledDate: 'Yesterday',
    acceptedAt: '3 days ago',
    completedAt: 'Yesterday, 4:30 PM',
    earnings: 1200,
  },
  {
    id: 'my_job_4',
    service: 'Office Cleaning',
    category: 'Home Services',
    customer: 'Tech Corp Ltd',
    customerRating: 5.0,
    description: 'Weekly office cleaning service.',
    budget: '₹2,500',
    budgetMin: 2500,
    budgetMax: 2500,
    location: 'Cyber Hub',
    distance: 5.0,
    status: 'completed',
    statusLabel: 'Completed',
    scheduledDate: '2 days ago',
    acceptedAt: '5 days ago',
    completedAt: '2 days ago, 6:00 PM',
    earnings: 2500,
  },
];

// =============================================================================
// COMPREHENSIVE MOCK WISHES - ORGANIZED BY SKILL CATEGORY
// Each wish has 'skillMatch' array that EXACTLY matches skill IDs from skilled-setup.tsx
// =============================================================================

const ALL_WISHES = [
  // ==================== HOME SERVICES (Cleaning) ====================
  // Skills: deep_cleaning, regular_cleaning, kitchen_cleaning, bathroom_cleaning, 
  //         carpet_cleaning, sofa_cleaning, laundry, dishwashing, window_cleaning,
  //         organizing, mattress_cleaning, chimney_cleaning
  {
    id: 'home1',
    service: 'Bathroom Deep Clean',
    category: 'Home Services',
    skillMatch: ['deep_cleaning', 'bathroom_cleaning'],
    customer: 'Amit Kumar',
    customerRating: 4.8,
    description: 'Need thorough cleaning of 2 bathrooms. Tiles, fixtures, and glass.',
    photos: 2,
    budget: '₹800 - ₹1,000',
    budgetMin: 800,
    budgetMax: 1000,
    location: 'Sector 21, Gurgaon',
    distance: 1.2,
    urgent: true,
    postedTime: '5 min ago',
    preferredDate: 'Today',
  },
  {
    id: 'home2',
    service: 'Full House Cleaning',
    category: 'Home Services',
    skillMatch: ['deep_cleaning', 'regular_cleaning', 'kitchen_cleaning', 'bathroom_cleaning'],
    customer: 'Sunita Verma',
    customerRating: 4.9,
    description: '3BHK apartment needs deep cleaning before a family function.',
    photos: 0,
    budget: '₹2,500 - ₹3,500',
    budgetMin: 2500,
    budgetMax: 3500,
    location: 'DLF Phase 3',
    distance: 2.8,
    urgent: false,
    postedTime: '15 min ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'home3',
    service: 'Kitchen Deep Clean',
    category: 'Home Services',
    skillMatch: ['kitchen_cleaning', 'chimney_cleaning', 'deep_cleaning'],
    customer: 'Priya Patel',
    customerRating: 4.7,
    description: 'Kitchen cleaning including chimney, cabinets, and appliances.',
    photos: 1,
    budget: '₹1,200 - ₹1,500',
    budgetMin: 1200,
    budgetMax: 1500,
    location: 'Cyber Hub',
    distance: 3.5,
    urgent: false,
    postedTime: '32 min ago',
    preferredDate: 'This Week',
  },
  {
    id: 'home4',
    service: 'Sofa & Carpet Cleaning',
    category: 'Home Services',
    skillMatch: ['carpet_cleaning', 'sofa_cleaning'],
    customer: 'Rahul Sharma',
    customerRating: 4.6,
    description: 'Large L-shaped sofa and 2 carpets need professional cleaning.',
    photos: 2,
    budget: '₹1,800 - ₹2,200',
    budgetMin: 1800,
    budgetMax: 2200,
    location: 'Golf Course Road',
    distance: 4.2,
    urgent: true,
    postedTime: '45 min ago',
    preferredDate: 'Today',
  },
  {
    id: 'home5',
    service: 'Window Cleaning - High Rise',
    category: 'Home Services',
    skillMatch: ['window_cleaning', 'deep_cleaning'],
    customer: 'Neha Singh',
    customerRating: 4.5,
    description: '15th floor apartment, all windows need cleaning inside-out.',
    photos: 0,
    budget: '₹1,000 - ₹1,500',
    budgetMin: 1000,
    budgetMax: 1500,
    location: 'Sector 54',
    distance: 5.5,
    urgent: false,
    postedTime: '1 hr ago',
    preferredDate: 'Weekend',
  },
  {
    id: 'home6',
    service: 'Mattress Deep Cleaning',
    category: 'Home Services',
    skillMatch: ['mattress_cleaning', 'deep_cleaning'],
    customer: 'Vikram Joshi',
    customerRating: 4.8,
    description: '3 mattresses need sanitization and stain removal.',
    photos: 1,
    budget: '₹600 - ₹900',
    budgetMin: 600,
    budgetMax: 900,
    location: 'Sector 44',
    distance: 3.8,
    urgent: false,
    postedTime: '2 hrs ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'home7',
    service: 'Laundry & Ironing Service',
    category: 'Home Services',
    skillMatch: ['laundry'],
    customer: 'Meera Kapoor',
    customerRating: 4.7,
    description: 'Weekly laundry service needed. 15-20 clothes per week.',
    photos: 0,
    budget: '₹400 - ₹600',
    budgetMin: 400,
    budgetMax: 600,
    location: 'Sector 29',
    distance: 2.2,
    urgent: false,
    postedTime: '3 hrs ago',
    preferredDate: 'Ongoing',
  },

  // ==================== REPAIR & MAINTENANCE ====================
  // Skills: plumbing, electrical, carpentry, painting, ac_repair, refrigerator,
  //         washing_machine, tv_repair, microwave, geyser, fan_repair, inverter,
  //         furniture_assembly, door_lock, waterproofing
  {
    id: 'repair1',
    service: 'Plumbing - Leak Repair',
    category: 'Repair & Maintenance',
    skillMatch: ['plumbing'],
    customer: 'Vikram Singh',
    customerRating: 4.5,
    description: 'Kitchen sink is leaking badly. Need urgent repair.',
    photos: 1,
    budget: '₹400 - ₹600',
    budgetMin: 400,
    budgetMax: 600,
    location: 'Sector 15',
    distance: 1.8,
    urgent: true,
    postedTime: '10 min ago',
    preferredDate: 'Today',
  },
  {
    id: 'repair2',
    service: 'AC Service & Gas Refill',
    category: 'Repair & Maintenance',
    skillMatch: ['ac_repair'],
    customer: 'Meera Reddy',
    customerRating: 4.7,
    description: 'Split AC not cooling properly. Might need gas refill.',
    photos: 0,
    budget: '₹1,500 - ₹2,500',
    budgetMin: 1500,
    budgetMax: 2500,
    location: 'Sector 49',
    distance: 3.2,
    urgent: false,
    postedTime: '1 hr ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'repair3',
    service: 'Electrical Wiring Repair',
    category: 'Repair & Maintenance',
    skillMatch: ['electrical'],
    customer: 'Anand Kapoor',
    customerRating: 4.8,
    description: 'Multiple switches not working in bedroom. Need rewiring.',
    photos: 1,
    budget: '₹800 - ₹1,200',
    budgetMin: 800,
    budgetMax: 1200,
    location: 'MG Road',
    distance: 2.5,
    urgent: false,
    postedTime: '2 hrs ago',
    preferredDate: 'This Week',
  },
  {
    id: 'repair4',
    service: 'Refrigerator Repair',
    category: 'Repair & Maintenance',
    skillMatch: ['refrigerator'],
    customer: 'Sanjay Gupta',
    customerRating: 4.6,
    description: 'Samsung refrigerator not cooling. Compressor might be faulty.',
    photos: 0,
    budget: '₹1,000 - ₹2,000',
    budgetMin: 1000,
    budgetMax: 2000,
    location: 'Sector 56',
    distance: 4.5,
    urgent: true,
    postedTime: '30 min ago',
    preferredDate: 'Today',
  },
  {
    id: 'repair5',
    service: 'Carpentry - Wardrobe Repair',
    category: 'Repair & Maintenance',
    skillMatch: ['carpentry', 'furniture_assembly'],
    customer: 'Neha Sharma',
    customerRating: 4.9,
    description: 'Wardrobe door hinges broken. Need to replace and fix alignment.',
    photos: 2,
    budget: '₹600 - ₹1,000',
    budgetMin: 600,
    budgetMax: 1000,
    location: 'Sushant Lok',
    distance: 3.8,
    urgent: false,
    postedTime: '3 hrs ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'repair6',
    service: 'Washing Machine Repair',
    category: 'Repair & Maintenance',
    skillMatch: ['washing_machine'],
    customer: 'Priya Mehta',
    customerRating: 4.7,
    description: 'IFB washing machine not spinning. Water not draining.',
    photos: 0,
    budget: '₹800 - ₹1,500',
    budgetMin: 800,
    budgetMax: 1500,
    location: 'Sector 43',
    distance: 2.9,
    urgent: true,
    postedTime: '20 min ago',
    preferredDate: 'Today',
  },
  {
    id: 'repair7',
    service: 'Geyser Installation',
    category: 'Repair & Maintenance',
    skillMatch: ['geyser', 'plumbing'],
    customer: 'Rohit Verma',
    customerRating: 4.6,
    description: 'New geyser needs installation in bathroom.',
    photos: 1,
    budget: '₹500 - ₹800',
    budgetMin: 500,
    budgetMax: 800,
    location: 'Sector 52',
    distance: 4.0,
    urgent: false,
    postedTime: '4 hrs ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'repair8',
    service: 'Interior Painting - 2BHK',
    category: 'Repair & Maintenance',
    skillMatch: ['painting'],
    customer: 'Anjali Choudhary',
    customerRating: 4.8,
    description: 'Complete interior painting of 2BHK apartment. Asian Paints preferred.',
    photos: 0,
    budget: '₹15,000 - ₹25,000',
    budgetMin: 15000,
    budgetMax: 25000,
    location: 'Sector 62',
    distance: 6.5,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Next Week',
  },

  // ==================== DRIVER ON DEMAND ====================
  // Skills: personal_driver, outstation_driver, corporate_driver, airport_transfer,
  //         night_driver, wedding_driver, vip_driver, female_driver, elderly_driver, medical_transport
  {
    id: 'driver1',
    service: 'Full Day Driver Needed',
    category: 'Driver Services',
    skillMatch: ['personal_driver', 'corporate_driver', 'vip_driver'],
    customer: 'Rajesh Malhotra',
    customerRating: 4.9,
    description: 'Need a driver for full day. Multiple errands across Delhi NCR.',
    photos: 0,
    budget: '₹1,500 - ₹2,000',
    budgetMin: 1500,
    budgetMax: 2000,
    location: 'Connaught Place',
    distance: 8.5,
    urgent: false,
    postedTime: '1 hr ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'driver2',
    service: 'Airport Drop - IGI T3',
    category: 'Driver Services',
    skillMatch: ['personal_driver', 'airport_transfer', 'night_driver'],
    customer: 'Kavita Joshi',
    customerRating: 4.7,
    description: 'Early morning airport drop at 4 AM. Flight at 6:30 AM.',
    photos: 0,
    budget: '₹800 - ₹1,200',
    budgetMin: 800,
    budgetMax: 1200,
    location: 'Sector 44',
    distance: 5.2,
    urgent: true,
    postedTime: '20 min ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'driver3',
    service: 'Outstation Trip - Jaipur',
    category: 'Driver Services',
    skillMatch: ['outstation_driver', 'personal_driver'],
    customer: 'Arun Mehta',
    customerRating: 4.8,
    description: '2-day trip to Jaipur. Comfortable driving, experienced driver.',
    photos: 0,
    budget: '₹4,000 - ₹5,000',
    budgetMin: 4000,
    budgetMax: 5000,
    location: 'South Delhi',
    distance: 12.5,
    urgent: false,
    postedTime: '5 hrs ago',
    preferredDate: 'Weekend',
  },
  {
    id: 'driver4',
    service: 'Wedding Chauffeur Service',
    category: 'Driver Services',
    skillMatch: ['wedding_driver', 'vip_driver'],
    customer: 'Kapoor Family',
    customerRating: 4.9,
    description: 'Need professional chauffeur for wedding day. Multiple trips.',
    photos: 0,
    budget: '₹3,000 - ₹4,000',
    budgetMin: 3000,
    budgetMax: 4000,
    location: 'Chattarpur',
    distance: 9.8,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'Feb 20',
  },
  {
    id: 'driver5',
    service: 'Female Driver for Daily Commute',
    category: 'Driver Services',
    skillMatch: ['female_driver', 'personal_driver'],
    customer: 'Sneha Malhotra',
    customerRating: 4.6,
    description: 'Need female driver for school pick-drop and office commute.',
    photos: 0,
    budget: '₹15,000 - ₹20,000',
    budgetMin: 15000,
    budgetMax: 20000,
    location: 'Sector 48',
    distance: 4.5,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Monthly',
  },

  // ==================== PHOTOGRAPHY & VIDEOGRAPHY ====================
  // Skills: wedding_photography, portrait_photo, event_photography, product_photography,
  //         fashion_photography, food_photography, real_estate_photo, wedding_video,
  //         corporate_video, music_video, documentary, live_streaming, video_editing, photo_editing
  {
    id: 'photo1',
    service: 'Wedding Photography',
    category: 'Photography',
    skillMatch: ['wedding_photography', 'portrait_photo', 'event_photography'],
    customer: 'Sharma Family',
    customerRating: 4.9,
    description: 'Full day wedding photography. Haldi, Mehendi and Reception.',
    photos: 1,
    budget: '₹25,000 - ₹35,000',
    budgetMin: 25000,
    budgetMax: 35000,
    location: 'Chattarpur',
    distance: 15.0,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'Feb 15',
  },
  {
    id: 'photo2',
    service: 'Product Photography',
    category: 'Photography',
    skillMatch: ['product_photography', 'photo_editing'],
    customer: 'FashionBrand Inc',
    customerRating: 4.8,
    description: '50 product shots for e-commerce website. White background.',
    photos: 0,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Okhla Industrial',
    distance: 10.2,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'This Week',
  },
  {
    id: 'photo3',
    service: 'Corporate Video Shoot',
    category: 'Videography',
    skillMatch: ['corporate_video', 'video_editing'],
    customer: 'TechCorp Solutions',
    customerRating: 4.7,
    description: 'Company profile video. Interview style with B-roll footage.',
    photos: 0,
    budget: '₹15,000 - ₹25,000',
    budgetMin: 15000,
    budgetMax: 25000,
    location: 'Cyber City',
    distance: 6.5,
    urgent: false,
    postedTime: '3 days ago',
    preferredDate: 'Next Week',
  },
  {
    id: 'photo4',
    service: 'Food Photography for Restaurant',
    category: 'Photography',
    skillMatch: ['food_photography', 'product_photography'],
    customer: 'Taste of India Restaurant',
    customerRating: 4.6,
    description: 'Menu photoshoot. 30 dishes need professional photos.',
    photos: 0,
    budget: '₹6,000 - ₹10,000',
    budgetMin: 6000,
    budgetMax: 10000,
    location: 'Sector 29 Market',
    distance: 3.5,
    urgent: false,
    postedTime: '6 hrs ago',
    preferredDate: 'This Week',
  },
  {
    id: 'photo5',
    service: 'Birthday Party Photography',
    category: 'Photography',
    skillMatch: ['event_photography', 'portrait_photo'],
    customer: 'Rahul Birthday',
    customerRating: 4.7,
    description: '5th birthday party photography. 3 hours coverage.',
    photos: 0,
    budget: '₹5,000 - ₹8,000',
    budgetMin: 5000,
    budgetMax: 8000,
    location: 'Sector 50',
    distance: 4.8,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Saturday',
  },

  // ==================== DRONE SERVICES ====================
  // Skills: drone_photography, drone_videography, drone_wedding, drone_survey,
  //         drone_inspection, drone_events, drone_real_estate, fpv_drone, drone_agriculture, drone_delivery
  {
    id: 'drone1',
    service: 'Wedding Drone Coverage',
    category: 'Drone Services',
    skillMatch: ['drone_photography', 'drone_videography', 'drone_wedding'],
    customer: 'Kapoor Wedding',
    customerRating: 4.9,
    description: 'Aerial shots and cinematic drone video for wedding ceremony.',
    photos: 1,
    budget: '₹15,000 - ₹25,000',
    budgetMin: 15000,
    budgetMax: 25000,
    location: 'Gurugram Farmhouse',
    distance: 8.5,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Feb 20',
  },
  {
    id: 'drone2',
    service: 'Real Estate Aerial Shots',
    category: 'Drone Services',
    skillMatch: ['drone_photography', 'drone_videography', 'drone_real_estate'],
    customer: 'DLF Builders',
    customerRating: 4.8,
    description: 'Drone video and photos of new residential project for marketing.',
    photos: 0,
    budget: '₹12,000 - ₹18,000',
    budgetMin: 12000,
    budgetMax: 18000,
    location: 'New Gurgaon',
    distance: 12.0,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'This Week',
  },
  {
    id: 'drone3',
    service: 'Event Aerial Coverage',
    category: 'Drone Services',
    skillMatch: ['drone_photography', 'drone_videography', 'drone_events'],
    customer: 'Corporate Event Org',
    customerRating: 4.7,
    description: 'Drone coverage for outdoor corporate event. 500+ attendees.',
    photos: 0,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'India Gate Area',
    distance: 18.0,
    urgent: false,
    postedTime: '4 hrs ago',
    preferredDate: 'Saturday',
  },
  {
    id: 'drone4',
    service: 'Land Survey Drone',
    category: 'Drone Services',
    skillMatch: ['drone_survey', 'drone_photography'],
    customer: 'Agri Farms Ltd',
    customerRating: 4.6,
    description: 'Agricultural land survey using drone. 50 acres plot mapping.',
    photos: 0,
    budget: '₹20,000 - ₹30,000',
    budgetMin: 20000,
    budgetMax: 30000,
    location: 'Sohna',
    distance: 25.0,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Next Week',
  },
  {
    id: 'drone5',
    service: 'Building Inspection Drone',
    category: 'Drone Services',
    skillMatch: ['drone_inspection', 'drone_photography'],
    customer: 'Construction Co',
    customerRating: 4.8,
    description: 'High-rise building facade inspection using drone.',
    photos: 0,
    budget: '₹10,000 - ₹15,000',
    budgetMin: 10000,
    budgetMax: 15000,
    location: 'Sector 65',
    distance: 7.2,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'This Week',
  },

  // ==================== WELLNESS & BEAUTY ====================
  // Skills: massage, spa_home, haircut_men, haircut_women, facial, makeup,
  //         mehendi, manicure, waxing, yoga, personal_trainer, physiotherapy, dietician
  {
    id: 'beauty1',
    service: 'Bridal Makeup',
    category: 'Beauty',
    skillMatch: ['makeup', 'haircut_women'],
    customer: 'Priya Bride',
    customerRating: 5.0,
    description: 'Complete bridal makeup for wedding day. HD makeup preferred.',
    photos: 1,
    budget: '₹15,000 - ₹25,000',
    budgetMin: 15000,
    budgetMax: 25000,
    location: 'South City',
    distance: 5.5,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'Feb 14',
  },
  {
    id: 'beauty2',
    service: 'Home Spa Session',
    category: 'Wellness',
    skillMatch: ['massage', 'spa_home', 'facial'],
    customer: 'Anjali Verma',
    customerRating: 4.8,
    description: 'Full body massage and facial at home. Relaxation session.',
    photos: 0,
    budget: '₹2,000 - ₹3,000',
    budgetMin: 2000,
    budgetMax: 3000,
    location: 'Sector 29',
    distance: 3.2,
    urgent: false,
    postedTime: '3 hrs ago',
    preferredDate: 'Today',
  },
  {
    id: 'beauty3',
    service: 'Mehendi for Wedding',
    category: 'Beauty',
    skillMatch: ['mehendi'],
    customer: 'Gupta Family',
    customerRating: 4.9,
    description: 'Bridal mehendi for bride and 10 family members.',
    photos: 1,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Rajouri Garden',
    distance: 15.0,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Feb 13',
  },
  {
    id: 'beauty4',
    service: 'Yoga Sessions at Home',
    category: 'Wellness',
    skillMatch: ['yoga'],
    customer: 'Sunita Malhotra',
    customerRating: 4.7,
    description: 'Weekly yoga sessions at home. Beginner level.',
    photos: 0,
    budget: '₹3,000 - ₹5,000',
    budgetMin: 3000,
    budgetMax: 5000,
    location: 'Sector 42',
    distance: 4.0,
    urgent: false,
    postedTime: '6 hrs ago',
    preferredDate: 'Weekly',
  },
  {
    id: 'beauty5',
    service: 'Personal Trainer - Weight Loss',
    category: 'Wellness',
    skillMatch: ['personal_trainer'],
    customer: 'Ravi Kumar',
    customerRating: 4.6,
    description: 'Looking for personal trainer for weight loss program. Home visits.',
    photos: 0,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Sector 55',
    distance: 5.8,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Monthly',
  },

  // ==================== PET SERVICES ====================
  // Skills: pet_grooming, dog_walking, pet_sitting, pet_boarding, pet_training, vet_visit, aquarium, bird_care
  {
    id: 'pet1',
    service: 'Dog Grooming at Home',
    category: 'Pet Services',
    skillMatch: ['pet_grooming'],
    customer: 'Rohit Saxena',
    customerRating: 4.8,
    description: 'Golden Retriever needs full grooming - bath, hair cut, nail trim.',
    photos: 1,
    budget: '₹1,200 - ₹1,800',
    budgetMin: 1200,
    budgetMax: 1800,
    location: 'Sector 50',
    distance: 4.8,
    urgent: false,
    postedTime: '2 hrs ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'pet2',
    service: 'Pet Sitting - 3 Days',
    category: 'Pet Services',
    skillMatch: ['pet_sitting', 'pet_boarding'],
    customer: 'Sneha Malik',
    customerRating: 4.7,
    description: 'Need someone to take care of my cat for 3 days while I travel.',
    photos: 0,
    budget: '₹2,000 - ₹3,000',
    budgetMin: 2000,
    budgetMax: 3000,
    location: 'Sector 47',
    distance: 3.5,
    urgent: true,
    postedTime: '1 hr ago',
    preferredDate: 'Starting Friday',
  },
  {
    id: 'pet3',
    service: 'Daily Dog Walking',
    category: 'Pet Services',
    skillMatch: ['dog_walking'],
    customer: 'Ankit Sharma',
    customerRating: 4.5,
    description: 'Need dog walker for morning and evening walks. Labrador.',
    photos: 0,
    budget: '₹3,000 - ₹4,000',
    budgetMin: 3000,
    budgetMax: 4000,
    location: 'Sector 31',
    distance: 2.8,
    urgent: false,
    postedTime: '5 hrs ago',
    preferredDate: 'Monthly',
  },

  // ==================== TECH SERVICES ====================
  // Skills: computer_repair, phone_repair, tablet_repair, data_recovery, virus_removal,
  //         software_install, networking, smart_home, cctv, printer, gaming_setup, website
  {
    id: 'tech1',
    service: 'Laptop Repair - Not Starting',
    category: 'Tech Services',
    skillMatch: ['computer_repair'],
    customer: 'Amit Choudhary',
    customerRating: 4.6,
    description: 'HP laptop not turning on. Might be motherboard issue.',
    photos: 0,
    budget: '₹1,500 - ₹3,000',
    budgetMin: 1500,
    budgetMax: 3000,
    location: 'Sector 14',
    distance: 2.2,
    urgent: true,
    postedTime: '30 min ago',
    preferredDate: 'Today',
  },
  {
    id: 'tech2',
    service: 'CCTV Installation - Home',
    category: 'Tech Services',
    skillMatch: ['cctv', 'networking'],
    customer: 'Security Conscious',
    customerRating: 4.8,
    description: '4 camera CCTV system installation with mobile app access.',
    photos: 0,
    budget: '₹8,000 - ₹15,000',
    budgetMin: 8000,
    budgetMax: 15000,
    location: 'Sector 57',
    distance: 6.0,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'This Week',
  },
  {
    id: 'tech3',
    service: 'WiFi Network Setup',
    category: 'Tech Services',
    skillMatch: ['networking'],
    customer: 'Home Office User',
    customerRating: 4.5,
    description: 'Mesh WiFi setup for 3-floor house. Need good coverage.',
    photos: 0,
    budget: '₹2,000 - ₹4,000',
    budgetMin: 2000,
    budgetMax: 4000,
    location: 'Sector 46',
    distance: 4.2,
    urgent: false,
    postedTime: '8 hrs ago',
    preferredDate: 'Weekend',
  },
  {
    id: 'tech4',
    service: 'Smart Home Setup',
    category: 'Tech Services',
    skillMatch: ['smart_home', 'networking'],
    customer: 'Tech Enthusiast',
    customerRating: 4.9,
    description: 'Alexa-based smart home setup. Lights, AC, curtains automation.',
    photos: 0,
    budget: '₹5,000 - ₹10,000',
    budgetMin: 5000,
    budgetMax: 10000,
    location: 'DLF Phase 5',
    distance: 7.5,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'Next Week',
  },

  // ==================== EDUCATION & TUTORING ====================
  // Skills: math_tutor, science_tutor, english_tutor, hindi_tutor, coding_tutor,
  //         music_lessons, art_lessons, dance_lessons, foreign_lang, exam_prep, nursery_teach, special_needs
  {
    id: 'edu1',
    service: 'Math Tutor for Class 10',
    category: 'Education',
    skillMatch: ['math_tutor', 'exam_prep'],
    customer: 'Parent - Vinay Khanna',
    customerRating: 4.9,
    description: 'Need tutor for Class 10 math. Board exam preparation.',
    photos: 0,
    budget: '₹800 - ₹1,200',
    budgetMin: 800,
    budgetMax: 1200,
    location: 'Sector 15',
    distance: 2.5,
    urgent: false,
    postedTime: '4 hrs ago',
    preferredDate: 'Ongoing',
  },
  {
    id: 'edu2',
    service: 'Guitar Lessons at Home',
    category: 'Education',
    skillMatch: ['music_lessons'],
    customer: 'Teenage Student',
    customerRating: 4.6,
    description: 'Beginner guitar lessons for 15-year-old. Acoustic guitar.',
    photos: 0,
    budget: '₹600 - ₹1,000',
    budgetMin: 600,
    budgetMax: 1000,
    location: 'DLF Phase 1',
    distance: 5.8,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Weekends',
  },
  {
    id: 'edu3',
    service: 'Coding Classes for Kids',
    category: 'Education',
    skillMatch: ['coding_tutor'],
    customer: 'Parent - Tech Dad',
    customerRating: 4.7,
    description: 'Python and Scratch programming for 12-year-old.',
    photos: 0,
    budget: '₹1,500 - ₹2,500',
    budgetMin: 1500,
    budgetMax: 2500,
    location: 'Sector 40',
    distance: 3.5,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'Weekly',
  },
  {
    id: 'edu4',
    service: 'Dance Classes - Kathak',
    category: 'Education',
    skillMatch: ['dance_lessons'],
    customer: 'Dance Enthusiast',
    customerRating: 4.8,
    description: 'Classical Kathak dance lessons at home. Beginner.',
    photos: 0,
    budget: '₹1,000 - ₹1,500',
    budgetMin: 1000,
    budgetMax: 1500,
    location: 'Sector 28',
    distance: 2.9,
    urgent: false,
    postedTime: '3 days ago',
    preferredDate: 'Weekends',
  },

  // ==================== EVENTS & ENTERTAINMENT ====================
  // Skills: dj, event_decor, balloon_decor, flower_decor, catering, anchor,
  //         magic_show, clown, live_music, standup, game_host, puppet_show
  {
    id: 'event1',
    service: 'DJ for Birthday Party',
    category: 'Events',
    skillMatch: ['dj', 'live_music'],
    customer: 'Birthday Host',
    customerRating: 4.8,
    description: '50th birthday party. 4 hours of music, 50 guests.',
    photos: 0,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Sector 31 Farmhouse',
    distance: 7.5,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'Saturday',
  },
  {
    id: 'event2',
    service: 'Balloon & Flower Decoration',
    category: 'Events',
    skillMatch: ['balloon_decor', 'flower_decor', 'event_decor'],
    customer: 'Baby Shower Host',
    customerRating: 4.9,
    description: 'Baby shower decoration. Theme: Pastel colors. Balloons + flowers.',
    photos: 1,
    budget: '₹5,000 - ₹8,000',
    budgetMin: 5000,
    budgetMax: 8000,
    location: 'Golf Course Extension',
    distance: 6.2,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Sunday',
  },
  {
    id: 'event3',
    service: 'Event Anchor / MC',
    category: 'Events',
    skillMatch: ['anchor'],
    customer: 'Corporate Event',
    customerRating: 4.7,
    description: 'Need professional MC for product launch event. Bilingual.',
    photos: 0,
    budget: '₹10,000 - ₹15,000',
    budgetMin: 10000,
    budgetMax: 15000,
    location: 'Cyber Hub',
    distance: 5.0,
    urgent: false,
    postedTime: '3 days ago',
    preferredDate: 'Feb 25',
  },
  {
    id: 'event4',
    service: 'Kids Party - Magic Show',
    category: 'Events',
    skillMatch: ['magic_show', 'clown'],
    customer: 'Kids Birthday',
    customerRating: 4.6,
    description: 'Magic show for 6-year-old birthday party. 1.5 hours.',
    photos: 0,
    budget: '₹3,000 - ₹5,000',
    budgetMin: 3000,
    budgetMax: 5000,
    location: 'Sector 22',
    distance: 3.0,
    urgent: false,
    postedTime: '5 hrs ago',
    preferredDate: 'Sunday',
  },

  // ==================== VEHICLE SERVICES ====================
  // Skills: car_wash, car_detailing, bike_wash, car_service, bike_repair,
  //         puncture, battery_service, denting_painting, car_polish, ac_service_car
  {
    id: 'vehicle1',
    service: 'Premium Car Detailing',
    category: 'Vehicle Services',
    skillMatch: ['car_detailing', 'car_wash', 'car_polish'],
    customer: 'BMW Owner',
    customerRating: 4.9,
    description: 'Full interior and exterior detailing for BMW 5 series.',
    photos: 0,
    budget: '₹3,000 - ₹5,000',
    budgetMin: 3000,
    budgetMax: 5000,
    location: 'Sector 54',
    distance: 4.5,
    urgent: false,
    postedTime: '6 hrs ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'vehicle2',
    service: 'Bike Service at Home',
    category: 'Vehicle Services',
    skillMatch: ['bike_repair', 'car_service'],
    customer: 'Biker',
    customerRating: 4.5,
    description: 'Royal Enfield needs general service. Oil change, chain service.',
    photos: 0,
    budget: '₹800 - ₹1,200',
    budgetMin: 800,
    budgetMax: 1200,
    location: 'Sector 37',
    distance: 3.2,
    urgent: false,
    postedTime: '2 hrs ago',
    preferredDate: 'Today',
  },

  // ==================== GARDEN & OUTDOOR ====================
  // Skills: gardening, lawn_mowing, tree_trimming, landscaping, pest_control,
  //         termite, tank_cleaning, solar_cleaning, terrace_garden, irrigation
  {
    id: 'garden1',
    service: 'Garden Maintenance',
    category: 'Garden Services',
    skillMatch: ['gardening', 'lawn_mowing', 'tree_trimming'],
    customer: 'Villa Owner',
    customerRating: 4.8,
    description: 'Monthly garden maintenance. Lawn mowing, plant care, trimming.',
    photos: 1,
    budget: '₹2,000 - ₹3,000',
    budgetMin: 2000,
    budgetMax: 3000,
    location: 'DLF Phase 2',
    distance: 5.5,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'Monthly',
  },
  {
    id: 'garden2',
    service: 'Pest Control - Full House',
    category: 'Garden Services',
    skillMatch: ['pest_control', 'termite'],
    customer: 'Home Owner',
    customerRating: 4.6,
    description: 'Complete pest control for 3BHK. Cockroach and ant treatment.',
    photos: 0,
    budget: '₹1,500 - ₹2,500',
    budgetMin: 1500,
    budgetMax: 2500,
    location: 'Sector 43',
    distance: 3.8,
    urgent: true,
    postedTime: '4 hrs ago',
    preferredDate: 'Tomorrow',
  },
  {
    id: 'garden3',
    service: 'Water Tank Cleaning',
    category: 'Garden Services',
    skillMatch: ['tank_cleaning'],
    customer: 'Apartment Society',
    customerRating: 4.7,
    description: 'Underground water tank cleaning. 10,000 liters capacity.',
    photos: 0,
    budget: '₹3,000 - ₹5,000',
    budgetMin: 3000,
    budgetMax: 5000,
    location: 'Sector 52',
    distance: 4.2,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'This Week',
  },

  // ==================== CARE SERVICES ====================
  // Skills: babysitting, nanny, elder_care, nurse_care, companion, patient_attendant, new_mom
  {
    id: 'care1',
    service: 'Babysitter for Evening',
    category: 'Care Services',
    skillMatch: ['babysitting', 'nanny'],
    customer: 'Working Parents',
    customerRating: 4.8,
    description: 'Need babysitter for 3-year-old. Evening 5-9 PM.',
    photos: 0,
    budget: '₹500 - ₹800',
    budgetMin: 500,
    budgetMax: 800,
    location: 'Sector 45',
    distance: 3.5,
    urgent: true,
    postedTime: '1 hr ago',
    preferredDate: 'Today',
  },
  {
    id: 'care2',
    service: 'Elder Care - Daily Visit',
    category: 'Care Services',
    skillMatch: ['elder_care', 'companion'],
    customer: 'Son of Patient',
    customerRating: 4.9,
    description: 'Daily 4-hour visit for elderly mother. Light care and company.',
    photos: 0,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Sector 30',
    distance: 2.8,
    urgent: false,
    postedTime: '2 days ago',
    preferredDate: 'Monthly',
  },

  // ==================== CULINARY SERVICES ====================
  // Skills: home_cook, party_cook, baking, tiffin, bbq, bartending, diet_meal, ethnic_cuisine
  {
    id: 'cul1',
    service: 'Daily Home Cooking',
    category: 'Culinary Services',
    skillMatch: ['home_cook', 'ethnic_cuisine'],
    customer: 'Working Couple',
    customerRating: 4.8,
    description: 'Need home cook for daily lunch and dinner. North Indian cuisine preferred.',
    photos: 0,
    budget: '₹8,000 - ₹12,000/month',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'DLF Phase 2',
    distance: 2.5,
    urgent: true,
    postedTime: '10 min ago',
    preferredDate: 'Starting Today',
  },
  {
    id: 'cul2',
    service: 'Tiffin Service for Office',
    category: 'Culinary Services',
    skillMatch: ['tiffin', 'home_cook', 'diet_meal'],
    customer: 'Office Manager',
    customerRating: 4.9,
    description: 'Daily tiffin for 15 employees. Vegetarian and non-veg options needed.',
    photos: 1,
    budget: '₹4,500 - ₹6,000/day',
    budgetMin: 4500,
    budgetMax: 6000,
    location: 'Cyber Hub',
    distance: 3.2,
    urgent: false,
    postedTime: '30 min ago',
    preferredDate: 'Weekly Contract',
  },
  {
    id: 'cul3',
    service: 'Birthday Party Cooking',
    category: 'Culinary Services',
    skillMatch: ['party_cook', 'home_cook', 'ethnic_cuisine'],
    customer: 'Birthday Host',
    customerRating: 4.7,
    description: 'Cooking for 50 guests. Multi-cuisine menu for birthday celebration.',
    photos: 2,
    budget: '₹15,000 - ₹20,000',
    budgetMin: 15000,
    budgetMax: 20000,
    location: 'Sector 31 Farmhouse',
    distance: 5.5,
    urgent: false,
    postedTime: '1 hr ago',
    preferredDate: 'This Saturday',
  },
  {
    id: 'cul4',
    service: 'BBQ Night Chef',
    category: 'Culinary Services',
    skillMatch: ['bbq', 'party_cook'],
    customer: 'House Party Host',
    customerRating: 4.8,
    description: 'BBQ specialist needed for house party. 20 guests, bring your own grill.',
    photos: 0,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'Sector 50',
    distance: 4.0,
    urgent: true,
    postedTime: '45 min ago',
    preferredDate: 'Sunday Evening',
  },
  {
    id: 'cul5',
    service: 'Custom Birthday Cake',
    category: 'Culinary Services',
    skillMatch: ['baking'],
    customer: "Child's Parent",
    customerRating: 4.9,
    description: '3-tier unicorn theme cake for 6 year old. Eggless required.',
    photos: 3,
    budget: '₹3,000 - ₹5,000',
    budgetMin: 3000,
    budgetMax: 5000,
    location: 'Golf Course Road',
    distance: 3.8,
    urgent: false,
    postedTime: '2 hrs ago',
    preferredDate: 'Next Weekend',
  },
  {
    id: 'cul6',
    service: 'Diet Meal Prep Weekly',
    category: 'Culinary Services',
    skillMatch: ['diet_meal', 'home_cook'],
    customer: 'Fitness Enthusiast',
    customerRating: 4.8,
    description: 'Weekly meal prep - high protein, low carb. 5 days, 3 meals each.',
    photos: 0,
    budget: '₹4,000 - ₹5,500/week',
    budgetMin: 4000,
    budgetMax: 5500,
    location: 'Sector 29',
    distance: 2.2,
    urgent: false,
    postedTime: '3 hrs ago',
    preferredDate: 'Every Sunday',
  },
  {
    id: 'cul7',
    service: 'South Indian Breakfast Cook',
    category: 'Culinary Services',
    skillMatch: ['ethnic_cuisine', 'home_cook'],
    customer: 'South Indian Family',
    customerRating: 4.9,
    description: 'Morning cook for traditional South Indian breakfast. 6-9 AM daily.',
    photos: 0,
    budget: '₹10,000 - ₹12,000/month',
    budgetMin: 10000,
    budgetMax: 12000,
    location: 'Sector 57',
    distance: 4.5,
    urgent: true,
    postedTime: '1 hr ago',
    preferredDate: 'Starting Tomorrow',
  },
  {
    id: 'cul8',
    service: 'Cocktail Party Bartender',
    category: 'Culinary Services',
    skillMatch: ['bartending'],
    customer: 'Corporate Event',
    customerRating: 4.7,
    description: 'Professional bartender for corporate cocktail evening. 4 hours.',
    photos: 1,
    budget: '₹5,000 - ₹8,000',
    budgetMin: 5000,
    budgetMax: 8000,
    location: 'Cyber Hub Amphitheatre',
    distance: 3.0,
    urgent: false,
    postedTime: '5 hrs ago',
    preferredDate: 'Friday Evening',
  },

  // ==================== SHIFTING & LOGISTICS ====================
  // Skills: packers_movers, furniture_moving, office_shifting, loading_unloading, courier_service, storage, junk_removal
  {
    id: 'shift1',
    service: 'Full Home Relocation',
    category: 'Shifting & Logistics',
    skillMatch: ['packers_movers', 'furniture_moving', 'loading_unloading'],
    customer: 'Relocating Family',
    customerRating: 4.8,
    description: '3BHK shifting from Noida to Gurgaon. Full packing needed.',
    photos: 2,
    budget: '₹15,000 - ₹20,000',
    budgetMin: 15000,
    budgetMax: 20000,
    location: 'Noida Sector 75',
    distance: 8.5,
    urgent: false,
    postedTime: '2 hrs ago',
    preferredDate: 'Next Weekend',
  },
  {
    id: 'shift2',
    service: 'Office Furniture Moving',
    category: 'Shifting & Logistics',
    skillMatch: ['office_shifting', 'furniture_moving'],
    customer: 'Startup Company',
    customerRating: 4.9,
    description: 'Moving 20 workstations within same building. Night shift work.',
    photos: 0,
    budget: '₹8,000 - ₹12,000',
    budgetMin: 8000,
    budgetMax: 12000,
    location: 'DLF Cyber City',
    distance: 3.2,
    urgent: true,
    postedTime: '1 hr ago',
    preferredDate: 'This Weekend',
  },

  // ==================== SPECIAL SERVICES ====================
  // Skills: astrology, vastu, tarot, numerology, pandit, wedding_priest, interior_consult, feng_shui
  {
    id: 'spec1',
    service: 'Griha Pravesh Puja',
    category: 'Special Services',
    skillMatch: ['pandit', 'wedding_priest'],
    customer: 'New Home Owner',
    customerRating: 4.9,
    description: 'Pandit needed for Griha Pravesh ceremony. Morning muhurat.',
    photos: 0,
    budget: '₹5,100 - ₹7,100',
    budgetMin: 5100,
    budgetMax: 7100,
    location: 'Sector 65',
    distance: 5.0,
    urgent: false,
    postedTime: '4 hrs ago',
    preferredDate: 'Auspicious Date',
  },
  {
    id: 'spec2',
    service: 'Vastu Consultation',
    category: 'Special Services',
    skillMatch: ['vastu', 'feng_shui'],
    customer: 'New Office Setup',
    customerRating: 4.8,
    description: 'Vastu consultation for new office space. 2000 sq ft.',
    photos: 1,
    budget: '₹3,000 - ₹5,000',
    budgetMin: 3000,
    budgetMax: 5000,
    location: 'Sector 44',
    distance: 4.2,
    urgent: false,
    postedTime: '1 day ago',
    preferredDate: 'This Week',
  },
];

export default function NearbyWishesScreen() {
  const router = useRouter();
  const { user, isOnline } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useState(5);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState<'distance' | 'budget' | 'time'>('distance');
  const [jobFilter, setJobFilter] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Get user's skills - memoized to prevent unnecessary recalculations
  const userSkills = useMemo(() => {
    const skills = user?.agent_skills || [];
    console.log('🎯 User Skills:', JSON.stringify(skills));
    console.log('👤 Full user state:', {
      partner_type: user?.partner_type,
      agent_type: user?.agent_type,
      skills_count: skills.length,
      user_id: user?.user_id
    });
    return skills;
  }, [user?.agent_skills, user?.partner_type, user?.agent_type, user?.user_id]);

  // Filter MY JOBS (accepted/completed) for offline mode
  const myJobs = useMemo(() => {
    if (jobFilter === 'all') return MY_JOBS;
    return MY_JOBS.filter(job => {
      if (jobFilter === 'in_progress') return job.status === 'in_progress' || job.status === 'accepted';
      if (jobFilter === 'completed') return job.status === 'completed';
      return true;
    });
  }, [jobFilter]);

  // Filter wishes based on user's skills (only for ONLINE mode)
  const filteredWishes = useMemo(() => {
    // If offline, don't show available wishes
    if (!isOnline) {
      console.log('🔴 OFFLINE - not showing available wishes');
      return [];
    }
    
    console.log('🟢 ONLINE - Filtering wishes...');
    console.log('  - User has', userSkills.length, 'skills:', userSkills);
    console.log('  - Radius:', radius, 'km');
    
    // If user has no skills, show nothing
    if (!userSkills || userSkills.length === 0) {
      console.log('  ❌ No skills - returning empty');
      return [];
    }

    const filtered = ALL_WISHES.filter(wish => {
      // Check if within radius first
      const withinRadius = wish.distance <= radius;
      if (!withinRadius) return false;
      
      // Check if any of the user's skills match the wish's skill requirements
      const skillsMatch = wish.skillMatch.some(requiredSkill => 
        userSkills.includes(requiredSkill)
      );
      
      if (skillsMatch) {
        console.log(`  ✅ MATCH: "${wish.service}" (skills: ${wish.skillMatch.join(', ')})`);
      }
      
      return skillsMatch;
    });

    // Sort
    const sorted = filtered.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'budget') return b.budgetMax - a.budgetMax;
      return 0;
    });

    console.log(`  📊 Found ${sorted.length} matching wishes`);
    return sorted;
  }, [userSkills, radius, sortBy, isOnline]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleExpandRadius = useCallback(() => {
    setRadius(10);
  }, []);

  // Render empty state with user's skills
  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No Matching Wishes</Text>
      <Text style={styles.emptyText}>
        {radius < 10 
          ? `No wishes within ${radius}km match your skills. Try increasing the radius.`
          : `No wishes currently available for your registered skills in this area.`
        }
      </Text>
      {userSkills.length > 0 && (
        <View style={styles.skillsHint}>
          <Text style={styles.skillsHintLabel}>Your skills:</Text>
          <Text style={styles.skillsHintText}>
            {userSkills.slice(0, 3).map(s => s.replace(/_/g, ' ')).join(', ')}
            {userSkills.length > 3 ? '...' : ''}
          </Text>
        </View>
      )}
      {radius < 10 && (
        <TouchableOpacity style={styles.expandRadiusBtn} onPress={handleExpandRadius}>
          <Ionicons name="expand-outline" size={16} color={COLORS.primary} />
          <Text style={styles.expandRadiusBtnText}>Expand to 10km</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render job card (for offline mode - accepted/completed jobs)
  const renderJobCard = (job: typeof MY_JOBS[0]) => {
    const statusColors = {
      in_progress: { bg: '#FEF3C7', text: '#D97706' },
      accepted: { bg: '#DBEAFE', text: '#2563EB' },
      completed: { bg: '#D1FAE5', text: '#059669' },
    };
    const colors = statusColors[job.status as keyof typeof statusColors] || statusColors.accepted;

    return (
      <TouchableOpacity 
        key={job.id} 
        style={styles.wishCard}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.wishHeader}>
          <View style={styles.wishServiceRow}>
            <Text style={styles.wishService} numberOfLines={1}>{job.service}</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.statusBadgeText, { color: colors.text }]}>{job.statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.wishBudget}>{job.budget}</Text>
        </View>

        {/* Category */}
        <View style={styles.wishMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{job.category}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.wishDescription} numberOfLines={2}>{job.description}</Text>

        {/* Footer */}
        <View style={styles.wishFooter}>
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitial}>{job.customer.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.customerName}>{job.customer}</Text>
              <Text style={styles.customerRating}>⭐ {job.customerRating}</Text>
            </View>
          </View>
          <View style={styles.wishLocation}>
            <View style={styles.distanceRow}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.distanceText}>{job.distance} km</Text>
            </View>
            <Text style={styles.postedTime}>{job.location}</Text>
          </View>
        </View>

        {/* Schedule Date */}
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.dateText}>{job.scheduledDate}</Text>
        </View>

        {/* Earnings for completed jobs */}
        {job.status === 'completed' && job.earnings && (
          <View style={styles.earningsRow}>
            <Ionicons name="cash-outline" size={14} color={COLORS.success} />
            <Text style={styles.earningsText}>Earned: ₹{job.earnings.toLocaleString()}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render offline state (my jobs)
  const renderOfflineContent = () => (
    <View style={styles.offlineContainer}>
      {/* Offline Banner */}
      <View style={styles.offlineBanner}>
        <Ionicons name="wifi-outline" size={24} color="#6B7280" />
        <View style={styles.offlineBannerText}>
          <Text style={styles.offlineTitle}>You're Offline</Text>
          <Text style={styles.offlineSubtitle}>Go online to see new work orders</Text>
        </View>
      </View>

      {/* My Jobs Filter */}
      <View style={styles.jobFilterContainer}>
        <TouchableOpacity 
          style={[styles.jobFilterTab, jobFilter === 'all' && styles.jobFilterTabActive]}
          onPress={() => setJobFilter('all')}
        >
          <Text style={[styles.jobFilterText, jobFilter === 'all' && styles.jobFilterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.jobFilterTab, jobFilter === 'in_progress' && styles.jobFilterTabActive]}
          onPress={() => setJobFilter('in_progress')}
        >
          <Text style={[styles.jobFilterText, jobFilter === 'in_progress' && styles.jobFilterTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.jobFilterTab, jobFilter === 'completed' && styles.jobFilterTabActive]}
          onPress={() => setJobFilter('completed')}
        >
          <Text style={[styles.jobFilterText, jobFilter === 'completed' && styles.jobFilterTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* My Jobs List */}
      {myJobs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No Jobs</Text>
          <Text style={styles.emptyText}>
            {jobFilter === 'completed' 
              ? "You haven't completed any jobs yet."
              : jobFilter === 'in_progress'
              ? "No active jobs at the moment."
              : "No jobs to show. Go online to accept new work orders!"
            }
          </Text>
        </View>
      ) : (
        myJobs.map(renderJobCard)
      )}
    </View>
  );

  // Render wish card
  const renderWishCard = (wish: typeof ALL_WISHES[0]) => (
    <TouchableOpacity 
      key={wish.id} 
      style={styles.wishCard}
      onPress={() => router.push(`/(main)/wish-detail?id=${wish.id}`)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.wishHeader}>
        <View style={styles.wishServiceRow}>
          <Text style={styles.wishService} numberOfLines={1}>{wish.service}</Text>
          {wish.urgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={10} color="#FFF" />
              <Text style={styles.urgentText}>Urgent</Text>
            </View>
          )}
        </View>
        <Text style={styles.wishBudget}>{wish.budget}</Text>
      </View>

      {/* Category & Photos */}
      <View style={styles.wishMeta}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{wish.category}</Text>
        </View>
        {wish.photos > 0 && (
          <View style={styles.photoBadge}>
            <Ionicons name="image" size={12} color={COLORS.textSecondary} />
            <Text style={styles.photoText}>{wish.photos} photo{wish.photos > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.wishDescription} numberOfLines={2}>{wish.description}</Text>

      {/* Footer */}
      <View style={styles.wishFooter}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerInitial}>{wish.customer.charAt(0)}</Text>
          </View>
          <View>
            <Text style={styles.customerName}>{wish.customer}</Text>
            <Text style={styles.customerRating}>⭐ {wish.customerRating}</Text>
          </View>
        </View>
        <View style={styles.wishLocation}>
          <View style={styles.distanceRow}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.distanceText}>{wish.distance} km</Text>
          </View>
          <Text style={styles.postedTime}>{wish.postedTime}</Text>
        </View>
      </View>

      {/* Preferred Date */}
      <View style={styles.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
        <Text style={styles.dateText}>{wish.preferredDate}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isOnline ? '📍 Work Orders' : '📋 My Jobs'}
        </Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusIndicator, isOnline ? styles.statusOnline : styles.statusOffline]}>
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ONLINE MODE: Show Nearby Wishes */}
      {isOnline ? (
        <>
          {/* Radius Control */}
          <View style={styles.radiusControl}>
            <View style={styles.radiusHeader}>
              <Text style={styles.radiusLabel}>Search Radius</Text>
              <View style={styles.radiusValue}>
                <Text style={styles.radiusNumber}>{radius}</Text>
                <Text style={styles.radiusUnit}>km</Text>
              </View>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={radius}
              onValueChange={setRadius}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={COLORS.primary}
            />
            <View style={styles.radiusMarkers}>
              <Text style={styles.radiusMarker}>1km</Text>
              <Text style={styles.radiusMarker}>5km</Text>
              <Text style={styles.radiusMarker}>10km</Text>
            </View>
          </View>

          {/* Results Header */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredWishes.length} wish{filteredWishes.length !== 1 ? 'es' : ''} found
            </Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'distance' && styles.sortBtnActive]}
                onPress={() => setSortBy('distance')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'distance' && styles.sortBtnTextActive]}>Nearest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'budget' && styles.sortBtnActive]}
                onPress={() => setSortBy('budget')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'budget' && styles.sortBtnTextActive]}>Highest ₹</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Wishes List */}
          <ScrollView
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
          >
            {filteredWishes.length === 0 ? renderEmptyState() : filteredWishes.map(renderWishCard)}
            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      ) : (
        /* OFFLINE MODE: Show My Jobs */
        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          {renderOfflineContent()}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 10,
  },
  radiusControl: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  radiusValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  radiusNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  radiusUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  radiusMarker: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortBtnActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sortBtnTextActive: {
    color: COLORS.primary,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  skillsHint: {
    marginTop: 16,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  skillsHintLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillsHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  expandRadiusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  expandRadiusBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  wishCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  wishServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  wishService: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flexShrink: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  wishBudget: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
    flexShrink: 0,
  },
  wishMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  photoText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  wishDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  wishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  customerRating: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  wishLocation: {
    alignItems: 'flex-end',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  postedTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
