from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import Optional, List

router = APIRouter(prefix="/comments", tags=["comments"])


def _build_comment_out(comment: models.Comment, current_user_id: Optional[int]) -> schemas.CommentOut:
    likes = sum(1 for l in comment.likes if l.is_like)
    dislikes = sum(1 for l in comment.likes if not l.is_like)
    user_vote = None
    if current_user_id:
        vote = next((l for l in comment.likes if l.user_id == current_user_id), None)
        if vote:
            user_vote = vote.is_like

    return schemas.CommentOut(
        id=comment.id,
        user_id=comment.user_id,
        movie_id=comment.movie_id,
        media_type=comment.media_type,
        content=comment.content,
        contains_spoiler=comment.contains_spoiler or False,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author_name=comment.user.name,
        like_info=schemas.LikeInfo(likes=likes, dislikes=dislikes, user_vote=user_vote)
    )


@router.get("", response_model=List[schemas.CommentOut])
def get_comments(
    movie_id: int = Query(...),
    media_type: str = Query("movie"),
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    try:
        uid = current_user.id if current_user else None
    except Exception:
        uid = None

    offset = (page - 1) * limit
    comments = db.query(models.Comment).filter(
        models.Comment.movie_id == movie_id,
        models.Comment.media_type == media_type
    ).order_by(models.Comment.created_at.desc()).offset(offset).limit(limit).all()

    return [_build_comment_out(c, uid) for c in comments]


@router.post("", response_model=schemas.CommentOut, status_code=201)
def add_comment(
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = models.Comment(
        user_id=current_user.id,
        movie_id=payload.movie_id,
        media_type=payload.media_type,
        content=payload.content,
        contains_spoiler=payload.contains_spoiler
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _build_comment_out(comment, current_user.id)


@router.put("/{comment_id}", response_model=schemas.CommentOut)
def edit_comment(
    comment_id: int,
    payload: schemas.CommentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")
    comment.content = payload.content
    db.commit()
    db.refresh(comment)
    return _build_comment_out(comment, current_user.id)


@router.delete("/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")
    db.delete(comment)
    db.commit()


@router.post("/{comment_id}/like")
def toggle_like(
    comment_id: int,
    is_like: bool = Query(..., description="True for like, False for dislike"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    existing = db.query(models.CommentLike).filter(
        models.CommentLike.comment_id == comment_id,
        models.CommentLike.user_id == current_user.id
    ).first()

    if existing:
        if existing.is_like == is_like:
            # Toggle off
            db.delete(existing)
        else:
            existing.is_like = is_like
        db.commit()
    else:
        like = models.CommentLike(
            comment_id=comment_id,
            user_id=current_user.id,
            is_like=is_like
        )
        db.add(like)
        db.commit()

    db.refresh(comment)
    return _build_comment_out(comment, current_user.id)
