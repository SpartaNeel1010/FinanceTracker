from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas
from config import get_settings
from openai import OpenAI
from typing import Optional
import json
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/ai", tags=["AI"])
settings = get_settings()


def get_openai_client():
    return OpenAI(api_key=settings.openai_api_key)


def build_financial_context(user: models.User, db: Session, date_from=None, date_to=None) -> str:
    """Build a structured financial context string for the LLM"""
    q = db.query(models.Transaction).filter(models.Transaction.user_id == user.id)

    if date_from:
        q = q.filter(models.Transaction.date >= date_from)
    if date_to:
        q = q.filter(models.Transaction.date <= date_to)

    transactions = q.order_by(models.Transaction.date.desc()).all()

    if not transactions:
        return "No transaction data available for the selected period."

    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    net = total_income - total_expense

    # Category breakdown
    categories = {}
    for t in transactions:
        if t.type == "expense":
            categories[t.category] = categories.get(t.category, 0) + t.amount

    sorted_cats = sorted(categories.items(), key=lambda x: x[1], reverse=True)

    # Monthly breakdown
    monthly = {}
    for t in transactions:
        key = f"{t.date.year}-{t.date.month:02d}"
        if key not in monthly:
            monthly[key] = {"income": 0, "expense": 0}
        monthly[key][t.type] += t.amount

    # Weekday vs weekend
    weekday = sum(t.amount for t in transactions if t.type == "expense" and t.date.weekday() < 5)
    weekend = sum(t.amount for t in transactions if t.type == "expense" and t.date.weekday() >= 5)

    # Recurring charges
    recurring = [(t.description, t.amount, t.category) for t in transactions if t.is_recurring]

    # Top merchants
    merchants = {}
    for t in transactions:
        if t.merchant and t.type == "expense":
            merchants[t.merchant] = merchants.get(t.merchant, 0) + t.amount
    top_merchants = sorted(merchants.items(), key=lambda x: x[1], reverse=True)[:5]

    context = f"""
USER: {user.name} | Currency: {user.currency}
PERIOD: {date_from or 'all time'} to {date_to or 'present'}

FINANCIAL SUMMARY:
- Total Income: ${total_income:,.2f}
- Total Expenses: ${total_expense:,.2f}
- Net Savings: ${net:,.2f}
- Savings Rate: {round(net/total_income*100, 1) if total_income > 0 else 0}%
- Total Transactions: {len(transactions)}

SPENDING BY CATEGORY (top expenses):
{chr(10).join(f'- {cat}: ${amt:,.2f} ({round(amt/total_expense*100,1) if total_expense > 0 else 0}%)' for cat, amt in sorted_cats[:10])}

MONTHLY BREAKDOWN:
{chr(10).join(f'- {month}: Income ${data["income"]:,.2f}, Expense ${data["expense"]:,.2f}' for month, data in sorted(monthly.items())[-6:])}

BEHAVIORAL PATTERNS:
- Weekday spending: ${weekday:,.2f}
- Weekend spending: ${weekend:,.2f}
- Weekend ratio: {round(weekend/(weekday+weekend)*100,1) if (weekday+weekend) > 0 else 0}%

RECURRING CHARGES ({len(recurring)} found):
{chr(10).join(f'- {desc}: ${amt:,.2f} ({cat})' for desc, amt, cat in recurring[:10])}

TOP MERCHANTS:
{chr(10).join(f'- {merchant}: ${amt:,.2f}' for merchant, amt in top_merchants)}

RECENT TRANSACTIONS (last 10):
{chr(10).join(f'- {t.date}: {t.description} | ${t.amount:,.2f} | {t.category}' for t in transactions[:10])}
"""
    return context


@router.post("/analyze", response_model=schemas.AIAnalysisResponse)
def analyze_spending(
    request: schemas.AIAnalysisRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = get_openai_client()
    context = build_financial_context(
        current_user, db,
        date_from=request.date_from,
        date_to=request.date_to
    )

    system_prompt = """You are SpendSense, an expert AI financial behavior analyst. 
    Analyze the user's financial data and provide deep, personalized behavioral insights.
    Focus on patterns, habits, anomalies, and actionable recommendations.
    Be specific, empathetic, and constructive. Avoid generic advice.
    Return valid JSON matching the schema exactly."""

    user_prompt = f"""Analyze this financial data and return a JSON object with exactly these keys:
    - summary: A 2-3 sentence narrative overview of the user's financial health
    - behavioral_insights: Array of 4-6 specific behavioral observations (patterns, habits, ratios)
    - recommendations: Array of 4-5 concrete, actionable steps the user can take
    - anomalies: Array of unusual patterns or outliers detected (empty array if none)
    - spending_patterns: Object with keys: "peak_day", "highest_category", "savings_assessment", "risk_level" (low/medium/high)

    Financial Data:
    {context}"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        result = json.loads(response.choices[0].message.content)
        return schemas.AIAnalysisResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(
    request: schemas.ChatRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    client = get_openai_client()

    # Get last 90 days of data for context
    date_from = (datetime.now() - timedelta(days=90)).date()
    context = build_financial_context(current_user, db, date_from=date_from)

    system_prompt = f"""You are SpendSense, an AI financial assistant with access to the user's transaction data.
    Answer questions about their finances clearly, specifically, and helpfully.
    Use the financial data provided to give precise answers. Be conversational but insightful.
    If you don't have enough data to answer, say so honestly.
    
    CURRENT USER FINANCIAL DATA:
    {context}"""

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history
    for msg in (request.history or [])[-10:]:  # Last 10 messages
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )

        reply = response.choices[0].message.content
        tokens = response.usage.total_tokens

        return schemas.ChatResponse(reply=reply, tokens_used=tokens)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/insights/behavioral")
def get_behavioral_insights(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pre-computed behavioral insight cards (no LLM, fast)"""
    from datetime import datetime, timedelta
    now = datetime.now().date()
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)

    recent = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= thirty_days_ago,
        models.Transaction.type == "expense",
    ).all()

    previous = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= sixty_days_ago,
        models.Transaction.date < thirty_days_ago,
        models.Transaction.type == "expense",
    ).all()

    insights = []

    # Insight 1: Weekend spender?
    weekday = sum(t.amount for t in recent if t.date.weekday() < 5)
    weekend = sum(t.amount for t in recent if t.date.weekday() >= 5)
    total = weekday + weekend
    if total > 0:
        weekend_pct = round(weekend / total * 100, 1)
        if weekend_pct > 40:
            insights.append({
                "type": "behavioral",
                "icon": "",
                "title": "Weekend Spender Detected",
                "description": f"You spend {weekend_pct}% of your money on weekends. Weekend discretionary spending is a common overspending trigger.",
                "severity": "warning" if weekend_pct > 50 else "info",
                "value": f"{weekend_pct}%",
                "trend": "up",
            })

    # Insight 2: Category concentration
    categories = {}
    for t in recent:
        categories[t.category] = categories.get(t.category, 0) + t.amount
    if categories:
        top_cat = max(categories, key=categories.get)
        top_pct = round(categories[top_cat] / sum(categories.values()) * 100, 1)
        if top_pct > 35:
            insights.append({
                "type": "concentration",
                "icon": "",
                "title": f"High {top_cat} Concentration",
                "description": f"{top_cat} accounts for {top_pct}% of your expenses this month. High category concentration can indicate a spending blind spot.",
                "severity": "warning",
                "value": f"{top_pct}%",
                "trend": "neutral",
            })

    # Insight 3: Month-over-month change
    recent_total = sum(t.amount for t in recent)
    prev_total = sum(t.amount for t in previous)
    if prev_total > 0:
        change_pct = round((recent_total - prev_total) / prev_total * 100, 1)
        insights.append({
            "type": "trend",
            "icon": "" if change_pct > 0 else "",
            "title": f"Spending {'Up' if change_pct > 0 else 'Down'} {abs(change_pct)}%",
            "description": f"Your spending {'increased' if change_pct > 0 else 'decreased'} by {abs(change_pct)}% compared to last month (${prev_total:,.0f} → ${recent_total:,.0f}).",
            "severity": "danger" if change_pct > 20 else ("success" if change_pct < -10 else "info"),
            "value": f"{'+'if change_pct>0 else ''}{change_pct}%",
            "trend": "up" if change_pct > 0 else "down",
        })

    # Insight 4: Recurring charges
    recurring = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.is_recurring == True,
    ).all()
    if recurring:
        recurring_total = sum(t.amount for t in recurring)
        insights.append({
            "type": "recurring",
            "icon": "",
            "title": f"{len(set(t.description for t in recurring))} Recurring Charges",
            "description": f"You have ${recurring_total:,.2f}/month in recurring charges including subscriptions and bills.",
            "severity": "info",
            "value": f"${recurring_total:,.0f}/mo",
            "trend": "neutral",
        })

    # Insight 5: Average transaction size
    if recent:
        avg = sum(t.amount for t in recent) / len(recent)
        insights.append({
            "type": "pattern",
            "icon": "",
            "title": "Average Transaction Size",
            "description": f"Your average transaction is ${avg:,.2f}. {'You tend to make many small purchases.' if avg < 30 else 'You tend to make larger, deliberate purchases.'}",
            "severity": "info",
            "value": f"${avg:,.0f}",
            "trend": "neutral",
        })

    return {"insights": insights, "period": "last_30_days"}
