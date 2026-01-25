import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PartnerType = 'agent' | 'vendor' | 'promoter' | null;

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

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  stats: PartnerStats | null;
  
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setStats: (stats: PartnerStats | null) => void;
  logout: () => void;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionToken: null,
  isLoading: true,
  stats: null,
  
  setUser: (user) => set({ user }),
  setSessionToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('session_token', token);
    } else {
      await AsyncStorage.removeItem('session_token');
    }
    set({ sessionToken: token });
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
  setStats: (stats) => set({ stats }),
  
  logout: async () => {
    await AsyncStorage.removeItem('session_token');
    set({ user: null, sessionToken: null, stats: null });
  },
  
  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        set({ sessionToken: token });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
