from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from auth.utils import get_current_user

router = APIRouter(
    prefix="/interests",
    tags=["interests"]
)

@router.post("/toggle", response_model=schemas.InterestInfo)
def toggle_interest(
    payload: schemas.MovieInterestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Toggle interest for a movie."""
    existing = db.query(models.MovieInterest).filter(
        models.MovieInterest.user_id == current_user.id,
        models.MovieInterest.movie_id == payload.movie_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        user_interested = False
    else:
        new_interest = models.MovieInterest(
            user_id=current_user.id,
            movie_id=payload.movie_id,
            media_type=payload.media_type,
            title=payload.title,
            poster_path=payload.poster_path,
            backdrop_path=payload.backdrop_path,
            release_date=payload.release_date
        )
        db.add(new_interest)
        db.commit()
        user_interested = True

    count = db.query(models.MovieInterest).filter(
        models.MovieInterest.movie_id == payload.movie_id
    ).count()

    return {"count": count, "user_interested": user_interested}

@router.get("/{movie_id}", response_model=schemas.InterestInfo)
def get_interest_info(
    movie_id: int,
    db: Session = Depends(get_db),
    user_id: int = None  # Optional user_id to check if they are interested
):
    """Get interest count and user status for a movie."""
    count = db.query(models.MovieInterest).filter(
        models.MovieInterest.movie_id == movie_id
    ).count()

    user_interested = False
    if user_id:
        existing = db.query(models.MovieInterest).filter(
            models.MovieInterest.user_id == user_id,
            models.MovieInterest.movie_id == movie_id
        ).first()
        user_interested = existing is not None

    return {"count": count, "user_interested": user_interested}

@router.get("/user/all", response_model=List[schemas.MovieInterestOut])
def get_user_interests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all movies the user is interested in."""
    return db.query(models.MovieInterest).filter(
        models.MovieInterest.user_id == current_user.id
    ).order_by(models.MovieInterest.created_at.desc()).all()
