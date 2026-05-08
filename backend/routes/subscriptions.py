from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/", response_model=List[schemas.SubscriptionResponse])
def get_subscriptions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).all()

@router.post("/", response_model=schemas.SubscriptionResponse)
def create_subscription(subscription: schemas.SubscriptionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subscription = models.Subscription(**subscription.model_dump(), user_id=current_user.id)
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription

@router.put("/{subscription_id}", response_model=schemas.SubscriptionResponse)
def update_subscription(subscription_id: int, subscription: schemas.SubscriptionUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id, models.Subscription.user_id == current_user.id).first()
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    update_data = subscription.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subscription, key, value)
    
    db.commit()
    db.refresh(db_subscription)
    return db_subscription

@router.delete("/{subscription_id}")
def delete_subscription(subscription_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id, models.Subscription.user_id == current_user.id).first()
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    db.delete(db_subscription)
    db.commit()
    return {"message": "Subscription deleted successfully"}
