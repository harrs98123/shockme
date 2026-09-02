from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import Optional, List

router = APIRouter(prefix="/debates", tags=["debates"])


def _build_debate_out(
    debate: models.Debate,
    current_user_id: Optional[int],
    reply_count: Optional[int] = None,
) -> schemas.DebateOut:
    upvotes = sum(1 for v in debate.votes if v.vote == "up")
    downvotes = sum(1 for v in debate.votes if v.vote == "down")
    user_vote = None
    if current_user_id:
        vote = next((v for v in debate.votes if v.user_id == current_user_id), None)
        if vote:
            user_vote = vote.vote

    if reply_count is None:
        # Only hit the lazy relationship when the caller didn't already
        # compute this from a batch it fetched (see get_debates).
        reply_count = len(debate.replies) if debate.replies else 0

    return schemas.DebateOut(
        id=debate.id,
        movie_id=debate.movie_id,
        media_type=debate.media_type,
        user_id=debate.user_id,
        stance=debate.stance,
        content=debate.content,
        parent_id=debate.parent_id,
        created_at=debate.created_at,
        author_name=debate.user.name,
        author_username=debate.user.username,
        author_avatar=debate.user.avatar_url,
        upvotes=upvotes,
        downvotes=downvotes,
        user_vote=user_vote,
        reply_count=reply_count
    )


@router.get("", response_model=List[schemas.DebateOut])
def get_debates(
    movie_id: int = Query(...),
    media_type: str = Query("movie"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    try:
        uid = current_user.id if current_user else None
    except Exception:
        uid = None

    # Return the WHOLE thread (top-level arguments + every nested reply) in
    # one call — the client builds the tree itself. Simpler and far fewer
    # round trips than lazily calling /debates/{id}/replies per node, and
    # debate threads on a single title are small enough that this is cheap.
    debates = db.query(models.Debate).options(joinedload(models.Debate.votes), joinedload(models.Debate.user)).filter(
        models.Debate.movie_id == movie_id,
        models.Debate.media_type == media_type,
    ).order_by(models.Debate.created_at.asc()).all()

    # Count each node's direct replies from the batch already in hand,
    # instead of lazy-loading debate.replies per row (would be one query each).
    reply_counts: dict[int, int] = {}
    for d in debates:
        if d.parent_id is not None:
            reply_counts[d.parent_id] = reply_counts.get(d.parent_id, 0) + 1

    return [_build_debate_out(d, uid, reply_count=reply_counts.get(d.id, 0)) for d in debates]


@router.get("/{debate_id}/replies", response_model=List[schemas.DebateOut])
def get_debate_replies(
    debate_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    try:
        uid = current_user.id if current_user else None
    except Exception:
        uid = None

    replies = db.query(models.Debate).filter(
        models.Debate.parent_id == debate_id
    ).order_by(models.Debate.created_at.asc()).all()

    return [_build_debate_out(r, uid) for r in replies]


@router.post("", response_model=schemas.DebateOut, status_code=201)
def create_debate(
    payload: schemas.DebateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if payload.parent_id is None:
        # A top-level argument must take a side.
        if payload.stance not in ("agree", "disagree"):
            raise HTTPException(status_code=400, detail="Stance must be 'agree' or 'disagree'")
        stance = payload.stance
        parent_id = None
    else:
        # A reply is just a reply — it doesn't take its own stance. Unlike
        # the social feed's comments, debate threads nest to arbitrary depth
        # (Reddit-style), so a reply attaches directly to whatever comment
        # the user tapped "Reply" on.
        parent = db.query(models.Debate).filter(models.Debate.id == payload.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent debate not found")
        if parent.movie_id != payload.movie_id or parent.media_type != payload.media_type:
            raise HTTPException(status_code=400, detail="Parent debate belongs to a different title")
        stance = "neutral"
        parent_id = parent.id

    debate = models.Debate(
        movie_id=payload.movie_id,
        media_type=payload.media_type,
        user_id=current_user.id,
        stance=stance,
        content=payload.content,
        parent_id=parent_id
    )
    db.add(debate)
    db.commit()
    db.refresh(debate)
    return _build_debate_out(debate, current_user.id)


@router.post("/{debate_id}/vote")
def vote_debate(
    debate_id: int,
    payload: schemas.DebateVoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if payload.vote not in ("up", "down"):
        raise HTTPException(status_code=400, detail="Vote must be 'up' or 'down'")

    debate = db.query(models.Debate).filter(models.Debate.id == debate_id).first()
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    existing = db.query(models.DebateVote).filter(
        models.DebateVote.debate_id == debate_id,
        models.DebateVote.user_id == current_user.id
    ).first()

    if existing:
        if existing.vote == payload.vote:
            db.delete(existing)  # Toggle off
        else:
            existing.vote = payload.vote
        db.commit()
    else:
        vote = models.DebateVote(
            debate_id=debate_id,
            user_id=current_user.id,
            vote=payload.vote
        )
        db.add(vote)
        db.commit()

    db.refresh(debate)
    return _build_debate_out(debate, current_user.id)
