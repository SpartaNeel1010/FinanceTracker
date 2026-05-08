from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum


class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    currency = Column(String, default="USD")
    monthly_budget = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    transactions = relationship("Transaction", back_populates="owner", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="owner", cascade="all, delete-orphan")
    goals = relationship("SavingsGoal", back_populates="owner", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="owner", cascade="all, delete-orphan")
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    debts = relationship("Debt", back_populates="owner", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False, default="expense")  # income / expense
    category = Column(String, nullable=False)
    subcategory = Column(String, nullable=True)
    description = Column(String, nullable=False)
    merchant = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False)
    tags = Column(String, nullable=True)  # comma-separated
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    period = Column(String, default="monthly")  # monthly / weekly / yearly
    month = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="budgets")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(Date, nullable=True)
    category = Column(String, nullable=True)
    color = Column(String, default="#0052FF")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="goals")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    billing_period = Column(String, default="monthly")  # monthly, yearly, weekly
    next_billing_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="subscriptions")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=False)  # emoji or icon name
    points = Column(Integer, default=10)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")


class Debt(Base):
    __tablename__ = "debts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    balance = Column(Float, nullable=False)
    interest_rate = Column(Float, nullable=False)  # Annual Percentage Rate (APR)
    minimum_payment = Column(Float, nullable=False)
    color = Column(String, default="#EF4444")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="debts")
