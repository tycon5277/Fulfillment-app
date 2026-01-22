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
    email: str
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    addresses: List[dict] = []
    # Agent fields
    is_agent: bool = False
    agent_status: str = "offline"  # available, busy, offline
    agent_vehicle: Optional[str] = None  # bike, scooter, car
    agent_rating: float = 5.0
    agent_total_deliveries: int = 0
    agent_total_earnings: float = 0.0
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

class WishCreate(BaseModel):
    wish_type: str
    title: str
    description: Optional[str] = None
    location: dict
    radius_km: float = 5.0
    remuneration: float
    is_immediate: bool = True
    scheduled_time: Optional[datetime] = None

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
    agent_id: str
    wish_title: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    message_id: str
    room_id: str
    sender_id: str
    sender_type: str
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
    delivery_type: str
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
    agent_id: str
    order_id: Optional[str] = None
    wish_id: Optional[str] = None
    amount: float
    type: str  # delivery, wish, bonus
    description: str
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

async def require_agent(request: Request, session_token: Optional[str] = Cookie(default=None)) -> User:
    """Require authenticated agent"""
    user = await require_auth(request, session_token)
    if not user.is_agent:
        raise HTTPException(status_code=403, detail="Agent access required")
    return user

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
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
            "addresses": [],
            "is_agent": False,
            "agent_status": "offline",
            "agent_vehicle": None,
            "agent_rating": 5.0,
            "agent_total_deliveries": 0,
            "agent_total_earnings": 0.0,
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

# ===================== AGENT REGISTRATION & PROFILE =====================

class AgentRegistration(BaseModel):
    vehicle_type: str  # bike, scooter, car
    phone: str

class AgentStatusUpdate(BaseModel):
    status: str  # available, busy, offline

class AgentProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    picture: Optional[str] = None

@api_router.post("/agent/register")
async def register_as_agent(data: AgentRegistration, current_user: User = Depends(require_auth)):
    """Register current user as an agent"""
    if current_user.is_agent:
        raise HTTPException(status_code=400, detail="Already registered as agent")
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "is_agent": True,
            "agent_status": "offline",
            "agent_vehicle": data.vehicle_type,
            "phone": data.phone,
            "agent_rating": 5.0,
            "agent_total_deliveries": 0,
            "agent_total_earnings": 0.0
        }}
    )
    
    updated_user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return {"message": "Registered as agent successfully", "user": updated_user}

@api_router.put("/agent/status")
async def update_agent_status(data: AgentStatusUpdate, current_user: User = Depends(require_agent)):
    """Update agent's availability status"""
    if data.status not in ["available", "busy", "offline"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"agent_status": data.status}}
    )
    return {"message": f"Status updated to {data.status}"}

@api_router.put("/agent/profile")
async def update_agent_profile(data: AgentProfileUpdate, current_user: User = Depends(require_agent)):
    """Update agent profile"""
    update_fields = {}
    if data.name:
        update_fields["name"] = data.name
    if data.phone:
        update_fields["phone"] = data.phone
    if data.vehicle_type:
        update_fields["agent_vehicle"] = data.vehicle_type
    if data.picture:
        update_fields["picture"] = data.picture
    
    if update_fields:
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_fields}
        )
    
    updated_user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    return {"message": "Profile updated", "user": updated_user}

@api_router.get("/agent/stats")
async def get_agent_stats(current_user: User = Depends(require_agent)):
    """Get agent's statistics"""
    # Get today's earnings
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    today_earnings = await db.earnings.aggregate([
        {"$match": {
            "agent_id": current_user.user_id,
            "created_at": {"$gte": today_start}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    
    # Get active deliveries count
    active_orders = await db.shop_orders.count_documents({
        "assigned_agent_id": current_user.user_id,
        "status": {"$in": ["picked_up", "on_the_way", "nearby"]}
    })
    
    active_wishes = await db.wishes.count_documents({
        "accepted_by": current_user.user_id,
        "status": "in_progress"
    })
    
    return {
        "total_deliveries": current_user.agent_total_deliveries,
        "total_earnings": current_user.agent_total_earnings,
        "today_earnings": today_earnings[0]["total"] if today_earnings else 0,
        "rating": current_user.agent_rating,
        "active_orders": active_orders,
        "active_wishes": active_wishes,
        "status": current_user.agent_status
    }

# ===================== AGENT ORDER MANAGEMENT =====================

@api_router.get("/agent/available-orders")
async def get_available_orders(current_user: User = Depends(require_agent)):
    """Get orders available for pickup"""
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
    
    # Update order
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
    
    # Update agent status to busy
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"agent_status": "busy"}}
    )
    
    # Update linked wish if exists
    await db.wishes.update_one(
        {"linked_order_id": order_id},
        {"$set": {"accepted_by": current_user.user_id, "status": "accepted"}}
    )
    
    return {"message": "Order accepted successfully"}

@api_router.get("/agent/orders")
async def get_agent_orders(current_user: User = Depends(require_agent)):
    """Get all orders assigned to agent"""
    orders = await db.shop_orders.find(
        {"assigned_agent_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders

@api_router.get("/agent/orders/active")
async def get_active_orders(current_user: User = Depends(require_agent)):
    """Get agent's active deliveries"""
    orders = await db.shop_orders.find({
        "assigned_agent_id": current_user.user_id,
        "status": {"$in": ["picked_up", "on_the_way", "nearby"]}
    }, {"_id": 0}).to_list(20)
    
    return orders

@api_router.get("/agent/orders/{order_id}")
async def get_order_detail(order_id: str, current_user: User = Depends(require_agent)):
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
    
    update_data = {
        "status": data.status
    }
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
    
    # If delivered, record earnings and update stats
    if data.status == "delivered":
        earning = {
            "earning_id": f"earn_{uuid.uuid4().hex[:12]}",
            "agent_id": current_user.user_id,
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
                    "agent_total_deliveries": 1,
                    "agent_total_earnings": order.get("delivery_fee", 30)
                },
                "$set": {"agent_status": "available"}
            }
        )
        
        # Update linked wish
        await db.wishes.update_one(
            {"linked_order_id": order_id},
            {"$set": {"status": "completed"}}
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
    wishes = await db.wishes.find({
        "status": "pending",
        "accepted_by": None,
        "linked_order_id": None  # Not auto-created delivery wishes
    }, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Enrich with wisher info
    for wish in wishes:
        wisher = await db.users.find_one({"user_id": wish["user_id"]}, {"_id": 0, "name": 1, "picture": 1})
        if wisher:
            wish["wisher_name"] = wisher.get("name")
            wish["wisher_picture"] = wisher.get("picture")
    
    return wishes

@api_router.post("/agent/wishes/{wish_id}/accept")
async def accept_wish(wish_id: str, current_user: User = Depends(require_agent)):
    """Agent accepts a wish - creates chat room for negotiation"""
    wish = await db.wishes.find_one({"wish_id": wish_id}, {"_id": 0})
    
    if not wish:
        raise HTTPException(status_code=404, detail="Wish not found")
    
    if wish.get("accepted_by"):
        raise HTTPException(status_code=400, detail="Wish already accepted")
    
    # Create chat room
    room_id = f"room_{uuid.uuid4().hex[:12]}"
    chat_room = {
        "room_id": room_id,
        "wish_id": wish_id,
        "wisher_id": wish["user_id"],
        "agent_id": current_user.user_id,
        "wish_title": wish.get("title"),
        "status": "negotiating",
        "created_at": datetime.now(timezone.utc)
    }
    await db.chat_rooms.insert_one(chat_room)
    
    # Send initial message
    message = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "room_id": room_id,
        "sender_id": current_user.user_id,
        "sender_type": "agent",
        "content": f"Hi! I'm {current_user.name} and I can help with your request.",
        "created_at": datetime.now(timezone.utc)
    }
    await db.messages.insert_one(message)
    
    # Update wish status
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
    
    # Enrich with wisher info
    for wish in wishes:
        wisher = await db.users.find_one({"user_id": wish["user_id"]}, {"_id": 0, "name": 1, "picture": 1, "phone": 1})
        if wisher:
            wish["wisher_name"] = wisher.get("name")
            wish["wisher_picture"] = wisher.get("picture")
            wish["wisher_phone"] = wisher.get("phone")
    
    return wishes

@api_router.put("/agent/wishes/{wish_id}/complete")
async def complete_wish(wish_id: str, current_user: User = Depends(require_agent)):
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
    
    # Record earnings
    earning = {
        "earning_id": f"earn_{uuid.uuid4().hex[:12]}",
        "agent_id": current_user.user_id,
        "wish_id": wish_id,
        "amount": wish.get("remuneration", 0),
        "type": "wish",
        "description": wish.get("title", "Wish completed"),
        "created_at": datetime.now(timezone.utc)
    }
    await db.earnings.insert_one(earning)
    
    # Update agent stats
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {
            "$inc": {
                "agent_total_deliveries": 1,
                "agent_total_earnings": wish.get("remuneration", 0)
            }
        }
    )
    
    # Update chat room status
    await db.chat_rooms.update_one(
        {"wish_id": wish_id},
        {"$set": {"status": "completed"}}
    )
    
    return {"message": "Wish completed successfully"}

# ===================== AGENT CHAT =====================

@api_router.get("/agent/chat/rooms")
async def get_agent_chat_rooms(current_user: User = Depends(require_agent)):
    """Get chat rooms for agent"""
    rooms = await db.chat_rooms.find(
        {"agent_id": current_user.user_id},
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

@api_router.get("/agent/chat/rooms/{room_id}/messages")
async def get_agent_chat_messages(room_id: str, current_user: User = Depends(require_agent)):
    """Get messages in a chat room"""
    room = await db.chat_rooms.find_one(
        {"room_id": room_id, "agent_id": current_user.user_id},
        {"_id": 0}
    )
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    messages = await db.messages.find(
        {"room_id": room_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    return messages

@api_router.post("/agent/chat/rooms/{room_id}/messages")
async def send_agent_message(room_id: str, msg: MessageCreate, current_user: User = Depends(require_agent)):
    """Send message as agent"""
    room = await db.chat_rooms.find_one(
        {"room_id": room_id, "agent_id": current_user.user_id},
        {"_id": 0}
    )
    if not room:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    message = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "room_id": room_id,
        "sender_id": current_user.user_id,
        "sender_type": "agent",
        "content": msg.content,
        "created_at": datetime.now(timezone.utc)
    }
    await db.messages.insert_one(message)
    
    return Message(**message)

# ===================== AGENT EARNINGS =====================

@api_router.get("/agent/earnings")
async def get_earnings_summary(current_user: User = Depends(require_agent)):
    """Get earnings summary"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    async def get_total(start_date):
        result = await db.earnings.aggregate([
            {"$match": {
                "agent_id": current_user.user_id,
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
        "total": current_user.agent_total_earnings
    }

@api_router.get("/agent/earnings/history")
async def get_earnings_history(limit: int = 50, current_user: User = Depends(require_agent)):
    """Get detailed earnings history"""
    earnings = await db.earnings.find(
        {"agent_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    
    return earnings

# ===================== SEED DATA FOR TESTING =====================

@api_router.post("/seed/orders")
async def seed_sample_orders():
    """Seed sample orders for testing agent app"""
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
