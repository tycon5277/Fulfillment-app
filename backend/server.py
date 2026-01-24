from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Cookie
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class User(BaseModel):
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None
    picture: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    addresses: List[dict] = []
    
    # Partner type: agent, vendor, promoter, or None (not registered)
    partner_type: Optional[str] = None
    partner_status: str = "offline"  # available, busy, offline
    partner_rating: float = 5.0
    partner_total_tasks: int = 0
    partner_total_earnings: float = 0.0
    
    # Agent-specific fields
    agent_type: Optional[str] = None  # 'mobile' or 'skilled'
    agent_vehicle: Optional[str] = None  # motorbike, scooter, car
    agent_is_electric: bool = False  # whether the vehicle is electric
    agent_services: List[str] = []  # delivery, courier, rides, errands, surprise (for mobile genies)
    agent_skills: List[str] = []  # electrician, plumber, etc. (for skilled genies)
    agent_has_vehicle: bool = False  # for skilled genies who have vehicle for commuting
    
    # Vendor-specific fields
    vendor_shop_name: Optional[str] = None
    vendor_shop_type: Optional[str] = None  # grocery, restaurant, pharmacy, etc.
    vendor_shop_address: Optional[str] = None
    vendor_shop_location: Optional[dict] = None  # {lat, lng}
    vendor_can_deliver: bool = False
    vendor_categories: List[str] = []
    vendor_is_verified: bool = False
    
    # Promoter-specific fields
    promoter_business_name: Optional[str] = None
    promoter_type: Optional[str] = None  # trip_organizer, event_organizer, service_provider
    promoter_description: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class Wish(BaseModel):
    wish_id: str
    user_id: str
    wish_type: str
    title: str
    description: Optional[str] = None
    location: dict
    radius_km: float
    remuneration: float
    is_immediate: bool
    scheduled_time: Optional[datetime] = None
    status: str = "pending"
    accepted_by: Optional[str] = None
    linked_order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRoom(BaseModel):
    room_id: str
    wish_id: str
    wisher_id: str
    partner_id: str  # Can be agent, vendor, or promoter
    wish_title: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    message_id: str
    room_id: str
    sender_id: str
    sender_type: str  # wisher or partner
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    content: str

class ShopOrder(BaseModel):
    order_id: str
    user_id: str
    vendor_id: str
    vendor_name: str
    items: List[dict]
    total_amount: float
    delivery_address: dict
    delivery_type: str  # self_pickup, vendor_delivery, agent_delivery
    delivery_fee: float = 0.0
    assigned_agent_id: Optional[str] = None
    agent_name: Optional[str] = None
    agent_phone: Optional[str] = None
    agent_location: Optional[dict] = None
    status: str = "pending"
    status_history: List[dict] = []
    payment_status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EarningsRecord(BaseModel):
    earning_id: str
    partner_id: str
    order_id: Optional[str] = None
    wish_id: Optional[str] = None
    event_id: Optional[str] = None
    amount: float
    type: str  # delivery, wish, sale, ticket, booking
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Vendor Products
class Product(BaseModel):
    product_id: str
    vendor_id: str
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image: Optional[str] = None  # base64
    in_stock: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Promoter Events/Services
class PromoterEvent(BaseModel):
    event_id: str
    promoter_id: str
    event_type: str  # trip, event, service
    title: str
    description: str
    date: Optional[datetime] = None
    location: Optional[dict] = None
    price: float
    total_slots: int
    booked_slots: int = 0
    images: List[str] = []  # base64 images
    status: str = "active"  # active, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===================== AUTH HELPERS =====================

async def get_current_user(request: Request, session_token: Optional[str] = Cookie(default=None)) -> Optional[User]:
    """Get current user from session token"""
    token = session_token
    
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        return None
    
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if user_doc:
        return User(**user_doc)
    return None

async def require_auth(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    """Require authenticated user"""
    user = await get_current_user(request, session_token)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_partner(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    """Require registered partner (agent, vendor, or promoter)"""
    user = await require_auth(request, session_token)
    if not user.partner_type:
        raise HTTPException(status_code=403, detail="Partner registration required")
    return user

async def require_agent(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    """Require agent partner"""
    user = await require_partner(request, session_token)
    if user.partner_type != "agent":
        raise HTTPException(status_code=403, detail="Agent access required")
    return user

async def require_vendor(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    """Require vendor partner"""
    user = await require_partner(request, session_token)
    if user.partner_type != "vendor":
        raise HTTPException(status_code=403, detail="Vendor access required")
    return user

async def require_promoter(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    """Require promoter partner"""
    user = await require_partner(request, session_token)
    if user.partner_type != "promoter":
        raise HTTPException(status_code=403, detail="Promoter access required")
    return user

# ===================== AUTH ENDPOINTS =====================

# In-memory OTP storage (for demo purposes)
otp_storage = {}

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

@api_router.post("/auth/send-otp")
async def send_otp(data: SendOTPRequest):
    """Send OTP to phone number (mock implementation)"""
    phone = data.phone.strip()
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    # Mock OTP - always 123456 for testing
    otp = "123456"
    otp_storage[phone] = {
        "otp": otp,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5)
    }
    
    logger.info(f"OTP for {phone}: {otp}")
    return {"message": "OTP sent successfully", "debug_otp": otp}  # Remove debug_otp in production

@api_router.post("/auth/verify-otp")
async def verify_otp(data: VerifyOTPRequest, response: Response):
    """Verify OTP and create session"""
    phone = data.phone.strip()
    otp = data.otp.strip()
    
    # Check stored OTP
    stored = otp_storage.get(phone)
    if not stored:
        raise HTTPException(status_code=400, detail="OTP expired or not found. Please request a new OTP.")
    
    if stored["expires_at"] < datetime.now(timezone.utc):
        del otp_storage[phone]
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new OTP.")
    
    # Mock OTP verification - accept "123456" always
    if otp != "123456" and otp != stored["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Clear used OTP
    del otp_storage[phone]
    
    # Check if user exists
    existing_user = await db.users.find_one({"phone": phone}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        is_new_user = False
    else:
        # Create new user with phone only
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "phone": phone,
            "name": None,
            "email": None,
            "picture": None,
            "date_of_birth": None,
            "address": None,
            "addresses": [],
            "partner_type": None,
            "partner_status": "offline",
            "partner_rating": 5.0,
            "partner_total_tasks": 0,
            "partner_total_earnings": 0.0,
            "agent_vehicle": None,
            "agent_services": [],
            "vendor_shop_name": None,
            "vendor_shop_type": None,
            "vendor_shop_address": None,
            "vendor_shop_location": None,
            "vendor_can_deliver": False,
            "vendor_categories": [],
            "vendor_is_verified": False,
            "promoter_business_name": None,
            "promoter_type": None,
            "promoter_description": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
        is_new_user = True
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=30*24*60*60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {
        "user": user_doc, 
        "session_token": session_token,
        "is_new_user": is_new_user,
        "needs_profile": user_doc.get("name") is None or user_doc.get("partner_type") is None
    }

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Legacy: Exchange session_id for session_token (kept for compatibility)"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing X-Session-ID header")
    
    async with httpx.AsyncClient() as http_client:
        try:
            auth_response = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            user_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth API error: {e}")
            raise HTTPException(status_code=500, detail="Authentication service error")
    
    session_data = SessionDataResponse(**user_data)
    
    existing_user = await db.users.find_one({"email": session_data.email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": session_data.email,
            "name": session_data.name,
            "picture": session_data.picture,
            "phone": None,
            "date_of_birth": None,
            "address": None,
            "addresses": [],
            "partner_type": None,
            "partner_status": "offline",
            "partner_rating": 5.0,
            "partner_total_tasks": 0,
            "partner_total_earnings": 0.0,
            "agent_vehicle": None,
            "agent_services": [],
            "vendor_shop_name": None,
            "vendor_shop_type": None,
            "vendor_shop_address": None,
            "vendor_shop_location": None,
            "vendor_can_deliver": False,
            "vendor_categories": [],
            "vendor_is_verified": False,
            "promoter_business_name": None,
            "promoter_type": None,
            "promoter_description": None,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(new_user)
    
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "user_id": user_id,
        "session_token": session_data.session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    response.set_cookie(
        key="session_token",
        value=session_data.session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user": user_doc, "session_token": session_data.session_token}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(require_auth)):
    """Get current authenticated user"""
    return current_user

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None

@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, current_user: User = Depends(require_auth)):
    """Update user profile"""
    update_fields = {}
    if data.name is not None:
        update_fields["name"] = data.name
    if data.email is not None:
        update_fields["email"] = data.email
    if data.date_of_birth is not None:
        update_fields["date_of_birth"] = data.date_of_birth
    if data.address is not None:
        update_fields["address"] = data.address
    
    if update_fields:
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_fields}
        )
    
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return {"user": user_doc}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(default=None)):
    """Logout user"""
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ===================== PARTNER REGISTRATION =====================

class AgentRegistration(BaseModel):
    phone: str
    agent_type: str = "mobile"  # 'mobile' or 'skilled'
    vehicle_type: Optional[str] = None  # motorbike, scooter, car
    is_electric: bool = False  # whether the vehicle is electric
    services: List[str] = []  # delivery, courier, rides, errands, surprise (for mobile)
    skills: List[str] = []  # electrician, plumber, etc. (for skilled)
    has_vehicle: bool = False

class VendorRegistration(BaseModel):
    phone: str
    shop_name: str
    shop_type: str  # grocery, restaurant, pharmacy, supermarket, farm_produce, fish, nursery, etc.
    shop_address: str
    shop_location: Optional[dict] = None  # {lat, lng}
    can_deliver: bool = False
    categories: List[str] = []

class PromoterRegistration(BaseModel):
    phone: str
    business_name: str
    promoter_type: str  # trip_organizer, event_organizer, service_provider
    description: str

class PartnerStatusUpdate(BaseModel):
    status: str  # available, busy, offline

@api_router.post("/partner/register/agent")
async def register_as_agent(data: AgentRegistration, current_user: User = Depends(require_auth)):
    """Register as an agent partner (Mobile Genie or Skilled Genie)"""
    if current_user.partner_type:
        raise HTTPException(status_code=400, detail=f"Already registered as {current_user.partner_type}")
    
    update_data = {
        "partner_type": "agent",
        "partner_status": "offline",
        "agent_type": data.agent_type,  # 'mobile' or 'skilled'
        "agent_vehicle": data.vehicle_type,
        "agent_is_electric": data.is_electric,
        "agent_services": data.services,
        "agent_skills": data.skills,
        "agent_has_vehicle": data.has_vehicle,
    }
    
    # Only set phone if provided
    if data.phone:
        update_data["phone"] = data.phone
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return {"message": "Registered as agent successfully", "user": updated_user}

@api_router.post("/partner/register/vendor")
async def register_as_vendor(data: VendorRegistration, current_user: User = Depends(require_auth)):
    """Register as a vendor partner"""
    if current_user.partner_type:
        raise HTTPException(status_code=400, detail=f"Already registered as {current_user.partner_type}")
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "partner_type": "vendor",
            "partner_status": "offline",
            "phone": data.phone,
            "vendor_shop_name": data.shop_name,
            "vendor_shop_type": data.shop_type,
            "vendor_shop_address": data.shop_address,
            "vendor_shop_location": data.shop_location,
            "vendor_can_deliver": data.can_deliver,
            "vendor_categories": data.categories,
        }}
    )
    
    updated_user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return {"message": "Registered as vendor successfully", "user": updated_user}

@api_router.post("/partner/register/promoter")
async def register_as_promoter(data: PromoterRegistration, current_user: User = Depends(require_auth)):
    """Register as a promoter partner"""
    if current_user.partner_type:
        raise HTTPException(status_code=400, detail=f"Already registered as {current_user.partner_type}")
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "partner_type": "promoter",
            "partner_status": "offline",
            "phone": data.phone,
            "promoter_business_name": data.business_name,
            "promoter_type": data.promoter_type,
            "promoter_description": data.description,
        }}
    )
    
    updated_user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return {"message": "Registered as promoter successfully", "user": updated_user}

@api_router.put("/partner/status")
async def update_partner_status(data: PartnerStatusUpdate, current_user: User = Depends(require_partner)):
    """Update partner's availability status"""
    if data.status not in ["available", "busy", "offline"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"partner_status": data.status}}
    )
    return {"message": f"Status updated to {data.status}"}

@api_router.get("/partner/stats")
async def get_partner_stats(current_user: User = Depends(require_partner)):
    """Get partner's statistics"""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    today_earnings = await db.earnings.aggregate([
        {"$match": {
            "partner_id": current_user.user_id,
            "created_at": {"$gte": today_start}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    # Count active tasks based on partner type
    active_count = 0
    if current_user.partner_type == "agent":
        active_orders = await db.shop_orders.count_documents({
            "assigned_agent_id": current_user.user_id,
            "status": {"$in": ["picked_up", "on_the_way", "nearby"]}
        })
        active_wishes = await db.wishes.count_documents({
            "accepted_by": current_user.user_id,
            "status": "in_progress"
        })
        active_count = active_orders + active_wishes
    elif current_user.partner_type == "vendor":
        active_count = await db.shop_orders.count_documents({
            "vendor_id": current_user.user_id,
            "status": {"$in": ["pending", "confirmed", "preparing", "ready"]}
        })
    elif current_user.partner_type == "promoter":
        active_count = await db.promoter_events.count_documents({
            "promoter_id": current_user.user_id,
            "status": "active"
        })
    
    return {
        "partner_type": current_user.partner_type,
        "total_tasks": current_user.partner_total_tasks,
        "total_earnings": current_user.partner_total_earnings,
        "today_earnings": today_earnings[0]["total"] if today_earnings else 0,
        "rating": current_user.partner_rating,
        "active_count": active_count,
        "status": current_user.partner_status
    }

# ===================== AGENT ENDPOINTS =====================

@api_router.get("/agent/available-orders")
async def get_available_orders(current_user: User = Depends(require_agent)):
    """Get orders available for pickup by agents"""
    orders = await db.shop_orders.find({
        "delivery_type": "agent_delivery",
        "assigned_agent_id": None,
        "status": {"$in": ["confirmed", "preparing", "ready"]}
    }, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    return orders

@api_router.post("/agent/orders/{order_id}/accept")
async def accept_order(order_id: str, current_user: User = Depends(require_agent)):
    """Agent accepts an order for delivery"""
    order = await db.shop_orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("assigned_agent_id"):
        raise HTTPException(status_code=400, detail="Order already assigned")
    
    await db.shop_orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "assigned_agent_id": current_user.user_id,
            "agent_name": current_user.name,
            "agent_phone": current_user.phone,
            "status": "picked_up" if order["status"] == "ready" else order["status"]
        },
        "$push": {
            "status_history": {
                "status": "agent_assigned",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "message": f"Agent {current_user.name} accepted the order"
            }
        }}
    )
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"partner_status": "busy"}}
    )
    
    return {"message": "Order accepted successfully"}

@api_router.get("/agent/orders/active")
async def get_agent_active_orders(current_user: User = Depends(require_agent)):
    """Get agent's active deliveries"""
    orders = await db.shop_orders.find({
        "assigned_agent_id": current_user.user_id,
        "status": {"$in": ["picked_up", "on_the_way", "nearby"]}
    }, {"_id": 0}).to_list(20)
    
    return orders

@api_router.get("/agent/orders/{order_id}")
async def get_agent_order_detail(order_id: str, current_user: User = Depends(require_agent)):
    """Get order details"""
    order = await db.shop_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

class OrderStatusUpdate(BaseModel):
    status: str
    location: Optional[dict] = None

@api_router.put("/agent/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, current_user: User = Depends(require_agent)):
    """Update order delivery status"""
    valid_statuses = ["picked_up", "on_the_way", "nearby", "delivered"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    order = await db.shop_orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("assigned_agent_id") != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your order")
    
    update_data = {"status": data.status}
    if data.location:
        update_data["agent_location"] = data.location
    
    await db.shop_orders.update_one(
        {"order_id": order_id},
        {
            "$set": update_data,
            "$push": {
                "status_history": {
                    "status": data.status,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "message": f"Order {data.status.replace('_', ' ')}"
                }
            }
        }
    )
    
    if data.status == "delivered":
        earning = {
            "earning_id": f"earn_{uuid.uuid4().hex[:12]}",
            "partner_id": current_user.user_id,
            "order_id": order_id,
            "amount": order.get("delivery_fee", 30),
            "type": "delivery",
            "description": f"Delivery from {order.get('vendor_name', 'vendor')}",
            "created_at": datetime.now(timezone.utc)
        }
        await db.earnings.insert_one(earning)
        
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {
                "$inc": {
                    "partner_total_tasks": 1,
                    "partner_total_earnings": order.get("delivery_fee", 30)
                },
                "$set": {"partner_status": "available"}
            }
        )
    
    return {"message": f"Order status updated to {data.status}"}

class LocationUpdate(BaseModel):
    lat: float
    lng: float

@api_router.put("/agent/orders/{order_id}/location")
async def update_delivery_location(order_id: str, data: LocationUpdate, current_user: User = Depends(require_agent)):
    """Update agent's live location during delivery"""
    await db.shop_orders.update_one(
        {"order_id": order_id, "assigned_agent_id": current_user.user_id},
        {"$set": {
            "agent_location": {
                "lat": data.lat,
                "lng": data.lng,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }}
    )
    return {"message": "Location updated"}

# ===================== AGENT WISH MANAGEMENT =====================

@api_router.get("/agent/available-wishes")
async def get_available_wishes(current_user: User = Depends(require_agent)):
    """Get pending wishes available for agents"""
    # Filter wishes based on agent services
    wish_types = []
    if "delivery" in current_user.agent_services:
        wish_types.extend(["delivery", "food_delivery", "grocery_delivery", "medicine_delivery"])
    if "courier" in current_user.agent_services:
        wish_types.extend(["courier", "document_delivery"])
    if "rides" in current_user.agent_services:
        wish_types.extend(["ride_request", "airport_transfer"])
    if "errands" in current_user.agent_services:
        wish_types.extend(["errands", "bill_payment", "pickup"])
    
    query = {
        "status": "pending",
        "accepted_by": None,
        "linked_order_id": None
    }
    if wish_types:
        query["wish_type"] = {"$in": wish_types}
    
    wishes = await db.wishes.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    for wish in wishes:
        wisher = await db.users.find_one({"user_id": wish["user_id"]}, {"_id": 0, "name": 1, "picture": 1})
        if wisher:
            wish["wisher_name"] = wisher.get("name")
            wish["wisher_picture"] = wisher.get("picture")
    
    return wishes

@api_router.post("/agent/wishes/{wish_id}/accept")
async def agent_accept_wish(wish_id: str, current_user: User = Depends(require_agent)):
    """Agent accepts a wish - creates chat room for negotiation"""
    wish = await db.wishes.find_one({"wish_id": wish_id}, {"_id": 0})
    
    if not wish:
        raise HTTPException(status_code=404, detail="Wish not found")
    
    if wish.get("accepted_by"):
        raise HTTPException(status_code=400, detail="Wish already accepted")
    
    room_id = f"room_{uuid.uuid4().hex[:12]}"
    chat_room = {
        "room_id": room_id,
        "wish_id": wish_id,
        "wisher_id": wish["user_id"],
        "partner_id": current_user.user_id,
        "wish_title": wish.get("title"),
        "status": "negotiating",
        "created_at": datetime.now(timezone.utc)
    }
    await db.chat_rooms.insert_one(chat_room)
    
    message = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "room_id": room_id,
        "sender_id": current_user.user_id,
        "sender_type": "partner",
        "content": f"Hi! I'm {current_user.name} and I can help with your request.",
        "created_at": datetime.now(timezone.utc)
    }
    await db.messages.insert_one(message)
    
    await db.wishes.update_one(
        {"wish_id": wish_id},
        {"$set": {"status": "negotiating", "accepted_by": current_user.user_id}}
    )
    
    return {"message": "Wish accepted, chat room created", "room_id": room_id}

@api_router.get("/agent/wishes")
async def get_agent_wishes(current_user: User = Depends(require_agent)):
    """Get wishes accepted by agent"""
    wishes = await db.wishes.find(
        {"accepted_by": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for wish in wishes:
        wisher = await db.users.find_one({"user_id": wish["user_id"]}, {"_id": 0, "name": 1, "picture": 1, "phone": 1})
        if wisher:
            wish["wisher_name"] = wisher.get("name")
            wish["wisher_picture"] = wisher.get("picture")
            wish["wisher_phone"] = wisher.get("phone")
    
    return wishes

@api_router.put("/agent/wishes/{wish_id}/complete")
async def agent_complete_wish(wish_id: str, current_user: User = Depends(require_agent)):
    """Mark wish as completed"""
    wish = await db.wishes.find_one({"wish_id": wish_id}, {"_id": 0})
    
    if not wish:
        raise HTTPException(status_code=404, detail="Wish not found")
    
    if wish.get("accepted_by") != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your wish")
    
    await db.wishes.update_one(
        {"wish_id": wish_id},
        {"$set": {"status": "completed"}}
    )
    
    earning = {
        "earning_id": f"earn_{uuid.uuid4().hex[:12]}",
        "partner_id": current_user.user_id,
        "wish_id": wish_id,
        "amount": wish.get("remuneration", 0),
        "type": "wish",
        "description": wish.get("title", "Wish completed"),
        "created_at": datetime.now(timezone.utc)
    }
    await db.earnings.insert_one(earning)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {
            "$inc": {
                "partner_total_tasks": 1,
                "partner_total_earnings": wish.get("remuneration", 0)
            }
        }
    )
    
    await db.chat_rooms.update_one(
        {"wish_id": wish_id},
        {"$set": {"status": "completed"}}
    )
    
    return {"message": "Wish completed successfully"}

# ===================== VENDOR ENDPOINTS =====================

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image: Optional[str] = None  # base64

@api_router.post("/vendor/products")
async def create_product(data: ProductCreate, current_user: User = Depends(require_vendor)):
    """Create a new product"""
    product = {
        "product_id": f"prod_{uuid.uuid4().hex[:12]}",
        "vendor_id": current_user.user_id,
        "name": data.name,
        "description": data.description,
        "price": data.price,
        "category": data.category,
        "image": data.image,
        "in_stock": True,
        "created_at": datetime.now(timezone.utc)
    }
    await db.products.insert_one(product)
    return {"message": "Product created", "product_id": product["product_id"]}

@api_router.get("/vendor/products")
async def get_vendor_products(current_user: User = Depends(require_vendor)):
    """Get vendor's products"""
    products = await db.products.find(
        {"vendor_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return products

@api_router.put("/vendor/products/{product_id}")
async def update_product(product_id: str, data: ProductCreate, current_user: User = Depends(require_vendor)):
    """Update a product"""
    await db.products.update_one(
        {"product_id": product_id, "vendor_id": current_user.user_id},
        {"$set": {
            "name": data.name,
            "description": data.description,
            "price": data.price,
            "category": data.category,
            "image": data.image
        }}
    )
    return {"message": "Product updated"}

@api_router.delete("/vendor/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(require_vendor)):
    """Delete a product"""
    await db.products.delete_one({"product_id": product_id, "vendor_id": current_user.user_id})
    return {"message": "Product deleted"}

@api_router.get("/vendor/orders")
async def get_vendor_orders(current_user: User = Depends(require_vendor)):
    """Get orders for vendor's shop"""
    orders = await db.shop_orders.find(
        {"vendor_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return orders

@api_router.put("/vendor/orders/{order_id}/status")
async def update_vendor_order_status(order_id: str, data: OrderStatusUpdate, current_user: User = Depends(require_vendor)):
    """Update order status as vendor"""
    valid_statuses = ["confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    order = await db.shop_orders.find_one({"order_id": order_id, "vendor_id": current_user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.shop_orders.update_one(
        {"order_id": order_id},
        {
            "$set": {"status": data.status},
            "$push": {
                "status_history": {
                    "status": data.status,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "message": f"Vendor updated status to {data.status}"
                }
            }
        }
    )
    
    if data.status == "delivered":
        # Record vendor earnings (order total minus platform fee)
        earning = {
            "earning_id": f"earn_{uuid.uuid4().hex[:12]}",
            "partner_id": current_user.user_id,
            "order_id": order_id,
            "amount": order.get("total_amount", 0) * 0.9,  # 90% to vendor
            "type": "sale",
            "description": f"Order #{order_id[-8:]}",
            "created_at": datetime.now(timezone.utc)
        }
        await db.earnings.insert_one(earning)
        
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {
                "$inc": {
                    "partner_total_tasks": 1,
                    "partner_total_earnings": order.get("total_amount", 0) * 0.9
                }
            }
        )
    
    return {"message": f"Order status updated to {data.status}"}

@api_router.post("/vendor/orders/{order_id}/assign-agent")
async def assign_agent_to_order(order_id: str, current_user: User = Depends(require_vendor)):
    """Mark order for agent delivery"""
    order = await db.shop_orders.find_one({"order_id": order_id, "vendor_id": current_user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.shop_orders.update_one(
        {"order_id": order_id},
        {"$set": {"delivery_type": "agent_delivery", "assigned_agent_id": None}}
    )
    
    return {"message": "Order marked for agent delivery"}

# ===================== PROMOTER ENDPOINTS =====================

class EventCreate(BaseModel):
    event_type: str  # trip, event, service
    title: str
    description: str
    date: Optional[datetime] = None
    location: Optional[dict] = None
    price: float
    total_slots: int
    images: List[str] = []  # base64 images

@api_router.post("/promoter/events")
async def create_event(data: EventCreate, current_user: User = Depends(require_promoter)):
    """Create a new event/trip/service"""
    event = {
        "event_id": f"event_{uuid.uuid4().hex[:12]}",
        "promoter_id": current_user.user_id,
        "event_type": data.event_type,
        "title": data.title,
        "description": data.description,
        "date": data.date,
        "location": data.location,
        "price": data.price,
        "total_slots": data.total_slots,
        "booked_slots": 0,
        "images": data.images,
        "status": "active",
        "created_at": datetime.now(timezone.utc)
    }
    await db.promoter_events.insert_one(event)
    return {"message": "Event created", "event_id": event["event_id"]}

@api_router.get("/promoter/events")
async def get_promoter_events(current_user: User = Depends(require_promoter)):
    """Get promoter's events"""
    events = await db.promoter_events.find(
        {"promoter_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return events

@api_router.put("/promoter/events/{event_id}")
async def update_event(event_id: str, data: EventCreate, current_user: User = Depends(require_promoter)):
    """Update an event"""
    await db.promoter_events.update_one(
        {"event_id": event_id, "promoter_id": current_user.user_id},
        {"$set": {
            "event_type": data.event_type,
            "title": data.title,
            "description": data.description,
            "date": data.date,
            "location": data.location,
            "price": data.price,
            "total_slots": data.total_slots,
            "images": data.images
        }}
    )
    return {"message": "Event updated"}

@api_router.delete("/promoter/events/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(require_promoter)):
    """Delete/cancel an event"""
    await db.promoter_events.update_one(
        {"event_id": event_id, "promoter_id": current_user.user_id},
        {"$set": {"status": "cancelled"}}
    )
    return {"message": "Event cancelled"}

@api_router.get("/promoter/bookings")
async def get_promoter_bookings(current_user: User = Depends(require_promoter)):
    """Get bookings for promoter's events"""
    bookings = await db.event_bookings.find(
        {"promoter_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    
    # Enrich with event details
    for booking in bookings:
        event = await db.promoter_events.find_one({"event_id": booking["event_id"]}, {"_id": 0, "title": 1})
        if event:
            booking["event_title"] = event.get("title")
    
    return bookings

# ===================== CHAT ENDPOINTS (SHARED) =====================

@api_router.get("/partner/chat/rooms")
async def get_partner_chat_rooms(current_user: User = Depends(require_partner)):
    """Get chat rooms for partner"""
    rooms = await db.chat_rooms.find(
        {"partner_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    enriched_rooms = []
    for room in rooms:
        wish = await db.wishes.find_one({"wish_id": room["wish_id"]}, {"_id": 0})
        wisher = await db.users.find_one({"user_id": room["wisher_id"]}, {"_id": 0, "name": 1, "picture": 1})
        
        last_messages = await db.messages.find(
            {"room_id": room["room_id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(1).to_list(1)
        
        enriched_rooms.append({
            **room,
            "wish": wish,
            "wisher": wisher,
            "last_message": last_messages[0] if last_messages else None
        })
    
    return enriched_rooms

@api_router.get("/partner/chat/rooms/{room_id}/messages")
async def get_partner_chat_messages(room_id: str, current_user: User = Depends(require_partner)):
    """Get messages in a chat room"""
    room = await db.chat_rooms.find_one(
        {"room_id": room_id, "partner_id": current_user.user_id},
        {"_id": 0}
    )
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    messages = await db.messages.find(
        {"room_id": room_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    return messages

@api_router.post("/partner/chat/rooms/{room_id}/messages")
async def send_partner_message(room_id: str, msg: MessageCreate, current_user: User = Depends(require_partner)):
    """Send message as partner"""
    room = await db.chat_rooms.find_one(
        {"room_id": room_id, "partner_id": current_user.user_id},
        {"_id": 0}
    )
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    message = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "room_id": room_id,
        "sender_id": current_user.user_id,
        "sender_type": "partner",
        "content": msg.content,
        "created_at": datetime.now(timezone.utc)
    }
    await db.messages.insert_one(message)
    
    return Message(**message)

# ===================== EARNINGS (SHARED) =====================

@api_router.get("/partner/earnings")
async def get_earnings_summary(current_user: User = Depends(require_partner)):
    """Get earnings summary"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    async def get_total(start_date):
        result = await db.earnings.aggregate([
            {"$match": {
                "partner_id": current_user.user_id,
                "created_at": {"$gte": start_date}
            }},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        return result[0]["total"] if result else 0
    
    today = await get_total(today_start)
    week = await get_total(week_start)
    month = await get_total(month_start)
    
    return {
        "today": today,
        "week": week,
        "month": month,
        "total": current_user.partner_total_earnings
    }

@api_router.get("/partner/earnings/history")
async def get_earnings_history(limit: int = 50, current_user: User = Depends(require_partner)):
    """Get detailed earnings history"""
    earnings = await db.earnings.find(
        {"partner_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return earnings

# ===================== SEED DATA FOR TESTING =====================

@api_router.post("/seed/orders")
async def seed_sample_orders():
    """Seed sample orders for testing"""
    vendors = [
        {"vendor_id": "vendor_1", "name": "Fresh Mart Grocery", "address": "Shop 12, Central Market"},
        {"vendor_id": "vendor_2", "name": "Biryani House", "address": "15, Food Street"},
        {"vendor_id": "vendor_3", "name": "Sweet Treats Bakery", "address": "Sweet Corner, Main Road"},
    ]
    
    orders = []
    for i, vendor in enumerate(vendors):
        order = {
            "order_id": f"order_test_{uuid.uuid4().hex[:8]}",
            "user_id": "test_customer",
            "vendor_id": vendor["vendor_id"],
            "vendor_name": vendor["name"],
            "vendor_address": vendor["address"],
            "items": [{"name": "Sample Item", "quantity": 2, "price": 150}],
            "total_amount": 300,
            "delivery_address": {
                "address": f"Customer Address {i+1}, Block A, Sector 5",
                "lat": 12.9716 + (i * 0.01),
                "lng": 77.5946 + (i * 0.01)
            },
            "delivery_type": "agent_delivery",
            "delivery_fee": 30 + (i * 10),
            "assigned_agent_id": None,
            "status": ["confirmed", "preparing", "ready"][i],
            "status_history": [{"status": "confirmed", "timestamp": datetime.now(timezone.utc).isoformat()}],
            "payment_status": "paid",
            "created_at": datetime.now(timezone.utc)
        }
        orders.append(order)
        await db.shop_orders.update_one(
            {"order_id": order["order_id"]},
            {"$set": order},
            upsert=True
        )
    
    return {"message": f"Created {len(orders)} sample orders"}

@api_router.post("/seed/wishes")
async def seed_sample_wishes():
    """Seed sample wishes for testing"""
    wish_types = [
        {"type": "delivery", "title": "Pick up groceries from local market", "remuneration": 100},
        {"type": "medicine_delivery", "title": "Urgent medicine from pharmacy", "remuneration": 80},
        {"type": "errands", "title": "Pay electricity bill at office", "remuneration": 50},
        {"type": "ride_request", "title": "Need ride to airport", "remuneration": 500},
    ]
    
    wishes = []
    for i, w in enumerate(wish_types):
        wish = {
            "wish_id": f"wish_test_{uuid.uuid4().hex[:8]}",
            "user_id": "test_wisher",
            "wish_type": w["type"],
            "title": w["title"],
            "description": f"Description for {w['title']}",
            "location": {
                "address": f"Location {i+1}, Sector {i+3}",
                "lat": 12.9716 + (i * 0.005),
                "lng": 77.5946 + (i * 0.005)
            },
            "radius_km": 5.0,
            "remuneration": w["remuneration"],
            "is_immediate": True,
            "status": "pending",
            "accepted_by": None,
            "created_at": datetime.now(timezone.utc)
        }
        wishes.append(wish)
        await db.wishes.update_one(
            {"wish_id": wish["wish_id"]},
            {"$set": wish},
            upsert=True
        )
    
    return {"message": f"Created {len(wishes)} sample wishes"}

# ===================== HEALTH CHECK =====================

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
