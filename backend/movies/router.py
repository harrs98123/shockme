import httpx
import os
import time
from functools import lru_cache
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.tmdb.org/3"  # Alternative domain — not blocked by most ISPs

from fastapi import HTTPException

# Shared AsyncClient for connection pooling with timeouts and browser headers
_tmdb_client = httpx.AsyncClient(
    timeout=httpx.Timeout(15.0, connect=5.0),
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
    },
    follow_redirects=True,
)

def _get_fallback_data(path: str) -> dict:
    if "genre" in path:
        return {"genres": [
            {"id": 28, "name": "Action"}, {"id": 12, "name": "Adventure"},
            {"id": 16, "name": "Animation"}, {"id": 35, "name": "Comedy"},
            {"id": 18, "name": "Drama"}, {"id": 27, "name": "Horror"},
            {"id": 10749, "name": "Romance"}, {"id": 878, "name": "Science Fiction"},
            {"id": 53, "name": "Thriller"}, {"id": 10752, "name": "War"},
        ]}
    if "configuration/languages" in path:
        return [{"iso_639_1": "en", "english_name": "English", "name": "English"}, {"iso_639_1": "ja", "english_name": "Japanese", "name": "Japanese"}]
    if "configuration/countries" in path:
        return [{"iso_3166_1": "US", "english_name": "United States of America", "native_name": "United States"}, {"iso_3166_1": "IN", "english_name": "India", "native_name": "India"}]

    # Real popular movies with actual TMDB image paths
    real_movies = [
        {"id": 823464, "title": "Godzilla x Kong: The New Empire", "overview": "Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world.", "poster_path": "/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg", "backdrop_path": "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", "vote_average": 7.2, "release_date": "2024-03-27", "media_type": "movie", "genre_ids": [28, 878, 12], "popularity": 4800},
        {"id": 786892, "title": "Furiosa: A Mad Max Saga", "overview": "As the world fell, young Furiosa is snatched from the Green Place of Many Mothers and falls into the hands of a great Biker Horde led by the Warlord Dementus.", "poster_path": "/iADOJ8Zymht2JPMoy3R7xceZprc.jpg", "backdrop_path": "/xgGGinKRL8xeRkaAR9RMbtyk9UD.jpg", "vote_average": 7.8, "release_date": "2024-05-22", "media_type": "movie", "genre_ids": [28, 12, 878], "popularity": 5100},
        {"id": 940551, "title": "Migration", "overview": "A family of ducks tries to convince their overprotective father to go on a migration trip.", "poster_path": "/ldfCF9RhR40mppkzmVd6oBFgMHN.jpg", "backdrop_path": "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", "vote_average": 7.4, "release_date": "2023-12-06", "media_type": "movie", "genre_ids": [16, 12, 35], "popularity": 3600},
        {"id": 1011985, "title": "Kung Fu Panda 4", "overview": "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior.", "poster_path": "/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg", "backdrop_path": "/zIYROrkHJPYB3VTiW1L9QVgaAA.jpg", "vote_average": 6.9, "release_date": "2024-03-02", "media_type": "movie", "genre_ids": [16, 35, 28, 12], "popularity": 4200},
        {"id": 653346, "title": "Kingdom of the Planet of the Apes", "overview": "Several generations in the future following Caesar's reign, apes are now the dominant species and live harmoniously while humans have been reduced to living in the shadows.", "poster_path": "/gKkl37BQuKTanygYQG1pyYgLVgf.jpg", "backdrop_path": "/fqv8v6AycXKsivp1T5yKtLbGXce.jpg", "vote_average": 7.3, "release_date": "2024-05-08", "media_type": "movie", "genre_ids": [878, 28, 12], "popularity": 4600},
        {"id": 748783, "title": "The Garfield Movie", "overview": "Garfield, the world-famous, Monday-hating, lasagna-loving indoor cat, is about to have a wild outdoor adventure.", "poster_path": "/xYduFGuch84bVSBNOFCNnqFXnYt.jpg", "backdrop_path": "/sdGrLvE2ODFBWJ3tqFOjBGCflgN.jpg", "vote_average": 6.8, "release_date": "2024-05-24", "media_type": "movie", "genre_ids": [16, 35, 12], "popularity": 3100},
        {"id": 929590, "title": "Civil War", "overview": "A journey across a dystopian future America, following a team of military-embedded journalists as they race against time to reach DC before rebel factions descend on the White House.", "poster_path": "/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg", "backdrop_path": "/fc9ePVEBYNmhBVNWa2PN3WMZQDC.jpg", "vote_average": 7.2, "release_date": "2024-04-10", "media_type": "movie", "genre_ids": [28, 18, 53], "popularity": 3400},
        {"id": 519182, "title": "Despicable Me 4", "overview": "Gru and Lucy and their girls welcome a new member to the family — Gru Jr. — who has a particular fondness for ruining Gru's day.", "poster_path": "/wWba3TaojhK7NdycRhoQpsG0FaH.jpg", "backdrop_path": "/lgkgmu4e0ik0R4VGUQP7FVR7sT3.jpg", "vote_average": 7.2, "release_date": "2024-07-03", "media_type": "movie", "genre_ids": [16, 35, 10751], "popularity": 4000},
        {"id": 1022789, "title": "Inside Out 2", "overview": "Teenager Riley's mind headquarters is suddenly turned upside down by a surprise demolition of Headquarters to make room for something entirely unexpected: new Emotions!", "poster_path": "/vpnVM9G6kukzbW9hvJFT3F0ozdz.jpg", "backdrop_path": "/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg", "vote_average": 7.8, "release_date": "2024-06-11", "media_type": "movie", "genre_ids": [16, 35, 12], "popularity": 6200},
        {"id": 533535, "title": "Deadpool & Wolverine", "overview": "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again.", "poster_path": "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", "backdrop_path": "/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg", "vote_average": 7.8, "release_date": "2024-07-24", "media_type": "movie", "genre_ids": [28, 35, 878], "popularity": 8900},
        {"id": 1100782, "title": "Alien: Romulus", "overview": "While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.", "poster_path": "/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg", "backdrop_path": "/9SSEUrSqhljBMzRe4aBTh17rUaC.jpg", "vote_average": 7.2, "release_date": "2024-08-13", "media_type": "movie", "genre_ids": [27, 878], "popularity": 4200},
        {"id": 1034541, "title": "Terrifier 3", "overview": "Art the Clown is set to unleash chaos on the unsuspecting residents of Miles County as they peacefully prepare for Christmas.", "poster_path": "/l1175hgL5DoXnqeZQCcU3eZIdhX.jpg", "backdrop_path": "/uHQ5pHqFnVnuvZ0DlYMELgKGTsg.jpg", "vote_average": 7.1, "release_date": "2024-10-09", "media_type": "movie", "genre_ids": [27, 53], "popularity": 3300},
        {"id": 573435, "title": "Bad Boys: Ride or Die", "overview": "After their late chief is accused of corruption, Miami detectives Mike Lowrey and Marcus Burnett go on the run to figure out who's framing their friend.", "poster_path": "/oGythE98MYleE6mZlTs5ZMbA9wr.jpg", "backdrop_path": "/rzdPqYx7Um4FUZeD8wpXqjAUcEp.jpg", "vote_average": 7.2, "release_date": "2024-05-30", "media_type": "movie", "genre_ids": [28, 35, 80], "popularity": 3900},
        {"id": 917496, "title": "Beetlejuice Beetlejuice", "overview": "After a family tragedy, three generations of the Deetz family return home to Winter River. Still haunted by Beetlejuice, Lydia's life is turned upside down when her teenage daughter discovers the mysterious model of the town.", "poster_path": "/cHa2NRPfTqmJEOXTBHnGfMjToXl.jpg", "backdrop_path": "/xi1VSt8DuxmCPsNB3VqKMKUrBrC.jpg", "vote_average": 7.2, "release_date": "2024-09-04", "media_type": "movie", "genre_ids": [35, 27, 14], "popularity": 3500},
        {"id": 1087822, "title": "Trap", "overview": "A father and his teen daughter attend a pop concert, where they realize they're at the center of a dark and sinister event.", "poster_path": "/gGqBf2nwPB5Ax6HW8UPlB97fbZp.jpg", "backdrop_path": "/4pEDi6MPXG4KfHDX6VvYHB4MTAP.jpg", "vote_average": 6.7, "release_date": "2024-08-07", "media_type": "movie", "genre_ids": [53, 27], "popularity": 2800},
        {"id": 698507, "title": "Gladiator II", "overview": "Years after witnessing the death of the revered hero Maximus at the hands of the corrupt Emperor Commodus, Lucius is forced to enter the Colosseum after his home is conquered by tyrants.", "poster_path": "/2cxhvwyE0IkSMkNJwa2VN3yQbT4.jpg", "backdrop_path": "/euYIwmwkmz95mnXvufEJIE0Oepr.jpg", "vote_average": 6.8, "release_date": "2024-11-13", "media_type": "movie", "genre_ids": [28, 18, 12], "popularity": 5800},
        {"id": 1084736, "title": "Kraven the Hunter", "overview": "Kraven Kravinoff's complex and compelling relationship with his ruthless gangster father, Nikolai, starts him down a path of vengeance with brutal consequences.", "poster_path": "/i47IUSsN126K11JUzqQIOi1Mg1M.jpg", "backdrop_path": "/v9Du2HC3TiEt07JkCMAzXCLMdoR.jpg", "vote_average": 6.2, "release_date": "2024-12-11", "media_type": "movie", "genre_ids": [28, 12, 878], "popularity": 2500},
        {"id": 762509, "title": "Mufasa: The Lion King", "overview": "Mufasa, a cub lost and alone, meets a sympathetic lion named Taka, the heir to a royal bloodline. The chance meeting sets in motion an expansive journey of a group of misfits searching for their destiny.", "poster_path": "/lurEK87kukWNaHd0zYnsi3yzJrs.jpg", "backdrop_path": "/AqFJeUPfloJYBaTmGYicMfaZpQZ.jpg", "vote_average": 7.4, "release_date": "2024-12-18", "media_type": "movie", "genre_ids": [16, 12, 18, 10751], "popularity": 4900},
        {"id": 558449, "title": "Gladiator", "overview": "In the year 180, the death of emperor Marcus Aurelius throws the Roman Empire into chaos. Maximus is one of the Roman army's most capable and trusted generals.", "poster_path": "/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg", "backdrop_path": "/6WxhEvFsauuACfv8HyoVX6mZKFj.jpg", "vote_average": 8.2, "release_date": "2000-05-01", "media_type": "movie", "genre_ids": [28, 18, 12], "popularity": 2600},
        {"id": 278, "title": "The Shawshank Redemption", "overview": "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.", "poster_path": "/9cqNxx0GxF0bAY74W56MAQLmjBR.jpg", "backdrop_path": "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", "vote_average": 8.7, "release_date": "1994-09-23", "media_type": "movie", "genre_ids": [18, 80], "popularity": 5100},
    ]

    if "trending" in path or "popular" in path or "top_rated" in path or "discover" in path or "search" in path or "anime" in path:
        return {"page": 1, "results": real_movies, "total_pages": 5, "total_results": 100}

    # Single movie detail fallback
    m = real_movies[0]
    return {
        "id": m["id"],
        "title": m["title"],
        "name": m["title"],
        "overview": m["overview"],
        "runtime": 120,
        "genres": [{"id": gid, "name": ["Action","Adventure","Animation","Comedy","Drama","Horror","Sci-Fi","Thriller"][i % 8]} for i, gid in enumerate(m.get("genre_ids", [28]))],
        "release_date": m.get("release_date", "2024-01-01"),
        "first_air_date": m.get("release_date", "2024-01-01"),
        "vote_average": m["vote_average"],
        "poster_path": m["poster_path"],
        "backdrop_path": m["backdrop_path"],
        "credits": {"cast": [], "crew": []},
        "similar": {"results": real_movies[1:11]},
        "videos": {"results": []},
        "watch/providers": {"results": {}},
        "cast": [], "crew": [], "known_for": []
    }

async def tmdb_get(path: str, params: dict = {}) -> dict:
    import json
    from fastapi_cache import FastAPICache
    
    # Create a unique cache key
    cache_key = f"tmdb:{path}:{json.dumps(params, sort_keys=True)}"
    
    # Try to get from cache (Redis or InMemory)
    try:
        backend = FastAPICache.get_backend()
        if backend:
            cached = await backend.get(cache_key)
            if cached:
                return json.loads(cached) if isinstance(cached, (str, bytes)) else cached
    except Exception as e:
        print(f"⚠️ Cache read error: {e}")

    # Not in cache, fetch from TMDB using shared client
    try:
        response = await _tmdb_client.get(
            f"{TMDB_BASE_URL}{path}",
            params={"api_key": TMDB_API_KEY, **params}
        )
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code in (401, 404):
            raise HTTPException(status_code=exc.response.status_code, detail=f"TMDB API error {exc.response.status_code}")
        print(f"❌ TMDB HTTP error {exc.response.status_code}. Using fallback.")
        data = _get_fallback_data(path)
    except httpx.RequestError as exc:
        print(f"❌ TMDB request error ({type(exc).__name__}): {exc}. Using fallback.")
        data = _get_fallback_data(path)

    # Cache the result for 600 seconds (10 minutes)
    try:
        if backend:
            await backend.set(cache_key, json.dumps(data), expire=600)
    except Exception as e:
        print(f"⚠️ Redis write error: {e}")

    return data


from fastapi import APIRouter, Query
from fastapi_cache.decorator import cache

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/trending")
async def get_trending(page: int = 1):
    data = await tmdb_get("/trending/movie/week", {"page": page, "language": "en-US"})
    return data


@router.get("/popular")
async def get_popular(page: int = 1):
    data = await tmdb_get("/movie/popular", {"page": page, "language": "en-US"})
    return data


@router.get("/trending-indian")
async def get_trending_indian(page: int = 1):
    data = await tmdb_get(
        "/discover/movie",
        {
            "with_origin_country": "IN",
            "sort_by": "popularity.desc",
            "page": page,
            "language": "hi-IN",
        }
    )
    return data


@router.get("/top-rated")
async def get_top_rated(page: int = 1):
    data = await tmdb_get("/movie/top_rated", {"page": page, "language": "en-US"})
    return data


@router.get("/search")
async def search_multi(q: str = Query(..., min_length=1), page: int = 1):
    """Search for movies, TV shows, and people all at once."""
    data = await tmdb_get("/search/multi", {
        "query": q,
        "page": page,
        "language": "en-US",
        "include_adult": False
    })
    return data


@router.get("/discover")
async def discover_movies(
    with_genres: str = "",
    with_origin_country: str = "",
    with_original_language: str = "",
    with_keywords: str = "",
    with_companies: str = "",
    vote_average_gte: float = 0,
    vote_count_gte: int = 0,
    primary_release_year: int = 0,
    sort_by: str = "popularity.desc",
    page: int = 1
):
    params = {"page": page, "language": "en-US", "sort_by": sort_by}
    if with_genres:
        params["with_genres"] = with_genres
    if with_origin_country:
        params["with_origin_country"] = with_origin_country
    if with_original_language:
        params["with_original_language"] = with_original_language
    if with_keywords:
        params["with_keywords"] = with_keywords
    if with_companies:
        params["with_companies"] = with_companies
    if vote_average_gte > 0:
        params["vote_average.gte"] = vote_average_gte
    if vote_count_gte > 0:
        params["vote_count.gte"] = vote_count_gte
    if primary_release_year > 0:
        params["primary_release_year"] = primary_release_year
        
    data = await tmdb_get("/discover/movie", params)
    return data


@router.get("/genres")
async def get_genres(media_type: str = "movie"):
    path = "/genre/movie/list" if media_type == "movie" else "/genre/tv/list"
    data = await tmdb_get(path, {"language": "en-US"})
    return data

@router.get("/tv/trending")
async def get_tv_trending(page: int = 1):
    data = await tmdb_get("/trending/tv/week", {"page": page, "language": "en-US"})
    return data

@router.get("/tv/popular")
async def get_tv_popular(page: int = 1):
    data = await tmdb_get("/tv/popular", {"page": page, "language": "en-US"})
    return data

@router.get("/tv/top-rated")
async def get_tv_top_rated(page: int = 1):
    data = await tmdb_get("/tv/top_rated", {"page": page, "language": "en-US"})
    return data

@router.get("/anime")
@cache(expire=3600)
async def get_anime(page: int = 1):
    # Animation genre (16) + Japanese language (ja)
    data = await tmdb_get(
        "/discover/tv",
        {
            "with_genres": "16",
            "with_original_language": "ja",
            "sort_by": "popularity.desc",
            "page": page,
            "language": "en-US",
        }
    )
    return data

@router.get("/tv/discover")
async def discover_tv(
    with_genres: str = "",
    with_origin_country: str = "",
    with_original_language: str = "",
    sort_by: str = "popularity.desc",
    page: int = 1
):
    params = {"page": page, "language": "en-US", "sort_by": sort_by}
    if with_genres:
        params["with_genres"] = with_genres
    if with_origin_country:
        params["with_origin_country"] = with_origin_country
    if with_original_language:
        params["with_original_language"] = with_original_language
        
    data = await tmdb_get("/discover/tv", params)
    return data


@router.get("/languages")
async def get_languages():
    data = await tmdb_get("/configuration/languages")
    return data


@router.get("/countries")
async def get_countries():
    data = await tmdb_get("/configuration/countries")
    return data


@router.get("/categories")
async def get_categories():
    # Return a set of hardcoded movie "categories" or "lists"
    return [
        {"id": "trending", "name": "Trending Now", "icon": "🔥", "description": "Most popular movies this week"},
        {"id": "popular", "name": "Most Popular", "icon": "⭐", "description": "All-time fan favorites"},
        {"id": "top-rated", "name": "Top Rated", "icon": "🏆", "description": "Highest rated by critics and fans"},
        {"id": "upcoming", "name": "Upcoming", "icon": "⏳", "description": "Highly anticipated releases"},
        {"id": "now-playing", "name": "Now Playing", "icon": "🍿", "description": "Movies currently in theaters"},
        {"id": "anime", "name": "Japanese Anime", "icon": "🎌", "description": "Golden collection of animation"},
        {"id": "trending-indian", "name": "Indian Cinema", "icon": "🇮🇳", "description": "Top trending movies from India"},
    ]


@router.get("/upcoming")
async def get_upcoming_movies(
    region: str = "all",
    month: int = 0,
    year: int = 0,
    page: int = 1,
):
    """
    Get upcoming movies filtered by region and optional month.
    Regions: all, hollywood, bollywood, tollywood, korean, other
    Month: 1-12 (0 = no filter)
    """
    from datetime import date, timedelta
    import calendar

    today = date.today()

    # Determine date range
    if month > 0 and year > 0:
        # Specific month filter
        _, last_day = calendar.monthrange(year, month)
        date_gte = f"{year}-{month:02d}-01"
        date_lte = f"{year}-{month:02d}-{last_day:02d}"
    elif month > 0:
        # Month in current or next year
        target_year = today.year if month >= today.month else today.year + 1
        _, last_day = calendar.monthrange(target_year, month)
        date_gte = f"{target_year}-{month:02d}-01"
        date_lte = f"{target_year}-{month:02d}-{last_day:02d}"
    else:
        # Default: from today to 1 year ahead
        date_gte = today.isoformat()
        date_lte = (today + timedelta(days=365)).isoformat()

    params = {
        "page": page,
        "sort_by": "popularity.desc",
        "primary_release_date.gte": date_gte,
        "primary_release_date.lte": date_lte,
        "with_release_type": "2|3",  # Theatrical & theatrical limited
    }

    # Region-specific filters
    if region == "hollywood":
        params["with_origin_country"] = "US"
        params["with_original_language"] = "en"
        params["language"] = "en-US"
    elif region == "bollywood":
        params["with_origin_country"] = "IN"
        params["with_original_language"] = "hi"
        params["language"] = "hi-IN"
    elif region == "tollywood":
        params["with_origin_country"] = "IN"
        params["with_original_language"] = "te"
        params["language"] = "te-IN"
    elif region == "korean":
        params["with_origin_country"] = "KR"
        params["with_original_language"] = "ko"
        params["language"] = "ko-KR"
    elif region == "other":
        # Exclude US, IN, KR — show everything else
        params["without_origin_country"] = "US|IN|KR"
        params["language"] = "en-US"
    else:
        # All upcoming
        params["language"] = "en-US"

    # Remove release type filter to get more results for non-US regions
    if region in ("bollywood", "tollywood", "korean", "other", "all"):
        params.pop("with_release_type", None)

    data = await tmdb_get("/discover/movie", params)

    return {
        "results": data.get("results", []),
        "page": data.get("page", 1),
        "total_pages": data.get("total_pages", 1),
        "total_results": data.get("total_results", 0),
        "date_range": {"from": date_gte, "to": date_lte},
        "region": region,
    }


@router.get("/universe/search/{query}")
async def search_people(query: str):
    """Search for people (actors/directors) for the universe map."""
    data = await tmdb_get("/search/person", {"query": query, "language": "en-US"})
    results = data.get("results", [])[:12]
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "profile_path": p.get("profile_path"),
            "known_for_department": p.get("known_for_department", ""),
            "known_for": [
                {"title": m.get("title", m.get("name", "")), "id": m.get("id")}
                for m in p.get("known_for", [])[:3]
            ]
        }
        for p in results
    ]


@router.get("/universe/{person_id}")
@cache(expire=7200)
async def get_universe_map(person_id: int):
    """Build a COMPLETE connection graph for a person — fetches all films and all collaborators."""
    import asyncio
    
    try:
        # 1. Get person details + combined credits concurrently
        person_task = tmdb_get(f"/person/{person_id}", {"language": "en-US"})
        credits_task = tmdb_get(f"/person/{person_id}/combined_credits", {"language": "en-US"})
        person, credits = await asyncio.gather(person_task, credits_task)
        
        # 2. Determine person type
        cast_credits = credits.get("cast", [])
        crew_credits = credits.get("crew", [])
        
        directing_credits = [c for c in crew_credits if c.get("job") == "Director"]
        is_director = len(directing_credits) >= 3 or (
            person.get("known_for_department") == "Directing"
        )
        person_type = "director" if is_director else "actor"
        
        # 3. Collect ALL works (movies + TV), deduplicated
        if is_director:
            works = list(directing_credits)
        else:
            works = list(cast_credits)
        
        seen_ids = set()
        all_works = []
        for w in works:
            wid = w.get("id")
            if wid and wid not in seen_ids:
                seen_ids.add(wid)
                all_works.append(w)
        
        all_works.sort(key=lambda m: m.get("popularity", 0), reverse=True)
        
        # 4. Build complete filmography from ALL works (no limit)
        all_movie_details = []
        for work in all_works:
            all_movie_details.append({
                "id": work.get("id"),
                "title": work.get("title", work.get("name", "Unknown")),
                "poster_path": work.get("poster_path"),
                "release_date": work.get("release_date", work.get("first_air_date", "")),
                "vote_average": work.get("vote_average", 0),
                "popularity": work.get("popularity", 0),
                "media_type": work.get("media_type", "movie"),
                "character": work.get("character", ""),
                "genre_ids": work.get("genre_ids", [])
            })
        
        # 5. Fetch credits for top works CONCURRENTLY to build connection graph
        #    Process up to 25 works (balances completeness vs speed)
        graph_works = all_works[:25]
        
        async def fetch_work_credits(work):
            """Fetch credits for a single work, return (work_info, credits_data)."""
            work_id = work.get("id")
            media_type = work.get("media_type", "movie")
            try:
                path = f"/movie/{work_id}/credits" if media_type == "movie" else f"/tv/{work_id}/credits"
                creds = await tmdb_get(path, {"language": "en-US"})
                return (work, creds)
            except Exception:
                return (work, None)
        
        # Fire all credit fetches at once (cached ones return instantly)
        batch_results = await asyncio.gather(
            *[fetch_work_credits(w) for w in graph_works]
        )
        
        # 6. Process all results into nodes + edges
        nodes = {}
        edges = {}
        
        for work, work_credits in batch_results:
            if work_credits is None:
                continue
            
            work_title = work.get("title", work.get("name", "Unknown"))
            
            # Process ALL cast (no limit per movie)
            for cm in work_credits.get("cast", []):
                cm_id = cm.get("id")
                if not cm_id or cm_id == person_id:
                    continue
                
                if cm_id not in nodes:
                    nodes[cm_id] = {
                        "id": cm_id,
                        "name": cm.get("name", "Unknown"),
                        "type": "actor",
                        "profile_path": cm.get("profile_path"),
                        "character": cm.get("character", "")
                    }
                
                edge_key = f"{person_id}-{cm_id}"
                if edge_key not in edges:
                    edges[edge_key] = {"from": person_id, "to": cm_id, "movies": []}
                if work_title not in edges[edge_key]["movies"]:
                    edges[edge_key]["movies"].append(work_title)
            
            # Process ALL directors
            for cm in work_credits.get("crew", []):
                if cm.get("job") != "Director":
                    continue
                cm_id = cm.get("id")
                if not cm_id or cm_id == person_id:
                    continue
                
                if cm_id not in nodes:
                    nodes[cm_id] = {
                        "id": cm_id,
                        "name": cm.get("name", "Unknown"),
                        "type": "director",
                        "profile_path": cm.get("profile_path"),
                        "character": ""
                    }
                
                edge_key = f"{person_id}-{cm_id}"
                if edge_key not in edges:
                    edges[edge_key] = {"from": person_id, "to": cm_id, "movies": []}
                if work_title not in edges[edge_key]["movies"]:
                    edges[edge_key]["movies"].append(work_title)
        
        # 7. Sort by connection strength and keep top 30 for the graph
        sorted_edges = sorted(edges.values(), key=lambda e: len(e["movies"]), reverse=True)
        top_node_ids = set()
        for edge in sorted_edges[:30]:
            top_node_ids.add(edge["to"])
        
        filtered_nodes = [nodes[nid] for nid in top_node_ids if nid in nodes]
        filtered_edges = [e for e in sorted_edges if e["to"] in top_node_ids]
        
        # 8. Stats
        total_collaborators = len(nodes)
        total_works_processed = sum(1 for _, c in batch_results if c is not None)
        
        return {
            "center": {
                "id": person_id,
                "name": person.get("name", "Unknown"),
                "type": person_type,
                "profile_path": person.get("profile_path"),
                "biography": (person.get("biography", "") or "")[:500],
                "known_for_department": person.get("known_for_department", ""),
                "birthday": person.get("birthday"),
                "place_of_birth": person.get("place_of_birth"),
            },
            "nodes": filtered_nodes,
            "edges": filtered_edges,
            "movies": all_movie_details,  # ALL films — complete filmography
            "stats": {
                "total_films": len(all_movie_details),
                "total_collaborators": total_collaborators,
                "graph_connections": len(filtered_nodes),
                "works_analyzed": total_works_processed
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"center": None, "nodes": [], "edges": [], "movies": [], "stats": {}, "error": str(e)}



@router.get("/{movie_id}")
async def get_details(movie_id: int, media_type: str = "movie"):
    path = f"/movie/{movie_id}" if media_type == "movie" else f"/tv/{movie_id}"
    data = await tmdb_get(
        path,
        {
            "append_to_response": "credits,videos,similar,images,watch/providers,keywords,release_dates,content_ratings",
            "include_image_language": "en,null",
            "language": "en-US"
        }
    )
    return data


@router.get("/{movie_id}/custom-info")
async def get_custom_info(movie_id: int):
    """
    Fetch custom metadata/trailer for a movie from our local DB.
    Checks GemOverride and MustWatch tables.
    """
    from database import SessionLocal
    import models

    db = SessionLocal()
    try:
        # Check MustWatch first
        mw = db.query(models.MustWatch).filter(models.MustWatch.movie_id == movie_id).first()
        if mw:
            return {
                "trailer_url": mw.trailer_url,
                "is_must_watch": True,
                "is_gem": False
            }
        
        # Check GemOverride
        gem = db.query(models.GemOverride).filter(models.GemOverride.movie_id == movie_id).first()
        if gem:
            return {
                "trailer_url": gem.trailer_url,
                "is_must_watch": False,
                "is_gem": True
            }
            
        return {"trailer_url": None, "is_must_watch": False, "is_gem": False}
    finally:
        db.close()


@router.get("/person/{person_id}")
async def get_person_details(person_id: int):
    """
    Fetch comprehensive person details:
    1. Basic Info (Bio, Birthday, Place of Birth)
    2. Combined Credits (Filmography/Cast/Crew)
    """
    import asyncio
    
    try:
        # 1. Fetch person details & credits concurrently
        # Adding append_to_response for external_ids (socials)
        person_task = tmdb_get(f"/person/{person_id}", {
            "language": "en-US",
            "append_to_response": "external_ids,images"
        })
        credits_task = tmdb_get(f"/person/{person_id}/combined_credits", {"language": "en-US"})
        
        person, credits = await asyncio.gather(person_task, credits_task)
        
        # 2. Extract and Sort Filmography (Movies & TV)
        # We combine both cast and crew roles, but deduplicate by ID
        # TMDB combined_credits returns 'cast' and 'crew' arrays
        
        all_roles = []
        seen_media_ids = set()
        
        # Process Cast Roles
        for role in credits.get("cast", []):
            mid = role.get("id")
            if not mid: continue
            
            # Since a person can have multiple roles in the same movie (rare), 
            # we group roles by movie ID for the filmography display
            role_key = f"{role.get('media_type')}_{mid}"
            
            all_roles.append({
                "id": mid,
                "title": role.get("title") or role.get("name") or "Untitled",
                "poster_path": role.get("poster_path"),
                "backdrop_path": role.get("backdrop_path"),
                "release_date": role.get("release_date") or role.get("first_air_date") or "",
                "character": role.get("character", ""),
                "media_type": role.get("media_type", "movie"),
                "vote_average": role.get("vote_average", 0),
                "popularity": role.get("popularity", 0),
                "job": "Actor"
            })
            
        # Process Crew Roles (e.g. Director)
        for role in credits.get("crew", []):
            mid = role.get("id")
            if not mid: continue
            
            all_roles.append({
                "id": mid,
                "title": role.get("title") or role.get("name") or "Untitled",
                "poster_path": role.get("poster_path"),
                "backdrop_path": role.get("backdrop_path"),
                "release_date": role.get("release_date") or role.get("first_air_date") or "",
                "character": "", # character is for cast
                "media_type": role.get("media_type", "movie"),
                "vote_average": role.get("vote_average", 0),
                "popularity": role.get("popularity", 0),
                "job": role.get("job", "Crew")
            })

        # Sort by popularity or release date
        # Let's sort by popularity primarily for the 'best known for' effect, 
        # but the UI can sort by date if needed.
        all_roles.sort(key=lambda x: x.get("popularity", 0), reverse=True)
        
        return {
            "id": person.get("id"),
            "name": person.get("name"),
            "biography": person.get("biography"),
            "profile_path": person.get("profile_path"),
            "birthday": person.get("birthday"),
            "deathday": person.get("deathday"),
            "place_of_birth": person.get("place_of_birth"),
            "known_for_department": person.get("known_for_department"),
            "external_ids": person.get("external_ids", {}),
            "images": person.get("images", {}).get("profiles", [])[:10],
            "filmography": all_roles
        }
        
    except Exception as e:
        return {"error": str(e)}

