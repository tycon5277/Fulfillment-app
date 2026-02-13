import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// External Order Lifecycle Backend
const ORDER_API_BASE = 'https://order-lifecycle-7.preview.emergentagent.com';

const orderApi = axios.create({
  baseURL: `${ORDER_API_BASE}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
orderApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============================================================================
// GENIE API - Delivery Management
// =============================================================================

export interface AvailableOrder {
  order_id: string;
  vendor_name: string;
  vendor_address: string;
  vendor_location: { lat: number; lng: number };
  customer_address: string;
  items_count: number;
  delivery_fee: number;
  distance_to_vendor_km: number;
}

export interface ActiveOrder {
  order_id: string;
  status: 'awaiting_pickup' | 'picked_up';
  vendor_name: string;
  vendor_address: string;
  vendor_phone: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_fee: number;
  special_instructions: string;
}

export interface CurrentOrderResponse {
  has_active_order: boolean;
  order: ActiveOrder | null;
}

export interface DeliverResponse {
  message: string;
  status: string;
  earnings: number;
}

export const genieAPI = {
  // Get available orders near the genie's location
  getAvailableOrders: (lat: number, lng: number) => 
    orderApi.get<{ available_orders: AvailableOrder[]; count: number }>('/genie/orders/available', { 
      params: { lat, lng } 
    }),
  
  // Accept an order (first to accept wins)
  acceptOrder: (orderId: string, pickupMins: number = 10, deliveryMins: number = 20) => 
    orderApi.post(`/genie/orders/${orderId}/accept`, null, { 
      params: { 
        estimated_pickup_mins: pickupMins, 
        estimated_delivery_mins: deliveryMins 
      } 
    }),
  
  // Mark order as picked up from vendor
  pickupOrder: (orderId: string) => 
    orderApi.post(`/genie/orders/${orderId}/pickup`),
  
  // Mark order as delivered to customer
  deliverOrder: (orderId: string) => 
    orderApi.post<DeliverResponse>(`/genie/orders/${orderId}/deliver`),
  
  // Get current active order (if any)
  getCurrentOrder: () => 
    orderApi.get<CurrentOrderResponse>('/genie/orders/current'),
  
  // Update genie's current location
  updateLocation: (lat: number, lng: number) => 
    orderApi.post('/genie/location', { lat, lng }),
};

export default orderApi;
