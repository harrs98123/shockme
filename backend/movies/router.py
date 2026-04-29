import httpx
import os
import time
from functools import lru_cache
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY", "")
TMDB_BASE_URL = "https://api.themoviedb.org/3"

# Shared AsyncClient for connection pooling
_tmdb_client = httpx.AsyncClient(timeout=10.0)

async def tmdb_get(path: str, params: dict = {}) -> dict:
    import json
    from fastapi_cache import FastAPICache
    
    # Create a unique cache key
    # sort_keys=True ensures consistent keys for the same params
    cache_key = f"tmdb:{path}:{json.dumps(params, sort_keys=True)}"
    
    # Try to get from Redis
    try:
        backend = FastAPICache.get_backend()
        if backend:
            cached = await backend.get(cache_key)
            if cached:
                return json.loads(cached)
    except Exception as e:
        print(f"⚠️ Redis read error: {e}")

    # Not in cache, fetch from TMDB using shared client (faster due to connection pooling)
    response = await _tmdb_client.get(
        f"{TMDB_BASE_URL}{path}",
        params={"api_key": TMDB_API_KEY, **params}
    )
    response.raise_for_status()
    data = response.json()

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
@cache(expire=3600)
async def get_trending(page: int = 1):
    data = await tmdb_get("/trending/movie/week", {"page": page, "language": "en-US"})
    return data


@router.get("/popular")
@cache(expire=3600)
async def get_popular(page: int = 1):
    data = await tmdb_get("/movie/popular", {"page": page, "language": "en-US"})
    return data


@router.get("/trending-indian")
@cache(expire=3600)
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

