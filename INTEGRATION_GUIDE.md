# QuickWish Integration Guide
## Wisher App ↔ Genie App Connection Points

This document lists all the API endpoints and integration points that need to be implemented between the **Wisher App** (customer-facing) and the **Genie App** (service provider).

---

## 🔗 CRITICAL INTEGRATIONS

### 1. Live Genie Tracking (Priority: HIGH)
**Purpose**: Allow Wishers to track their assigned Genie's real-time location

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wishes/{wish_id}/track` | GET | Get Genie's live location, ETA, and contact info |
| `/api/wishes/{wish_id}/status` | GET | Get current wish status |

**Response includes**:
- `genie_location`: { latitude, longitude, accuracy, heading, speed, is_online, updated_at }
- `eta_minutes`: Calculated ETA based on distance
- `distance_km`: Distance from Genie to destination
- `genie`: { name, phone, picture, rating }

**When to show tracking**: 
- Wish status is `confirmed`, `accepted`, `matched`, or `in_progress`

**Reference Implementation**: `/app/frontend/app/(main)/tracking-demo.tsx`

---

### 2. Location Updates from Genie App (Priority: HIGH)
**Purpose**: Genie app sends GPS updates to backend for tracking

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/partner/location` | PUT | Update Genie's current GPS location |
| `/api/partner/location` | GET | Get Genie's last known location |

**Payload**:
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "accuracy": 10.5,
  "heading": 45.0,
  "speed": 15.0,
  "timestamp": 1735500000,
  "is_online": true
}
```

**Tracking Modes**:
- **Online Mode**: Continuous updates (every 5 seconds)
- **Offline Mode**: Periodic updates (every 5 minutes)

---

### 3. Wish Creation & Matching (Priority: HIGH)
**Purpose**: Wisher creates a wish, Genies see and accept it

| Endpoint | Method | App | Description |
|----------|--------|-----|-------------|
| `/api/wishes/create` | POST | Wisher | Create a new wish/service request |
| `/api/agent/available-wishes` | GET | Genie | Get pending wishes matching Genie's skills |
| `/api/agent/wishes/{wish_id}/accept` | POST | Genie | Accept a wish (creates chat room) |
| `/api/wishes/{wish_id}/accept` | POST | Genie | Alternative accept endpoint |
| `/api/wishes/{wish_id}/decline` | POST | Genie | Decline a wish |

---

### 4. Chat System (Priority: HIGH)
**Purpose**: Real-time communication between Wisher and Genie

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/rooms` | GET | Get all chat rooms for current user |
| `/api/chat/rooms/{room_id}` | GET | Get specific chat room details |
| `/api/chat/rooms/{room_id}/messages` | GET | Get messages in a room |
| `/api/chat/rooms/{room_id}/messages` | POST | Send a message |

**Chat Room Structure**:
- Created automatically when Genie accepts a wish
- Contains: `wisher_id`, `partner_id`, `wish_id`, `wish_title`

---

### 5. Wish Status Updates (Priority: MEDIUM)
**Purpose**: Update wish progress throughout the service lifecycle

| Status | Description | Who Updates |
|--------|-------------|-------------|
| `searching` | Looking for a Genie | System |
| `matched` | Genie found | System |
| `accepted` | Genie accepted | Genie App |
| `in_progress` | Service started | Genie App |
| `completed` | Service finished | Genie App |
| `cancelled` | Wish cancelled | Either |

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/wishes/{wish_id}/complete` | PUT | Mark wish as completed |

---

## 📱 PUSH NOTIFICATIONS

### Notification Events to Implement:

| Event | From | To | Message |
|-------|------|-----|---------|
| New Wish | Wisher App | Genie App | "New service request nearby!" |
| Wish Accepted | Genie App | Wisher App | "{Genie Name} accepted your request" |
| Genie En Route | Genie App | Wisher App | "Your Genie is on the way" |
| Genie Arrived | Genie App | Wisher App | "Your Genie has arrived" |
| Service Complete | Genie App | Wisher App | "Service completed. Rate your experience!" |
| New Message | Either | Either | "New message from {name}" |

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/send-wish-request` | POST | Send wish notification to nearby Genies |

---

## 💰 PAYMENTS & EARNINGS

### Endpoints:

| Endpoint | Method | App | Description |
|----------|--------|-----|-------------|
| `/api/partner/earnings` | GET | Genie | Get earnings summary |
| `/api/partner/earnings/history` | GET | Genie | Get earnings history |
| `/api/partner/stats` | GET | Genie | Get partner statistics |

**Note**: Payment processing integration (Stripe/Razorpay) needs to be added.

---

## 👤 USER & PARTNER MANAGEMENT

### Authentication (Shared):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/send-otp` | POST | Send OTP to phone |
| `/api/auth/verify-otp` | POST | Verify OTP and login |
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/profile` | PUT | Update user profile |

### Partner Registration (Genie App Only):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/partner/register/agent` | POST | Register as Genie/Agent |
| `/api/partner/status` | PUT | Update availability status |

---

## 🗺️ LOCATION SERVICES

### Wisher App Needs:
1. **Wish Location**: Capture service location when creating wish
2. **Genie Tracking Map**: Show Genie's live location on map
3. **ETA Display**: Show estimated arrival time

### Genie App Provides:
1. **Background Location**: Continuous GPS updates when online
2. **Periodic Location**: Updates every 5 minutes when offline

---

## 📋 DATA MODELS TO SYNC

### Wish Object:
```json
{
  "wish_id": "string",
  "user_id": "wisher_id",
  "title": "Service description",
  "wish_type": "cleaning|plumbing|electrical|etc",
  "location": { "lat": 12.97, "lng": 77.59, "address": "..." },
  "status": "searching|matched|accepted|in_progress|completed",
  "assigned_genie_id": "genie_user_id",
  "created_at": "timestamp"
}
```

### Partner Location Object:
```json
{
  "user_id": "genie_user_id",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "accuracy": 10.5,
  "heading": 45.0,
  "speed": 15.0,
  "is_online": true,
  "updated_at": "timestamp"
}
```

---

## 🔧 TESTING ENDPOINTS

### Seed Data (For Development):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seed/culinary-genie` | POST | Create test Culinary Genie user |
| `/api/seed/drone-genie` | POST | Create test Drone Genie user |
| `/api/seed/skilled-genie` | POST | Create test Skilled Genie user |
| `/api/seed/wishes` | POST | Create test wishes |
| `/api/seed/orders` | POST | Create test orders |

**Test OTP**: `123456` (works for all phone numbers in dev mode)

---

## 🚀 INTEGRATION CHECKLIST

### Phase 1 - Core Integration:
- [ ] Wisher can create wishes with location
- [ ] Genies receive notifications for nearby wishes
- [ ] Genie can accept/decline wishes
- [ ] Chat room created on acceptance
- [ ] Basic messaging works

### Phase 2 - Live Tracking:
- [ ] Genie location updates sent to backend
- [ ] Wisher can view Genie on map
- [ ] ETA calculation working
- [ ] "Genie is online" indicator

### Phase 3 - Status Flow:
- [ ] Status updates from Genie app
- [ ] Push notifications on status changes
- [ ] Wisher sees status updates in real-time

### Phase 4 - Completion:
- [ ] Mark service as complete
- [ ] Rating/review system
- [ ] Payment processing
- [ ] Earnings credited to Genie

---

## 📞 CONTACT FEATURES

### From Wisher App:
- **Call Genie**: `tel:{genie_phone}` - Available after acceptance
- **Chat with Genie**: Open chat room

### From Genie App:
- **Call Wisher**: `tel:{wisher_phone}` - Available for accepted wishes
- **Chat with Wisher**: Open chat room

---

## ⚙️ ENVIRONMENT SETUP

### Backend URL:
- Development: `http://localhost:8001/api`
- Production: Configure in `.env` file

### Both Apps Should:
1. Use same backend URL
2. Share authentication system (session tokens)
3. Use same database (MongoDB)

---

## 📝 NOTES

1. **Real-time Updates**: Consider WebSocket integration for:
   - Live location streaming
   - Instant message delivery
   - Real-time status updates

2. **Offline Support**: 
   - Cache recent data
   - Queue location updates when offline
   - Sync when connection restored

3. **Security**:
   - Validate wish ownership before showing Genie location
   - Only show Genie phone after acceptance
   - Rate limit location updates

---

*Last Updated: January 2026*
*Genie App Version: 1.0.0*
