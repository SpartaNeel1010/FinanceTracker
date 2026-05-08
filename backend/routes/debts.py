from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/debts", tags=["Debts"])

@router.get("/", response_model=List[schemas.DebtResponse])
def get_debts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Debt).filter(models.Debt.user_id == current_user.id).all()

@router.post("/", response_model=schemas.DebtResponse)
def create_debt(debt: schemas.DebtCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_debt = models.Debt(**debt.model_dump(), user_id=current_user.id)
    db.add(db_debt)
    db.commit()
    db.refresh(db_debt)
    return db_debt

@router.put("/{debt_id}", response_model=schemas.DebtResponse)
def update_debt(debt_id: int, debt: schemas.DebtUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_debt = db.query(models.Debt).filter(models.Debt.id == debt_id, models.Debt.user_id == current_user.id).first()
    if not db_debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    update_data = debt.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_debt, key, value)
    
    db.commit()
    db.refresh(db_debt)
    return db_debt

@router.delete("/{debt_id}")
def delete_debt(debt_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_debt = db.query(models.Debt).filter(models.Debt.id == debt_id, models.Debt.user_id == current_user.id).first()
    if not db_debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    db.delete(db_debt)
    db.commit()
    return {"message": "Debt deleted successfully"}

@router.get("/payoff-strategy")
def payoff_strategy(strategy: str = "avalanche", extra_payment: float = 0.0, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Avalanche: Highest interest first
    # Snowball: Lowest balance first
    debts = db.query(models.Debt).filter(models.Debt.user_id == current_user.id).all()
    if not debts:
        return {"months": 0, "schedule": [], "total_interest": 0}

    # Deep copy for simulation
    sim_debts = [{"id": d.id, "name": d.name, "balance": d.balance, "rate": d.interest_rate, "min_pay": d.minimum_payment, "color": d.color} for d in debts]
    
    months = 0
    total_interest = 0
    schedule = []
    
    while any(d["balance"] > 0 for d in sim_debts) and months < 360: # Max 30 years
        months += 1
        month_interest = 0
        
        # Sort for strategy targeting
        if strategy == "snowball":
            sim_debts.sort(key=lambda x: (x["balance"] <= 0, x["balance"]))
        else: # avalanche
            sim_debts.sort(key=lambda x: (x["balance"] <= 0, -x["rate"]))
            
        available_cash = extra_payment + sum(d["min_pay"] for d in sim_debts if d["balance"] > 0)
        
        for d in sim_debts:
            if d["balance"] <= 0:
                continue
                
            # Add interest (annual rate / 12)
            interest = d["balance"] * (d["rate"] / 100 / 12)
            d["balance"] += interest
            month_interest += interest
            total_interest += interest
            
            # Minimum payment
            payment = min(d["min_pay"], d["balance"])
            d["balance"] -= payment
            available_cash -= payment
            
        # Apply remaining available cash to the target debt
        target = next((d for d in sim_debts if d["balance"] > 0), None)
        if target and available_cash > 0:
            extra = min(available_cash, target["balance"])
            target["balance"] -= extra
            
        schedule.append({
            "month": months,
            "total_balance": sum(d["balance"] for d in sim_debts if d["balance"] > 0),
            "interest_paid": month_interest
        })
        
    return {"months": months, "total_interest": round(total_interest, 2), "schedule": schedule}
