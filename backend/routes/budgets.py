from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import schemas
from typing import List

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("/", response_model=List[schemas.BudgetResponse])
def list_budgets(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(models.Budget).filter(models.Budget.user_id == current_user.id).all()


@router.post("/", response_model=schemas.BudgetResponse)
def create_budget(
    budget: schemas.BudgetCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Upsert: check if budget for category+month+year exists
    existing = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.category == budget.category,
        models.Budget.month == budget.month,
        models.Budget.year == budget.year,
    ).first()

    if existing:
        existing.amount = budget.amount
        db.commit()
        db.refresh(existing)
        return existing

    new_budget = models.Budget(**budget.model_dump(), user_id=current_user.id)
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    return new_budget


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    b = db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == current_user.id,
    ).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(b)
    db.commit()
    return {"message": "Budget deleted"}


@router.get("/vs-actual")
def budget_vs_actual(
    month: int,
    year: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from datetime import date
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == current_user.id,
        models.Budget.month == month,
        models.Budget.year == year,
    ).all()

    start = date(year, month, 1)
    import calendar
    last_day = calendar.monthrange(year, month)[1]
    end = date(year, month, last_day)

    transactions = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= start,
        models.Transaction.date <= end,
        models.Transaction.type == "expense",
    ).all()

    actual_by_category = {}
    for t in transactions:
        actual_by_category[t.category] = actual_by_category.get(t.category, 0) + t.amount

    result = []
    for b in budgets:
        actual = actual_by_category.get(b.category, 0)
        result.append({
            "category": b.category,
            "budget": b.amount,
            "actual": actual,
            "remaining": b.amount - actual,
            "percentage": round(actual / b.amount * 100, 2) if b.amount > 0 else 0,
        })

    # Categories with spending but no budget
    for cat, amount in actual_by_category.items():
        if not any(b.category == cat for b in budgets):
            result.append({
                "category": cat,
                "budget": 0,
                "actual": amount,
                "remaining": -amount,
                "percentage": 100,
            })

    return {"month": month, "year": year, "data": result}
