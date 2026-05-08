from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
import base64
import json
import os
from openai import OpenAI
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from database import get_db
from auth import get_current_user
import models
import schemas
from typing import Optional, List
from datetime import date
import csv
import io

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=List[schemas.TransactionResponse])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)

    if category:
        q = q.filter(models.Transaction.category == category)
    if type:
        q = q.filter(models.Transaction.type == type)
    if date_from:
        q = q.filter(models.Transaction.date >= date_from)
    if date_to:
        q = q.filter(models.Transaction.date <= date_to)
    if search:
        q = q.filter(
            models.Transaction.description.ilike(f"%{search}%") |
            models.Transaction.merchant.ilike(f"%{search}%") |
            models.Transaction.notes.ilike(f"%{search}%")
        )

    return q.order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=schemas.TransactionResponse)
def create_transaction(
    tx: schemas.TransactionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transaction = models.Transaction(**tx.model_dump(), user_id=current_user.id)
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.get("/{tx_id}", response_model=schemas.TransactionResponse)
def get_transaction(
    tx_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


@router.patch("/{tx_id}", response_model=schemas.TransactionResponse)
def update_transaction(
    tx_id: int,
    update: schemas.TransactionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in update.model_dump(exclude_none=True).items():
        setattr(tx, field, value)
    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted"}


@router.post("/import/bulk", response_model=dict)
def bulk_import(
    payload: schemas.TransactionImport,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    transactions = [
        models.Transaction(**tx.model_dump(), user_id=current_user.id)
        for tx in payload.transactions
    ]
    db.add_all(transactions)
    db.commit()
    return {"imported": len(transactions)}


@router.get("/stats/summary")
def get_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    if date_from:
        q = q.filter(models.Transaction.date >= date_from)
    if date_to:
        q = q.filter(models.Transaction.date <= date_to)

    transactions = q.all()
    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")

    # Category breakdown
    category_totals = {}
    for t in transactions:
        if t.type == "expense":
            category_totals[t.category] = category_totals.get(t.category, 0) + t.amount

    # Monthly totals
    monthly = {}
    for t in transactions:
        key = f"{t.date.year}-{t.date.month:02d}"
        if key not in monthly:
            monthly[key] = {"income": 0, "expense": 0}
        monthly[key][t.type] += t.amount

    # Daily spending (for heatmap)
    daily = {}
    for t in transactions:
        if t.type == "expense":
            key = str(t.date)
            daily[key] = daily.get(key, 0) + t.amount

    # Weekday vs weekend
    weekday_total = sum(t.amount for t in transactions if t.type == "expense" and t.date.weekday() < 5)
    weekend_total = sum(t.amount for t in transactions if t.type == "expense" and t.date.weekday() >= 5)

    # Recurring charges
    recurring = [
        {"description": t.description, "amount": t.amount, "category": t.category}
        for t in transactions if t.is_recurring
    ]

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_savings": total_income - total_expense,
        "savings_rate": round((total_income - total_expense) / total_income * 100, 2) if total_income > 0 else 0,
        "transaction_count": len(transactions),
        "category_breakdown": category_totals,
        "monthly_totals": dict(sorted(monthly.items())),
        "daily_spending": daily,
        "weekday_vs_weekend": {
            "weekday": weekday_total,
            "weekend": weekend_total,
        },
        "recurring_charges": recurring,
        "avg_daily_spend": round(total_expense / max(len(daily), 1), 2),
        "top_merchant": max(
            (t.merchant for t in transactions if t.type == "expense" and t.merchant),
            key=lambda m: sum(t.amount for t in transactions if t.merchant == m),
            default=None
        ),
    }


@router.get("/stats/trends")
def get_trends(
    months: int = 6,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get spending trends by month and category"""
    from datetime import datetime, timedelta
    cutoff = datetime.now().date().replace(day=1)
    for _ in range(months - 1):
        if cutoff.month == 1:
            cutoff = cutoff.replace(year=cutoff.year - 1, month=12)
        else:
            cutoff = cutoff.replace(month=cutoff.month - 1)

    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= cutoff,
    ).all()

    # Group by month and category
    result = {}
    for t in transactions:
        key = f"{t.date.year}-{t.date.month:02d}"
        if key not in result:
            result[key] = {}
        if t.type == "expense":
            result[key][t.category] = result[key].get(t.category, 0) + t.amount

    return {"trends": dict(sorted(result.items())), "months": months}

@router.post("/scan-receipt")
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    """Scan a receipt image and return parsed transaction data"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")

        from config import get_settings
        settings = get_settings()
        client = OpenAI(api_key=settings.openai_api_key)
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are a financial receipt parser. Extract the transaction details from the image. Return ONLY a valid JSON object matching this schema: {\"amount\": float, \"merchant\": string, \"date\": \"YYYY-MM-DD\", \"category\": string, \"description\": string}. If a field cannot be determined, return null for it. Ensure amount is a positive number. Category should be one of: Housing, Transportation, Food & Dining, Utilities, Insurance, Healthcare, Savings & Investments, Personal Spending, Entertainment, Miscellaneous, Income, Other."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Parse this receipt into JSON."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{file.content_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=300
        )
        
        result_text = response.choices[0].message.content
        parsed = json.loads(result_text)
        
        return {
            "amount": parsed.get("amount", 0.0),
            "merchant": parsed.get("merchant", ""),
            "date": parsed.get("date", date.today().isoformat()),
            "category": parsed.get("category", "Other"),
            "description": parsed.get("description", "Receipt Scan")
        }
    except Exception as e:
        print(f"Error scanning receipt: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze image. Please try another photo.")
