from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, or_
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import User, SocialPost, PostReaction, PostComment, CommentVote, TopicFollow, UserFollow
from auth.utils import get_current_user, get_current_user_optional
from sqlalchemy.orm.attributes import flag_modified
from cache_utils import cache_get, cache_set

router = APIRouter()

FEED_CACHE_TTL = 20
MAX_LIMIT = 100

# ----------------- FEED CACHE INVALIDATION -----------------
# get_movie_posts/get_following_feed/get_for_you_feed cache their results for
# FEED_CACHE_TTL seconds. Without this, reacting/commenting/voting/posting
# doesn't change what those cached responses return, so a reload within the
# TTL window shows stale data (e.g. a like that "doesn't save"). Every write
# below bumps this epoch; every list read mixes it into the cache key, so a
# write instantly invalidates all previously-cached feed reads.
FEED_EPOCH_KEY = "feed:epoch"

async def _feed_epoch() -> str:
    return (await cache_get(FEED_EPOCH_KEY)) or "0"

async def _bump_feed_epoch() -> None:
    await cache_set(FEED_EPOCH_KEY, str(int(datetime.utcnow().timestamp() * 1000)), 86400)

POST_LIST_OPTIONS = (
    joinedload(SocialPost.user),
    joinedload(SocialPost.reactions).joinedload(PostReaction.user),
)

# ----------------- SCHEMAS -----------------

class SocialPostCreate(BaseModel):
    post_type: str
    content: Optional[str] = None
    movie_id: Optional[int] = None
    payload: Optional[Dict[str, Any]] = None
    is_spoiler: bool = False

class ReactionCreate(BaseModel):
    reaction_type: str

class PollVoteRequest(BaseModel):
    option_index: int

class CommentCreate(BaseModel):
    content: str
    contains_spoiler: bool = False
    media_url: Optional[str] = None
    parent_id: Optional[int] = None

class CommentVoteCreate(BaseModel):
    vote: str  # "up" or "down"

class CommentOut(BaseModel):
    id: int
    content: str
    contains_spoiler: bool
    media_url: Optional[str]
    created_at: datetime
    author: Dict[str, Any]
    parent_id: Optional[int] = None
    upvotes: int = 0
    downvotes: int = 0
    user_vote: Optional[str] = None

class ReactionOut(BaseModel):
    id: int
    reaction_type: str
    user_id: int
    author_name: str
    author_avatar: Optional[str]

class SocialPostOut(BaseModel):
    id: int
    post_type: str
    content: Optional[str]
    movie_id: Optional[int]
    payload: Optional[Dict[str, Any]]
    is_spoiler: bool
    is_archived: bool = False
    created_at: datetime
    author: Dict[str, Any]
    reactions: List[ReactionOut]
    comments_count: int
    user_reaction: Optional[str] = None


# ----------------- ENDPOINTS -----------------

@router.post("/posts/", response_model=SocialPostOut)
async def create_post(post: SocialPostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_post = SocialPost(
        user_id=current_user.id,
        post_type=post.post_type,
        movie_id=post.movie_id,
        content=post.content,
        payload=post.payload,
        is_spoiler=post.is_spoiler
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    await _bump_feed_epoch()
    return format_post(db, new_post, current_user.id, comments_count=0, is_following=False)

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    db.delete(post)
    db.commit()
    await _bump_feed_epoch()
    return {"message": "Post deleted successfully", "id": post_id}

@router.patch("/posts/{post_id}/archive", response_model=SocialPostOut)
async def toggle_archive_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(SocialPost).options(*POST_LIST_OPTIONS).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to modify this post")
    post.is_archived = not bool(post.is_archived)
    db.commit()
    db.refresh(post)
    await _bump_feed_epoch()
    return format_post(db, post, current_user.id)

@router.get("/posts/my", response_model=List[SocialPostOut])
async def get_my_posts(
    include_archived: bool = False,
    archived_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SocialPost).options(*POST_LIST_OPTIONS).filter(SocialPost.user_id == current_user.id)
    if archived_only:
        query = query.filter(SocialPost.is_archived == True)
    elif not include_archived:
        query = query.filter(or_(SocialPost.is_archived == False, SocialPost.is_archived.is_(None)))
    posts = query.order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()
    return format_posts(db, posts, current_user.id)

@router.get("/posts/user/{user_id}", response_model=List[SocialPostOut])
async def get_user_posts(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    query = db.query(SocialPost).options(*POST_LIST_OPTIONS).filter(SocialPost.user_id == user_id)
    if not current_user or current_user.id != user_id:
        query = query.filter(or_(SocialPost.is_archived == False, SocialPost.is_archived.is_(None)))
    posts = query.order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()
    current_id = current_user.id if current_user else None
    return format_posts(db, posts, current_id)

@router.post("/posts/{post_id}/react", response_model=SocialPostOut)
@router.post("/posts/posts/{post_id}/react", response_model=SocialPostOut)
async def react_to_post(post_id: int, reaction: ReactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(SocialPost).options(*POST_LIST_OPTIONS).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_reaction = db.query(PostReaction).filter(
        PostReaction.post_id == post_id,
        PostReaction.user_id == current_user.id
    ).first()

    if existing_reaction:
        if existing_reaction.reaction_type == reaction.reaction_type:
            # Toggle off
            db.delete(existing_reaction)
        else:
            # Change reaction
            existing_reaction.reaction_type = reaction.reaction_type
    else:
        new_reaction = PostReaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction_type=reaction.reaction_type
        )
        db.add(new_reaction)

    db.commit()
    db.refresh(post)
    await _bump_feed_epoch()

    # Return the authoritative post (reactions included) so the client can
    # sync its optimistic UI to real state instead of guessing.
    return format_post(db, post, current_user.id)


@router.post("/posts/{post_id}/poll/vote", response_model=SocialPostOut)
@router.post("/posts/posts/{post_id}/poll/vote", response_model=SocialPostOut)
async def vote_on_poll(
    post_id: int,
    vote_req: PollVoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Lock the row for the duration of the read-modify-write so concurrent
    # votes on the same poll can't clobber each other's counts.
    post = db.query(SocialPost).filter(SocialPost.id == post_id).with_for_update().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.post_type != "poll":
        raise HTTPException(status_code=400, detail="Post is not a poll")

    payload = dict(post.payload or {})
    options = payload.get("options", [])
    if not options or vote_req.option_index < 0 or vote_req.option_index >= len(options):
        raise HTTPException(status_code=400, detail="Invalid option index")

    voters = dict(payload.get("voters") or {})
    user_key = str(current_user.id)
    previous_vote = voters.get(user_key)

    counts = payload.get("votes")
    if not counts or len(counts) != len(options):
        # No valid counts cached yet - derive them once from voters.
        counts = [0] * len(options)
        for v_idx in voters.values():
            if isinstance(v_idx, int) and 0 <= v_idx < len(options):
                counts[v_idx] += 1
    else:
        counts = list(counts)

    # Incrementally adjust instead of recomputing over every voter.
    if isinstance(previous_vote, int) and 0 <= previous_vote < len(options):
        counts[previous_vote] = max(0, counts[previous_vote] - 1)
    counts[vote_req.option_index] += 1

    voters[user_key] = vote_req.option_index
    payload["voters"] = voters
    payload["votes"] = counts
    payload["total_votes"] = sum(counts)

    post.payload = payload
    flag_modified(post, "payload")
    db.commit()
    db.refresh(post)
    await _bump_feed_epoch()

    return format_post(db, post, current_user.id)


@router.post("/posts/{post_id}/comment", response_model=CommentOut)
@router.post("/posts/posts/{post_id}/comment", response_model=CommentOut)
async def add_comment(post_id: int, comment: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    parent_id = comment.parent_id
    if parent_id is not None:
        parent = db.query(PostComment).filter(
            PostComment.id == parent_id,
            PostComment.post_id == post_id,
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent comment not found on this post")
        # Threads nest to arbitrary depth (Reddit-style) — a reply attaches
        # directly to whichever comment the user tapped "Reply" on.

    new_comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=parent_id,
        content=comment.content,
        contains_spoiler=comment.contains_spoiler,
        media_url=comment.media_url
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    await _bump_feed_epoch()

    return {
        "id": new_comment.id,
        "content": new_comment.content,
        "contains_spoiler": new_comment.contains_spoiler,
        "media_url": new_comment.media_url,
        "created_at": new_comment.created_at,
        "parent_id": new_comment.parent_id,
        "upvotes": 0,
        "downvotes": 0,
        "user_vote": None,
        "author": {
            "id": current_user.id,
            "name": current_user.name,
            "username": current_user.username,
            "avatar_url": current_user.avatar_url
        }
    }


@router.get("/posts/movie/{movie_id}", response_model=List[SocialPostOut])
async def get_movie_posts(
    movie_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    limit = min(max(limit, 1), MAX_LIMIT)
    offset = max(offset, 0)
    current_id = current_user.id if current_user else None

    epoch = await _feed_epoch()
    cache_key = f"feed:movie:{movie_id}:{current_id or 'anon'}:{limit}:{offset}:{epoch}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    posts = db.query(SocialPost).options(*POST_LIST_OPTIONS).filter(
        SocialPost.movie_id == movie_id
    ).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()

    result = format_posts(db, posts, current_id)
    await cache_set(cache_key, _for_cache(result), FEED_CACHE_TTL)
    return result


@router.get("/posts/{post_id}/comments", response_model=List[CommentOut])
@router.get("/posts/posts/{post_id}/comments", response_model=List[CommentOut])
def get_comments(
    post_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    limit = min(max(limit, 1), MAX_LIMIT)
    offset = max(offset, 0)
    current_id = current_user.id if current_user else None

    comments = db.query(PostComment).options(
        joinedload(PostComment.user), joinedload(PostComment.votes)
    ).filter(
        PostComment.post_id == post_id
    ).order_by(PostComment.created_at.asc()).offset(offset).limit(limit).all()

    result = []
    for c in comments:
        upvotes = sum(1 for v in c.votes if v.vote == "up")
        downvotes = sum(1 for v in c.votes if v.vote == "down")
        user_vote = None
        if current_id:
            v = next((v for v in c.votes if v.user_id == current_id), None)
            if v:
                user_vote = v.vote

        result.append({
            "id": c.id,
            "content": c.content,
            "contains_spoiler": c.contains_spoiler,
            "media_url": c.media_url,
            "created_at": c.created_at,
            "parent_id": c.parent_id,
            "upvotes": upvotes,
            "downvotes": downvotes,
            "user_vote": user_vote,
            "author": {
                "id": c.user.id,
                "name": c.user.name,
                "username": c.user.username,
                "avatar_url": c.user.avatar_url
            }
        })
    return result


@router.post("/posts/comments/{comment_id}/vote", response_model=CommentOut)
async def vote_on_comment(
    comment_id: int,
    payload: CommentVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.vote not in ("up", "down"):
        raise HTTPException(status_code=400, detail="Vote must be 'up' or 'down'")

    comment = db.query(PostComment).options(
        joinedload(PostComment.user), joinedload(PostComment.votes)
    ).filter(PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing = db.query(CommentVote).filter(
        CommentVote.comment_id == comment_id,
        CommentVote.user_id == current_user.id
    ).first()

    if existing:
        if existing.vote == payload.vote:
            db.delete(existing)  # Toggle off
        else:
            existing.vote = payload.vote
    else:
        db.add(CommentVote(comment_id=comment_id, user_id=current_user.id, vote=payload.vote))

    db.commit()
    db.refresh(comment)

    upvotes = sum(1 for v in comment.votes if v.vote == "up")
    downvotes = sum(1 for v in comment.votes if v.vote == "down")
    user_vote = next((v.vote for v in comment.votes if v.user_id == current_user.id), None)

    return {
        "id": comment.id,
        "content": comment.content,
        "contains_spoiler": comment.contains_spoiler,
        "media_url": comment.media_url,
        "created_at": comment.created_at,
        "parent_id": comment.parent_id,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "user_vote": user_vote,
        "author": {
            "id": comment.user.id,
            "name": comment.user.name,
            "username": comment.user.username,
            "avatar_url": comment.user.avatar_url
        }
    }


@router.get("/feed/following", response_model=List[SocialPostOut])
@router.get("/posts/feed/following", response_model=List[SocialPostOut])
async def get_following_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    limit = min(max(limit, 1), MAX_LIMIT)
    offset = max(offset, 0)

    epoch = await _feed_epoch()
    cache_key = f"feed:following:{current_user.id}:{limit}:{offset}:{epoch}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    # Strictly get posts from people the user follows
    not_archived = or_(SocialPost.is_archived == False, SocialPost.is_archived.is_(None))
    following_ids = [f.following_id for f in current_user.following]
    if not following_ids:
        # No following users -> return empty list (no random fallbacks)
        return []

    posts = db.query(SocialPost).options(*POST_LIST_OPTIONS).filter(
        SocialPost.user_id.in_(following_ids),
        not_archived
    ).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()

    result = format_posts(db, posts, current_user.id)
    await cache_set(cache_key, _for_cache(result), FEED_CACHE_TTL)
    return result


@router.get("/feed/for-you", response_model=List[SocialPostOut])
@router.get("/posts/feed/for-you", response_model=List[SocialPostOut])
async def get_for_you_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    limit = min(max(limit, 1), MAX_LIMIT)
    offset = max(offset, 0)
    current_id = current_user.id if current_user else None

    epoch = await _feed_epoch()
    cache_key = f"feed:foryou:{current_id or 'anon'}:{limit}:{offset}:{epoch}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached

    not_archived = or_(SocialPost.is_archived == False, SocialPost.is_archived.is_(None))

    # For You feed: shows all active community posts across the platform ordered by recent
    posts = db.query(SocialPost).options(*POST_LIST_OPTIONS).filter(
        not_archived
    ).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()

    result = format_posts(db, posts, current_id)
    await cache_set(cache_key, _for_cache(result), FEED_CACHE_TTL)
    return result


# ----------------- HELPERS -----------------

def _for_cache(posts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Datetime objects aren't JSON-serializable; stringify before caching.
    Pydantic parses ISO datetime strings back on the way out via response_model."""
    out = []
    for p in posts:
        p = dict(p)
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
        out.append(p)
    return out


def format_posts(db: Session, posts: List[SocialPost], current_user_id: Optional[int]) -> List[Dict[str, Any]]:
    """Batch-format posts, avoiding one lazy-load round trip per post per relationship."""
    post_ids = [p.id for p in posts]

    comments_count_map: Dict[int, int] = {}
    if post_ids:
        rows = db.query(PostComment.post_id, func.count(PostComment.id)).filter(
            PostComment.post_id.in_(post_ids)
        ).group_by(PostComment.post_id).all()
        comments_count_map = {post_id: count for post_id, count in rows}

    following_ids: set = set()
    if current_user_id:
        author_ids = {p.user_id for p in posts}
        if author_ids:
            rows = db.query(UserFollow.following_id).filter(
                UserFollow.follower_id == current_user_id,
                UserFollow.following_id.in_(author_ids)
            ).all()
            following_ids = {row[0] for row in rows}

    return [
        format_post(
            db,
            post,
            current_user_id,
            comments_count=comments_count_map.get(post.id, 0),
            is_following=post.user_id in following_ids,
        )
        for post in posts
    ]


def format_post(
    db: Session,
    post: SocialPost,
    current_user_id: Optional[int],
    comments_count: Optional[int] = None,
    is_following: Optional[bool] = None,
) -> Dict[str, Any]:
    reactions_list = []
    user_reaction = None

    for r in post.reactions:
        reactions_list.append({
            "id": r.id,
            "reaction_type": r.reaction_type,
            "user_id": r.user_id,
            "author_name": r.user.name,
            "author_avatar": r.user.avatar_url
        })
        if current_user_id and r.user_id == current_user_id:
            user_reaction = r.reaction_type

    if comments_count is None:
        comments_count = db.query(func.count(PostComment.id)).filter(PostComment.post_id == post.id).scalar() or 0

    if is_following is None:
        is_following = current_user_id is not None and db.query(UserFollow.id).filter(
            UserFollow.follower_id == current_user_id,
            UserFollow.following_id == post.user_id
        ).first() is not None

    payload = dict(post.payload or {})
    if post.post_type == "poll":
        options = payload.get("options", [])
        voters = payload.get("voters") or {}
        counts = payload.get("votes")
        if not counts or len(counts) != len(options):
            counts = [0] * len(options)
            for v_idx in voters.values():
                if isinstance(v_idx, int) and 0 <= v_idx < len(options):
                    counts[v_idx] += 1
            payload["votes"] = counts
            
        total_votes = sum(counts)
        payload["total_votes"] = total_votes
        
        if total_votes > 0:
            payload["percentages"] = [round((c / total_votes) * 100, 1) for c in counts]
        else:
            payload["percentages"] = [0.0] * len(options)
            
        if current_user_id:
            payload["user_vote"] = voters.get(str(current_user_id))
        else:
            payload["user_vote"] = None

    return {
        "id": post.id,
        "post_type": post.post_type,
        "content": post.content,
        "movie_id": post.movie_id,
        "payload": payload,
        "is_spoiler": post.is_spoiler,
        "is_archived": bool(getattr(post, "is_archived", False)),
        "created_at": post.created_at,
        "author": {
            "id": post.user.id,
            "name": post.user.name,
            "username": post.user.username,
            "avatar_url": post.user.avatar_url,
            "is_following": is_following
        },
        "reactions": reactions_list,
        "comments_count": comments_count,
        "user_reaction": user_reaction
    }
