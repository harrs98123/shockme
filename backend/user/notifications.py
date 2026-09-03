from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

from database import get_db
from auth.utils import get_current_user
import models

router = APIRouter(prefix="/user", tags=["notifications"])

# In-memory record of when each user last marked notifications as read
_user_last_read_notifications: Dict[int, datetime] = {}


class NotificationActor(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    is_following: bool = False


class NotificationItem(BaseModel):
    id: str
    type: str  # 'like' | 'comment' | 'follow'
    created_at: str
    actor: NotificationActor
    post_id: Optional[int] = None
    post_title: Optional[str] = None
    post_snippet: Optional[str] = None
    post_poster: Optional[str] = None
    reaction_type: Optional[str] = None
    content: Optional[str] = None
    is_read: bool = False
    is_following_back: bool = False


class NotificationsResponse(BaseModel):
    notifications: List[NotificationItem]
    unread_count: int


@router.get("/notifications", response_model=NotificationsResponse)
def get_user_notifications(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Fetches user notifications (likes, comments, new followers) sorted chronologically."""
    last_read = _user_last_read_notifications.get(current_user.id)

    # Set of IDs current_user follows
    my_following_ids = {
        r[0]
        for r in db.query(models.UserFollow.following_id)
        .filter(models.UserFollow.follower_id == current_user.id)
        .all()
    }

    # 1. Post reactions (likes) on current_user's posts
    likes = (
        db.query(models.PostReaction)
        .join(models.SocialPost, models.PostReaction.post_id == models.SocialPost.id)
        .filter(
            models.SocialPost.user_id == current_user.id,
            models.PostReaction.user_id != current_user.id,
        )
        .order_by(models.PostReaction.created_at.desc())
        .limit(limit)
        .all()
    )

    # 2. Comments on current_user's posts
    comments = (
        db.query(models.PostComment)
        .join(models.SocialPost, models.PostComment.post_id == models.SocialPost.id)
        .filter(
            models.SocialPost.user_id == current_user.id,
            models.PostComment.user_id != current_user.id,
        )
        .order_by(models.PostComment.created_at.desc())
        .limit(limit)
        .all()
    )

    # 3. New followers of current_user
    follows = (
        db.query(models.UserFollow)
        .filter(models.UserFollow.following_id == current_user.id)
        .order_by(models.UserFollow.created_at.desc())
        .limit(limit)
        .all()
    )

    items: List[Dict[str, Any]] = []

    for l in likes:
        if not l.user or not l.post:
            continue
        dt = l.created_at or datetime.utcnow()
        is_read = last_read is not None and dt <= last_read
        items.append({
            "id": f"like_{l.id}",
            "type": "like",
            "created_at": dt.isoformat(),
            "raw_dt": dt,
            "actor": {
                "id": l.user.id,
                "name": l.user.name,
                "username": l.user.username,
                "avatar_url": l.user.avatar_url,
                "is_following": l.user.id in my_following_ids,
            },
            "post_id": l.post_id,
            "post_title": l.post.movie_title or "film moment",
            "post_snippet": (l.post.content or "")[:80],
            "post_poster": (l.post.payload or {}).get("poster_path") or (l.post.payload or {}).get("backdrop_path"),
            "reaction_type": l.reaction_type,
            "content": None,
            "is_read": is_read,
            "is_following_back": l.user.id in my_following_ids,
        })

    for c in comments:
        if not c.user or not c.post:
            continue
        dt = c.created_at or datetime.utcnow()
        is_read = last_read is not None and dt <= last_read
        items.append({
            "id": f"comment_{c.id}",
            "type": "comment",
            "created_at": dt.isoformat(),
            "raw_dt": dt,
            "actor": {
                "id": c.user.id,
                "name": c.user.name,
                "username": c.user.username,
                "avatar_url": c.user.avatar_url,
                "is_following": c.user.id in my_following_ids,
            },
            "post_id": c.post_id,
            "post_title": c.post.movie_title or "film moment",
            "post_snippet": (c.post.content or "")[:80],
            "post_poster": (c.post.payload or {}).get("poster_path") or (c.post.payload or {}).get("backdrop_path"),
            "reaction_type": None,
            "content": c.content,
            "is_read": is_read,
            "is_following_back": c.user.id in my_following_ids,
        })

    for f in follows:
        if not f.follower:
            continue
        dt = f.created_at or datetime.utcnow()
        is_read = last_read is not None and dt <= last_read
        items.append({
            "id": f"follow_{f.id}",
            "type": "follow",
            "created_at": dt.isoformat(),
            "raw_dt": dt,
            "actor": {
                "id": f.follower.id,
                "name": f.follower.name,
                "username": f.follower.username,
                "avatar_url": f.follower.avatar_url,
                "is_following": f.follower.id in my_following_ids,
            },
            "post_id": None,
            "post_title": None,
            "post_snippet": None,
            "post_poster": None,
            "reaction_type": None,
            "content": None,
            "is_read": is_read,
            "is_following_back": f.follower.id in my_following_ids,
        })

    items.sort(key=lambda x: x["raw_dt"], reverse=True)
    unread_count = sum(1 for item in items if not item["is_read"])

    paginated = items[offset : offset + limit]
    for p in paginated:
        p.pop("raw_dt", None)

    return {"notifications": paginated, "unread_count": unread_count}


@router.post("/notifications/mark-read")
def mark_notifications_read(current_user: models.User = Depends(get_current_user)):
    """Marks all current notifications as read for current_user."""
    _user_last_read_notifications[current_user.id] = datetime.utcnow()
    return {"status": "ok"}


@router.get("/notifications/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Quick count of unread notifications for badge display."""
    last_read = _user_last_read_notifications.get(current_user.id)
    if not last_read:
        has_likes = (
            db.query(models.PostReaction.id)
            .join(models.SocialPost, models.PostReaction.post_id == models.SocialPost.id)
            .filter(
                models.SocialPost.user_id == current_user.id,
                models.PostReaction.user_id != current_user.id,
            )
            .count()
        )
        has_comments = (
            db.query(models.PostComment.id)
            .join(models.SocialPost, models.PostComment.post_id == models.SocialPost.id)
            .filter(
                models.SocialPost.user_id == current_user.id,
                models.PostComment.user_id != current_user.id,
            )
            .count()
        )
        has_follows = db.query(models.UserFollow.id).filter(models.UserFollow.following_id == current_user.id).count()
        return {"unread_count": min(has_likes + has_comments + has_follows, 99)}

    unread_likes = (
        db.query(models.PostReaction.id)
        .join(models.SocialPost, models.PostReaction.post_id == models.SocialPost.id)
        .filter(
            models.SocialPost.user_id == current_user.id,
            models.PostReaction.user_id != current_user.id,
            models.PostReaction.created_at > last_read,
        )
        .count()
    )
    unread_comments = (
        db.query(models.PostComment.id)
        .join(models.SocialPost, models.PostComment.post_id == models.SocialPost.id)
        .filter(
            models.SocialPost.user_id == current_user.id,
            models.PostComment.user_id != current_user.id,
            models.PostComment.created_at > last_read,
        )
        .count()
    )
    unread_follows = (
        db.query(models.UserFollow.id)
        .filter(
            models.UserFollow.following_id == current_user.id,
            models.UserFollow.created_at > last_read,
        )
        .count()
    )
    return {"unread_count": min(unread_likes + unread_comments + unread_follows, 99)}
