from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from database import get_db
from auth.router import get_current_user
import models

router = APIRouter(prefix="/tierlist", tags=["tierlist"])


class TierListSave(BaseModel):
    id: int | None = None
    title: str = "My Movie Ranking"
    tiers_json: str  # JSON string of [{id, name, color, movies: [...movie objects]}]


@router.get("/all")
def get_all_tier_lists(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    lists = db.query(models.TierList).filter_by(user_id=current_user.id).order_by(models.TierList.updated_at.desc()).all()
    return lists


@router.get("")
def get_tier_list(
    id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if id:
        tier = db.query(models.TierList).filter_by(id=id, user_id=current_user.id).first()
    else:
        # Default to the most recently updated one
        tier = db.query(models.TierList).filter_by(user_id=current_user.id).order_by(models.TierList.updated_at.desc()).first()

    if not tier:
        return {"id": None, "title": "My Movie Ranking", "tiers_json": "[]"}
    return {"id": tier.id, "title": tier.title, "tiers_json": tier.tiers_json}


@router.post("/save")
def save_tier_list(
    body: TierListSave,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Validate JSON
    try:
        json.loads(body.tiers_json)
    except Exception:
        raise HTTPException(400, "Invalid JSON for tiers_json")

    if body.id:
        tier = db.query(models.TierList).filter_by(id=body.id, user_id=current_user.id).first()
        if not tier:
            raise HTTPException(404, "Tier list not found")
        tier.title = body.title
        tier.tiers_json = body.tiers_json
    else:
        tier = models.TierList(user_id=current_user.id, title=body.title, tiers_json=body.tiers_json)
        db.add(tier)

    db.commit()
    db.refresh(tier)
    return {"status": "saved", "id": tier.id}


@router.delete("/{tier_id}")
def delete_tier_list(
    tier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tier = db.query(models.TierList).filter_by(id=tier_id, user_id=current_user.id).first()
    if not tier:
        raise HTTPException(404, "Tier list not found")
    
    db.delete(tier)
    db.commit()
    return {"status": "deleted"}
