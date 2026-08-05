from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from auth.utils import get_current_user
import httpx
import os
from collections import Counter
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

from movies.router import tmdb_get

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("")
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Get user's rated movies with genre info
    ratings = db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id
    ).all()

    genre_weight: Counter = Counter()

    for r in ratings:
        if r.genre_ids:
            genres = [int(g) for g in r.genre_ids.split(",") if g.strip()]
            for g in genres:
                genre_weight[g] += r.rating  # Weight by rating

    # 2. Boost from favorites & collect favorite IDs
    favorites = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id
    ).all()
    fav_ids = {int(f.movie_id) for f in favorites if f.movie_id}

    if not genre_weight and fav_ids:
        for f_id in list(fav_ids)[:3]:
            try:
                detail = await tmdb_get(f"/movie/{f_id}", {})
                for g in detail.get("genres", []):
                    genre_weight[int(g.get("id"))] += 5
            except Exception:
                pass

    # 3. Get watched & favorite IDs to exclude from recommendations
    watched_ids = {
        int(w.movie_id) for w in db.query(models.Watched).filter(
            models.Watched.user_id == current_user.id
        ).all() if w.movie_id
    }
    exclude_ids = watched_ids.union(fav_ids)

    # 4. If no preference data, return popular movies
    if not genre_weight:
        try:
            data = await tmdb_get("/movie/popular", {"page": 1, "language": "en-US"})
            movies = [
                m for m in data.get("results", [])
                if m.get("id") and int(m.get("id")) not in exclude_ids
            ][:20]
            return {"based_on": [], "results": movies}
        except Exception:
            raise

    # 5. Top 3 genres by weight
    top_genres = [str(g) for g, _ in genre_weight.most_common(3)]
    genre_str = ",".join(top_genres)

    try:
        data = await tmdb_get("/discover/movie", {
            "with_genres": genre_str,
            "sort_by": "popularity.desc",
            "vote_count.gte": 50,
            "page": 1
        })
        movies = [
            m for m in data.get("results", [])
            if m.get("id") and int(m.get("id")) not in exclude_ids
        ][:20]
        return {"based_on": top_genres, "results": movies}
    except Exception:
        raise
