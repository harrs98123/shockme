from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[schemas.FavoriteOut])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id
    ).order_by(models.Favorite.added_at.desc()).all()


@router.post("", response_model=schemas.FavoriteOut, status_code=201)
def add_favorite(
    payload: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.movie_id == payload.movie_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")

    fav = models.Favorite(user_id=current_user.id, **payload.model_dump())
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{movie_id}", status_code=204)
def remove_favorite(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id,
        models.Favorite.movie_id == movie_id
    ).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(fav)
    db.commit()


@router.get("/ids")
def get_favorite_ids(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Returns just the movie IDs for fast client-side lookup."""
    favs = db.query(models.Favorite.movie_id).filter(
        models.Favorite.user_id == current_user.id
    ).all()
    return [f.movie_id for f in favs]
