from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import User, SocialPost, PostReaction, PostComment, TopicFollow, UserFollow
from auth.utils import get_current_user, get_current_user_optional
from sqlalchemy.orm.attributes import flag_modified

router = APIRouter()

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

class CommentOut(BaseModel):
    id: int
    content: str
    contains_spoiler: bool
    media_url: Optional[str]
    created_at: datetime
    author: Dict[str, Any]

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
    created_at: datetime
    author: Dict[str, Any]
    reactions: List[ReactionOut]
    comments_count: int
    user_reaction: Optional[str] = None


# ----------------- ENDPOINTS -----------------

@router.post("/posts/", response_model=SocialPostOut)
def create_post(post: SocialPostCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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
    return format_post(new_post, current_user.id)

@router.post("/posts/{post_id}/react")
@router.post("/posts/posts/{post_id}/react")
def react_to_post(post_id: int, reaction: ReactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
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
            db.commit()
            return {"status": "removed"}
        else:
            # Change reaction
            existing_reaction.reaction_type = reaction.reaction_type
            db.commit()
            return {"status": "updated"}
    else:
        new_reaction = PostReaction(
            post_id=post_id,
            user_id=current_user.id,
            reaction_type=reaction.reaction_type
        )
        db.add(new_reaction)
        db.commit()
        return {"status": "added"}


@router.post("/posts/{post_id}/poll/vote", response_model=SocialPostOut)
@router.post("/posts/posts/{post_id}/poll/vote", response_model=SocialPostOut)
def vote_on_poll(
    post_id: int,
    vote_req: PollVoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
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
    
    # Record user vote
    voters[user_key] = vote_req.option_index
    payload["voters"] = voters
    
    # Re-calculate counts
    counts = [0] * len(options)
    for v_idx in voters.values():
        if isinstance(v_idx, int) and 0 <= v_idx < len(options):
            counts[v_idx] += 1
            
    payload["votes"] = counts
    payload["total_votes"] = sum(counts)
    
    post.payload = payload
    flag_modified(post, "payload")
    db.commit()
    db.refresh(post)
    
    return format_post(post, current_user.id)


@router.post("/posts/{post_id}/comment", response_model=CommentOut)
@router.post("/posts/posts/{post_id}/comment", response_model=CommentOut)
def add_comment(post_id: int, comment: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    post = db.query(SocialPost).filter(SocialPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    new_comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment.content,
        contains_spoiler=comment.contains_spoiler,
        media_url=comment.media_url
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return {
        "id": new_comment.id,
        "content": new_comment.content,
        "contains_spoiler": new_comment.contains_spoiler,
        "media_url": new_comment.media_url,
        "created_at": new_comment.created_at,
        "author": {
            "id": current_user.id,
            "name": current_user.name,
            "username": current_user.username,
            "avatar_url": current_user.avatar_url
        }
    }


@router.get("/posts/movie/{movie_id}", response_model=List[SocialPostOut])
def get_movie_posts(movie_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    posts = db.query(SocialPost).filter(
        SocialPost.movie_id == movie_id
    ).order_by(SocialPost.created_at.desc()).limit(50).all()
    
    current_id = current_user.id if current_user else None
    return [format_post(p, current_id) for p in posts]


@router.get("/posts/{post_id}/comments", response_model=List[CommentOut])
@router.get("/posts/posts/{post_id}/comments", response_model=List[CommentOut])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = db.query(PostComment).filter(PostComment.post_id == post_id).order_by(PostComment.created_at.asc()).all()
    return [
        {
            "id": c.id,
            "content": c.content,
            "contains_spoiler": c.contains_spoiler,
            "media_url": c.media_url,
            "created_at": c.created_at,
            "author": {
                "id": c.user.id,
                "name": c.user.name,
                "username": c.user.username,
                "avatar_url": c.user.avatar_url
            }
        } for c in comments
    ]


@router.get("/feed/following", response_model=List[SocialPostOut])
@router.get("/posts/feed/following", response_model=List[SocialPostOut])
def get_following_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get IDs of people the user follows
    following_ids = [f.following_id for f in current_user.following]
    if not following_ids:
        # Fallback to general recent so the feed is never empty!
        posts = db.query(SocialPost).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()
        return [format_post(p, current_user.id) for p in posts]
        
    posts = db.query(SocialPost).filter(
        SocialPost.user_id.in_(following_ids)
    ).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()
    
    if not posts:
        posts = db.query(SocialPost).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()

    return [format_post(p, current_user.id) for p in posts]


@router.get("/feed/for-you", response_model=List[SocialPostOut])
@router.get("/posts/feed/for-you", response_model=List[SocialPostOut])
def get_for_you_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user_optional)):
    if not current_user:
        # Public feed - just popular/recent posts
        posts = db.query(SocialPost).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()
        return [format_post(p, None) for p in posts]
        
    # Intelligent Feed: Mix of following, topic follows, and popular
    following_ids = [f.following_id for f in current_user.following]
    
    # Topic follows (e.g. movies, genres)
    topic_follows = db.query(TopicFollow).filter(TopicFollow.user_id == current_user.id).all()
    followed_movie_ids = [int(t.entity_id) for t in topic_follows if t.entity_type == 'movie' and t.entity_id.isdigit()]
    
    conditions = []
    if following_ids:
        conditions.append(SocialPost.user_id.in_(following_ids))
    if followed_movie_ids:
        conditions.append(SocialPost.movie_id.in_(followed_movie_ids))

    if conditions:
        posts = db.query(SocialPost).filter(or_(*conditions)).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()
    else:
        posts = []
    
    # Fallback to general recent if empty so feed is always vibrant
    if not posts:
        posts = db.query(SocialPost).order_by(SocialPost.created_at.desc()).offset(offset).limit(limit).all()
        
    return [format_post(p, current_user.id) for p in posts]


# ----------------- HELPERS -----------------

def format_post(post: SocialPost, current_user_id: Optional[int]) -> Dict[str, Any]:
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
        "created_at": post.created_at,
        "author": {
            "id": post.user.id,
            "name": post.user.name,
            "username": post.user.username,
            "avatar_url": post.user.avatar_url,
            "is_following": any(f.follower_id == current_user_id for f in post.user.followers) if current_user_id else False
        },
        "reactions": reactions_list,
        "comments_count": len(post.post_comments),
        "user_reaction": user_reaction
    }
