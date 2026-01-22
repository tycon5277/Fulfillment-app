import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  is_agent: boolean;
  agent_status: string;
  agent_vehicle?: string;
  agent_rating: number;
  agent_total_deliveries: number;
  agent_total_earnings: number;
}

export interface AgentStats {
  total_deliveries: number;
  total_earnings: number;
  today_earnings: number;
  rating: number;
  active_orders: number;
  active_wishes: number;
  status: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  stats: AgentStats | null;
  
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setStats: (stats: AgentStats | null) => void;
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
