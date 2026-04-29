import os
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import List
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

router = APIRouter(prefix="/admin", tags=["admin"])


# ─── Guard ───────────────────────────────────────────────────────────────────

def get_admin_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ─── Stats ───────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=schemas.AdminStats)
def get_stats(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    total_users = db.query(models.User).count()
    total_franchises = db.query(models.Franchise).count()
    total_gems = db.query(models.GemOverride).count()
    total_must_watch = db.query(models.MustWatch).count()
    recent_users = (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .limit(10)
        .all()
    )
    return schemas.AdminStats(
        total_users=total_users,
        total_franchises=total_franchises,
        total_gems=total_gems,
        total_must_watch=total_must_watch,
        recent_users=recent_users,
    )


# ─── Users ───────────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[schemas.UserOut])
def list_users(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    offset = (page - 1) * limit
    return (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_admin_user),
):
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ─── Franchises — Public ─────────────────────────────────────────────────────

@router.get("/franchises/public", response_model=List[schemas.FranchiseOut])
def list_franchises_public(db: Session = Depends(get_db)):
    """Public endpoint — no auth needed. Used by frontend franchise page."""
    return db.query(models.Franchise).order_by(models.Franchise.created_at.desc()).all()


# ─── Franchises — Admin ──────────────────────────────────────────────────────

@router.get("/franchises", response_model=List[schemas.FranchiseOut])
def list_franchises(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    return db.query(models.Franchise).order_by(models.Franchise.created_at.desc()).all()


@router.post("/franchises", response_model=schemas.FranchiseOut)
def create_franchise(
    payload: schemas.FranchiseCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    franchise = models.Franchise(
        name=payload.name,
        description=payload.description,
        color=payload.color,
        icon_emoji=payload.icon_emoji,
        movie_ids=[],
    )
    db.add(franchise)
    db.commit()
    db.refresh(franchise)
    return franchise


@router.put("/franchises/{franchise_id}", response_model=schemas.FranchiseOut)
def update_franchise(
    franchise_id: int,
    payload: schemas.FranchiseUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    franchise = db.query(models.Franchise).filter(models.Franchise.id == franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
    if payload.name is not None:
        franchise.name = payload.name
    if payload.description is not None:
        franchise.description = payload.description
    if payload.color is not None:
        franchise.color = payload.color
    if payload.icon_emoji is not None:
        franchise.icon_emoji = payload.icon_emoji
    db.commit()
    db.refresh(franchise)
    return franchise


@router.delete("/franchises/{franchise_id}")
def delete_franchise(
    franchise_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    franchise = db.query(models.Franchise).filter(models.Franchise.id == franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
    db.delete(franchise)
    db.commit()
    return {"message": "Franchise deleted"}


@router.post("/franchises/{franchise_id}/movies")
def add_movie_to_franchise(
    franchise_id: int,
    movie_id: int = Query(...),
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    franchise = db.query(models.Franchise).filter(models.Franchise.id == franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
    current_ids = list(franchise.movie_ids or [])
    if movie_id not in current_ids:
        current_ids.append(movie_id)
        franchise.movie_ids = current_ids
        db.commit()
        db.refresh(franchise)
    return {"message": "Movie added", "movie_ids": franchise.movie_ids}


@router.delete("/franchises/{franchise_id}/movies/{movie_id}")
def remove_movie_from_franchise(
    franchise_id: int,
    movie_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    franchise = db.query(models.Franchise).filter(models.Franchise.id == franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franchise not found")
    current_ids = list(franchise.movie_ids or [])
    if movie_id in current_ids:
        current_ids.remove(movie_id)
        franchise.movie_ids = current_ids
        db.commit()
        db.refresh(franchise)
    return {"message": "Movie removed", "movie_ids": franchise.movie_ids}


# ─── Gems — Public ───────────────────────────────────────────────────────────

@router.get("/gems/public", response_model=List[schemas.GemOverrideOut])
def list_gems_public(db: Session = Depends(get_db)):
    """Public endpoint — no auth required. Used by gems page."""
    return db.query(models.GemOverride).order_by(models.GemOverride.added_at.desc()).all()


# ─── Gems — Admin ────────────────────────────────────────────────────────────

@router.get("/gems", response_model=List[schemas.GemOverrideOut])
def list_gems(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    return db.query(models.GemOverride).order_by(models.GemOverride.added_at.desc()).all()


@router.post("/gems", response_model=schemas.GemOverrideOut)
def add_gem(
    payload: schemas.GemOverrideCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    existing = db.query(models.GemOverride).filter(
        models.GemOverride.movie_id == payload.movie_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Movie already in gems")

    gem = models.GemOverride(
        movie_id=payload.movie_id,
        title=payload.title,
        poster_path=payload.poster_path,
        backdrop_path=payload.backdrop_path,
        vote_average=payload.vote_average,
        vote_count=payload.vote_count,
        release_date=payload.release_date,
        overview=payload.overview,
        gem_score=payload.gem_score,
        rarity=payload.rarity,
        trailer_url=payload.trailer_url,
    )
    db.add(gem)
    db.commit()
    db.refresh(gem)
    return gem


@router.delete("/gems/{gem_id}")
def remove_gem(
    gem_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    gem = db.query(models.GemOverride).filter(models.GemOverride.id == gem_id).first()
    if not gem:
        raise HTTPException(status_code=404, detail="Gem not found")
    db.delete(gem)
    db.commit()
    return {"message": "Gem removed"}


# ─── Must Watch — Public ─────────────────────────────────────────────────────

@router.get("/must-watch/public", response_model=List[schemas.MustWatchOut])
def list_must_watch_public(db: Session = Depends(get_db)):
    """Public endpoint for 'Must Watch' movies."""
    return db.query(models.MustWatch).order_by(models.MustWatch.added_at.desc()).all()


# ─── Must Watch — Admin ──────────────────────────────────────────────────────

@router.get("/must-watch", response_model=List[schemas.MustWatchOut])
def list_must_watch(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    return db.query(models.MustWatch).order_by(models.MustWatch.added_at.desc()).all()


@router.post("/must-watch", response_model=schemas.MustWatchOut)
def add_must_watch(
    payload: schemas.MustWatchCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    existing = db.query(models.MustWatch).filter(
        models.MustWatch.movie_id == payload.movie_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Movie already in Must Watch")

    mw = models.MustWatch(
        movie_id=payload.movie_id,
        title=payload.title,
        poster_path=payload.poster_path,
        backdrop_path=payload.backdrop_path,
        vote_average=payload.vote_average,
        release_date=payload.release_date,
        overview=payload.overview,
        trailer_url=payload.trailer_url,
    )
    db.add(mw)
    db.commit()
    db.refresh(mw)
    return mw


@router.delete("/must-watch/{movie_id}")
def remove_must_watch(
    movie_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    mw = db.query(models.MustWatch).filter(models.MustWatch.movie_id == movie_id).first()
    if not mw:
        raise HTTPException(status_code=404, detail="Movie not found in Must Watch")
    db.delete(mw)
    db.commit()
    return {"message": "Removed from Must Watch"}


# ─── TMDB Search (for admin movie picker) ────────────────────────────────────

@router.get("/tmdb/search")
async def admin_search_movies(
    q: str = Query(..., min_length=1),
    _: models.User = Depends(get_admin_user),
):
    """Search TMDB for movies to add to franchises or gems."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={
                "api_key": TMDB_API_KEY,
                "query": q,
                "language": "en-US",
                "page": 1,
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])[:10]
        return [
            {
                "id": m["id"],
                "title": m.get("title", ""),
                "poster_path": m.get("poster_path"),
                "release_date": m.get("release_date", ""),
                "vote_average": m.get("vote_average", 0),
                "vote_count": m.get("vote_count", 0),
                "overview": m.get("overview", ""),
            }
            for m in results
        ]
