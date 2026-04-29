from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from auth.router import get_current_user
import models

router = APIRouter(prefix="/collections", tags=["collections"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = True


class MoviePayload(BaseModel):
    movie_id: int
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_year: Optional[str] = None
    vote_average: Optional[float] = None


class CollectionItemOut(BaseModel):
    id: int
    movie_id: int
    title: str
    poster_path: Optional[str]
    backdrop_path: Optional[str]
    release_year: Optional[str]
    vote_average: Optional[float]
    added_at: datetime

    class Config:
        from_attributes = True


class CollectionOut(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str]
    is_public: bool
    is_rank_list: bool
    banner_path: Optional[str] = None
    banner_movie_id: Optional[int] = None
    created_at: datetime
    item_count: int
    cover_poster: Optional[str]   # first item poster

    class Config:
        from_attributes = True

class BannerUpdate(BaseModel):
    banner_path: str
    banner_movie_id: Optional[int] = None


class CollectionDetailOut(CollectionOut):
    items: List[CollectionItemOut]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _to_out(col: models.Collection) -> dict:
    items = col.items or []
    cover = items[0].poster_path if items else None
    return {
        "id": col.id,
        "user_id": col.user_id,
        "name": col.name,
        "description": col.description,
        "is_public": col.is_public,
        "is_rank_list": col.is_rank_list,
        "banner_path": col.banner_path,
        "banner_movie_id": col.banner_movie_id,
        "created_at": col.created_at,
        "item_count": len(items),
        "cover_poster": cover,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED, response_model=CollectionOut)
def create_collection(
    body: CollectionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    col = models.Collection(
        user_id=current_user.id,
        name=body.name,
        description=body.description,
        is_public=body.is_public,
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return _to_out(col)


@router.get("", response_model=List[CollectionOut])
def list_public_collections(db: Session = Depends(get_db)):
    """All public collections (Discover view)."""
    cols = (
        db.query(models.Collection)
        .filter_by(is_public=True, is_rank_list=False)
        .order_by(models.Collection.created_at.desc())
        .all()
    )
    return [_to_out(c) for c in cols]


@router.get("/my", response_model=List[CollectionOut])
def my_collections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    cols = (
        db.query(models.Collection)
        .filter_by(user_id=current_user.id, is_rank_list=False)
        .order_by(models.Collection.created_at.desc())
        .all()
    )
    return [_to_out(c) for c in cols]


@router.get("/rank-pool", response_model=List[CollectionItemOut])
def get_rank_pool(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get the special Rank Collection (movies available for tier ranking)."""
    rank_col = (
        db.query(models.Collection)
        .filter_by(user_id=current_user.id, is_rank_list=True)
        .first()
    )
    if not rank_col:
        return []
    return rank_col.items


@router.post("/rank-pool/add", status_code=status.HTTP_200_OK)
def add_to_rank_pool(
    body: MoviePayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Add a movie to the user's special Rank Collection pool."""
    rank_col = (
        db.query(models.Collection)
        .filter_by(user_id=current_user.id, is_rank_list=True)
        .first()
    )
    if not rank_col:
        rank_col = models.Collection(
            user_id=current_user.id,
            name="My Rank Collection",
            is_public=False,
            is_rank_list=True,
        )
        db.add(rank_col)
        db.commit()
        db.refresh(rank_col)

    existing = db.query(models.CollectionItem).filter_by(
        collection_id=rank_col.id, movie_id=body.movie_id
    ).first()
    if existing:
        return {"status": "already_added"}

    item = models.CollectionItem(
        collection_id=rank_col.id,
        movie_id=body.movie_id,
        title=body.title,
        poster_path=body.poster_path,
        backdrop_path=body.backdrop_path,
        release_year=body.release_year,
        vote_average=body.vote_average,
    )
    db.add(item)
    db.commit()
    return {"status": "added"}


@router.delete("/rank-pool/remove/{movie_id}", status_code=status.HTTP_200_OK)
def remove_from_rank_pool(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rank_col = (
        db.query(models.Collection)
        .filter_by(user_id=current_user.id, is_rank_list=True)
        .first()
    )
    if rank_col:
        item = db.query(models.CollectionItem).filter_by(
            collection_id=rank_col.id, movie_id=movie_id
        ).first()
        if item:
            db.delete(item)
            db.commit()
    return {"status": "removed"}


@router.get("/{collection_id}", response_model=CollectionDetailOut)
def get_collection(collection_id: int, db: Session = Depends(get_db)):
    col = db.query(models.Collection).filter_by(id=collection_id).first()
    if not col or (not col.is_public):
        raise HTTPException(404, "Collection not found")
    result = _to_out(col)
    result["items"] = col.items
    return result


@router.post("/{collection_id}/add", status_code=status.HTTP_200_OK)
def add_movie_to_collection(
    collection_id: int,
    body: MoviePayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    col = db.query(models.Collection).filter_by(id=collection_id, user_id=current_user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found or not yours")

    existing = db.query(models.CollectionItem).filter_by(
        collection_id=collection_id, movie_id=body.movie_id
    ).first()
    if existing:
        return {"status": "already_added"}

    item = models.CollectionItem(
        collection_id=collection_id,
        movie_id=body.movie_id,
        title=body.title,
        poster_path=body.poster_path,
        backdrop_path=body.backdrop_path,
        release_year=body.release_year,
        vote_average=body.vote_average,
    )
    db.add(item)
    db.commit()
    return {"status": "added"}


@router.delete("/{collection_id}/remove/{movie_id}", status_code=status.HTTP_200_OK)
def remove_from_collection(
    collection_id: int,
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    col = db.query(models.Collection).filter_by(id=collection_id, user_id=current_user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found or not yours")

    item = db.query(models.CollectionItem).filter_by(
        collection_id=collection_id, movie_id=movie_id
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return {"status": "removed"}


@router.patch("/{collection_id}/banner", response_model=CollectionOut)
def update_collection_banner(
    collection_id: int,
    body: BannerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    col = db.query(models.Collection).filter_by(id=collection_id, user_id=current_user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found or not yours")
    
    col.banner_path = body.banner_path
    col.banner_movie_id = body.banner_movie_id
    db.commit()
    db.refresh(col)
    return _to_out(col)


@router.delete("/{collection_id}", status_code=status.HTTP_200_OK)
def delete_collection(
    collection_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    col = db.query(models.Collection).filter_by(id=collection_id, user_id=current_user.id).first()
    if not col:
        raise HTTPException(404, "Collection not found or not yours")
    db.delete(col)
    db.commit()
    return {"status": "deleted"}
