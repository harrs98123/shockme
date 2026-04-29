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

    # 2. Boost from favorites
    favorites = db.query(models.Favorite).filter(
        models.Favorite.user_id == current_user.id
    ).all()

    # Get genres for favorites from a quick TMDB lookup (cached in a real app)
    # For simplicity, we'll rely on genre data from ratings here

    # 3. Get watched IDs to exclude
    watched_ids = {
        w.movie_id for w in db.query(models.Watched).filter(
            models.Watched.user_id == current_user.id
        ).all()
    }

    # 4. If no preference data, return popular movies
    if not genre_weight:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TMDB_BASE_URL}/movie/popular",
                params={"api_key": TMDB_API_KEY, "language": "en-US", "page": 1}
            )
            if resp.status_code == 200:
                data = resp.json()
                movies = [
                    m for m in data.get("results", [])
                    if m["id"] not in watched_ids
                ][:20]
                return {"based_on": [], "results": movies}
        return {"based_on": [], "results": []}

    # 5. Top 3 genres by weight
    top_genres = [str(g) for g, _ in genre_weight.most_common(3)]
    genre_str = ",".join(top_genres)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{TMDB_BASE_URL}/discover/movie",
            params={
                "api_key": TMDB_API_KEY,
                "language": "en-US",
                "with_genres": genre_str,
                "sort_by": "popularity.desc",
                "vote_count.gte": 50,
                "page": 1
            }
        )
        if resp.status_code != 200:
            return {"based_on": top_genres, "results": []}

        data = resp.json()
        movies = [
            m for m in data.get("results", [])
            if m["id"] not in watched_ids
        ][:20]

    return {"based_on": top_genres, "results": movies}
