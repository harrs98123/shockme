import os
import time
from datetime import datetime, timezone, timedelta
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text
from fastapi_cache import FastAPICache
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import List, Dict, Optional, Any
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
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    # 1. User metrics
    try:
        total_users = db.query(models.User).count()
    except Exception:
        total_users = 0

    try:
        admin_users = db.query(models.User).filter(models.User.is_admin == True).count()
    except Exception:
        admin_users = 0

    try:
        locked_users = db.query(models.User).filter(
            models.User.locked_until != None,
            models.User.locked_until > now
        ).count()
    except Exception:
        locked_users = 0

    try:
        new_users_today = db.query(models.User).filter(models.User.created_at >= day_ago).count()
    except Exception:
        new_users_today = 0

    try:
        new_users_week = db.query(models.User).filter(models.User.created_at >= week_ago).count()
    except Exception:
        new_users_week = 0

    # 2. Content metrics
    try:
        total_franchises = db.query(models.Franchise).count()
    except Exception:
        total_franchises = 0

    try:
        total_universe_entries = db.query(models.FranchiseEntry).count()
    except Exception:
        total_universe_entries = 0

    try:
        total_gems = db.query(models.GemOverride).count()
    except Exception:
        total_gems = 0

    try:
        total_must_watch = db.query(models.MustWatch).count()
    except Exception:
        total_must_watch = 0

    try:
        total_collections = db.query(models.Collection).count()
    except Exception:
        total_collections = 0

    # 3. Community metrics
    try:
        total_ratings = db.query(models.Rating).count()
        avg_rating_raw = db.query(func.avg(models.Rating.rating)).scalar()
        avg_rating = round(float(avg_rating_raw), 2) if avg_rating_raw else 0.0
    except Exception:
        total_ratings = 0
        avg_rating = 0.0

    try:
        total_favorites = db.query(models.Favorite).count()
    except Exception:
        total_favorites = 0

    try:
        total_watchlist = db.query(models.Watchlist).count()
    except Exception:
        total_watchlist = 0

    try:
        total_watched = db.query(models.Watched).count()
    except Exception:
        total_watched = 0

    try:
        total_moctale_reviews = db.query(models.MoctaleRating).count()
    except Exception:
        total_moctale_reviews = 0

    try:
        total_comments = db.query(models.Comment).count()
    except Exception:
        total_comments = 0

    try:
        total_debates = db.query(models.Debate).count()
    except Exception:
        total_debates = 0

    try:
        total_battles = db.query(models.VerdictBattle).count()
    except Exception:
        total_battles = 0

    try:
        total_social_posts = db.query(models.SocialPost).count()
    except Exception:
        total_social_posts = 0

    try:
        total_watch_parties = db.query(models.WatchParty).count()
    except Exception:
        total_watch_parties = 0

    try:
        total_groups = db.query(models.Group).count()
    except Exception:
        total_groups = 0

    # 4. Sentiment breakdown
    try:
        raw_labels = db.query(models.MoctaleRating.label, func.count(models.MoctaleRating.id)).group_by(models.MoctaleRating.label).all()
        moctale_breakdown = {str(label).lower(): int(count) for label, count in raw_labels if label}
    except Exception:
        moctale_breakdown = {}

    # 5. Recent lists
    try:
        recent_users = (
            db.query(models.User)
            .order_by(models.User.created_at.desc())
            .limit(10)
            .all()
        )
    except Exception:
        recent_users = []

    # Recent reviews with user info
    recent_reviews = []
    try:
        raw_reviews = (
            db.query(models.MoctaleRating, models.User)
            .join(models.User, models.MoctaleRating.user_id == models.User.id)
            .order_by(models.MoctaleRating.created_at.desc())
            .limit(8)
            .all()
        )
        for r, u in raw_reviews:
            recent_reviews.append(
                schemas.RecentReviewOut(
                    id=r.id,
                    user_name=u.name if u else "User",
                    user_avatar=u.avatar_url if u else None,
                    movie_id=r.movie_id,
                    media_type=r.media_type or "movie",
                    title=r.title or f"Movie #{r.movie_id}",
                    poster_path=r.poster_path,
                    label=r.label,
                    review_text=r.review_text,
                    created_at=r.created_at or datetime.utcnow(),
                )
            )
    except Exception as e:
        print(f"Error fetching recent reviews: {e}")

    # Recent comments with user info
    recent_comments = []
    try:
        raw_comments = (
            db.query(models.Comment, models.User)
            .join(models.User, models.Comment.user_id == models.User.id)
            .order_by(models.Comment.created_at.desc())
            .limit(8)
            .all()
        )
        for c, u in raw_comments:
            recent_comments.append(
                schemas.RecentCommentOut(
                    id=c.id,
                    user_name=u.name if u else "User",
                    user_avatar=u.avatar_url if u else None,
                    movie_id=c.movie_id,
                    media_type=c.media_type or "movie",
                    content=c.content,
                    contains_spoiler=bool(c.contains_spoiler),
                    created_at=c.created_at or datetime.utcnow(),
                )
            )
    except Exception as e:
        print(f"Error fetching recent comments: {e}")

    # Recent social posts
    recent_posts = []
    try:
        raw_posts = (
            db.query(models.SocialPost, models.User)
            .join(models.User, models.SocialPost.user_id == models.User.id)
            .order_by(models.SocialPost.created_at.desc())
            .limit(12)
            .all()
        )
        for p, u in raw_posts:
            recent_posts.append(
                schemas.AdminSocialPostOut(
                    id=p.id,
                    user_id=p.user_id,
                    user_name=u.name if u else "User",
                    user_avatar=u.avatar_url if u else None,
                    post_type=p.post_type or "review",
                    movie_id=p.movie_id,
                    content=p.content,
                    payload=p.payload,
                    is_spoiler=bool(p.is_spoiler),
                    created_at=p.created_at or datetime.utcnow(),
                    reactions_count=len(p.reactions) if p.reactions else 0,
                    comments_count=len(p.post_comments) if p.post_comments else 0,
                )
            )
    except Exception as e:
        print(f"Error fetching recent posts: {e}")

    return schemas.AdminStats(
        total_users=total_users,
        admin_users=admin_users,
        new_users_today=new_users_today,
        new_users_week=new_users_week,
        locked_users=locked_users,
        total_franchises=total_franchises,
        total_universe_entries=total_universe_entries,
        total_gems=total_gems,
        total_must_watch=total_must_watch,
        total_collections=total_collections,
        total_ratings=total_ratings,
        avg_rating=avg_rating,
        total_favorites=total_favorites,
        total_watchlist=total_watchlist,
        total_watched=total_watched,
        total_moctale_reviews=total_moctale_reviews,
        total_comments=total_comments,
        total_debates=total_debates,
        total_battles=total_battles,
        total_social_posts=total_social_posts,
        total_watch_parties=total_watch_parties,
        total_groups=total_groups,
        moctale_breakdown=moctale_breakdown,
        recent_users=recent_users,
        recent_reviews=recent_reviews,
        recent_comments=recent_comments,
        recent_posts=recent_posts,
    )


# ─── Social Feed Moderation ──────────────────────────────────────────────────

@router.get("/feed/posts", response_model=List[schemas.AdminSocialPostOut])
def list_admin_feed_posts(
    page: int = 1,
    limit: int = 30,
    post_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    offset = (page - 1) * limit
    q = db.query(models.SocialPost, models.User).join(models.User, models.SocialPost.user_id == models.User.id)
    if post_type and post_type != "all":
        q = q.filter(models.SocialPost.post_type == post_type)
    raw_posts = q.order_by(models.SocialPost.created_at.desc()).offset(offset).limit(limit).all()
    results = []
    for p, u in raw_posts:
        results.append(
            schemas.AdminSocialPostOut(
                id=p.id,
                user_id=p.user_id,
                user_name=u.name if u else "User",
                user_avatar=u.avatar_url if u else None,
                post_type=p.post_type or "review",
                movie_id=p.movie_id,
                content=p.content,
                payload=p.payload,
                is_spoiler=bool(p.is_spoiler),
                created_at=p.created_at or datetime.utcnow(),
                reactions_count=len(p.reactions) if p.reactions else 0,
                comments_count=len(p.post_comments) if p.post_comments else 0,
            )
        )
    return results


@router.delete("/feed/posts/{post_id}")
def delete_admin_feed_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    post = db.query(models.SocialPost).filter(models.SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post removed by admin"}


@router.patch("/feed/posts/{post_id}/spoiler")
def toggle_post_spoiler(
    post_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    post = db.query(models.SocialPost).filter(models.SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.is_spoiler = not post.is_spoiler
    db.commit()
    db.refresh(post)
    return {"id": post.id, "is_spoiler": post.is_spoiler}



# ─── System Health & Diagnostics ─────────────────────────────────────────────

@router.get("/system/health", response_model=schemas.SystemHealthOut)
async def get_system_health(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    t_start = time.perf_counter()

    # 1. Database check
    db_status = "operational"
    db_lat = 0.0
    try:
        db_t0 = time.perf_counter()
        db.execute(text("SELECT 1"))
        db_lat = round((time.perf_counter() - db_t0) * 1000, 2)
    except Exception as e:
        db_status = f"error: {str(e)[:40]}"

    # 2. TMDB API check
    tmdb_status = "operational"
    tmdb_lat = 0.0
    try:
        tm_t0 = time.perf_counter()
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TMDB_BASE_URL}/configuration",
                params={"api_key": TMDB_API_KEY},
                timeout=5.0
            )
            if resp.status_code == 200:
                tmdb_lat = round((time.perf_counter() - tm_t0) * 1000, 2)
            else:
                tmdb_status = f"HTTP {resp.status_code}"
    except Exception as e:
        tmdb_status = f"error: {str(e)[:40]}"

    # 3. Redis / Cache backend
    redis_status = "in-memory / active"
    try:
        backend = FastAPICache.get_backend()
        if backend:
            redis_status = backend.__class__.__name__
    except Exception:
        redis_status = "unknown"

    total_lat = round((time.perf_counter() - t_start) * 1000, 2)

    return schemas.SystemHealthOut(
        status="healthy" if db_status == "operational" and tmdb_status == "operational" else "degraded",
        api_latency_ms=total_lat,
        db_status=db_status,
        db_latency_ms=db_lat,
        tmdb_status=tmdb_status,
        tmdb_latency_ms=tmdb_lat,
        redis_status=redis_status,
        server_time=datetime.now(timezone.utc).isoformat(),
        uptime_info="Online & Monitoring",
    )


@router.post("/system/flush-cache")
async def flush_cache(
    _: models.User = Depends(get_admin_user),
):
    try:
        await FastAPICache.clear()
        return {"status": "success", "message": "All cache entries successfully invalidated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to flush cache: {str(e)}")


# ─── Quick Movie Curation ───────────────────────────────────────────────────

@router.post("/quick-curate")
async def quick_curate_movie(
    payload: schemas.QuickCurateRequest,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    # Auto-fetch metadata from TMDB if missing
    title = payload.title
    poster_path = payload.poster_path
    backdrop_path = payload.backdrop_path
    release_date = payload.release_date
    vote_average = payload.vote_average
    overview = payload.overview

    if not title or not poster_path:
        try:
            data = await tmdb_get(f"/{payload.media_type}/{payload.movie_id}", {"language": "en-US"})
            title = title or data.get("title") or data.get("name") or f"Title #{payload.movie_id}"
            poster_path = poster_path or data.get("poster_path")
            backdrop_path = backdrop_path or data.get("backdrop_path")
            release_date = release_date or data.get("release_date") or data.get("first_air_date")
            vote_average = vote_average or data.get("vote_average", 0.0)
            overview = overview or data.get("overview", "")
        except Exception:
            title = title or f"Movie #{payload.movie_id}"

    if payload.target == "gem":
        existing = db.query(models.GemOverride).filter(models.GemOverride.movie_id == payload.movie_id).first()
        if existing:
            return {"status": "exists", "message": "Already present in Hidden Gems vault"}
        gem = models.GemOverride(
            movie_id=payload.movie_id,
            title=title,
            poster_path=poster_path,
            backdrop_path=backdrop_path,
            vote_average=vote_average,
            vote_count=150,
            release_date=release_date,
            overview=overview,
            gem_score=9.2,
            rarity="legendary",
        )
        db.add(gem)
        db.commit()
        return {"status": "success", "message": f"Added '{title}' to Hidden Gems"}

    elif payload.target == "must_watch":
        existing = db.query(models.MustWatch).filter(models.MustWatch.movie_id == payload.movie_id).first()
        if existing:
            return {"status": "exists", "message": "Already in Must Watch vault"}
        mw = models.MustWatch(
            movie_id=payload.movie_id,
            title=title,
            poster_path=poster_path,
            backdrop_path=backdrop_path,
            vote_average=vote_average,
            release_date=release_date,
            overview=overview,
        )
        db.add(mw)
        db.commit()
        return {"status": "success", "message": f"Added '{title}' to Must Watch list"}

    elif payload.target == "franchise" and payload.franchise_id:
        franchise = db.query(models.Franchise).filter(models.Franchise.id == payload.franchise_id).first()
        if not franchise:
            raise HTTPException(status_code=404, detail="Franchise not found")
        current_ids = list(franchise.movie_ids or [])
        if payload.movie_id not in current_ids:
            current_ids.append(payload.movie_id)
            franchise.movie_ids = current_ids
            db.commit()

        existing_entry = db.query(models.FranchiseEntry).filter(
            models.FranchiseEntry.franchise_id == payload.franchise_id,
            models.FranchiseEntry.movie_id == payload.movie_id,
        ).first()
        if not existing_entry:
            entry = models.FranchiseEntry(
                franchise_id=payload.franchise_id,
                movie_id=payload.movie_id,
                media_type=payload.media_type,
                title=title,
                poster_path=poster_path,
                release_date=release_date,
            )
            db.add(entry)
            db.commit()
        return {"status": "success", "message": f"Added '{title}' to {franchise.name}"}

    raise HTTPException(status_code=400, detail="Invalid target specified")


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
async def add_movie_to_franchise(
    franchise_id: int,
    movie_id: int = Query(...),
    media_type: str = Query("movie"),
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

    existing_entry = db.query(models.FranchiseEntry).filter(
        models.FranchiseEntry.franchise_id == franchise_id,
        models.FranchiseEntry.movie_id == movie_id,
        models.FranchiseEntry.media_type == media_type,
    ).first()
    if not existing_entry:
        try:
            data = await tmdb_get(f"/{media_type}/{movie_id}", {"language": "en-US"})
            title = data.get("title") or data.get("name") or "Unknown"
            release_date = data.get("release_date") or data.get("first_air_date")
            poster_path = data.get("poster_path")
        except Exception:
            title, release_date, poster_path = "Unknown", None, None
        entry = models.FranchiseEntry(
            franchise_id=franchise_id,
            movie_id=movie_id,
            media_type=media_type,
            title=title,
            poster_path=poster_path,
            release_date=release_date,
        )
        db.add(entry)
        db.commit()

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

    db.query(models.FranchiseEntry).filter(
        models.FranchiseEntry.franchise_id == franchise_id,
        models.FranchiseEntry.movie_id == movie_id,
    ).delete()
    db.commit()

    return {"message": "Movie removed", "movie_ids": franchise.movie_ids}


# ─── Franchise Entries — Timeline / Watch-Order metadata ────────────────────

@router.get("/franchises/{franchise_id}/entries", response_model=List[schemas.FranchiseEntryOut])
def list_franchise_entries(
    franchise_id: int,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    return (
        db.query(models.FranchiseEntry)
        .filter(models.FranchiseEntry.franchise_id == franchise_id)
        .order_by(models.FranchiseEntry.release_order.asc().nulls_last(), models.FranchiseEntry.created_at.asc())
        .all()
    )


@router.put("/franchises/{franchise_id}/entries/{entry_id}", response_model=schemas.FranchiseEntryOut)
def update_franchise_entry(
    franchise_id: int,
    entry_id: int,
    payload: schemas.FranchiseEntryUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(get_admin_user),
):
    entry = db.query(models.FranchiseEntry).filter(
        models.FranchiseEntry.id == entry_id,
        models.FranchiseEntry.franchise_id == franchise_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Timeline entry not found")

    for field in (
        "saga", "phase", "sub_timeline", "timeline_order", "release_order",
        "watch_order", "canon", "multiverse", "requires_movie_ids", "notes",
    ):
        value = getattr(payload, field)
        if value is not None:
            setattr(entry, field, value)

    db.commit()
    db.refresh(entry)
    return entry


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
    media_type: str = Query("movie", pattern="^(movie|tv)$"),
    _: models.User = Depends(get_admin_user),
):
    """Search TMDB for movies or TV shows to add to franchises or gems."""
    search_path = "/search/movie" if media_type == "movie" else "/search/tv"
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{TMDB_BASE_URL}{search_path}",
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
                "title": m.get("title") or m.get("name", ""),
                "poster_path": m.get("poster_path"),
                "release_date": m.get("release_date") or m.get("first_air_date", ""),
                "vote_average": m.get("vote_average", 0),
                "vote_count": m.get("vote_count", 0),
                "overview": m.get("overview", ""),
            }
            for m in results
        ]
