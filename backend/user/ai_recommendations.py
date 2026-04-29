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
      "explanation": "Reasoning in English"
    }}
    JSON ONLY. NO MARKDOWN.
    """

    async with httpx.AsyncClient() as client:
        try:
            # Using google/gemini-2.0-flash-exp:free for better stability and response speed
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "nvidia/nemotron-3-super-120b-a12b:free",
                    "messages": [{"role": "user", "content": prompt}],
                    "reasoning": {"enabled": True}
                },
                timeout=60.0
            )
            response.raise_for_status()
            res_data = response.json()
            content = res_data['choices'][0]['message'].get('content', "").strip()
            
            # Use raw reasoning if available, otherwise use explanation from the AI result
            reasoning = res_data['choices'][0]['message'].get('reasoning_details', "")
            if isinstance(reasoning, list):
                reasoning = "\n".join([r.get("text", "") for r in reasoning if isinstance(r, dict)])
            else:
                reasoning = str(reasoning)

            # Clean content from potential markdown blocks if AI ignored "RAW JSON" instruction
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()

            ai_data = json.loads(content)
        except Exception as e:
            print(f"OpenRouter Error: {str(e)}")
            # Even if reasoning is empty, we must ensure ai_data is formed for fallback
            raise HTTPException(status_code=502, detail=f"OpenRouter/AI Brain Error: {str(e)}")

    # 2. Search for movies on TMDB using genres and keywords
    results = []
    genre_ids = ai_data.get("genre_ids", [])
    keywords = ai_data.get("keywords", [])
    
    async with httpx.AsyncClient() as client:
        try:
            # First, try to find keyword IDs if keywords are provided
            keyword_ids = []
            if keywords:
                for kw in keywords[:3]: # limit to top 3 keywords
                    kw_resp = await client.get(
                        f"{TMDB_BASE_URL}/search/keyword",
                        params={"api_key": TMDB_API_KEY, "query": kw}
                    )
                    if kw_resp.status_code == 200:
                        kw_data = kw_resp.json()
                        if kw_data.get("results"):
                            keyword_ids.append(str(kw_data["results"][0]["id"]))

            # Discover movies
            discover_params = {
                "api_key": TMDB_API_KEY,
                "language": "en-US",
                "sort_by": "vote_average.desc", # Get better rated movies for "best" suggests
                "page": 1,
                "vote_count.gte": 100, # ensure they are well-regarded
                "with_genres": ",".join(map(str, genre_ids))
            }
            if keyword_ids:
                discover_params["with_keywords"] = "|".join(keyword_ids) # OR logic for keywords

            resp = await client.get(
                f"{TMDB_BASE_URL}/discover/movie",
                params=discover_params
            )
            
            if resp.status_code == 200:
                data = resp.json()
                movies = data.get("results", [])[:10]  # get top 10
                
                category_name = ai_data.get("category", "Personalized Selection")
                explanation = ai_data.get("explanation", "Matches your requested mood.")
                
                # If no movies found with keywords + genres, fallback to just genres
                if not movies and keyword_ids:
                    del discover_params["with_keywords"]
                    resp = await client.get(f"{TMDB_BASE_URL}/discover/movie", params=discover_params)
                    if resp.status_code == 200:
                        movies = resp.json().get("results", [])[:10]

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
            
            # If still nothing, or AI just wants to provide specific ones, we could add more logic here.
            # For now, this covers the "search and suggest" requirement well.

        except Exception as e:
            print(f"TMDB/Logic Error: {str(e)}")

    return schemas.MoodRecommendationResponse(
        results=results,
        reasoning=reasoning if reasoning else ai_data.get("explanation", "")
    )
