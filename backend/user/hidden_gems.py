import httpx
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

router = APIRouter(prefix="/hidden-gems", tags=["hidden-gems"])


def compute_gem_score(vote_average: float, vote_count: int) -> float:
    """Higher score = more underrated. High rating + low vote count = high gem score."""
    if vote_count == 0:
        return 0
    # Formula: rating * (1 / log(vote_count + 1)) * 10
    import math
    return round(vote_average * (1 / math.log10(vote_count + 1)) * 10, 1)


def compute_rarity(vote_count: int) -> str:
    if vote_count <= 50:
        return "legendary"
    elif vote_count <= 100:
        return "rare"
    else:
        return "common"


@router.get("", response_model=List[schemas.HiddenGemOut])
async def get_hidden_gems(page: int = 1, db: Session = Depends(get_db)):
    """Discover hidden gem movies: admin-curated first, then TMDB discoveries."""

    # Pull admin-curated gems from DB (only on page 1)
    admin_gems = []
    if page == 1:
        overrides = db.query(models.GemOverride).order_by(models.GemOverride.added_at.desc()).all()
        for o in overrides:
            admin_gems.append(schemas.HiddenGemOut(
                id=o.movie_id,
                title=o.title,
                poster_path=o.poster_path,
                backdrop_path=o.backdrop_path,
                vote_average=o.vote_average or 0,
                vote_count=o.vote_count or 0,
                release_date=o.release_date,
                overview=o.overview,
                genre_ids=[],
                gem_score=o.gem_score,
                rarity=o.rarity,
                is_admin_curated=True,
            ))

    admin_movie_ids = {g.id for g in admin_gems}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{TMDB_BASE_URL}/discover/movie",
                params={
                    "api_key": TMDB_API_KEY,
                    "language": "en-US",
                    "sort_by": "vote_average.desc",
                    "vote_count.gte": 30,
                    "vote_count.lte": 300,
                    "vote_average.gte": 7.0,
                    "page": page,
                    "with_original_language": "en",
                },
                timeout=10.0
            )
            resp.raise_for_status()
            data = resp.json()
            movies = data.get("results", [])[:20]

            tmdb_gems = []
            for m in movies:
                if m["id"] in admin_movie_ids:
                    continue  # skip duplicates
                vc = m.get("vote_count", 0)
                va = m.get("vote_average", 0)
                tmdb_gems.append(schemas.HiddenGemOut(
                    id=m["id"],
                    title=m["title"],
                    poster_path=m.get("poster_path"),
                    backdrop_path=m.get("backdrop_path"),
                    vote_average=va,
                    vote_count=vc,
                    release_date=m.get("release_date"),
                    overview=m.get("overview"),
                    genre_ids=m.get("genre_ids", []),
                    gem_score=compute_gem_score(va, vc),
                    rarity=compute_rarity(vc)
                ))

            tmdb_gems.sort(key=lambda g: g.gem_score, reverse=True)
            return admin_gems + tmdb_gems

        except Exception as e:
            print(f"Hidden Gems Error: {str(e)}")
            if admin_gems:
                return admin_gems
            raise HTTPException(status_code=502, detail=f"TMDB Error: {str(e)}")


@router.get("/badges", response_model=List[schemas.UserBadgeOut])
def get_my_badges(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get current user's badges."""
    badges = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == current_user.id
    ).order_by(models.UserBadge.earned_at.desc()).all()
    return badges


def award_gem_badge(db: Session, user_id: int, movie_id: int, title: str):
    """Award gem hunter badge if movie qualifies and user doesn't already have it for this movie."""
    existing = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user_id,
        models.UserBadge.badge_type == "gem_hunter",
        models.UserBadge.movie_id == movie_id
    ).first()
    if existing:
        return

    badge = models.UserBadge(
        user_id=user_id,
        badge_type="gem_hunter",
        badge_name=f"💎 Gem Hunter: {title}",
        movie_id=movie_id
    )
    db.add(badge)
    db.commit()
