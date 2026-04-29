from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import Optional, List

router = APIRouter(prefix="/debates", tags=["debates"])


def _build_debate_out(debate: models.Debate, current_user_id: Optional[int]) -> schemas.DebateOut:
    upvotes = sum(1 for v in debate.votes if v.vote == "up")
    downvotes = sum(1 for v in debate.votes if v.vote == "down")
    user_vote = None
    if current_user_id:
        vote = next((v for v in debate.votes if v.user_id == current_user_id), None)
        if vote:
            user_vote = vote.vote

    reply_count = len([r for r in debate.replies]) if debate.replies else 0

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

    # Get top-level debates only (parent_id is None)
    debates = db.query(models.Debate).filter(
        models.Debate.movie_id == movie_id,
        models.Debate.media_type == media_type,
        models.Debate.parent_id == None
    ).order_by(models.Debate.created_at.desc()).all()

    return [_build_debate_out(d, uid) for d in debates]


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
    if payload.stance not in ("agree", "disagree"):
        raise HTTPException(status_code=400, detail="Stance must be 'agree' or 'disagree'")

    debate = models.Debate(
        movie_id=payload.movie_id,
        media_type=payload.media_type,
        user_id=current_user.id,
        stance=payload.stance,
        content=payload.content,
        parent_id=payload.parent_id
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
