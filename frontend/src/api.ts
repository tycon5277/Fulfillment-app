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

// Auth - Phone OTP
export const sendOTP = (phone: string) =>
  api.post('/auth/send-otp', { phone });

export const verifyOTP = (phone: string, otp: string) =>
  api.post('/auth/verify-otp', { phone, otp });

// Auth - Legacy (Google)
export const createSession = (sessionId: string) =>
  api.post('/auth/session', {}, { headers: { 'X-Session-ID': sessionId } });

export const getMe = () => api.get('/auth/me');

export const logout = () => api.post('/auth/logout');

// Partner Registration
export const registerAsAgent = (data: { 
  phone: string; 
  agent_type?: string;  // 'mobile' or 'skilled'
  vehicle_type?: string | null; 
  is_electric?: boolean;
  vehicle_registration?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  services?: string[];
  skills?: string[];
  has_vehicle?: boolean;
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

// Profile Update
export const updateProfile = (data: {
  name?: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
}) => api.put('/auth/profile', data);

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

// Location Tracking
export const updateLocation = (data: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  is_online: boolean;
}) => api.put('/partner/location', data);

export const getPartnerLocation = () => api.get('/partner/location');

// Wish Tracking (for Wisher app)
export const trackWishGenie = (wishId: string) => api.get(`/wishes/${wishId}/track`);

export const getWishStatus = (wishId: string) => api.get(`/wishes/${wishId}/status`);

// Seed data (for testing)
export const seedOrders = () => api.post('/seed/orders');
export const seedWishes = () => api.post('/seed/wishes');
export const seedChatRooms = () => api.post('/seed/chat-rooms');

// Deal Negotiation APIs
export const createDealFromWish = (data: {
  wish_id: string;
  price: number;
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
}) => api.post('/deals/create-from-wish', data);

export const getDeal = (dealId: string) => 
  api.get(`/deals/${dealId}`);

export const sendDealOffer = (dealId: string, data: {
  wish_id: string;
  price: number;
  scheduled_date?: string;
  scheduled_time?: string;
  notes?: string;
}) => api.post(`/deals/${dealId}/send-offer`, data);

export const acceptDeal = (dealId: string) => 
  api.post(`/deals/${dealId}/accept`);

export const rejectDeal = (dealId: string) => 
  api.post(`/deals/${dealId}/reject`);

export const startDealJob = (dealId: string) => 
  api.post(`/deals/${dealId}/start`);

export const completeDealJob = (dealId: string) => 
  api.post(`/deals/${dealId}/complete`);

export const getMyDeals = (status?: string) => 
  api.get('/deals/my-deals', { params: status ? { status } : {} });

export default api;
