from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

from database import get_db
from auth.utils import get_current_user, decode_access_token, oauth2_scheme
from fastapi.security import OAuth2PasswordBearer
import models

router = APIRouter(prefix="/user", tags=["public-profile"])

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    if not token:
        return None
    user_id = decode_access_token(token)
    if not user_id:
        return None
    return db.query(models.User).filter(models.User.id == user_id).first()


# ── Schemas ───────────────────────────────────────────────────────────────────

class UserPublicInfo(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PublicFavoriteOut(BaseModel):
    id: int
    movie_id: int
    media_type: str = "movie"
    title: str
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_year: Optional[str] = None
    vote_average: Optional[float] = None
    added_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PublicReviewOut(BaseModel):
    id: int
    movie_id: int
    media_type: str = "movie"
    title: Optional[str] = None
    poster_path: Optional[str] = None
    label: str
    review_text: Optional[str] = None
    created_at: datetime
    likes_count: int = 0

    class Config:
        from_attributes = True

class PublicCollectionOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_rank_list: bool = False
    item_count: int = 0
    cover_poster: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PublicWatchlistItem(BaseModel):
    id: int
    movie_id: int
    media_type: str = "movie"
    title: str
    poster_path: Optional[str] = None
    release_year: Optional[str] = None
    vote_average: Optional[float] = None
    added_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PublicProfileStats(BaseModel):
    favorites_count: int = 0
    reviews_count: int = 0
    collections_count: int = 0
    watchlist_count: int = 0
    watched_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0

class PublicProfileResponse(BaseModel):
    user: UserPublicInfo
    stats: PublicProfileStats
    is_following: bool = False
    movie_taste: Dict[str, float] = {}
    top_movies: List[Any] = []
    favorites: List[PublicFavoriteOut] = []
    reviews: List[PublicReviewOut] = []
    collections: List[PublicCollectionOut] = []
    watchlist: List[PublicWatchlistItem] = []
    watched: List[PublicWatchlistItem] = []


class FollowUserOut(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_following: bool = False
    follows_you: bool = False
    followers_count: int = 0

    class Config:
        from_attributes = True


class FeedActivityItem(BaseModel):
    id: str  # unique synthetic ID e.g. "review_12"
    type: str  # "review" | "favorite" | "collection"
    created_at: datetime
    user: UserPublicInfo
    # Activity specific payload
    movie_id: Optional[int] = None
    media_type: Optional[str] = "movie"
    title: Optional[str] = None
    poster_path: Optional[str] = None
    label: Optional[str] = None
    review_text: Optional[str] = None
    vote_average: Optional[float] = None
    release_year: Optional[str] = None
    collection_id: Optional[int] = None
    collection_name: Optional[str] = None
    collection_item_count: Optional[int] = None
    likes_count: int = 0


# ── Endpoints ─────────────────────────────────────────────────────────────────

def _build_profile_response(user: models.User, db: Session, current_user: Optional[models.User] = None) -> PublicProfileResponse:
    favorites = (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == user.id)
        .order_by(models.Favorite.added_at.desc())
        .all()
    )

    reviews_raw = (
        db.query(models.MoctaleRating)
        .filter(models.MoctaleRating.user_id == user.id)
        .options(joinedload(models.MoctaleRating.likes))
        .order_by(models.MoctaleRating.created_at.desc())
        .all()
    )
    reviews = [
        PublicReviewOut(
            id=r.id,
            movie_id=r.movie_id,
            media_type=r.media_type or "movie",
            title=r.title,
            poster_path=r.poster_path,
            label=r.label,
            review_text=r.review_text,
            created_at=r.created_at,
            likes_count=len(r.likes),
        )
        for r in reviews_raw
    ]

    collections_raw = (
        db.query(models.Collection)
        .filter(models.Collection.user_id == user.id, models.Collection.is_public == True)
        .options(joinedload(models.Collection.items))
        .order_by(models.Collection.created_at.desc())
        .all()
    )
    collections = []
    for c in collections_raw:
        item_count = len(c.items)
        cover_poster = c.items[0].poster_path if c.items and c.items[0].poster_path else None
        collections.append(PublicCollectionOut(
            id=c.id,
            name=c.name,
            description=c.description,
            is_rank_list=c.is_rank_list,
            item_count=item_count,
            cover_poster=cover_poster,
            created_at=c.created_at,
        ))

    watchlist = (
        db.query(models.Watchlist)
        .filter(models.Watchlist.user_id == user.id)
        .order_by(models.Watchlist.added_at.desc())
        .all()
    )

    watched = (
        db.query(models.Watched)
        .filter(models.Watched.user_id == user.id)
        .order_by(models.Watched.watched_at.desc())
        .all()
    )

    followers_count = db.query(models.UserFollow).filter(models.UserFollow.following_id == user.id).count()
    following_count = db.query(models.UserFollow).filter(models.UserFollow.follower_id == user.id).count()

    is_following = False
    if current_user and current_user.id != user.id:
        is_following = db.query(models.UserFollow).filter(
            models.UserFollow.follower_id == current_user.id,
            models.UserFollow.following_id == user.id
        ).first() is not None

    posts_count = db.query(models.SocialPost).filter(
        models.SocialPost.user_id == user.id,
        or_(models.SocialPost.is_archived == False, models.SocialPost.is_archived.is_(None))
    ).count()

    stats = PublicProfileStats(
        favorites_count=len(favorites),
        reviews_count=len(reviews_raw),
        collections_count=len(collections),
        watchlist_count=len(watchlist),
        watched_count=len(watched),
        followers_count=followers_count,
        following_count=following_count,
        posts_count=posts_count,
    )
    
    # Deterministic mock taste based on user ID
    genres = ["Sci-Fi", "Thriller", "Drama", "Action", "Horror", "Comedy", "Romance"]
    taste = {
        genres[user.id % len(genres)]: 42.0,
        genres[(user.id + 1) % len(genres)]: 28.0,
        genres[(user.id + 2) % len(genres)]: 15.0
    }
    
    # Top movies from favorites (top 3)
    top_movies = [{"title": f.title, "poster_path": f.poster_path} for f in favorites[:3]]

    return PublicProfileResponse(
        user=UserPublicInfo.model_validate(user),
        stats=stats,
        is_following=is_following,
        movie_taste=taste,
        top_movies=top_movies,
        favorites=favorites,
        reviews=reviews,
        collections=collections,
        watchlist=watchlist,
        watched=watched,
    )


@router.get("/feed/following", response_model=List[FeedActivityItem])
def get_following_feed(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """
    Returns unified chronological feed of activities.
    If authenticated and following users, returns their activity.
    If not following anyone or not authenticated, returns top global community activity.
    """
    following_ids = []
    if current_user:
        following_rels = db.query(models.UserFollow.following_id).filter(
            models.UserFollow.follower_id == current_user.id
        ).all()
        following_ids = [r[0] for r in following_rels]

    activities: List[FeedActivityItem] = []

    # 1. Fetch Reviews
    review_query = db.query(models.MoctaleRating).options(
        joinedload(models.MoctaleRating.user),
        joinedload(models.MoctaleRating.likes)
    )
    if following_ids:
        review_query = review_query.filter(models.MoctaleRating.user_id.in_(following_ids))
    
    reviews = review_query.order_by(models.MoctaleRating.created_at.desc()).limit(limit).all()
    for r in reviews:
        if r.user:
            activities.append(FeedActivityItem(
                id=f"review_{r.id}",
                type="review",
                created_at=r.created_at,
                user=UserPublicInfo.model_validate(r.user),
                movie_id=r.movie_id,
                media_type=r.media_type or "movie",
                title=r.title,
                poster_path=r.poster_path,
                label=r.label,
                review_text=r.review_text,
                likes_count=len(r.likes),
            ))

    # 2. Fetch Favorites
    fav_query = db.query(models.Favorite).options(joinedload(models.Favorite.user))
    if following_ids:
        fav_query = fav_query.filter(models.Favorite.user_id.in_(following_ids))
    
    favs = fav_query.order_by(models.Favorite.added_at.desc()).limit(limit // 2).all()
    for f in favs:
        if f.user and f.added_at:
            activities.append(FeedActivityItem(
                id=f"fav_{f.id}",
                type="favorite",
                created_at=f.added_at,
                user=UserPublicInfo.model_validate(f.user),
                movie_id=f.movie_id,
                media_type=f.media_type or "movie",
                title=f.title,
                poster_path=f.poster_path,
                vote_average=f.vote_average,
                release_year=f.release_year,
            ))

    # 3. Fetch Collections
    col_query = db.query(models.Collection).filter(models.Collection.is_public == True).options(
        joinedload(models.Collection.user),
        joinedload(models.Collection.items)
    )
    if following_ids:
        col_query = col_query.filter(models.Collection.user_id.in_(following_ids))
    
    cols = col_query.order_by(models.Collection.created_at.desc()).limit(limit // 3).all()
    for c in cols:
        if c.user:
            cover = c.items[0].poster_path if c.items and c.items[0].poster_path else None
            activities.append(FeedActivityItem(
                id=f"col_{c.id}",
                type="collection",
                created_at=c.created_at,
                user=UserPublicInfo.model_validate(c.user),
                collection_id=c.id,
                collection_name=c.name,
                collection_item_count=len(c.items),
                poster_path=cover,
                review_text=c.description,
            ))

    # Sort everything chronologically desc
    activities.sort(key=lambda x: x.created_at, reverse=True)
    return activities[:limit]


@router.get("/suggestions", response_model=List[FollowUserOut])
def get_user_suggestions(
    limit: int = 15,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Returns top suggested users/cinephiles to follow, prioritizing those who follow you (follow-back)."""
    following_ids = set()
    follows_me_ids = set()
    if current_user:
        following_ids = {
            r[0] for r in db.query(models.UserFollow.following_id).filter(
                models.UserFollow.follower_id == current_user.id
            ).all()
        }
        following_ids.add(current_user.id)

        follows_me_ids = {
            r[0] for r in db.query(models.UserFollow.follower_id).filter(
                models.UserFollow.following_id == current_user.id
            ).all()
        }

    # 1. First get users who follow you but you don't follow back
    follow_back_users = []
    follow_back_ids = follows_me_ids - following_ids
    if follow_back_ids:
        follow_back_users = db.query(models.User).filter(
            models.User.id.in_(follow_back_ids)
        ).limit(limit).all()

    # 2. Then get other active community cinephiles
    excluded = following_ids.union({u.id for u in follow_back_users})
    remaining_limit = max(limit - len(follow_back_users), 0)
    other_users = []
    if remaining_limit > 0:
        other_users = db.query(models.User).filter(
            models.User.username.isnot(None),
            ~models.User.id.in_(excluded) if excluded else True
        ).limit(remaining_limit).all()

    results = []
    for u in follow_back_users:
        followers_count = db.query(models.UserFollow).filter(models.UserFollow.following_id == u.id).count()
        results.append(FollowUserOut(
            id=u.id,
            name=u.name,
            username=u.username,
            avatar_url=u.avatar_url,
            bio=u.bio,
            is_following=False,
            follows_you=True,
            followers_count=followers_count,
        ))

    for u in other_users:
        followers_count = db.query(models.UserFollow).filter(models.UserFollow.following_id == u.id).count()
        results.append(FollowUserOut(
            id=u.id,
            name=u.name,
            username=u.username,
            avatar_url=u.avatar_url,
            bio=u.bio,
            is_following=False,
            follows_you=False,
            followers_count=followers_count,
        ))

    return results


@router.post("/{user_id}/follow")
def toggle_follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Toggle follow or unfollow a user."""
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(models.UserFollow).filter(
        models.UserFollow.follower_id == current_user.id,
        models.UserFollow.following_id == user_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        is_following = False
    else:
        new_follow = models.UserFollow(
            follower_id=current_user.id,
            following_id=user_id
        )
        db.add(new_follow)
        db.commit()
        is_following = True

    followers_count = db.query(models.UserFollow).filter(models.UserFollow.following_id == user_id).count()
    following_count = db.query(models.UserFollow).filter(models.UserFollow.follower_id == user_id).count()

    return {
        "status": "ok",
        "is_following": is_following,
        "followers_count": followers_count,
        "following_count": following_count,
    }


@router.get("/{user_id}/followers", response_model=List[FollowUserOut])
def get_user_followers(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Get all followers of a user."""
    follows = db.query(models.UserFollow).filter(
        models.UserFollow.following_id == user_id
    ).options(joinedload(models.UserFollow.follower)).all()

    my_following = set()
    if current_user:
        my_following = {
            r[0] for r in db.query(models.UserFollow.following_id).filter(
                models.UserFollow.follower_id == current_user.id
            ).all()
        }

    results = []
    for f in follows:
        if f.follower:
            u = f.follower
            followers_count = db.query(models.UserFollow).filter(models.UserFollow.following_id == u.id).count()
            results.append(FollowUserOut(
                id=u.id,
                name=u.name,
                username=u.username,
                avatar_url=u.avatar_url,
                bio=u.bio,
                is_following=u.id in my_following,
                followers_count=followers_count,
            ))
    return results


@router.get("/{user_id}/following", response_model=List[FollowUserOut])
def get_user_following(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    """Get all users that this user follows."""
    follows = db.query(models.UserFollow).filter(
        models.UserFollow.follower_id == user_id
    ).options(joinedload(models.UserFollow.following)).all()

    my_following = set()
    if current_user:
        my_following = {
            r[0] for r in db.query(models.UserFollow.following_id).filter(
                models.UserFollow.follower_id == current_user.id
            ).all()
        }

    results = []
    for f in follows:
        if f.following:
            u = f.following
            followers_count = db.query(models.UserFollow).filter(models.UserFollow.following_id == u.id).count()
            results.append(FollowUserOut(
                id=u.id,
                name=u.name,
                username=u.username,
                avatar_url=u.avatar_url,
                bio=u.bio,
                is_following=u.id in my_following,
                followers_count=followers_count,
            ))
    return results


@router.get("/{user_id}/public", response_model=PublicProfileResponse)
def get_public_profile_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _build_profile_response(user, db, current_user)


@router.get("/by-username/{username}/public", response_model=PublicProfileResponse)
def get_public_profile_by_username(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_optional_user),
):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _build_profile_response(user, db, current_user)
