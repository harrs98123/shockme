import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import get_current_user
from typing import Optional, List

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/seasons", response_model=List[schemas.PredictionSeasonOut])
def get_seasons(
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    seasons = db.query(models.PredictionSeason).order_by(models.PredictionSeason.created_at.desc()).all()

    results = []
    for s in seasons:
        results.append(schemas.PredictionSeasonOut(
            id=s.id,
            name=s.name,
            ceremony=s.ceremony,
            status=s.status,
            created_at=s.created_at,
            category_count=len(s.categories),
            categories=[]
        ))
    return results


@router.get("/seasons/{season_id}", response_model=schemas.PredictionSeasonOut)
def get_season_detail(
    season_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    try:
        uid = current_user.id if current_user else None
    except Exception:
        uid = None

    season = db.query(models.PredictionSeason).filter(models.PredictionSeason.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    cats = []
    for cat in season.categories:
        nominees = json.loads(cat.nominees_json) if cat.nominees_json else []
        nominee_items = [schemas.NomineeItem(**n) for n in nominees]

        user_pred_id = None
        total_preds = len(cat.predictions)
        if uid:
            user_pred = next((p for p in cat.predictions if p.user_id == uid), None)
            if user_pred:
                user_pred_id = user_pred.predicted_movie_id

        cats.append(schemas.PredictionCategoryOut(
            id=cat.id,
            season_id=cat.season_id,
            name=cat.name,
            nominees=nominee_items,
            winner_movie_id=cat.winner_movie_id,
            user_prediction_id=user_pred_id,
            total_predictions=total_preds
        ))

    return schemas.PredictionSeasonOut(
        id=season.id,
        name=season.name,
        ceremony=season.ceremony,
        status=season.status,
        created_at=season.created_at,
        category_count=len(season.categories),
        categories=cats
    )


@router.post("/seasons", response_model=schemas.PredictionSeasonOut, status_code=201)
def create_season(
    payload: schemas.PredictionSeasonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new prediction season with categories."""
    season = models.PredictionSeason(
        name=payload.name,
        ceremony=payload.ceremony,
        status="open"
    )
    db.add(season)
    db.commit()
    db.refresh(season)

    for cat_data in payload.categories:
        cat = models.PredictionCategory(
            season_id=season.id,
            name=cat_data["name"],
            nominees_json=json.dumps(cat_data.get("nominees", []))
        )
        db.add(cat)
    db.commit()
    db.refresh(season)

    return schemas.PredictionSeasonOut(
        id=season.id,
        name=season.name,
        ceremony=season.ceremony,
        status=season.status,
        created_at=season.created_at,
        category_count=len(season.categories),
        categories=[]
    )


@router.post("/predict", status_code=201)
def make_prediction(
    payload: schemas.UserPredictionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    cat = db.query(models.PredictionCategory).filter(models.PredictionCategory.id == payload.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    season = db.query(models.PredictionSeason).filter(models.PredictionSeason.id == cat.season_id).first()
    if season.status != "open":
        raise HTTPException(status_code=400, detail="Predictions are locked for this season")

    # Verify nominee is valid
    nominees = json.loads(cat.nominees_json) if cat.nominees_json else []
    valid_ids = [n["movie_id"] for n in nominees]
    if payload.predicted_movie_id not in valid_ids:
        raise HTTPException(status_code=400, detail="Invalid nominee selection")

    existing = db.query(models.UserPrediction).filter(
        models.UserPrediction.user_id == current_user.id,
        models.UserPrediction.category_id == payload.category_id
    ).first()

    if existing:
        existing.predicted_movie_id = payload.predicted_movie_id
        db.commit()
        return {"message": "Prediction updated"}
    else:
        pred = models.UserPrediction(
            user_id=current_user.id,
            category_id=payload.category_id,
            predicted_movie_id=payload.predicted_movie_id
        )
        db.add(pred)
        db.commit()
        return {"message": "Prediction submitted"}


@router.get("/leaderboard/{season_id}", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(
    season_id: int,
    db: Session = Depends(get_db)
):
    season = db.query(models.PredictionSeason).filter(models.PredictionSeason.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    # Get all categories with winners
    categories_with_winners = [c for c in season.categories if c.winner_movie_id is not None]

    if not categories_with_winners:
        return []

    # Aggregate all predictions
    all_preds = db.query(models.UserPrediction).filter(
        models.UserPrediction.category_id.in_([c.id for c in season.categories])
    ).all()

    # Group by user
    user_scores = {}
    for pred in all_preds:
        if pred.user_id not in user_scores:
            user = db.query(models.User).filter(models.User.id == pred.user_id).first()
            user_scores[pred.user_id] = {
                "user_id": pred.user_id,
                "user_name": user.name if user else "Unknown",
                "correct": 0,
                "total": 0
            }
        user_scores[pred.user_id]["total"] += 1

        # Check if correct
        cat = next((c for c in categories_with_winners if c.id == pred.category_id), None)
        if cat and pred.predicted_movie_id == cat.winner_movie_id:
            user_scores[pred.user_id]["correct"] += 1

    # Build leaderboard
    leaderboard = []
    for uid, data in user_scores.items():
        score = (data["correct"] / len(categories_with_winners) * 100) if categories_with_winners else 0
        leaderboard.append(schemas.LeaderboardEntry(
            user_id=data["user_id"],
            user_name=data["user_name"],
            correct_count=data["correct"],
            total_predictions=data["total"],
            score=round(score, 1)
        ))

    leaderboard.sort(key=lambda x: x.score, reverse=True)
    return leaderboard
