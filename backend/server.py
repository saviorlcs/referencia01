import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# Create the main app without a prefix
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://SEU-SITE.netlify.app",  # depois troque isso pelo endereço real do Netlify
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Garante que caminhos relativos apontem para a pasta "backend"
BASE_DIR = Path(__file__).parent
os.chdir(BASE_DIR)

COSMETICS_FILE = BASE_DIR / "cosmetics_data.json"
ANIMATED_FILE = BASE_DIR / "animated_cosmetics.json"
# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ==================== Models ====================
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    nick_tag: Optional[str] = (
        None  # formato: nome#tag (nome: 4-16 chars, tag: 3-4 chars)
    )
    nick_tag_last_changed: Optional[datetime] = None  # última vez que alterou nick#tag
    photo: Optional[str] = None
    xp: int = 0
    level: int = 1
    coins: int = 0
    total_study_time: int = 0  # em segundos
    owned_cosmetics: List[str] = []  # IDs dos cosméticos comprados
    active_cosmetics: Dict[str, str] = {}  # tipo: id do cosmético

    # Novos campos para persistência completa
    study_subjects: List[Dict[str, Any]] = []  # Lista de matérias salvas
    study_time_minutes: int = 50  # Tempo padrão de estudo
    break_time_minutes: int = 10  # Tempo padrão de pausa
    selected_alarm: str = "bell"  # Alarme selecionado
    notification_volume: float = 0.5  # Volume das notificações (0.0 a 1.0)
    completed_cycles: int = 0  # Total de ciclos completos
    current_theme: str = "dark"  # Tema atual (dark/light)

    # Metas
    daily_goal_minutes: int = 120  # Meta diária em minutos
    weekly_goal_minutes: int = 600  # Meta semanal em minutos

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: str
    name: str
    photo: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    nick_tag: Optional[str] = None  # formato: nome#tag


class NickTagUpdate(BaseModel):
    nick_tag: str  # formato obrigatório: nome#tag


class FriendRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    friend_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False


class MessageCreate(BaseModel):
    receiver_id: str
    content: str


class StudySession(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    subject: str
    duration: int  # em segundos
    xp_earned: int
    coins_earned: int
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StudySessionCreate(BaseModel):
    subject: str
    duration: int  # em segundos


class CosmeticItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # badge, border, background
    price: int
    description: str
    style_data: Dict[str, Any]  # dados de estilo específicos (cor, gradiente, etc)


class CosmeticItemCreate(BaseModel):
    name: str
    type: str
    price: int
    description: str
    style_data: Dict[str, Any]


class Quest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    target: int  # objetivo (ex: 120 minutos)
    progress: int = 0
    xp_reward: int
    coins_reward: int
    expires_at: datetime
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Group(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    owner_id: str
    members: List[str] = []  # IDs dos membros
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GroupCreate(BaseModel):
    name: str
    description: str


# ==================== Auth Dependency ====================
async def get_current_user(authorization: str = Header(None)) -> str:
    """Get user ID from authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        user_id = authorization.replace("Bearer ", "")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authorization token")


# ==================== Helper Functions ====================
def calculate_xp(duration_seconds: int) -> int:
    """Calcula XP baseado no tempo de estudo (1 minuto = 10 XP)"""
    minutes = duration_seconds // 60
    return minutes * 10


def calculate_coins(duration_seconds: int) -> int:
    """Calcula moedas baseado no tempo de estudo (1 minuto = 5 moedas)"""
    minutes = duration_seconds // 60
    return minutes * 5


def calculate_level(xp: int) -> int:
    """Calcula nível baseado no XP (nível = XP // 1000 + 1)"""
    return (xp // 1000) + 1


async def generate_nick_tag(name: str) -> str:
    """Gera um nick#tag único aleatório"""
    base_nick = name.replace(" ", "").lower()[:8]
    tag = str(uuid.uuid4().int)[:4]
    nick_tag = f"{base_nick}#{tag}"

    # Verifica se já existe
    existing = await db.users.find_one({"nick_tag": nick_tag})
    if existing:
        return await generate_nick_tag(name)  # tenta novamente

    return nick_tag


def validate_nick_tag(nick_tag: str) -> tuple[bool, str]:
    """
    Valida formato do nick#tag
    Regras: nome de 4-16 caracteres alfanuméricos, tag de 3-4 caracteres alfanuméricos
    Retorna: (válido, mensagem de erro)
    """
    if not nick_tag or "#" not in nick_tag:
        return False, "Formato inválido. Use: nome#tag"

    parts = nick_tag.split("#")
    if len(parts) != 2:
        return False, "Formato inválido. Use apenas um # separando nome e tag"

    nick, tag = parts

    # Validar nome (4-16 caracteres alfanuméricos)
    if len(nick) < 4 or len(nick) > 16:
        return False, "Nome deve ter entre 4 e 16 caracteres"

    if not nick.isalnum():
        return False, "Nome deve conter apenas letras e números"

    # Validar tag (3-4 caracteres alfanuméricos)
    if len(tag) < 3 or len(tag) > 4:
        return False, "Tag deve ter entre 3 e 4 caracteres"

    if not tag.isalnum():
        return False, "Tag deve conter apenas letras e números"

    return True, ""


# ==================== Routes ====================
@api_router.get("/")
async def root():
    return {"message": "Study Cycles Pro API"}


# ==================== User Routes ====================
@api_router.post("/users", response_model=User)
async def create_or_get_user(user_data: UserCreate):
    """Create user or get existing user by email"""
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})

    if existing_user:
        if isinstance(existing_user["created_at"], str):
            existing_user["created_at"] = datetime.fromisoformat(
                existing_user["created_at"]
            )
        return existing_user

    # Gera nick#tag único
    nick_tag = await generate_nick_tag(user_data.name)

    user = User(**user_data.model_dump(), nick_tag=nick_tag)
    doc = user.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.users.insert_one(doc)
    return user


@api_router.get("/users/me", response_model=User)
async def get_current_user_data(user_id: str = Depends(get_current_user)):
    """Get current user data"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])

    return user


@api_router.put("/users/me", response_model=User)
async def update_current_user(
    user_update: UserUpdate, user_id: str = Depends(get_current_user)
):
    """Update current user data (name only)"""
    update_data = {}

    if user_update.name:
        update_data["name"] = user_update.name

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = await db.users.update_one({"id": user_id}, {"$set": update_data})

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    if user.get("nick_tag_last_changed") and isinstance(
        user["nick_tag_last_changed"], str
    ):
        user["nick_tag_last_changed"] = datetime.fromisoformat(
            user["nick_tag_last_changed"]
        )

    return user


@api_router.put("/users/me/settings")
async def update_user_settings(
    study_subjects: Optional[List[Dict[str, Any]]] = None,
    study_time_minutes: Optional[int] = None,
    break_time_minutes: Optional[int] = None,
    selected_alarm: Optional[str] = None,
    current_theme: Optional[str] = None,
    user_id: str = Depends(get_current_user),
):
    """Update user settings and preferences"""
    update_data = {}

    if study_subjects is not None:
        update_data["study_subjects"] = study_subjects
    if study_time_minutes is not None:
        update_data["study_time_minutes"] = study_time_minutes
    if break_time_minutes is not None:
        update_data["break_time_minutes"] = break_time_minutes
    if selected_alarm is not None:
        update_data["selected_alarm"] = selected_alarm
    if current_theme is not None:
        update_data["current_theme"] = current_theme

    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    await db.users.update_one({"id": user_id}, {"$set": update_data})

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    if user.get("nick_tag_last_changed") and isinstance(
        user["nick_tag_last_changed"], str
    ):
        user["nick_tag_last_changed"] = datetime.fromisoformat(
            user["nick_tag_last_changed"]
        )

    return user


@api_router.post("/users/me/cycle-complete")
async def complete_cycle(user_id: str = Depends(get_current_user)):
    """Mark a cycle as complete"""
    await db.users.update_one({"id": user_id}, {"$inc": {"completed_cycles": 1}})
    return {"message": "Cycle completed"}


@api_router.put("/users/me/nicktag", response_model=User)
async def update_nick_tag(
    nick_tag_data: NickTagUpdate, user_id: str = Depends(get_current_user)
):
    """Update user nick#tag (can only change every 60 days)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validar formato
    valid, error_msg = validate_nick_tag(nick_tag_data.nick_tag)
    if not valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Verificar se já existe outro usuário com este nick#tag
    existing = await db.users.find_one(
        {"nick_tag": nick_tag_data.nick_tag, "id": {"$ne": user_id}}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Este nick#tag já está em uso")

    # Verificar se pode alterar (60 dias)
    if user.get("nick_tag_last_changed"):
        last_changed = user["nick_tag_last_changed"]
        if isinstance(last_changed, str):
            last_changed = datetime.fromisoformat(last_changed)

        days_since_change = (datetime.now(timezone.utc) - last_changed).days
        if days_since_change < 60:
            days_remaining = 60 - days_since_change
            raise HTTPException(
                status_code=400,
                detail=f"Você pode alterar seu nick#tag novamente em {days_remaining} dias",
            )

    # Atualizar nick#tag
    now = datetime.now(timezone.utc)
    result = await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "nick_tag": nick_tag_data.nick_tag,
                "nick_tag_last_changed": now.isoformat(),
            }
        },
    )

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if isinstance(user["created_at"], str):
        user["created_at"] = datetime.fromisoformat(user["created_at"])
    if isinstance(user["nick_tag_last_changed"], str):
        user["nick_tag_last_changed"] = datetime.fromisoformat(
            user["nick_tag_last_changed"]
        )

    return user


@api_router.get("/users/search")
async def search_users(query: str, user_id: str = Depends(get_current_user)):
    """Search users by name, email or nick_tag"""
    users = (
        await db.users.find(
            {
                "$and": [
                    {"id": {"$ne": user_id}},
                    {
                        "$or": [
                            {"name": {"$regex": query, "$options": "i"}},
                            {"email": {"$regex": query, "$options": "i"}},
                            {"nick_tag": {"$regex": query, "$options": "i"}},
                        ]
                    },
                ]
            },
            {"_id": 0},
        )
        .limit(10)
        .to_list(10)
    )

    return users


# ==================== Study Session Routes ====================
@api_router.post("/sessions", response_model=StudySession)
async def create_study_session(
    session_data: StudySessionCreate, user_id: str = Depends(get_current_user)
):
    """Create a study session and update user stats"""
    xp_earned = calculate_xp(session_data.duration)
    coins_earned = calculate_coins(session_data.duration)

    session = StudySession(
        user_id=user_id,
        subject=session_data.subject,
        duration=session_data.duration,
        xp_earned=xp_earned,
        coins_earned=coins_earned,
    )

    doc = session.model_dump()
    doc["date"] = doc["date"].isoformat()
    await db.study_sessions.insert_one(doc)

    # Atualiza stats do usuário
    user = await db.users.find_one({"id": user_id})
    new_xp = user["xp"] + xp_earned
    new_level = calculate_level(new_xp)

    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {
                "xp": xp_earned,
                "coins": coins_earned,
                "total_study_time": session_data.duration,
            },
            "$set": {"level": new_level},
        },
    )

    # Atualiza progresso das quests ativas
    active_quests = await db.quests.find(
        {
            "user_id": user_id,
            "completed": False,
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()},
        }
    ).to_list(100)

    for quest in active_quests:
        new_progress = quest["progress"] + (session_data.duration // 60)
        if new_progress >= quest["target"]:
            # Completa a quest
            await db.quests.update_one(
                {"id": quest["id"]},
                {"$set": {"completed": True, "progress": quest["target"]}},
            )
            # Adiciona recompensas
            await db.users.update_one(
                {"id": user_id},
                {"$inc": {"xp": quest["xp_reward"], "coins": quest["coins_reward"]}},
            )
        else:
            await db.quests.update_one(
                {"id": quest["id"]}, {"$set": {"progress": new_progress}}
            )

    return session


@api_router.get("/sessions", response_model=List[StudySession])
async def get_study_sessions(user_id: str = Depends(get_current_user), limit: int = 50):
    """Get user's study sessions"""
    sessions = (
        await db.study_sessions.find({"user_id": user_id}, {"_id": 0})
        .sort("date", -1)
        .limit(limit)
        .to_list(limit)
    )

    for session in sessions:
        if isinstance(session["date"], str):
            session["date"] = datetime.fromisoformat(session["date"])

    return sessions


@api_router.get("/sessions/report/90days")
async def get_90_days_report(user_id: str = Depends(get_current_user)):
    """Get study report for last 90 days"""
    ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)

    sessions = await db.study_sessions.find(
        {"user_id": user_id, "date": {"$gte": ninety_days_ago.isoformat()}}, {"_id": 0}
    ).to_list(10000)

    # Agrupa por dia
    daily_stats = {}
    for session in sessions:
        date_str = (
            session["date"][:10]
            if isinstance(session["date"], str)
            else session["date"].strftime("%Y-%m-%d")
        )

        if date_str not in daily_stats:
            daily_stats[date_str] = {
                "date": date_str,
                "total_minutes": 0,
                "total_xp": 0,
                "total_coins": 0,
                "sessions_count": 0,
            }

        daily_stats[date_str]["total_minutes"] += session["duration"] // 60
        daily_stats[date_str]["total_xp"] += session["xp_earned"]
        daily_stats[date_str]["total_coins"] += session["coins_earned"]
        daily_stats[date_str]["sessions_count"] += 1

    # Converte para lista ordenada
    report = sorted(daily_stats.values(), key=lambda x: x["date"])

    return {
        "days": report,
        "total_minutes": sum(d["total_minutes"] for d in report),
        "total_xp": sum(d["total_xp"] for d in report),
        "total_sessions": sum(d["sessions_count"] for d in report),
        "avg_minutes_per_day": sum(d["total_minutes"] for d in report)
        / max(len(report), 1),
    }


# ==================== Ranking Routes ====================
@api_router.get("/ranking/global")
async def get_global_ranking(limit: int = 10):
    """Get top users by XP"""
    users = (
        await db.users.find({}, {"_id": 0}).sort("xp", -1).limit(limit).to_list(limit)
    )
    return users


@api_router.get("/ranking/daily")
async def get_daily_ranking(limit: int = 10):
    """Get today's top users by study time"""
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    pipeline = [
        {"$match": {"date": {"$gte": today_start.isoformat()}}},
        {
            "$group": {
                "_id": "$user_id",
                "total_time": {"$sum": "$duration"},
                "total_xp": {"$sum": "$xp_earned"},
            }
        },
        {"$sort": {"total_time": -1}},
        {"$limit": limit},
    ]

    rankings = await db.study_sessions.aggregate(pipeline).to_list(limit)

    # Busca dados dos usuários
    user_ids = [r["_id"] for r in rankings]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(
        len(user_ids)
    )

    # Combina dados
    result = []
    for rank in rankings:
        user = next((u for u in users if u["id"] == rank["_id"]), None)
        if user:
            result.append(
                {
                    "user": user,
                    "daily_time": rank["total_time"],
                    "daily_xp": rank["total_xp"],
                }
            )

    return result


@api_router.get("/ranking/weekly")
async def get_weekly_ranking(limit: int = 10):
    """Get this week's top users by study time"""
    week_start = datetime.now(timezone.utc) - timedelta(days=7)

    pipeline = [
        {"$match": {"date": {"$gte": week_start.isoformat()}}},
        {
            "$group": {
                "_id": "$user_id",
                "total_time": {"$sum": "$duration"},
                "total_xp": {"$sum": "$xp_earned"},
            }
        },
        {"$sort": {"total_time": -1}},
        {"$limit": limit},
    ]

    rankings = await db.study_sessions.aggregate(pipeline).to_list(limit)

    user_ids = [r["_id"] for r in rankings]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(
        len(user_ids)
    )

    result = []
    for rank in rankings:
        user = next((u for u in users if u["id"] == rank["_id"]), None)
        if user:
            result.append(
                {
                    "user": user,
                    "weekly_time": rank["total_time"],
                    "weekly_xp": rank["total_xp"],
                }
            )

    return result


@api_router.get("/ranking/monthly")
async def get_monthly_ranking(limit: int = 10):
    """Get this month's top users by study time"""
    month_start = datetime.now(timezone.utc) - timedelta(days=30)

    pipeline = [
        {"$match": {"date": {"$gte": month_start.isoformat()}}},
        {
            "$group": {
                "_id": "$user_id",
                "total_time": {"$sum": "$duration"},
                "total_xp": {"$sum": "$xp_earned"},
            }
        },
        {"$sort": {"total_time": -1}},
        {"$limit": limit},
    ]

    rankings = await db.study_sessions.aggregate(pipeline).to_list(limit)

    user_ids = [r["_id"] for r in rankings]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(
        len(user_ids)
    )

    result = []
    for rank in rankings:
        user = next((u for u in users if u["id"] == rank["_id"]), None)
        if user:
            result.append(
                {
                    "user": user,
                    "monthly_time": rank["total_time"],
                    "monthly_xp": rank["total_xp"],
                }
            )

    return result


@api_router.get("/ranking/position")
async def get_user_position(user_id: str = Depends(get_current_user)):
    """Get user's global ranking position"""
    users_above = await db.users.count_documents({"xp": {"$gt": 0}})

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    position = await db.users.count_documents({"xp": {"$gt": user["xp"]}}) + 1

    return {"position": position, "total_users": users_above + 1, "user_xp": user["xp"]}


# ==================== Friends Routes ====================
@api_router.get("/friends")
async def get_friends(user_id: str = Depends(get_current_user)):
    """Get user's friends list"""
    friend_requests = await db.friend_requests.find(
        {
            "$or": [
                {"user_id": user_id, "status": "accepted"},
                {"friend_id": user_id, "status": "accepted"},
            ]
        },
        {"_id": 0},
    ).to_list(1000)

    friend_ids = []
    for req in friend_requests:
        if req["user_id"] == user_id:
            friend_ids.append(req["friend_id"])
        else:
            friend_ids.append(req["user_id"])

    friends = await db.users.find({"id": {"$in": friend_ids}}, {"_id": 0}).to_list(1000)
    return friends


@api_router.get("/friends/requests")
async def get_friend_requests(user_id: str = Depends(get_current_user)):
    """Get pending friend requests"""
    requests = await db.friend_requests.find(
        {"friend_id": user_id, "status": "pending"}, {"_id": 0}
    ).to_list(1000)

    user_ids = [req["user_id"] for req in requests]
    users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(1000)

    result = []
    for req in requests:
        user = next((u for u in users if u["id"] == req["user_id"]), None)
        if user:
            result.append({"request_id": req["id"], "user": user})

    return result


@api_router.post("/friends/request/{friend_id}")
async def send_friend_request(friend_id: str, user_id: str = Depends(get_current_user)):
    """Send friend request"""
    if friend_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")

    existing = await db.friend_requests.find_one(
        {
            "$or": [
                {"user_id": user_id, "friend_id": friend_id},
                {"user_id": friend_id, "friend_id": user_id},
            ]
        }
    )

    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists")

    friend_request = FriendRequest(user_id=user_id, friend_id=friend_id)
    doc = friend_request.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.friend_requests.insert_one(doc)
    return {"message": "Friend request sent"}


@api_router.put("/friends/accept/{request_id}")
async def accept_friend_request(
    request_id: str, user_id: str = Depends(get_current_user)
):
    """Accept friend request"""
    result = await db.friend_requests.update_one(
        {"id": request_id, "friend_id": user_id, "status": "pending"},
        {"$set": {"status": "accepted"}},
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")

    return {"message": "Friend request accepted"}


@api_router.delete("/friends/reject/{request_id}")
async def reject_friend_request(
    request_id: str, user_id: str = Depends(get_current_user)
):
    """Reject friend request"""
    result = await db.friend_requests.delete_one(
        {"id": request_id, "friend_id": user_id, "status": "pending"}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friend request not found")

    return {"message": "Friend request rejected"}


@api_router.delete("/friends/{friend_id}")
async def remove_friend(friend_id: str, user_id: str = Depends(get_current_user)):
    """Remove a friend"""
    result = await db.friend_requests.delete_one(
        {
            "$or": [
                {"user_id": user_id, "friend_id": friend_id, "status": "accepted"},
                {"user_id": friend_id, "friend_id": user_id, "status": "accepted"},
            ]
        }
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Friend not found")

    return {"message": "Friend removed"}


# ==================== Messages Routes ====================
@api_router.get("/messages/{friend_id}")
async def get_messages(friend_id: str, user_id: str = Depends(get_current_user)):
    """Get messages with a friend"""
    messages = (
        await db.messages.find(
            {
                "$or": [
                    {"sender_id": user_id, "receiver_id": friend_id},
                    {"sender_id": friend_id, "receiver_id": user_id},
                ]
            },
            {"_id": 0},
        )
        .sort("timestamp", 1)
        .to_list(1000)
    )

    for msg in messages:
        if isinstance(msg["timestamp"], str):
            msg["timestamp"] = datetime.fromisoformat(msg["timestamp"])

    # Mark as read
    await db.messages.update_many(
        {"sender_id": friend_id, "receiver_id": user_id, "read": False},
        {"$set": {"read": True}},
    )

    return messages


@api_router.post("/messages", response_model=Message)
async def send_message(
    message_data: MessageCreate, user_id: str = Depends(get_current_user)
):
    """Send a message"""
    friendship = await db.friend_requests.find_one(
        {
            "$or": [
                {
                    "user_id": user_id,
                    "friend_id": message_data.receiver_id,
                    "status": "accepted",
                },
                {
                    "user_id": message_data.receiver_id,
                    "friend_id": user_id,
                    "status": "accepted",
                },
            ]
        }
    )

    if not friendship:
        raise HTTPException(status_code=403, detail="Can only message friends")

    message = Message(
        sender_id=user_id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
    )

    doc = message.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()

    await db.messages.insert_one(doc)
    return message


@api_router.get("/messages/unread/count")
async def get_unread_count(user_id: str = Depends(get_current_user)):
    """Get unread messages count"""
    count = await db.messages.count_documents({"receiver_id": user_id, "read": False})
    return {"count": count}


# ==================== Cosmetics Routes ====================
@api_router.get("/cosmetics", response_model=List[CosmeticItem])
async def get_cosmetics():
    """Get all available cosmetics"""
    cosmetics = await db.cosmetics.find({}, {"_id": 0}).to_list(1000)
    return cosmetics


@api_router.post("/cosmetics/buy/{item_id}")
async def buy_cosmetic(item_id: str, user_id: str = Depends(get_current_user)):
    """Buy a cosmetic item"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if item_id in user.get("owned_cosmetics", []):
        raise HTTPException(status_code=400, detail="Already owned")

    item = await db.cosmetics.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if user["coins"] < item["price"]:
        raise HTTPException(status_code=400, detail="Insufficient coins")

    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"coins": -item["price"]}, "$push": {"owned_cosmetics": item_id}},
    )

    return {"message": "Item purchased successfully"}


@api_router.put("/cosmetics/equip/{item_id}")
async def equip_cosmetic(item_id: str, user_id: str = Depends(get_current_user)):
    """Equip a cosmetic item"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if item_id not in user.get("owned_cosmetics", []):
        raise HTTPException(status_code=400, detail="Item not owned")

    item = await db.cosmetics.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Atualiza cosmético ativo do tipo
    active_cosmetics = user.get("active_cosmetics", {})
    active_cosmetics[item["type"]] = item_id

    await db.users.update_one(
        {"id": user_id}, {"$set": {"active_cosmetics": active_cosmetics}}
    )

    return {"message": "Item equipped successfully"}


@api_router.put("/cosmetics/unequip/{item_type}")
async def unequip_cosmetic(item_type: str, user_id: str = Depends(get_current_user)):
    """Unequip a cosmetic item (only for badge and border, not background)"""
    if item_type not in ["badge", "border"]:
        raise HTTPException(status_code=400, detail="Can only unequip badge or border")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    active_cosmetics = user.get("active_cosmetics", {})
    if item_type in active_cosmetics:
        del active_cosmetics[item_type]

    await db.users.update_one(
        {"id": user_id}, {"$set": {"active_cosmetics": active_cosmetics}}
    )

    return {"message": "Item unequipped successfully"}


# ==================== Quests Routes ====================
@api_router.get("/quests", response_model=List[Quest])
async def get_quests(user_id: str = Depends(get_current_user)):
    """Get user's active quests"""
    quests = await db.quests.find(
        {
            "user_id": user_id,
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()},
        },
        {"_id": 0},
    ).to_list(1000)

    for quest in quests:
        if isinstance(quest["created_at"], str):
            quest["created_at"] = datetime.fromisoformat(quest["created_at"])
        if isinstance(quest["expires_at"], str):
            quest["expires_at"] = datetime.fromisoformat(quest["expires_at"])

    return quests


@api_router.post("/quests/generate")
async def generate_quests(user_id: str = Depends(get_current_user)):
    """Generate 4 individualized weekly quests for user"""
    import random

    # Remove quests expiradas
    await db.quests.delete_many(
        {
            "user_id": user_id,
            "expires_at": {"$lt": datetime.now(timezone.utc).isoformat()},
        }
    )

    # Verifica se já tem quests ativas
    active_quests = await db.quests.count_documents(
        {
            "user_id": user_id,
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()},
            "completed": False,
        }
    )

    if active_quests >= 4:
        raise HTTPException(status_code=400, detail="Already have 4 active quests")

    # Pega estatísticas do usuário para personalizar
    user = await db.users.find_one({"id": user_id})
    user_level = user.get("level", 1)

    # Templates de quests dinâmicos e possíveis (7 dias = 1 ciclo máximo)
    quest_templates = [
        # Tempo de estudo (mais conservador)
        {
            "title": "Iniciante Focado",
            "description": "Estude por {target} minutos esta semana",
            "target": random.randint(60, 180),
            "xp_mult": 8,
            "coins_mult": 4,
            "type": "time",
        },
        {
            "title": "Estudante Aplicado",
            "description": "Acumule {target} minutos de estudo",
            "target": random.randint(120, 300),
            "xp_mult": 10,
            "coins_mult": 5,
            "type": "time",
        },
        {
            "title": "Dedicado",
            "description": "Estude por {target} minutos esta semana",
            "target": random.randint(180, 360),
            "xp_mult": 12,
            "coins_mult": 6,
            "type": "time",
        },
        # Máximo 1 ciclo completo
        {
            "title": "Complete um Ciclo",
            "description": "Finalize 1 ciclo de estudos completo",
            "target": 1,
            "xp_mult": 500,
            "coins_mult": 250,
            "type": "cycles",
        },
        # Dias de estudo
        {
            "title": "Rotina Sólida",
            "description": "Estude em {target} dias diferentes",
            "target": random.randint(3, 5),
            "xp_mult": 25,
            "coins_mult": 12,
            "type": "days",
        },
        {
            "title": "Consistência",
            "description": "Estude por {target} dias consecutivos",
            "target": random.randint(3, 5),
            "xp_mult": 30,
            "coins_mult": 15,
            "type": "days",
        },
        # Sessões (mais realista)
        {
            "title": "Produtivo",
            "description": "Complete {target} sessões de estudo",
            "target": random.randint(5, 10),
            "xp_mult": 10,
            "coins_mult": 5,
            "type": "sessions",
        },
        {
            "title": "Focado",
            "description": "Realize {target} blocos de estudo",
            "target": random.randint(8, 15),
            "xp_mult": 12,
            "coins_mult": 6,
            "type": "sessions",
        },
        # Horas totais
        {
            "title": "Meta Semanal",
            "description": "Acumule {target} horas de estudo",
            "target": random.randint(3, 8),
            "xp_mult": 60,
            "coins_mult": 30,
            "type": "hours",
        },
    ]

    # Seleciona 4 quests aleatórias de tipos diferentes
    selected = []
    used_types = set()
    random.shuffle(quest_templates)

    for template in quest_templates:
        if template["type"] not in used_types and len(selected) < 4:
            selected.append(template)
            used_types.add(template["type"])

    # Garante 4 quests (pega extras se necessário)
    while len(selected) < 4:
        template = random.choice(quest_templates)
        selected.append(template)

    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    for template in selected[: 4 - active_quests]:
        target = template["target"]
        xp_reward = target * template["xp_mult"] * (1 + user_level * 0.1)
        coins_reward = target * template["coins_mult"] * (1 + user_level * 0.1)

        quest = Quest(
            user_id=user_id,
            title=template["title"],
            description=template["description"].format(target=target),
            target=target,
            xp_reward=int(xp_reward),
            coins_reward=int(coins_reward),
            expires_at=expires_at,
        )

        doc = quest.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["expires_at"] = doc["expires_at"].isoformat()

        await db.quests.insert_one(doc)

    return {"message": "4 quests semanais geradas com sucesso"}


@api_router.post("/quests/reset")
async def reset_quests(user_id: str = Depends(get_current_user)):
    """Reset quests for 25 coins"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    reset_cost = 25
    if user["coins"] < reset_cost:
        raise HTTPException(status_code=400, detail="Insufficient coins")

    # Remove quests não completas
    await db.quests.delete_many({"user_id": user_id, "completed": False})

    # Desconta moedas
    await db.users.update_one({"id": user_id}, {"$inc": {"coins": -reset_cost}})

    return {"message": "Quests resetadas com sucesso"}


# ==================== Groups Routes ====================
@api_router.post("/groups", response_model=Group)
async def create_group(
    group_data: GroupCreate, user_id: str = Depends(get_current_user)
):
    """Create a new group"""
    group = Group(
        name=group_data.name,
        description=group_data.description,
        owner_id=user_id,
        members=[user_id],
    )

    doc = group.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.groups.insert_one(doc)
    return group


@api_router.get("/groups", response_model=List[Group])
async def get_user_groups(user_id: str = Depends(get_current_user)):
    """Get groups user is member of"""
    groups = await db.groups.find({"members": user_id}, {"_id": 0}).to_list(1000)

    for group in groups:
        if isinstance(group["created_at"], str):
            group["created_at"] = datetime.fromisoformat(group["created_at"])

    return groups


@api_router.post("/groups/{group_id}/join")
async def join_group(group_id: str, user_id: str = Depends(get_current_user)):
    """Join a group"""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if user_id in group.get("members", []):
        raise HTTPException(status_code=400, detail="Already a member")

    await db.groups.update_one({"id": group_id}, {"$push": {"members": user_id}})

    return {"message": "Joined group successfully"}


@api_router.delete("/groups/{group_id}/leave")
async def leave_group(group_id: str, user_id: str = Depends(get_current_user)):
    """Leave a group"""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if user_id not in group.get("members", []):
        raise HTTPException(status_code=400, detail="Not a member")

    if group["owner_id"] == user_id:
        raise HTTPException(status_code=400, detail="Owner cannot leave group")

    await db.groups.update_one({"id": group_id}, {"$pull": {"members": user_id}})

    return {"message": "Left group successfully"}


@api_router.get("/groups/{group_id}/ranking")
async def get_group_ranking(group_id: str, user_id: str = Depends(get_current_user)):
    """Get group member ranking"""
    group = await db.groups.find_one({"id": group_id})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if user_id not in group.get("members", []):
        raise HTTPException(status_code=403, detail="Not a member of this group")

    # Busca usuários do grupo
    members = (
        await db.users.find({"id": {"$in": group["members"]}}, {"_id": 0})
        .sort("xp", -1)
        .to_list(1000)
    )

    return members


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


from fastapi.responses import JSONResponse

# se já existir "app = FastAPI()", não repita
try:
    app  # só para não sobrescrever
except NameError:
    app = FastAPI()


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/_debug/cosmetics_file")
def debug_cosmetics_file():
    try:
        return {
            "exists": COSMETICS_FILE.exists(),
            "path": str(COSMETICS_FILE),
            "size": COSMETICS_FILE.stat().st_size if COSMETICS_FILE.exists() else 0,
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
