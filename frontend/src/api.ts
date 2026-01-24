import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const createSession = (sessionId: string) =>
  api.post('/auth/session', {}, { headers: { 'X-Session-ID': sessionId } });

export const getMe = () => api.get('/auth/me');

export const logout = () => api.post('/auth/logout');

// Partner Registration
export const registerAsAgent = (data: { 
  phone: string; 
  vehicle_type: string; 
  services: string[];
}) => api.post('/partner/register/agent', data);

export const registerAsVendor = (data: { 
  phone: string; 
  shop_name: string;
  shop_type: string;
  shop_address: string;
  shop_location?: { lat: number; lng: number };
  can_deliver: boolean;
  categories: string[];
}) => api.post('/partner/register/vendor', data);

export const registerAsPromoter = (data: { 
  phone: string; 
  business_name: string;
  promoter_type: string;
  description: string;
}) => api.post('/partner/register/promoter', data);

// Partner Status & Stats
export const updatePartnerStatus = (status: string) =>
  api.put('/partner/status', { status });

export const getPartnerStats = () => api.get('/partner/stats');

// Alias for backward compatibility
export const getAgentStats = () => api.get('/partner/stats');
export const updateAgentStatus = (status: string) =>
  api.put('/partner/status', { status });

// Agent - Orders
export const getAvailableOrders = () => api.get('/agent/available-orders');

export const acceptOrder = (orderId: string) =>
  api.post(`/agent/orders/${orderId}/accept`);

export const getActiveOrders = () => api.get('/agent/orders/active');

export const getOrderDetail = (orderId: string) =>
  api.get(`/agent/orders/${orderId}`);

export const updateOrderStatus = (orderId: string, status: string, location?: { lat: number; lng: number }) =>
  api.put(`/agent/orders/${orderId}/status`, { status, location });

export const updateDeliveryLocation = (orderId: string, lat: number, lng: number) =>
  api.put(`/agent/orders/${orderId}/location`, { lat, lng });

// Agent - Wishes
export const getAvailableWishes = () => api.get('/agent/available-wishes');

export const acceptWish = (wishId: string) =>
  api.post(`/agent/wishes/${wishId}/accept`);

export const getAgentWishes = () => api.get('/agent/wishes');

export const completeWish = (wishId: string) =>
  api.put(`/agent/wishes/${wishId}/complete`);

// Vendor - Products
export const createProduct = (data: {
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
}) => api.post('/vendor/products', data);

export const getVendorProducts = () => api.get('/vendor/products');

export const updateProduct = (productId: string, data: any) =>
  api.put(`/vendor/products/${productId}`, data);

export const deleteProduct = (productId: string) =>
  api.delete(`/vendor/products/${productId}`);

// Vendor - Orders
export const getVendorOrders = () => api.get('/vendor/orders');

export const updateVendorOrderStatus = (orderId: string, status: string) =>
  api.put(`/vendor/orders/${orderId}/status`, { status });

export const assignAgentToOrder = (orderId: string) =>
  api.post(`/vendor/orders/${orderId}/assign-agent`);

// Promoter - Events
export const createEvent = (data: {
  event_type: string;
  title: string;
  description: string;
  date?: string;
  location?: { lat: number; lng: number };
  price: number;
  total_slots: number;
  images?: string[];
}) => api.post('/promoter/events', data);

export const getPromoterEvents = () => api.get('/promoter/events');

export const updateEvent = (eventId: string, data: any) =>
  api.put(`/promoter/events/${eventId}`, data);

export const deleteEvent = (eventId: string) =>
  api.delete(`/promoter/events/${eventId}`);

export const getPromoterBookings = () => api.get('/promoter/bookings');

// Chat (Partner)
export const getChatRooms = () => api.get('/partner/chat/rooms');

export const getChatMessages = (roomId: string) =>
  api.get(`/partner/chat/rooms/${roomId}/messages`);

export const sendMessage = (roomId: string, content: string) =>
  api.post(`/partner/chat/rooms/${roomId}/messages`, { content });

// Earnings
export const getEarningsSummary = () => api.get('/partner/earnings');

export const getEarningsHistory = (limit?: number) =>
  api.get('/partner/earnings/history', { params: { limit } });

// Seed data (for testing)
export const seedOrders = () => api.post('/seed/orders');
export const seedWishes = () => api.post('/seed/wishes');

export default api;
