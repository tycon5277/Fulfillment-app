import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PartnerType = 'agent' | 'vendor' | 'promoter' | null;

// Location types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  addresses?: any[];
  
  // Partner fields (all partner types)
  partner_type: PartnerType;
  partner_status: string;  // available, busy, offline
  partner_rating: number;
  partner_total_tasks: number;
  partner_total_earnings: number;
  
  // Agent-specific
  agent_type?: 'mobile' | 'skilled';  // Mobile Genie or Skilled Genie
  agent_vehicle?: string;  // motorbike, scooter, car
  agent_vehicle_registration?: string;
  agent_vehicle_make?: string;
  agent_vehicle_model?: string;
  agent_vehicle_color?: string;
  agent_is_electric?: boolean;
  agent_has_vehicle?: boolean;
  agent_services?: string[];  // delivery, courier, rides, errands, surprise
  agent_skills?: string[];
  agent_rating?: number;
  agent_total_deliveries?: number;
  
  // Vendor-specific
  vendor_shop_name?: string;
  vendor_shop_type?: string;
  vendor_shop_address?: string;
  vendor_shop_location?: { lat: number; lng: number };
  vendor_can_deliver?: boolean;
  vendor_categories?: string[];
  vendor_is_verified?: boolean;
  
  // Promoter-specific
  promoter_business_name?: string;
  promoter_type?: string;  // trip_organizer, event_organizer, service_provider
  promoter_description?: string;
}

export interface PartnerStats {
  partner_type: string;
  total_tasks: number;
  total_earnings: number;
  today_earnings: number;
  rating: number;
  active_count: number;
  status: string;
}

interface ActiveWork {
  type: 'order' | 'wish';
  id: string;
  title: string;
  status: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isUserLoaded: boolean;  // True only after user data has been fetched from server
  stats: PartnerStats | null;
  isOnline: boolean;
  activeWork: ActiveWork[];
  
  // Location state
  currentLocation: LocationData | null;
  locationPermissionGranted: boolean;
  isTrackingLocation: boolean;
  
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsUserLoaded: (loaded: boolean) => void;
  setStats: (stats: PartnerStats | null) => void;
  setIsOnline: (online: boolean) => Promise<void>;
  setActiveWork: (work: ActiveWork[]) => void;
  addActiveWork: (work: ActiveWork) => void;
  removeActiveWork: (id: string) => void;
  
  // Location actions
  setCurrentLocation: (location: LocationData | null) => void;
  setLocationPermissionGranted: (granted: boolean) => void;
  setIsTrackingLocation: (tracking: boolean) => void;
  
  logout: () => void;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionToken: null,
  isLoading: true,
  isUserLoaded: false,  // Start as false
  stats: null,
  activeWork: [],
  isOnline: false,
  
  // Location state
  currentLocation: null,
  locationPermissionGranted: false,
  isTrackingLocation: false,
  
  setUser: (user) => set({ user, isUserLoaded: true }),  // Mark as loaded when user is set
  setSessionToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('session_token', token);
    } else {
      await AsyncStorage.removeItem('session_token');
    }
    set({ sessionToken: token });
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsUserLoaded: (loaded) => set({ isUserLoaded: loaded }),
  setStats: (stats) => set({ stats }),
  setIsOnline: async (online) => {
    // Persist online state to AsyncStorage
    try {
      await AsyncStorage.setItem('is_online', JSON.stringify(online));
    } catch (error) {
      console.error('Error saving online state:', error);
    }
    set({ isOnline: online });
  },
  setActiveWork: (work) => set({ activeWork: work }),
  addActiveWork: (work) => set((state) => ({ activeWork: [...state.activeWork, work] })),
  removeActiveWork: (id) => set((state) => ({ activeWork: state.activeWork.filter(w => w.id !== id) })),
  
  // Location actions
  setCurrentLocation: (location) => set({ currentLocation: location }),
  setLocationPermissionGranted: (granted) => set({ locationPermissionGranted: granted }),
  setIsTrackingLocation: (tracking) => set({ isTrackingLocation: tracking }),
  
  logout: async () => {
    await AsyncStorage.removeItem('session_token');
    await AsyncStorage.removeItem('is_online');
    set({ 
      user: null, 
      sessionToken: null, 
      stats: null, 
      isOnline: false, 
      activeWork: [], 
      isUserLoaded: false,
      currentLocation: null,
      isTrackingLocation: false
    });
  },
  
  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const onlineState = await AsyncStorage.getItem('is_online');
      
      if (token) {
        set({ sessionToken: token });
      }
      
      // Restore online state if saved
      if (onlineState !== null) {
        set({ isOnline: JSON.parse(onlineState) });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
