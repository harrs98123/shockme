from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=list[schemas.WatchlistOut])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id
    ).order_by(models.Watchlist.added_at.desc()).all()


@router.post("", response_model=schemas.WatchlistOut, status_code=201)
def add_to_watchlist(
    payload: schemas.WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id,
        models.Watchlist.movie_id == payload.movie_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")

    item = models.Watchlist(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{movie_id}", status_code=204)
def remove_from_watchlist(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.Watchlist).filter(
        models.Watchlist.user_id == current_user.id,
        models.Watchlist.movie_id == movie_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()


@router.get("/ids")
def get_watchlist_ids(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    items = db.query(models.Watchlist.movie_id).filter(
        models.Watchlist.user_id == current_user.id
    ).all()
    return [i.movie_id for i in items]
