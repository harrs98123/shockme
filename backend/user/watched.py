from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user

router = APIRouter(prefix="/watched", tags=["watched"])


@router.get("", response_model=list[schemas.WatchedOut])
def get_watched(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Watched).filter(
        models.Watched.user_id == current_user.id
    ).order_by(models.Watched.watched_at.desc()).all()


@router.post("", response_model=schemas.WatchedOut, status_code=201)
def mark_watched(
    payload: schemas.WatchedCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Watched).filter(
        models.Watched.user_id == current_user.id,
        models.Watched.movie_id == payload.movie_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already marked as watched")

    item = models.Watched(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{movie_id}", status_code=204)
def unmark_watched(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    item = db.query(models.Watched).filter(
        models.Watched.user_id == current_user.id,
        models.Watched.movie_id == movie_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()


@router.get("/ids")
def get_watched_ids(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    items = db.query(models.Watched.movie_id).filter(
        models.Watched.user_id == current_user.id
    ).all()
    return [i.movie_id for i in items]
