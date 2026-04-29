from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import Optional, List
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/battles", tags=["verdict-battles"])


def _build_battle_out(battle: models.VerdictBattle, current_user_id: Optional[int], include_args: bool = False) -> schemas.VerdictBattleOut:
    side_a_votes = sum(1 for v in battle.votes if v.side == "a")
    side_b_votes = sum(1 for v in battle.votes if v.side == "b")
    user_vote = None
    if current_user_id:
        vote = next((v for v in battle.votes if v.user_id == current_user_id), None)
        if vote:
            user_vote = vote.side

    args = []
    if include_args:
        for arg in sorted(battle.arguments, key=lambda a: a.created_at):
            args.append(schemas.BattleArgumentOut(
                id=arg.id,
                battle_id=arg.battle_id,
                user_id=arg.user_id,
                author_name=arg.user.name,
                side=arg.side,
                content=arg.content,
                created_at=arg.created_at
            ))

    return schemas.VerdictBattleOut(
        id=battle.id,
        movie_id=battle.movie_id,
        media_type=battle.media_type,
        creator_id=battle.creator_id,
        creator_name=battle.creator.name,
        title=battle.title,
        side_a_label=battle.side_a_label,
        side_b_label=battle.side_b_label,
        description=battle.description,
        ends_at=battle.ends_at,
        status=battle.status,
        created_at=battle.created_at,
        side_a_votes=side_a_votes,
        side_b_votes=side_b_votes,
        user_vote=user_vote,
        argument_count=len(battle.arguments),
        arguments=args
    )


@router.get("", response_model=List[schemas.VerdictBattleOut])
def get_battles(
    movie_id: int = Query(...),
    media_type: str = Query("movie"),
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    try:
        uid = current_user.id if current_user else None
    except Exception:
        uid = None

    battles = db.query(models.VerdictBattle).filter(
        models.VerdictBattle.movie_id == movie_id,
        models.VerdictBattle.media_type == media_type
    ).order_by(models.VerdictBattle.created_at.desc()).all()

    return [_build_battle_out(b, uid) for b in battles]


@router.get("/featured", response_model=List[schemas.VerdictBattleOut])
def get_featured_battles(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    try:
        uid = current_user.id if current_user else None
    except Exception:
        uid = None

    battles = db.query(models.VerdictBattle).filter(
        models.VerdictBattle.status == "active"
    ).order_by(models.VerdictBattle.created_at.desc()).limit(10).all()

    return [_build_battle_out(b, uid) for b in battles]


@router.get("/{battle_id}", response_model=schemas.VerdictBattleOut)
def get_battle(
    battle_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    try:
        uid = current_user.id if current_user else None
    except Exception:
        uid = None

    battle = db.query(models.VerdictBattle).filter(models.VerdictBattle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    return _build_battle_out(battle, uid, include_args=True)


@router.post("", response_model=schemas.VerdictBattleOut, status_code=201)
def create_battle(
    payload: schemas.VerdictBattleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ends_at = datetime.now(timezone.utc) + timedelta(days=payload.duration_days)

    battle = models.VerdictBattle(
        movie_id=payload.movie_id,
        media_type=payload.media_type,
        creator_id=current_user.id,
        title=payload.title,
        side_a_label=payload.side_a_label,
        side_b_label=payload.side_b_label,
        description=payload.description,
        ends_at=ends_at,
        status="active"
    )
    db.add(battle)
    db.commit()
    db.refresh(battle)
    return _build_battle_out(battle, current_user.id)


@router.post("/{battle_id}/arguments", response_model=schemas.BattleArgumentOut, status_code=201)
def add_argument(
    battle_id: int,
    payload: schemas.BattleArgumentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if payload.side not in ("a", "b"):
        raise HTTPException(status_code=400, detail="Side must be 'a' or 'b'")

    battle = db.query(models.VerdictBattle).filter(models.VerdictBattle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")
    if battle.status != "active":
        raise HTTPException(status_code=400, detail="Battle has ended")

    arg = models.BattleArgument(
        battle_id=battle_id,
        user_id=current_user.id,
        side=payload.side,
        content=payload.content
    )
    db.add(arg)
    db.commit()
    db.refresh(arg)

    return schemas.BattleArgumentOut(
        id=arg.id,
        battle_id=arg.battle_id,
        user_id=arg.user_id,
        author_name=current_user.name,
        side=arg.side,
        content=arg.content,
        created_at=arg.created_at
    )


@router.post("/{battle_id}/vote")
def vote_battle(
    battle_id: int,
    payload: schemas.BattleVoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if payload.side not in ("a", "b"):
        raise HTTPException(status_code=400, detail="Side must be 'a' or 'b'")

    battle = db.query(models.VerdictBattle).filter(models.VerdictBattle.id == battle_id).first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    existing = db.query(models.BattleVote).filter(
        models.BattleVote.battle_id == battle_id,
        models.BattleVote.user_id == current_user.id
    ).first()

    if existing:
        if existing.side == payload.side:
            db.delete(existing)  # Toggle off
        else:
            existing.side = payload.side  # Switch side
        db.commit()
    else:
        vote = models.BattleVote(
            battle_id=battle_id,
            user_id=current_user.id,
            side=payload.side
        )
        db.add(vote)
        db.commit()

    db.refresh(battle)
    return _build_battle_out(battle, current_user.id)
