import httpx
import os
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

router = APIRouter(prefix="/alternate-ending", tags=["ai-alternate-ending"])

@router.get("/{movie_id}")
async def generate_alternate_ending(
    movie_id: int, 
    media_type: str = Query("movie", description="Type of media: movie or tv"),
    ending_type: str = Query("twist", description="Type of alternate ending: dark, happy, or twist")
):
    valid_types = ["dark", "happy", "twist"]
    if ending_type.lower() not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid ending type. Must be 'dark', 'happy', or 'twist'.")
        
    if not OPENROUTER_API_KEY or "your_openrouter_api_key_here" in OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key is not configured.")

    # 1. Fetch media context from TMDB
    async with httpx.AsyncClient() as client:
        tmdb_resp = await client.get(
            f"{TMDB_BASE_URL}/{media_type}/{movie_id}",
            params={"api_key": TMDB_API_KEY, "language": "en-US"}
        )
        if tmdb_resp.status_code != 200:
            raise HTTPException(status_code=404, detail=f"{media_type.capitalize()} not found on TMDB.")
        
        media_data = tmdb_resp.json()
        media_title = media_data.get("title") or media_data.get("name") or "Unknown"
        overview = media_data.get("overview", "No overview provided.")
        release_date = media_data.get("release_date") or media_data.get("first_air_date") or "Unknown Year"
        year = release_date[:4] if release_date and len(release_date) >= 4 else "Unknown Year"

    # 2. Construct Prompt for the requested ending type
    style_instruction = ""
    if ending_type.lower() == "dark":
        style_instruction = "Make it bleak, thrilling, or deeply tragic. Emphasize unintended consequences or a grim reality."
    elif ending_type.lower() == "happy":
        style_instruction = "Give it an uplifting, purely joyful resolution where everything works out miraculously well."
    elif ending_type.lower() == "twist":
        style_instruction = "End it with a mind-bending, unexpected revelation that changes how the audience interprets the entire film."

    type_label = "movie" if media_type == "movie" else "TV series"
    prompt = f"""
    You are an expert Hollywood screenwriter tasked with writing a viral-worthy, mind-blowing alternate ending.
    
    {media_type.capitalize()} Context: "{media_title}" ({year})
    Original Synopsis (for reference): {overview}
    
    Your Task: Write a wildly distinct {ending_type.upper()} alternate ending for this {type_label}.
    
    Instruction: {style_instruction}
    
    Ensure it is captivating, thought-provoking, and written beautifully. 
    Format using Markdown with:
    - A catchy bold title for the new ending.
    - An introductory sentence setting the scene where the divergence happens.
    - A detailed, vivid description of the new outcome.
    - A concluding "The Aftermath" section explaining the impact.
    
    Do not use JSON formatting, just return raw markdown content.
    """

    # 3. Request LLM generation via OpenRouter
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
            
            return {
                "movie_id": movie_id, 
                "media_type": media_type,
                "title": media_title, 
                "ending_type": ending_type,
                "alternate_ending": content
            }
            
        except Exception as e:
            print(f"OpenRouter Error: {str(e)}")
            raise HTTPException(status_code=502, detail="Failed to generate the alternate ending from AI.")
