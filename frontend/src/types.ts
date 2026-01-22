export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  is_agent: boolean;
  agent_status: 'available' | 'busy' | 'offline';
  agent_vehicle?: 'bike' | 'scooter' | 'car';
  agent_rating: number;
  agent_total_deliveries: number;
  agent_total_earnings: number;
}

export interface Order {
  order_id: string;
  user_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_address?: string;
  items: OrderItem[];
  total_amount: number;
  delivery_address: {
    address: string;
    lat?: number;
    lng?: number;
  };
  delivery_type: string;
  delivery_fee: number;
  assigned_agent_id?: string;
  agent_name?: string;
  agent_phone?: string;
  agent_location?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  status: string;
  status_history: StatusHistory[];
  payment_status: string;
  created_at: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface StatusHistory {
  status: string;
  timestamp: string;
  message?: string;
}

export interface Wish {
  wish_id: string;
  user_id: string;
  wish_type: string;
  title: string;
  description?: string;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  radius_km: number;
  remuneration: number;
  is_immediate: boolean;
  scheduled_time?: string;
  status: string;
  accepted_by?: string;
  wisher_name?: string;
  wisher_picture?: string;
  wisher_phone?: string;
  created_at: string;
}

export interface ChatRoom {
  room_id: string;
  wish_id: string;
  wisher_id: string;
  agent_id: string;
  wish_title?: string;
  status: string;
  wish?: Wish;
  wisher?: {
    name: string;
    picture?: string;
  };
  last_message?: Message;
  created_at: string;
}

export interface Message {
  message_id: string;
  room_id: string;
  sender_id: string;
  sender_type: 'wisher' | 'agent';
  content: string;
  created_at: string;
}

export interface Earning {
  earning_id: string;
  agent_id: string;
  order_id?: string;
  wish_id?: string;
  amount: number;
  type: 'delivery' | 'wish' | 'bonus';
  description: string;
  created_at: string;
}

export interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  total: number;
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
