from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta

from database import get_db
from models import User, Story, StoryReaction, UserFollow
from auth.utils import get_current_user, get_current_user_optional

router = APIRouter(prefix="/stories", tags=["Stories"])


# ── SCHEMAS ───────────────────────────────────────────────────────────────────

class StoryCreate(BaseModel):
    movie_id: Optional[int] = None
    movie_title: Optional[str] = None
    movie_poster: Optional[str] = None
    movie_backdrop: Optional[str] = None
    media_type: Optional[str] = "movie"
    caption: Optional[str] = None
    story_type: Optional[str] = "pulse"
    rating: Optional[float] = None


class StoryReactionCreate(BaseModel):
    reaction_type: str


class StoryOut(BaseModel):
    id: int
    user_id: int
    movie_id: Optional[int] = None
    movie_title: Optional[str] = None
    movie_poster: Optional[str] = None
    movie_backdrop: Optional[str] = None
    media_type: str = "movie"
    caption: Optional[str] = None
    story_type: str = "pulse"
    rating: Optional[float] = None
    created_at: str
    reactions_count: int = 0
    user_reaction: Optional[str] = None


class UserStoryGroup(BaseModel):
    user_id: int
    name: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    stories: List[StoryOut]
    latest_created_at: str


# ── HELPERS ───────────────────────────────────────────────────────────────────

def _format_story(s: Story, current_user_id: Optional[int]) -> StoryOut:
    reactions_count = len(s.reactions)
    user_reaction = None
    if current_user_id:
        for r in s.reactions:
            if r.user_id == current_user_id:
                user_reaction = r.reaction_type
                break

    created_at_str = s.created_at.isoformat() if isinstance(s.created_at, datetime) else str(s.created_at)

    return StoryOut(
        id=s.id,
        user_id=s.user_id,
        movie_id=s.movie_id,
        movie_title=s.movie_title,
        movie_poster=s.movie_poster,
        movie_backdrop=s.movie_backdrop,
        media_type=s.media_type or "movie",
        caption=s.caption,
        story_type=s.story_type or "pulse",
        rating=s.rating,
        created_at=created_at_str,
        reactions_count=reactions_count,
        user_reaction=user_reaction,
    )


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@router.get("/feed", response_model=List[UserStoryGroup])
async def get_stories_feed(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Returns stories created within the last 24 hours grouped by creator.
    Prioritizes the current user and creators the user follows, then all active stories.
    """
    cutoff = datetime.utcnow() - timedelta(hours=24)

    # Query active stories in past 24h
    stories = (
        db.query(Story)
        .options(joinedload(Story.user), joinedload(Story.reactions))
        .filter(Story.created_at >= cutoff)
        .order_by(Story.created_at.asc())
        .all()
    )

    current_id = current_user.id if current_user else None

    # Group stories by user
    user_map: Dict[int, Dict[str, Any]] = {}
    for s in stories:
        if not s.user:
            continue
        uid = s.user_id
        if uid not in user_map:
            user_map[uid] = {
                "user_id": uid,
                "name": s.user.name,
                "username": s.user.username,
                "avatar_url": s.user.avatar_url,
                "stories": [],
                "latest_created_at": s.created_at.isoformat() if isinstance(s.created_at, datetime) else str(s.created_at),
            }
        formatted = _format_story(s, current_id)
        user_map[uid]["stories"].append(formatted)
        if isinstance(s.created_at, datetime):
            user_map[uid]["latest_created_at"] = s.created_at.isoformat()

    groups = list(user_map.values())

    # Sorting: Current user first, then followed users, then most recent
    if current_user:
        following_ids = set(f.following_id for f in current_user.following)
        def sort_key(g):
            uid = g["user_id"]
            if uid == current_user.id:
                return (0, g["latest_created_at"])
            elif uid in following_ids:
                return (1, g["latest_created_at"])
            else:
                return (2, g["latest_created_at"])
        groups.sort(key=sort_key)
    else:
        groups.sort(key=lambda g: g["latest_created_at"], reverse=True)

    return groups


@router.get("/my", response_model=List[StoryOut])
async def get_my_stories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the current user's active 24h stories."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    stories = (
        db.query(Story)
        .options(joinedload(Story.reactions))
        .filter(Story.user_id == current_user.id, Story.created_at >= cutoff)
        .order_by(Story.created_at.asc())
        .all()
    )
    return [_format_story(s, current_user.id) for s in stories]


@router.get("/user/{user_id}", response_model=List[StoryOut])
async def get_user_stories(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Returns active 24h stories for a given user."""
    cutoff = datetime.utcnow() - timedelta(hours=24)
    stories = (
        db.query(Story)
        .options(joinedload(Story.reactions))
        .filter(Story.user_id == user_id, Story.created_at >= cutoff)
        .order_by(Story.created_at.asc())
        .all()
    )
    current_id = current_user.id if current_user else None
    return [_format_story(s, current_id) for s in stories]


@router.post("/", response_model=StoryOut)
async def create_story(
    payload: StoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Creates a new story for the current user."""
    story = Story(
        user_id=current_user.id,
        movie_id=payload.movie_id,
        movie_title=payload.movie_title,
        movie_poster=payload.movie_poster,
        movie_backdrop=payload.movie_backdrop,
        media_type=payload.media_type or "movie",
        caption=payload.caption,
        story_type=payload.story_type or "pulse",
        rating=payload.rating,
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return _format_story(story, current_user.id)


@router.delete("/{story_id}")
async def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deletes a story owned by the user (or admin)."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    if story.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this story")

    db.delete(story)
    db.commit()
    return {"message": "Story deleted successfully", "id": story_id}


@router.post("/{story_id}/react")
async def react_to_story(
    story_id: int,
    reaction_data: StoryReactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reacts to a story (or toggles off)."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    existing = (
        db.query(StoryReaction)
        .filter(StoryReaction.story_id == story_id, StoryReaction.user_id == current_user.id)
        .first()
    )

    if existing:
        if existing.reaction_type == reaction_data.reaction_type:
            db.delete(existing)
            db.commit()
            return {"message": "Reaction removed", "reaction": None}
        else:
            existing.reaction_type = reaction_data.reaction_type
            db.commit()
            return {"message": "Reaction updated", "reaction": existing.reaction_type}
    else:
        new_reaction = StoryReaction(
            story_id=story_id,
            user_id=current_user.id,
            reaction_type=reaction_data.reaction_type,
        )
        db.add(new_reaction)
        db.commit()
        return {"message": "Reaction added", "reaction": new_reaction.reaction_type}
