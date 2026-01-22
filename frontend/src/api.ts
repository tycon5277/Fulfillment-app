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

// Agent Registration & Profile
export const registerAsAgent = (data: { vehicle_type: string; phone: string }) =>
  api.post('/agent/register', data);

export const updateAgentStatus = (status: string) =>
  api.put('/agent/status', { status });

export const updateAgentProfile = (data: any) =>
  api.put('/agent/profile', data);

export const getAgentStats = () => api.get('/agent/stats');

// Orders
export const getAvailableOrders = () => api.get('/agent/available-orders');

export const acceptOrder = (orderId: string) =>
  api.post(`/agent/orders/${orderId}/accept`);

export const getAgentOrders = () => api.get('/agent/orders');

export const getActiveOrders = () => api.get('/agent/orders/active');

export const getOrderDetail = (orderId: string) =>
  api.get(`/agent/orders/${orderId}`);

export const updateOrderStatus = (orderId: string, status: string, location?: { lat: number; lng: number }) =>
  api.put(`/agent/orders/${orderId}/status`, { status, location });

export const updateDeliveryLocation = (orderId: string, lat: number, lng: number) =>
  api.put(`/agent/orders/${orderId}/location`, { lat, lng });

// Wishes
export const getAvailableWishes = () => api.get('/agent/available-wishes');

export const acceptWish = (wishId: string) =>
  api.post(`/agent/wishes/${wishId}/accept`);

export const getAgentWishes = () => api.get('/agent/wishes');

export const completeWish = (wishId: string) =>
  api.put(`/agent/wishes/${wishId}/complete`);

// Chat
export const getChatRooms = () => api.get('/agent/chat/rooms');

export const getChatMessages = (roomId: string) =>
  api.get(`/agent/chat/rooms/${roomId}/messages`);

export const sendMessage = (roomId: string, content: string) =>
  api.post(`/agent/chat/rooms/${roomId}/messages`, { content });

// Earnings
export const getEarningsSummary = () => api.get('/agent/earnings');

export const getEarningsHistory = (limit?: number) =>
  api.get('/agent/earnings/history', { params: { limit } });

// Seed data (for testing)
export const seedOrders = () => api.post('/seed/orders');
export const seedWishes = () => api.post('/seed/wishes');

export default api;
