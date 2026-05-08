from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    monthly_budget: Optional[float] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    currency: str
    monthly_budget: Optional[float]
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# ─── Transaction Schemas ─────────────────────────────────────────────────────

class TransactionCreate(BaseModel):
    amount: float
    type: str = "expense"
    category: str
    subcategory: Optional[str] = None
    description: str
    merchant: Optional[str] = None
    date: date
    notes: Optional[str] = None
    is_recurring: bool = False
    tags: Optional[str] = None


class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    date: Optional[date] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None
    tags: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str
    category: str
    subcategory: Optional[str]
    description: str
    merchant: Optional[str]
    date: date
    notes: Optional[str]
    is_recurring: bool
    tags: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionImport(BaseModel):
    transactions: List[TransactionCreate]


# ─── Budget Schemas ───────────────────────────────────────────────────────────

class BudgetCreate(BaseModel):
    category: str
    amount: float
    period: str = "monthly"
    month: Optional[int] = None
    year: Optional[int] = None


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    period: str
    month: Optional[int]
    year: Optional[int]

    class Config:
        from_attributes = True


# ─── Savings Goal Schemas ─────────────────────────────────────────────────────

class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: Optional[date] = None
    category: Optional[str] = None
    color: str = "#0052FF"


class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[date] = None
    color: Optional[str] = None


class SavingsGoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: Optional[date]
    category: Optional[str]
    color: str

    class Config:
        from_attributes = True


# ─── AI Schemas ───────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # user / assistant
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    tokens_used: Optional[int] = None


class AIAnalysisRequest(BaseModel):
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class AIAnalysisResponse(BaseModel):
    summary: str
    behavioral_insights: List[str]
    recommendations: List[str]
    anomalies: List[str]
    spending_patterns: dict


# ─── Subscription Schemas ─────────────────────────────────────────────────────

class SubscriptionCreate(BaseModel):
    name: str
    amount: float
    billing_period: str = "monthly"
    next_billing_date: date
    is_active: bool = True
    category: Optional[str] = None


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    billing_period: Optional[str] = None
    next_billing_date: Optional[date] = None
    is_active: Optional[bool] = None
    category: Optional[str] = None


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    name: str
    amount: float
    billing_period: str
    next_billing_date: date
    is_active: bool
    category: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Achievement Schemas ──────────────────────────────────────────────────────

class AchievementBase(BaseModel):
    name: str
    description: str
    icon: str
    points: int

    class Config:
        from_attributes = True

class AchievementResponse(AchievementBase):
    id: int

class UserAchievementResponse(BaseModel):
    id: int
    user_id: int
    achievement_id: int
    earned_at: datetime
    achievement: AchievementResponse

    class Config:
        from_attributes = True


# ─── Debt Schemas ─────────────────────────────────────────────────────────────

class DebtCreate(BaseModel):
    name: str
    balance: float
    interest_rate: float
    minimum_payment: float
    color: str = "#EF4444"


class DebtUpdate(BaseModel):
    name: Optional[str] = None
    balance: Optional[float] = None
    interest_rate: Optional[float] = None
    minimum_payment: Optional[float] = None
    color: Optional[str] = None


class DebtResponse(BaseModel):
    id: int
    user_id: int
    name: str
    balance: float
    interest_rate: float
    minimum_payment: float
    color: str
    created_at: datetime

    class Config:
        from_attributes = True
