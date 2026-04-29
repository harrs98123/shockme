import httpx
import os
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

router = APIRouter(prefix="/explanation", tags=["ai-explanation"])


@router.get("/{movie_id}")
async def get_movie_explanation(movie_id: int, media_type: str = "movie"):
    if not OPENROUTER_API_KEY or "your_openrouter_api_key_here" in OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key is not configured.")

    # 1. Fetch media details from TMDB to get its exact title and release year
    async with httpx.AsyncClient() as client:
        tmdb_resp = await client.get(
            f"{TMDB_BASE_URL}/{media_type}/{movie_id}",
            params={"api_key": TMDB_API_KEY, "language": "en-US"}
        )
        if tmdb_resp.status_code != 200:
            raise HTTPException(status_code=404, detail=f"{media_type.capitalize()} not found on TMDB.")
        
        media_data = tmdb_resp.json()
        media_title = media_data.get("title") or media_data.get("name") or "Unknown"
        release_date = media_data.get("release_date") or media_data.get("first_air_date") or "Unknown Year"
        year = release_date[:4] if release_date and len(release_date) >= 4 else "Unknown Year"

    # 2. Call OpenRouter to generate the explanation
    type_label = "movie" if media_type == "movie" else "TV series"
    prompt = f"""
    You are a {type_label} expert providing a rich, premium "Why This {media_type.capitalize()}?" explanation for a user.
    The {type_label} is "{media_title}" ({year}).
    
    Please provide:
    1. A brief historical context of when it was made.
    2. Interesting behind-the-scenes events, trivia, or production challenges.
    3. Its cultural impact and legacy.
    4. Why it is a must-watch (what makes it special).
    
    Format the output beautifully using Markdown. Use clear headings, bullet points, and engaging language. Keep it detailed but readable, suited for a "Netflix-level" intelligence engine UI. Do NOT include a JSON wrapper, just return the raw markdown content.
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
            
            message = res_data['choices'][0]['message']
            content = message.get('content', "").strip()
            
            return {"movie_id": movie_id, "media_type": media_type, "title": media_title, "explanation": content}
            
        except Exception as e:
            print(f"OpenRouter Error: {str(e)}")
            raise HTTPException(status_code=502, detail="Failed to get explanation from AI.")
