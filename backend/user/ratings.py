from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import Optional

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("", status_code=200)
def submit_rating(
    payload: schemas.RatingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not (1.0 <= payload.rating <= 5.0):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    existing = db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id,
        models.Rating.movie_id == payload.movie_id,
        models.Rating.media_type == payload.media_type
    ).first()

    if existing:
        existing.rating = payload.rating
        if payload.genre_ids:
            existing.genre_ids = payload.genre_ids
        db.commit()
        db.refresh(existing)
        rating_obj = existing
    else:
        rating_obj = models.Rating(
            user_id=current_user.id,
            movie_id=payload.movie_id,
            media_type=payload.media_type,
            rating=payload.rating,
            genre_ids=payload.genre_ids
        )
        db.add(rating_obj)
        db.commit()
        db.refresh(rating_obj)

    # Return stats
    stats = db.query(
        func.avg(models.Rating.rating).label("average"),
        func.count(models.Rating.id).label("count")
    ).filter(
        models.Rating.movie_id == payload.movie_id,
        models.Rating.media_type == payload.media_type
    ).first()

    return {
        "average": round(stats.average or 0, 1),
        "count": stats.count,
        "user_rating": rating_obj.rating
    }


@router.get("/{movie_id}", response_model=schemas.RatingOut)
def get_movie_rating(
    movie_id: int,
    media_type: str = Query("movie"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    stats = db.query(
        func.avg(models.Rating.rating).label("average"),
        func.count(models.Rating.id).label("count")
    ).filter(
        models.Rating.movie_id == movie_id,
        models.Rating.media_type == media_type
    ).first()

    user_rating = None
    if current_user:
        user_r = db.query(models.Rating).filter(
            models.Rating.user_id == current_user.id,
            models.Rating.movie_id == movie_id,
            models.Rating.media_type == media_type
        ).first()
        user_rating = user_r.rating if user_r else None

    return {
        "average": round(stats.average or 0, 1),
        "count": stats.count or 0,
        "user_rating": user_rating
    }
