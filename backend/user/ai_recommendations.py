import httpx
import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth.utils import get_current_user
import models
import schemas
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

router = APIRouter(prefix="/recommendations/mood", tags=["ai-recommendations"])


@router.post("", response_model=schemas.MoodRecommendationResponse)
async def get_mood_recommendations(
    request: schemas.MoodRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not OPENROUTER_API_KEY or "your_openrouter_api_key_here" in OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key is not configured.")

    # 1. Call OpenRouter to analyze the mood (multilingual support)
    prompt = f"""
    Analyze user mood: "{request.mood}" (Multilingual)
    1. Determine English Category Name
    2. Map to TMDB Genre IDs (Action:28, Adv:12, Anim:16, Com:35, Crim:80, Doc:99, Dra:18, Fam:10751, Fan:14, Hist:36, Hor:27, Mus:10402, Mys:9648, Rom:10749, SciFi:878, Thrill:53)
    3. Suggest search Keywords (e.g. "supernatural", "rainy day")

    Return ONLY RAW JSON:
    {{
      "category": "Title in English",
      "genre_ids": [numbers],
      "keywords": ["strings"],
      "explanation": "Brief 1-2 sentence explanation for the user on why these movies match their requested vibe."
    }}
    JSON ONLY. NO MARKDOWN. DO NOT INCLUDE THINKING OR CHAIN OF THOUGHT IN THE OUTPUT.
    """

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "nvidia/nemotron-3-super-120b-a12b:free",
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=60.0
            )
            response.raise_for_status()
            res_data = response.json()
            content = res_data['choices'][0]['message'].get('content', "").strip()

            # Clean content from potential markdown blocks if AI ignored "RAW JSON" instruction
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()

            ai_data = json.loads(content)
        except Exception as e:
            print(f"OpenRouter Error: {str(e)}")
            raise HTTPException(status_code=502, detail=f"OpenRouter/AI Brain Error: {str(e)}")

    # 2. Search for movies on TMDB using genres and keywords.
    results = []
    genre_ids = ai_data.get("genre_ids", [])
    keywords = ai_data.get("keywords", [])
    explanation = ai_data.get("explanation", f"Selected specifically for your vibe: {request.mood}")
    TARGET_COUNT = 24

    async def discover(client, params):
        try:
            resp = await client.get(f"{TMDB_BASE_URL}/discover/movie", params=params)
            if resp.status_code == 200:
                return resp.json().get("results", [])
        except Exception:
            pass
        return []

    async with httpx.AsyncClient() as client:
        try:
            # Resolve keyword strings to TMDB keyword IDs
            keyword_ids = []
            if keywords:
                for kw in keywords[:5]:  # limit to top 5 keywords
                    kw_resp = await client.get(
                        f"{TMDB_BASE_URL}/search/keyword",
                        params={"api_key": TMDB_API_KEY, "query": kw}
                    )
                    if kw_resp.status_code == 200:
                        kw_data = kw_resp.json()
                        if kw_data.get("results"):
                            keyword_ids.append(str(kw_data["results"][0]["id"]))

            movies_by_id: dict[int, dict] = {}
            order: list[int] = []

            def merge(movie_list):
                for m in movie_list:
                    mid = m.get("id")
                    if mid and mid not in movies_by_id:
                        movies_by_id[mid] = m
                        order.append(mid)

            genre_and = ",".join(map(str, genre_ids))  # TMDB: comma = ALL genres (precise)
            genre_or = "|".join(map(str, genre_ids))   # TMDB: pipe = ANY genre (broad)

            # Tier 1: precise — must match every AI-picked genre + at least one keyword
            if genre_ids:
                tier1_params = {
                    "api_key": TMDB_API_KEY,
                    "language": "en-US",
                    "sort_by": "vote_average.desc",
                    "page": 1,
                    "vote_count.gte": 100,
                    "with_genres": genre_and,
                }
                if keyword_ids:
                    tier1_params["with_keywords"] = "|".join(keyword_ids)
                merge(await discover(client, tier1_params))

            # Tier 2: drop the keyword filter, keep the precise genre match
            if len(order) < TARGET_COUNT and genre_ids:
                tier2_params = {
                    "api_key": TMDB_API_KEY,
                    "language": "en-US",
                    "sort_by": "vote_average.desc",
                    "page": 1,
                    "vote_count.gte": 100,
                    "with_genres": genre_and,
                }
                merge(await discover(client, tier2_params))

            # Tier 3: relax to "ANY of these genres", drop the vote-count floor, pull two pages
            if len(order) < TARGET_COUNT and genre_ids:
                for page in (1, 2):
                    if len(order) >= TARGET_COUNT:
                        break
                    tier3_params = {
                        "api_key": TMDB_API_KEY,
                        "language": "en-US",
                        "sort_by": "popularity.desc",
                        "page": page,
                        "with_genres": genre_or,
                    }
                    merge(await discover(client, tier3_params))

            movies = [movies_by_id[mid] for mid in order][:TARGET_COUNT]

            if movies:
                for movie in movies:
                    results.append(schemas.MovieRecommendation(
                        id=movie["id"],
                        title=movie["title"],
                        poster_path=movie.get("poster_path"),
                        backdrop_path=movie.get("backdrop_path"),
                        vote_average=movie.get("vote_average", 0.0),
                        release_date=movie.get("release_date"),
                        genre_ids=movie.get("genre_ids", []),
                        reason=explanation
                    ))

        except Exception as e:
            print(f"TMDB/Logic Error: {str(e)}")

    return schemas.MoodRecommendationResponse(
        results=results,
        reasoning=explanation
    )
