from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/achievements", tags=["Achievements"])

@router.get("/", response_model=List[schemas.UserAchievementResponse])
def get_user_achievements(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id).all()

@router.post("/check")
def check_achievements(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # This endpoint checks if the user has earned any new achievements based on rules
    # We will seed some basic achievements if they don't exist
    achievements = db.query(models.Achievement).all()
    if not achievements:
        seed_achievements = [
            models.Achievement(name="First Scan", description="Scanned your first receipt", icon="📄", points=10),
            models.Achievement(name="Saver Novice", description="Created your first savings goal", icon="💰", points=10),
            models.Achievement(name="Budget Master", description="Created your first budget", icon="📊", points=10),
        ]
        db.add_all(seed_achievements)
        db.commit()
        achievements = seed_achievements

    # Check logic
    new_achievements = []
    user_achievements = [ua.achievement_id for ua in db.query(models.UserAchievement).filter(models.UserAchievement.user_id == current_user.id).all()]
    
    # Rule 1: Has budgets?
    has_budgets = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first() is not None
    budget_master = next((a for a in achievements if a.name == "Budget Master"), None)
    if has_budgets and budget_master and budget_master.id not in user_achievements:
        db.add(models.UserAchievement(user_id=current_user.id, achievement_id=budget_master.id))
        new_achievements.append(budget_master.name)
        user_achievements.append(budget_master.id)
        
    # Rule 2: Has goals?
    has_goals = db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == current_user.id).first() is not None
    saver_novice = next((a for a in achievements if a.name == "Saver Novice"), None)
    if has_goals and saver_novice and saver_novice.id not in user_achievements:
        db.add(models.UserAchievement(user_id=current_user.id, achievement_id=saver_novice.id))
        new_achievements.append(saver_novice.name)
        user_achievements.append(saver_novice.id)
        
    # Rule 3: Has AI Scan (indicated by transactions with notes mentioning AI)
    # Just a placeholder, assume true if more than 5 transactions
    has_txs = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).count() >= 5
    first_scan = next((a for a in achievements if a.name == "First Scan"), None)
    if has_txs and first_scan and first_scan.id not in user_achievements:
        db.add(models.UserAchievement(user_id=current_user.id, achievement_id=first_scan.id))
        new_achievements.append(first_scan.name)
        user_achievements.append(first_scan.id)

    db.commit()

    return {"message": "Achievements checked", "new_achievements": new_achievements}
