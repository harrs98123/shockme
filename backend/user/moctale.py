from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from auth.router import get_current_user
import models
import schemas

router = APIRouter(prefix="/moctale", tags=["moctale"])

VALID_LABELS = {"skip", "timepass", "goforit", "perfection"}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class MoctaleSubmit(BaseModel):
    label: str          # skip | timepass | goforit | perfection
    media_type: str = "movie"
    review_text: Optional[str] = None
    title: Optional[str] = None
    poster_path: Optional[str] = None


class MoctaleReviewCommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

class MoctaleReviewCommentOut(BaseModel):
    id: int
    review_id: int
    user_id: int
    author_name: str
    content: str
    created_at: datetime
    parent_id: Optional[int] = None
    likes_count: int = 0
    user_liked: bool = False
    replies: List["MoctaleReviewCommentOut"] = []

    class Config:
        from_attributes = True

try:
    MoctaleReviewCommentOut.model_rebuild()
except AttributeError:
    MoctaleReviewCommentOut.update_forward_refs()

class ReviewOut(BaseModel):
    id: int
    user_id: int
    author_name: str
    label: str
    review_text: Optional[str]
    created_at: datetime
    likes_count: int = 0
    user_liked: bool = False
    comments_count: int = 0
    comments: List[MoctaleReviewCommentOut] = []

    class Config:
        from_attributes = True


class MoctaleStatsOut(BaseModel):
    total: int
    skip: int
    timepass: int
    goforit: int
    perfection: int
    skip_pct: float
    timepass_pct: float
    goforit_pct: float
    perfection_pct: float
    top_label: str
    user_label: Optional[str]   # what the current user voted (if any)
    reviews: List[ReviewOut]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/{movie_id}", status_code=status.HTTP_200_OK)
def submit_rating(
    movie_id: int,
    body: MoctaleSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    label = body.label.lower()
    if label not in VALID_LABELS:
        raise HTTPException(400, f"Invalid label. Must be one of: {', '.join(VALID_LABELS)}")

    existing = (
        db.query(models.MoctaleRating)
        .filter_by(user_id=current_user.id, movie_id=movie_id)
        .first()
    )

    if existing:
        existing.label = label
        existing.review_text = body.review_text
        if body.title: existing.title = body.title
        if body.poster_path: existing.poster_path = body.poster_path
    else:
        rating = models.MoctaleRating(
            user_id=current_user.id,
            movie_id=movie_id,
            media_type=body.media_type,
            label=label,
            review_text=body.review_text,
            title=body.title,
            poster_path=body.poster_path
        )
        db.add(rating)

    db.commit()
    return {"status": "ok", "label": label}


@router.get("/my", response_model=List[schemas.UserReviewOut])
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    reviews = (
        db.query(models.MoctaleRating)
        .filter_by(user_id=current_user.id)
        .order_by(models.MoctaleRating.created_at.desc())
        .all()
    )
    return reviews


@router.delete("/{movie_id}", status_code=status.HTTP_200_OK)
def delete_rating(
    movie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    existing = (
        db.query(models.MoctaleRating)
        .filter_by(user_id=current_user.id, movie_id=movie_id)
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
    return {"status": "ok"}


@router.get("/{movie_id}", response_model=MoctaleStatsOut)
def get_stats(
    movie_id: int,
    media_type: str = "movie",
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user),
):
    all_ratings = (
        db.query(models.MoctaleRating)
        .filter_by(movie_id=movie_id, media_type=media_type)
        .options(
            joinedload(models.MoctaleRating.user),
            joinedload(models.MoctaleRating.likes),
            joinedload(models.MoctaleRating.comments).joinedload(models.MoctaleReviewComment.user),
            joinedload(models.MoctaleRating.comments).joinedload(models.MoctaleReviewComment.likes)
        )
        .order_by(models.MoctaleRating.created_at.desc())
        .all()
    )

    counts = {"skip": 0, "timepass": 0, "goforit": 0, "perfection": 0}
    for r in all_ratings:
        if r.label in counts:
            counts[r.label] += 1

    total = sum(counts.values())

    def pct(v):
        return round(v / total * 100, 1) if total > 0 else 0.0

    top_label = max(counts, key=counts.get) if total > 0 else "goforit"

    user_label = None
    if current_user:
        my = next((r for r in all_ratings if r.user_id == current_user.id), None)
        if my:
            user_label = my.label

    reviews = []
    for r in all_ratings:
        if r.review_text:
            user_liked = False
            if current_user:
                user_liked = any(like.user_id == current_user.id for like in r.likes)
            
            comments_map = {}
            for c in r.comments:
                comments_map[c.id] = MoctaleReviewCommentOut(
                    id=c.id,
                    review_id=c.review_id,
                    user_id=c.user_id,
                    author_name=c.user.name if c.user else "User",
                    content=c.content,
                    created_at=c.created_at,
                    parent_id=c.parent_id,
                    likes_count=len(c.likes),
                    user_liked=any(l.user_id == current_user.id for l in c.likes) if current_user else False,
                    replies=[]
                )
            
            review_comments = []
            for c in r.comments:
                if c.parent_id and c.parent_id in comments_map:
                    comments_map[c.parent_id].replies.append(comments_map[c.id])
                elif not c.parent_id:
                    review_comments.append(comments_map[c.id])

            reviews.append(ReviewOut(
                id=r.id,
                user_id=r.user_id,
                author_name=r.user.name if r.user else "User",
                label=r.label,
                review_text=r.review_text,
                created_at=r.created_at,
                likes_count=len(r.likes),
                user_liked=user_liked,
                comments_count=len(r.comments),
                comments=review_comments
            ))

    return MoctaleStatsOut(
        total=total,
        skip=counts["skip"],
        timepass=counts["timepass"],
        goforit=counts["goforit"],
        perfection=counts["perfection"],
        skip_pct=pct(counts["skip"]),
        timepass_pct=pct(counts["timepass"]),
        goforit_pct=pct(counts["goforit"]),
        perfection_pct=pct(counts["perfection"]),
        top_label=top_label,
        user_label=user_label,
        reviews=reviews,
    )

@router.post("/reviews/{review_id}/like")
def toggle_review_like(review_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.MoctaleReviewLike).filter_by(review_id=review_id, user_id=current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unliked"}
    else:
        new_like = models.MoctaleReviewLike(review_id=review_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"status": "liked"}

@router.post("/reviews/{review_id}/comments", response_model=MoctaleReviewCommentOut)
def add_review_comment(review_id: int, body: MoctaleReviewCommentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    review = db.query(models.MoctaleRating).filter_by(id=review_id).first()
    if not review:
        raise HTTPException(404, "Review not found")
    new_comment = models.MoctaleReviewComment(
        review_id=review_id, 
        user_id=current_user.id, 
        content=body.content,
        parent_id=body.parent_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return MoctaleReviewCommentOut(
        id=new_comment.id,
        review_id=new_comment.review_id,
        user_id=new_comment.user_id,
        author_name=current_user.name,
        content=new_comment.content,
        created_at=new_comment.created_at,
        parent_id=new_comment.parent_id,
        replies=[],
    )

@router.post("/comments/{comment_id}/like")
def toggle_comment_like(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    existing = db.query(models.MoctaleReviewCommentLike).filter_by(comment_id=comment_id, user_id=current_user.id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unliked"}
    else:
        new_like = models.MoctaleReviewCommentLike(comment_id=comment_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"status": "liked"}

@router.delete("/comments/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(comment_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    comment = db.query(models.MoctaleReviewComment).filter_by(id=comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "Not authorized to delete this comment")
    
    db.delete(comment)
    db.commit()
    return {"status": "ok"}
