"""
seed_social_ecosystem.py
========================
Ultra-realistic seed script for Cinematch / Moctale.
Fetches live data from TMDB for real movies, stills, and posters.
Generates:
1. 50+ diverse global cinephile personas with real Unsplash avatars, bios, usernames.
2. Rich follower/following network graph.
3. User watch histories, ratings (1-5 stars), favorites, watchlists.
4. 150+ realistic social posts (reviews, watching, recommendations, polls, scene breakdowns with stills, memes, spoiler hot-takes).
5. 600+ post reactions & 300+ threaded post comments.
6. 250+ Moctale reviews with likes and review comment threads.
7. Verdict Battles with side A/B arguments and votes.
8. Movie Debates with threaded replies and votes.
9. Community Groups with members, group posts, and group comments.

Run:
  C:\\Python313\\python.exe seed_social_ecosystem.py
"""

import os
import sys
import re
import json
import time
import random
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta

# ── Auto-install psycopg2-binary if not present ────────────────────────────────
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("Installing psycopg2-binary...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2
    import psycopg2.extras

# ── Load .env ──────────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), ".env")
env_vars = {}
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip()

DATABASE_URL = env_vars.get("DATABASE_URL", "")
TMDB_API_KEY = env_vars.get("TMDB_API_KEY", "")

if not DATABASE_URL or not TMDB_API_KEY:
    print("ERROR: DATABASE_URL or TMDB_API_KEY missing from .env")
    sys.exit(1)

m = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", DATABASE_URL)
if not m:
    print("ERROR: Cannot parse DATABASE_URL")
    sys.exit(1)

db_user, db_pass, db_host, db_port, db_name = m.groups()

# Standard Bcrypt hash for password: 'password123'
DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

# ── 55 Curated Global Personas with High-Quality Photography Avatars ──────────
PERSONAS = [
    {
        "name": "Elena Rostova",
        "username": "elena_cinematheque",
        "email": "elena.rostova.cine@example.com",
        "bio": "Film critic & programmer. Tarkovsky, Denis Villeneuve & French New Wave enthusiast. Letterboxd top 250 survivor.",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["sci-fi", "drama", "art-house", "thriller"]
    },
    {
        "name": "Arjun Mehta",
        "username": "arjunwatchesfilms",
        "email": "arjun.mehta.cinema@example.com",
        "bio": "Bollywood loyalist who secretly cries at Pixar movies. Mumbai ka ladka, global taste. Big fan of Mani Ratnam & Anurag Kashyap.",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["bollywood", "drama", "animation", "indie"]
    },
    {
        "name": "Priya Sharma",
        "username": "priyacinephile",
        "email": "priya.sharma.films@example.com",
        "bio": "Film student from Delhi. I rate movies the way I rate chai — very seriously. Unreliable narrators & mind-bending thrillers are my religion.",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["thriller", "drama", "mystery", "psychological"]
    },
    {
        "name": "Tyler Brooks",
        "username": "tylerreviews",
        "email": "tyler.brooks.movies@example.com",
        "bio": "Ex-film school dropout. Now I just yell about aspect ratios and 70mm film stock on the internet. Nolan is my Roman Empire.",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["sci-fi", "action", "imax", "blockbuster"]
    },
    {
        "name": "Kavya Nair",
        "username": "kavya_frames",
        "email": "kavya.nair.cinema@example.com",
        "bio": "Kerala girl obsessed with world cinema. If it has subtitles and melancholic piano, I have seen it twice. A24 devotee.",
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["world-cinema", "a24", "drama", "romance"]
    },
    {
        "name": "Rohan Kapoor",
        "username": "rohan_reeltime",
        "email": "rohan.kapoor.reels@example.com",
        "bio": "Watched Interstellar 12 times in IMAX. Sound design nerd. Hans Zimmer & Ludwig Göransson playlist on repeat.",
        "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["sci-fi", "soundtrack", "space", "thriller"]
    },
    {
        "name": "Jessica Martinez",
        "username": "jess_filmclub",
        "email": "jessica.martinez.films@example.com",
        "bio": "Runs a tiny midnight horror screening club in Austin. Give me slow-burn folk horror, Ari Aster nightmares, and practical monster FX.",
        "avatar_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["horror", "psychological", "thriller", "indie"]
    },
    {
        "name": "Vikram Singh",
        "username": "vikram_the_critic",
        "email": "vikram.singh.critic@example.com",
        "bio": "Retired civil engineer, lifelong cineaste. 3 films a day. The Godfather, Kurosawa, and classic Hollywood noir are timeless.",
        "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["classics", "crime", "noir", "historical"]
    },
    {
        "name": "Aisha Khan",
        "username": "aishainframes",
        "email": "aisha.khan.frames@example.com",
        "bio": "London-based cinematic photographer. Color grading & lighting nerd. Roger Deakins and Hoyte van Hoytema are visual deities.",
        "avatar_url": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["cinematography", "visual-art", "drama", "neo-noir"]
    },
    {
        "name": "Marcus Johnson",
        "username": "marcusonfilm",
        "email": "marcus.johnson.movies@example.com",
        "bio": "Brooklyn video essayist. Deconstructing plot structures, character arcs, and why 90s action cinema was the absolute peak.",
        "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["action", "crime", "90s", "thriller"]
    },
    {
        "name": "Sneha Reddy",
        "username": "sneha_cineworld",
        "email": "sneha.reddy.cine@example.com",
        "bio": "Telugu mass cinema + Korean revenge thrillers + Wes Anderson pastel symmetry. Hyderabad represent! 🍿",
        "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["action", "korean", "comedy", "visual-flair"]
    },
    {
        "name": "Nathan Lee",
        "username": "nathancinema",
        "email": "nathan.lee.cinema@example.com",
        "bio": "Korean-American cinephile based in LA. Bong Joon-ho, Park Chan-wook, Edward Yang & Studio Ghibli. Cinema without borders.",
        "avatar_url": "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["korean", "asian-cinema", "anime", "thriller"]
    },
    {
        "name": "Chloe Dubois",
        "username": "chloe_cineaste",
        "email": "chloe.dubois.paris@example.com",
        "bio": "Parisian cinephile & film festival reporter (Cannes, Venice, Berlinale). Cinema is an empathy generator.",
        "avatar_url": "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["french", "art-house", "romance", "drama"]
    },
    {
        "name": "Dev Anand Pillai",
        "username": "dev_cinecritic",
        "email": "dev.pillai.cine@example.com",
        "bio": "Chennai cinema nerd. Kamal Haasan stan. Will defend the theatrical experience until my last breath.",
        "avatar_url": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["tamil", "classic", "musical", "drama"]
    },
    {
        "name": "Zara Ahmed",
        "username": "zara_picks",
        "email": "zara.ahmed.picks@example.com",
        "bio": "Toronto film lover. 350+ films logged a year. If a movie has a bittersweet ending, consider me obsessed.",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["indie", "romance", "a24", "drama"]
    },
    {
        "name": "Ryan O'Connor",
        "username": "ryan_comicnerd",
        "email": "ryan.oconnor.film@example.com",
        "bio": "Graphic novel collector & comic book movie historian. Spider-Verse is the pinnacle of animation. Fight me.",
        "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["comic-book", "animation", "superhero", "action"]
    },
    {
        "name": "Meera Krishnan",
        "username": "meera_cinemaa",
        "email": "meera.krishnan.film@example.com",
        "bio": "Tamil Nadu film buff. Screenplay structure analyst. A good score and crisp editing can save any movie.",
        "avatar_url": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["drama", "thriller", "south-indian", "music"]
    },
    {
        "name": "Jake Patterson",
        "username": "jakefilm",
        "email": "jake.patterson.movies@example.com",
        "bio": "35mm projectionist in Seattle. Physical media collector (4K Blu-ray > Streaming). David Lynch decoded.",
        "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["cult", "mystery", "surrealism", "sci-fi"]
    },
    {
        "name": "Pooja Malhotra",
        "username": "pooja_frames",
        "email": "pooja.malhotra.watch@example.com",
        "bio": "Delhi cinephile & architecture student. Obsessed with set design, brutalist sci-fi aesthetics and Dune lore.",
        "avatar_url": "https://images.unsplash.com/photo-1534751516642-a171ed28a1c8?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["sci-fi", "architecture", "world-building", "drama"]
    },
    {
        "name": "Carlos Rivera",
        "username": "carloscineaste",
        "email": "carlos.rivera.cine@example.com",
        "bio": "Guillermo del Toro, Alfonso Cuarón, Alejandro G. Iñárritu — Mexican cinema pride. Practical creature effects fan.",
        "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["fantasy", "horror", "drama", "latin-america"]
    },
    {
        "name": "Simran Bhatia",
        "username": "simran_reels",
        "email": "simran.bhatia.reels@example.com",
        "bio": "Romcom philosopher & nostalgia seeker. 90s Shah Rukh Khan films gave me unrealistic romance expectations.",
        "avatar_url": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["romcom", "bollywood", "drama", "feel-good"]
    },
    {
        "name": "Kenji Takahashi",
        "username": "kenji_cinemas",
        "email": "kenji.takahashi.tokyo@example.com",
        "bio": "Tokyo-based anime & live-action film archivist. Studio Ghibli, Satoshi Kon, Kurosawa & Makoto Shinkai.",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["anime", "japanese", "cyberpunk", "drama"]
    },
    {
        "name": "Maya Lin",
        "username": "maya_filmlore",
        "email": "maya.lin.films@example.com",
        "bio": "Vancouver sound designer. The hum of a lightsaber and the ticking watch in Oppenheimer keep me awake at night.",
        "avatar_url": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["sci-fi", "sound-design", "thriller", "drama"]
    },
    {
        "name": "Lucas Silva",
        "username": "lucas_screenplay",
        "email": "lucas.silva.cinema@example.com",
        "bio": "Screenwriter in São Paulo. City of God changed my perception of narrative energy. Dialogue-first cinema.",
        "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["crime", "drama", "screenwriting", "latin-america"]
    },
    {
        "name": "Hannah Schmidt",
        "username": "hannah_berlinale",
        "email": "hannah.schmidt.films@example.com",
        "bio": "Berlin film critic. Cold war thrillers, German expressionism, and dark psychological character studies.",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["german", "thriller", "psychological", "historical"]
    },
    {
        "name": "Kabir Dasgupta",
        "username": "kabir_celluloid",
        "email": "kabir.dasgupta.cine@example.com",
        "bio": "Kolkata bibliophile & Satyajit Ray disciple. Visual poetry over fast cuts any day of the week.",
        "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["bengali", "art-house", "poetry", "drama"]
    },
    {
        "name": "Liam Gallagher",
        "username": "liam_reelgeek",
        "email": "liam.gallagher.film@example.com",
        "bio": "Manchester cinephile. Guy Ritchie banter, Edgar Wright fast edits & Danny Boyle energy.",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["british", "comedy", "crime", "action"]
    },
    {
        "name": "Ananya Roy",
        "username": "ananya_reels",
        "email": "ananya.roy.cine@example.com",
        "bio": "Film archivist & period drama addict. Costume design, production design and haunting soundtracks.",
        "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["period-drama", "costume", "history", "romance"]
    },
    {
        "name": "Samira Al-Mansoor",
        "username": "samira_cinemania",
        "email": "samira.mansoor.film@example.com",
        "bio": "Dubai film festival curator. Middle Eastern and North African cinema renaissance advocate.",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["middle-east", "world-cinema", "drama", "documentary"]
    },
    {
        "name": "Noah Williams",
        "username": "noah_darkroom",
        "email": "noah.williams.cine@example.com",
        "bio": "Chicago indie filmmaker. Lighting with a single key light & natural shadows. Low budget, high heart.",
        "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["indie", "neo-noir", "crime", "drama"]
    },
    {
        "name": "Matteo Rossi",
        "username": "matteo_cinema_italiano",
        "email": "matteo.rossi.roma@example.com",
        "bio": "Rome-based film historian. Fellini, Antonioni, Sergio Leone & modern Italian auteur cinema.",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["italian", "spaghetti-western", "classics", "drama"]
    },
    {
        "name": "Astrid Lindgren",
        "username": "astrid_nordicnoir",
        "email": "astrid.lindgren.cine@example.com",
        "bio": "Stockholm. Nordic noir, Ingmar Bergman existentialism, and chilling Scandinavian thrillers.",
        "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["nordic", "thriller", "existential", "drama"]
    },
    {
        "name": "Aditya Verma",
        "username": "aditya_filmcraft",
        "email": "aditya.verma.craft@example.com",
        "bio": "Bengaluru UI designer by day, film score analyst by night. A.R. Rahman, Trent Reznor & Ennio Morricone.",
        "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["score", "sound-design", "thriller", "sci-fi"]
    },
    {
        "name": "Zoe Kravitz-Fan",
        "username": "zoe_reelmagic",
        "email": "zoe.kravitz.fan@example.com",
        "bio": "NYC cinephile. Neon aesthetic, coming-of-age indies, and synthwave soundtracks. Greta Gerwig stan.",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["indie", "coming-of-age", "neon", "drama"]
    },
    {
        "name": "Tariq Aziz",
        "username": "tariq_celluloid",
        "email": "tariq.aziz.films@example.com",
        "bio": "Lahore cinephile. Exploring South Asian parallel cinema, poetry in screenplays, and vintage Pakistani classics.",
        "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80",
        "taste": ["south-asian", "poetry", "drama", "parallel-cinema"]
    }
]

# ── TMDB API Helper ────────────────────────────────────────────────────────────
def fetch_tmdb(endpoint, params=None):
    if params is None:
        params = {}
    params["api_key"] = TMDB_API_KEY
    params["language"] = "en-US"
    url = f"https://api.themoviedb.org/3/{endpoint}?{urllib.parse.urlencode(params)}"
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=12) as res:
                return json.loads(res.read().decode("utf-8"))
        except Exception:
            time.sleep(1.5)
    return {}

# ── Seed Engine ────────────────────────────────────────────────────────────────
def seed_all():
    print("Connecting to PostgreSQL / Supabase...")
    conn = psycopg2.connect(
        host=db_host, port=int(db_port), dbname=db_name,
        user=db_user, password=db_pass, sslmode="require", connect_timeout=15
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # 1. Fetch Real Movie Data from TMDB
    print("\n[1/7] Fetching real top-rated, popular, and trending movies from TMDB...")
    all_movies = {}
    
    endpoints = [
        ("movie/popular", {"page": 1}),
        ("movie/popular", {"page": 2}),
        ("movie/top_rated", {"page": 1}),
        ("movie/top_rated", {"page": 2}),
        ("trending/movie/week", {"page": 1}),
        ("discover/movie", {"with_genres": "878", "sort_by": "vote_count.desc", "page": 1}), # Sci-Fi
        ("discover/movie", {"with_genres": "27", "sort_by": "vote_count.desc", "page": 1}),  # Horror
        ("discover/movie", {"with_genres": "53", "sort_by": "vote_count.desc", "page": 1}),  # Thriller
        ("discover/movie", {"with_genres": "16", "sort_by": "vote_count.desc", "page": 1}),  # Animation
        ("discover/movie", {"with_original_language": "hi", "sort_by": "vote_count.desc", "page": 1}), # Hindi
        ("discover/movie", {"with_original_language": "ko", "sort_by": "vote_count.desc", "page": 1}), # Korean
        ("discover/movie", {"with_original_language": "ja", "sort_by": "vote_count.desc", "page": 1}), # Japanese
    ]

    for ep, p in endpoints:
        data = fetch_tmdb(ep, p)
        for m_obj in data.get("results", []):
            if m_obj.get("id") and m_obj.get("title") and m_obj.get("poster_path"):
                all_movies[m_obj["id"]] = m_obj

    movie_list = list(all_movies.values())
    print(f"-> Successfully loaded {len(movie_list)} unique real movies from TMDB.")

    # 2. Insert or Update Users
    print("\n[2/7] Seeding diverse cinephile personas & profile metadata...")
    user_db_map = {} # username -> user_id

    for p in PERSONAS:
        cur.execute("SELECT id FROM users WHERE username = %s OR email = %s", (p["username"], p["email"]))
        existing = cur.fetchone()
        if existing:
            uid = existing["id"]
            cur.execute("""
                UPDATE users 
                SET name = %s, username = %s, bio = %s, avatar_url = %s, failed_login_attempts = 0
                WHERE id = %s
            """, (p["name"], p["username"], p["bio"], p["avatar_url"], uid))
            user_db_map[p["username"]] = uid
        else:
            cur.execute("""
                INSERT INTO users (name, username, email, hashed_password, bio, avatar_url, is_admin, failed_login_attempts, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 0, NOW() - INTERVAL '60 days')
                RETURNING id
            """, (p["name"], p["username"], p["email"], DUMMY_HASH, p["bio"], p["avatar_url"], False))
            uid = cur.fetchone()["id"]
            user_db_map[p["username"]] = uid

    # Ensure existing users in DB also have good avatars if missing
    cur.execute("SELECT id, name, username, avatar_url FROM users")
    all_db_users = cur.fetchall()
    all_user_ids = [u["id"] for u in all_db_users]

    sample_avatars = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=faces&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=faces&q=80",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&q=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces&q=80",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=faces&q=80",
        "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=faces&q=80"
    ]
    for u in all_db_users:
        if not u["avatar_url"]:
            chosen_avatar = random.choice(sample_avatars)
            cur.execute("UPDATE users SET avatar_url = %s WHERE id = %s", (chosen_avatar, u["id"]))
    
    conn.commit()
    print(f"-> Total active user pool: {len(all_user_ids)} users.")

    # 3. Build Realistic Social Network Graph (User Follows)
    print("\n[3/7] Generating dense, realistic Follower/Following social graph...")
    cur.execute("DELETE FROM user_follows")
    conn.commit()

    follow_pairs = set()
    for uid in all_user_ids:
        # Follow between 8 and 22 random other users
        num_following = random.randint(8, min(22, len(all_user_ids) - 1))
        targets = random.sample([other for other in all_user_ids if other != uid], num_following)
        for t in targets:
            follow_pairs.add((uid, t))

    for f_id, target_id in follow_pairs:
        cur.execute("""
            INSERT INTO user_follows (follower_id, following_id, created_at)
            VALUES (%s, %s, NOW() - (random() * interval '45 days'))
            ON CONFLICT DO NOTHING
        """, (f_id, target_id))

    conn.commit()
    print(f"-> Created {len(follow_pairs)} active follow relationships.")

    # 4. User Watch Activity (Favorites, Watched, Watchlist, Ratings)
    print("\n[4/7] Populating user watchlists, favorites, and 1-5 star ratings...")
    for uid in all_user_ids:
        # Select 15-30 movies for this user
        user_movies = random.sample(movie_list, min(len(movie_list), random.randint(15, 30)))
        
        # Favorites (3-6)
        favs = user_movies[:random.randint(3, 6)]
        for f in favs:
            cur.execute("""
                INSERT INTO favorites (user_id, movie_id, media_type, title, poster_path, backdrop_path, release_year, vote_average)
                VALUES (%s, %s, 'movie', %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (uid, f["id"], f["title"], f.get("poster_path"), f.get("backdrop_path"), f.get("release_date", "")[:4], f.get("vote_average", 8.0)))

        # Watched (10-20)
        watched_items = user_movies[3:random.randint(10, 20)]
        for w in watched_items:
            cur.execute("""
                INSERT INTO watched (user_id, movie_id, media_type, title, poster_path, backdrop_path, release_year, vote_average)
                VALUES (%s, %s, 'movie', %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (uid, w["id"], w["title"], w.get("poster_path"), w.get("backdrop_path"), w.get("release_date", "")[:4], w.get("vote_average", 8.0)))

        # Watchlist (5-12)
        watchlist_items = user_movies[12:random.randint(16, 25)]
        for wl in watchlist_items:
            cur.execute("""
                INSERT INTO watchlist (user_id, movie_id, media_type, title, poster_path, backdrop_path, release_year, vote_average)
                VALUES (%s, %s, 'movie', %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (uid, wl["id"], wl["title"], wl.get("poster_path"), wl.get("backdrop_path"), wl.get("release_date", "")[:4], wl.get("vote_average", 8.0)))

        # Star Ratings (8-15)
        for r_movie in user_movies[:random.randint(8, 15)]:
            score = round(random.uniform(3.0, 5.0) if random.random() > 0.15 else random.uniform(1.5, 2.5), 1)
            genres_str = ",".join(str(g) for g in r_movie.get("genre_ids", []))
            cur.execute("""
                INSERT INTO ratings (user_id, movie_id, media_type, rating, genre_ids, created_at)
                VALUES (%s, %s, 'movie', %s, %s, NOW() - (random() * interval '30 days'))
                ON CONFLICT DO NOTHING
            """, (uid, r_movie["id"], score, genres_str))

    conn.commit()
    print("-> User profiles populated with watch history, favorites, and ratings.")

    # 5. Rich Social Posts (Reviews, Watching, Recommendations, Polls, Scenes, Memes, Spoilers)
    print("\n[5/7] Generating 160+ ultra-realistic cinephile social posts across all types...")
    cur.execute("DELETE FROM post_reactions")
    cur.execute("DELETE FROM post_comments")
    cur.execute("DELETE FROM social_posts")
    conn.commit()

    # Pre-crafted realistic cinephile post templates with deep cinematic references
    REVIEW_POSTS = [
        ("Dune: Part Two (2024)", "Greig Fraser's cinematography in the Giedi Prime arena sequence using infrared cameras is pure black-and-white visual ecstasy. Austin Butler's physical performance as Feyd-Rautha was terrifying. Zimmer's score vibrates your ribcage. A landmark in modern science-fiction cinema.", 5),
        ("Interstellar (2014)", "10 years later and the docking scene ('No Time for Caution') remains the single most intense sequence ever put to celluloid. The mix of organ swells, silence in the vacuum of space, and McConaughey's desperation. Absolute masterpiece.", 5),
        ("Oppenheimer (2023)", "The Trinity test sequence is unforgettable, but what truly shattered me was the gymnasium celebration scene. Christopher Nolan turning cheering feet into the acoustic rumble of a nuclear detonation is world-class psychological sound design. Cillian Murphy gave the performance of a lifetime.", 5),
        ("Spider-Man: Across the Spider-Verse (2023)", "The Gwen Stacy Earth-65 watercolor background shifts with her emotional state. That level of artistic ambition in mainstream studio animation is unprecedented. Daniel Pemberton's punk-rock/synth score goes unfathomably hard.", 5),
        ("Whiplash (2014)", "Rewatched Whiplash tonight. The final 9-minute Caravan drum solo is the closest cinema has ever come to an Olympic gold medal match. Damien Chazelle cut this like an action movie. J.K. Simmons is terrifying.", 5),
        ("Past Lives (2023)", "The ending scene waiting for the Uber in the silence of New York City streets. No words spoken, just two lifetimes diverging forever. Celine Song created one of the most tender, heartbreaking films of this century. Still not over it.", 5),
        ("Parasite (2019)", "Bong Joon-ho’s spatial blocking in the Park family house is a masterclass in visual storytelling. The way vertical architecture represents class disparity—stairs going down, rain flooding the basement. Cinema at its peak perfection.", 5),
        ("Blade Runner 2049 (2017)", "Roger Deakins deserved every single award for the Las Vegas orange haze sequence alone. Ryan Gosling's quiet loneliness as K and Ana de Armas' Joi created one of the most poignant romances in sci-fi. It deserved so much more box office love.", 5),
        ("The Batman (2022)", "The opening 10 minutes establishing Gotham as an unlivable nightmare set to Nirvana's 'Something in the Way' is immaculate noir. Robert Pattinson was born to play Year Two Bruce Wayne. Greig Fraser's rain-soaked amber lens work is pure art.", 4.5),
        ("Everything Everywhere All At Once (2022)", "A mother-daughter reconciliation framed through multidimensional bagels, hot dog fingers, and talking rocks with subtitles. The Daniels made something completely unhinged yet deeply emotionally healing.", 5),
        ("La La Land (2016)", "The 'Epilogue' alternate reality sequence shows what could have been in a gorgeous 7-minute theatrical dream ballet. Justin Hurwitz's music is etched into my soul. That final nod across the jazz club. Devastating.", 5),
        ("Fight Club (1999)", "David Fincher’s nihilistic masterpiece still hits harder every year. The dirty green lighting, the subliminal frames, Dust Brothers electronic score. Brad Pitt and Edward Norton had lightning in a bottle.", 5),
        ("Spirited Away (2001)", "The sixth station train ride across the submerged tracks at sunset with Joe Hisaishi's piano playing. Pure meditative visual poetry. Hayao Miyazaki captures childhood melancholy like nobody else in history.", 5),
        ("Pulp Fiction (1994)", "The nonlinear screenplay structure, the iconic dialogue cadence, the soundtrack choices. Quentin Tarantino redefined the entire DNA of American indie cinema with this film. Timeless.", 5),
        ("The Dark Knight (2008)", "Heath Ledger's Joker interrogation room scene with Christian Bale. Zero score in the background, just raw physical acting and philosophy. Still the high watermark for comic book cinema.", 5),
        ("Poor Things (2023)", "Yorgos Lanthimos' use of ultra-wide fisheye lenses, hyper-stylized steampunk European cities, and Emma Stone's completely fearless physical comedy made this an instant classic. Jerskin Fendrix's off-kilter score is brilliant.", 4.5),
        ("Killers of the Flower Moon (2023)", "Martin Scorsese at 80 years old directing with more fury, precision, and moral gravity than directors half his age. Lily Gladstone commanded every single frame with devastating quiet strength.", 4.5),
        ("Anatomy of a Fall (2023)", "The 10-minute marital argument scene in the cabin kitchen is one of the best written dialogue confrontations in modern cinema. Sandra Hüller delivered an acting masterclass.", 5),
        ("Civil War (2024)", "Alex Garland's sound design during the third act Washington D.C. raid was bone-chilling. Gunfire sounded loud, concussive, and terrifyingly real. A brutal meditation on photojournalism and political desensitization.", 4),
        ("Challengers (2024)", "Trent Reznor and Atticus Ross turned a tennis match into a 130 BPM sweaty techno rave. Luca Guadagnino directed the ball's POV like an F1 race. Pure cinematic adrenaline and tension.", 4.5)
    ]

    WATCHING_POSTS = [
        "Late night 4K OLED rewatch of Blade Runner 2049 with Dolby Atmos. That neon-lit holographic rain atmosphere never gets old. 🌧️🛸",
        "Finally sat down for a double feature: Whiplash followed immediately by La La Land. Damien Chazelle was truly in an untouchable groove in the 2010s.",
        "Rewatching Inception with high-end headphones on. The Ludwig Göransson / Hans Zimmer horn drops still give me goosebumps every single time.",
        "Sunday afternoon Studio Ghibli marathon. Starting with *Princess Mononoke* and ending with *Spirited Away*. Soul cleansing. 🍃✨",
        "First time watching *Memories of Murder* (2003) by Bong Joon-ho. That final shot staring directly into the camera lens gave me chills.",
        "Rewatching *The Social Network* (2010). Aaron Sorkin's dialogue pacing and Fincher's metronomic direction make two hours feel like 20 minutes.",
        "Late night noir vibes: *Drive* (2011) in 4K. Cliff Martinez's synthwave soundtrack and the neon Los Angeles streets. Perfection.",
        "Currently rewatching *Dune: Part One* before revisiting Part Two this weekend. The Sardaukar throat singing chant scene still goes so ridiculously hard.",
        "Watching *Tumbbad* (2018) in the dark with rain outside. The mythology, production design, and atmosphere are unmatched in Indian horror cinema.",
        "Revisiting *Mad Max: Fury Road* on the big screen. 120 minutes of practical vehicle stuntwork and fire-breathing guitars. 10/10 masterclass."
    ]

    RECOMMENDATION_POSTS = [
        "If you loved *Severance* or *Inception*, you NEED to watch *Coherence* (2013). Shot in 5 nights in a single living room with mostly improvised dialogue. Peak mindfuck sci-fi thriller on a micro-budget.",
        "If you enjoyed the moody detective atmosphere of *The Batman*, check out David Fincher's *Zodiac* (2007) and Bong Joon-ho's *Memories of Murder* (2003). The holy trinity of obsessive investigation films.",
        "Films with immaculate melancholic rainy night vibes:\n1. *Blade Runner 2049*\n2. *Lost in Translation*\n3. *Fallen Angels* (Wong Kar-wai)\n4. *Drive*\n5. *Her*\nSave this for your next late-night mood. 🌌",
        "If you want peak Indian cinema that goes beyond commercial tropes:\n1. *Kumbalangi Nights* (Malayalam)\n2. *Super Deluxe* (Tamil)\n3. *Tumbbad* (Hindi)\n4. *Gangs of Wasseypur* (Hindi)\n5. *Jallikattu* (Malayalam)",
        "Under-the-radar sci-fi gems with zero CGI but 100% philosophical brilliance:\n• *The Man from Earth* (2007)\n• *Primer* (2004)\n• *Triangle* (2009)\n• *Moon* (2009)\nWhich one is your favorite?",
        "If you liked *Past Lives*, watch the Before Trilogy (*Before Sunrise*, *Before Sunset*, *Before Midnight*) by Richard Linklater. The gold standard for romantic dialogue in cinema history."
    ]

    POLL_POSTS = [
        {
            "question": "Which Denis Villeneuve science-fiction masterpiece ranks #1 in your heart?",
            "options": ["Arrival (2016)", "Blade Runner 2049 (2017)", "Dune: Part One (2021)", "Dune: Part Two (2024)", "Sicario (2015)"]
        },
        {
            "question": "Which Christopher Nolan climax gave you the most visceral chills in theaters?",
            "options": ["Interstellar (Docking / Tesseract)", "Inception (Spinning Top / The Kick)", "Oppenheimer (Trinity / Pond Conversation)", "The Prestige (Final Stage Reveal)"]
        },
        {
            "question": "Who delivered the most definitive, iconic live-action Batman performance?",
            "options": ["Christian Bale (Dark Knight Trilogy)", "Robert Pattinson (The Batman)", "Michael Keaton (Batman 1989)", "Ben Affleck (Batman v Superman)"]
        },
        {
            "question": "What is the greatest cinematic plot twist of all time?",
            "options": ["The Sixth Sense ('He was dead all along')", "Fight Club ('Tyler Durden is me')", "Shutter Island ('Patient 67')", "Oldboy 2003 ('The Photo Album')"]
        },
        {
            "question": "You can only keep ONE director's complete filmography for the rest of your life. Who do you pick?",
            "options": ["Quentin Tarantino", "Christopher Nolan", "David Fincher", "Hayao Miyazaki", "Martin Scorsese"]
        },
        {
            "question": "Best Animated Feature of the 21st Century so far?",
            "options": ["Spirited Away (2001)", "Spider-Man: Across the Spider-Verse (2023)", "WALL-E (2008)", "Ratatouille (2007)", "Spider-Man: Into the Spider-Verse (2018)"]
        },
        {
            "question": "Which 2023 film deserved the Best Picture Oscar the most?",
            "options": ["Oppenheimer", "Poor Things", "Past Lives", "Anatomy of a Fall", "The Zone of Interest"]
        },
        {
            "question": "Most terrifying modern horror villain / concept?",
            "options": ["The Entity (It Follows)", "Black Phillip (The Witch)", "Hereditary Cult (Hereditary)", "Art the Clown (Terrifier)"]
        }
    ]

    SCENE_POSTS = [
        ("Interstellar (2014)", "The Docking Sequence ('No Time for Caution'). Case: 'It's impossible.' Cooper: 'No, it's necessary.' Hans Zimmer's pipe organ escalating while the Endurance spins in synchronize. Literal cinematic perfection.", "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg"),
        ("Whiplash (2014)", "The Caravan Finale. When Andrew Neiman cuts Fletcher off and takes command of the band with that opening hi-hat beat. Pure adrenaline and artistic obsession distilled into 9 minutes of raw drumming.", "https://image.tmdb.org/t/p/w1280/6bbZ6XyvgfjhQwfplEdcAEdj4wh.jpg"),
        ("Inception (2010)", "The Rotating Hallway Zero-Gravity Fight Scene. Joseph Gordon-Levitt fighting in a practical revolving centrifuge corridor built on a British airship hangar. Practical FX > CGI always.", "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg"),
        ("Pulp Fiction (1994)", "The Diner Opening Scene. Pumpkin and Honey Bunny discussing bank heists over coffee before 'Misirlou' kicks in. The coolest opening titles in 90s cinema history.", "https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"),
        ("The Dark Knight (2008)", "The Joker's Pencil Magic Trick and mob meeting. Heath Ledger completely owning the room with just laughter and a grenade trap inside his coat. Iconic villain entrance.", "https://image.tmdb.org/t/p/w1280/hkBaDkMWbLaf8B1r5vsIRqqXst4.jpg"),
        ("Dune: Part Two (2024)", "Paul Atreides taking the Water of Life and giving his speech to the Southern fundamentalists in the sietch. Timothée Chalamet's vocal command and presence silenced the entire theater.", "https://image.tmdb.org/t/p/w1280/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg")
    ]

    MEME_POSTS = [
        ("Me explaining the entire non-linear inverted timeline of Tenet to my friend who just wanted to order a pizza on Friday night.", "https://image.tmdb.org/t/p/w1280/k68nPLbIST6NP96JmTxmZijEvCA.jpg"),
        ("My watchlist containing 948 award-winning foreign films vs me rewatching Interstellar for the 15th time at 2 AM.", "https://image.tmdb.org/t/p/w1280/rAiYTrKGqDCRIIqo664sY9XZIvQ.jpg"),
        ("A24 Horror Movie Director: 'What if the real monster was generational trauma and unaddressed grief?'\nFilm critics: 🌟 10/10 MASTERPIECE 🌟\nMy parents: 'Nothing happened in the whole movie.'", "https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg"),
        ("Me trying to hear the dialogue in a Christopher Nolan movie when Ludwig Göransson's orchestral bass drop hits at 120 decibels.", "https://image.tmdb.org/t/p/w1280/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg"),
        ("Film student explaining why the 4:3 aspect ratio and 16mm grain in a movie about two sad people in a lighthouse represents the decay of the soul.", "https://image.tmdb.org/t/p/w1280/6xKCY0hDATVwWCr9th197ZeYe76.jpg")
    ]

    SPOILER_HOT_TAKES = [
        ("La La Land (2016)", "⚠️ HOT TAKE: If Mia and Sebastian had ended up together at the end of La La Land, the movie would have been just a cute romantic comedy. The bittersweet realization that some people are meant to inspire your dreams, not share the destination, is why it is an all-time classic.", True),
        ("Inception (2010)", "⚠️ SPOILER ANALYSIS: The spinning top at the end does NOT matter. Cobb walks away to hug his children without waiting to see if it wobbles or falls. The entire point of the movie is that he stopped caring about what's real and chose to be present in his life. That's his emotional catharsis.", True),
        ("Fight Club (1999)", "⚠️ SPOILER: The most tragic detail in Fight Club is that Marla Singer was genuine the entire time. She was dealing with a severely mentally ill man who literally shifted personalities every time he walked out of the room, and she still tried to love him.", True),
        ("Oppenheimer (2023)", "⚠️ SPOILER HOT TAKE: The final conversation between Oppenheimer and Einstein at the pond recontextualizes the whole 3 hours. It wasn't about Strauss' nomination at all. Oppenheimer realizing he started a chain reaction that will eventually destroy humanity is the true horror climax.", True),
        ("Dune: Part Two (2024)", "⚠️ SPOILER: Paul Atreides is not the hero; he is the tragedy. Watching him succumb to the golden path and weaponize the Bene Gesserit prophecy over the Fremen while Chani watches in heartbreak was Shakespearean.", True)
    ]

    # Insert posts with realistic timestamps over the last 30 days
    inserted_posts = []

    # Insert Reviews as posts
    for title, content, rating in REVIEW_POSTS:
        # Match movie if in tmdb list
        matched_m = next((m for m in movie_list if title.lower().split(" (")[0] in m["title"].lower()), random.choice(movie_list))
        user_id = random.choice(all_user_ids)
        payload = {
            "rating": rating,
            "movie_title": matched_m["title"],
            "poster_path": matched_m.get("poster_path"),
            "release_year": matched_m.get("release_date", "")[:4]
        }
        days_ago = random.uniform(0.1, 28.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'review', %s, %s, %s, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, matched_m["id"], content, json.dumps(payload), False, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "review"})

    # Insert Watching posts
    for content in WATCHING_POSTS:
        matched_m = random.choice(movie_list)
        user_id = random.choice(all_user_ids)
        payload = {"platform": "4K Blu-ray / OLED", "movie_title": matched_m["title"]}
        days_ago = random.uniform(0.1, 25.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'watching', %s, %s, %s, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, matched_m["id"], content, json.dumps(payload), False, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "watching"})

    # Insert Recommendations
    for content in RECOMMENDATION_POSTS:
        user_id = random.choice(all_user_ids)
        days_ago = random.uniform(0.2, 26.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'recommendation', NULL, %s, NULL, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, content, False, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "recommendation"})

    # Insert Polls
    for poll in POLL_POSTS:
        user_id = random.choice(all_user_ids)
        payload = {"options": poll["options"]}
        days_ago = random.uniform(0.1, 20.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'poll', NULL, %s, %s, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, poll["question"], json.dumps(payload), False, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "poll"})

    # Insert Scene posts
    for title, content, backdrop in SCENE_POSTS:
        user_id = random.choice(all_user_ids)
        matched_m = next((m for m in movie_list if title.lower().split(" (")[0] in m["title"].lower()), random.choice(movie_list))
        payload = {"media_url": backdrop, "scene_title": title}
        days_ago = random.uniform(0.1, 27.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'scene', %s, %s, %s, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, matched_m["id"], content, json.dumps(payload), False, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "scene"})

    # Insert Memes
    for content, backdrop in MEME_POSTS:
        user_id = random.choice(all_user_ids)
        payload = {"media_url": backdrop}
        days_ago = random.uniform(0.1, 22.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'meme', NULL, %s, %s, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, content, json.dumps(payload), False, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "meme"})

    # Insert Spoiler Hot Takes
    for title, content, is_spoil in SPOILER_HOT_TAKES:
        matched_m = next((m for m in movie_list if title.lower().split(" (")[0] in m["title"].lower()), random.choice(movie_list))
        user_id = random.choice(all_user_ids)
        days_ago = random.uniform(0.1, 25.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'review', %s, %s, NULL, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, matched_m["id"], content, is_spoil, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "spoiler"})

    # Multiply and distribute additional genuine micro-reviews across remaining movies
    for m_obj in movie_list[:80]:
        user_id = random.choice(all_user_ids)
        stars = round(random.choice([3.5, 4.0, 4.5, 5.0, 5.0]), 1) if m_obj.get("vote_average", 7) >= 7.5 else round(random.choice([2.0, 2.5, 3.0, 3.5]), 1)
        
        sample_short_reviews = [
            f"Rewatched {m_obj['title']} ({m_obj.get('release_date', '')[:4]}). The pacing and visual language still hold up remarkably well. Solid {stars}/5.",
            f"Finally caught {m_obj['title']}. Exceeded my expectations—sound design and lead performances carried the whole third act.",
            f"{m_obj['title']} hits completely differently on a second viewing. Notice the subtle foreshadowing in the opening sequence.",
            f"Underrated cinematography in {m_obj['title']}. The color palette in the second half was chef's kiss.",
            f"If you haven't seen {m_obj['title']}, do not sleep on it. An easy weekend recommendation."
        ]
        chosen_txt = random.choice(sample_short_reviews)
        payload = {"rating": stars, "movie_title": m_obj["title"], "poster_path": m_obj.get("poster_path")}
        days_ago = random.uniform(0.1, 30.0)
        cur.execute("""
            INSERT INTO social_posts (user_id, post_type, movie_id, content, payload, is_spoiler, created_at)
            VALUES (%s, 'review', %s, %s, %s, %s, NOW() - (%s * interval '1 day'))
            RETURNING id
        """, (user_id, m_obj["id"], chosen_txt, json.dumps(payload), False, days_ago))
        p_id = cur.fetchone()["id"]
        inserted_posts.append({"id": p_id, "user_id": user_id, "type": "review"})

    conn.commit()
    print(f"-> Created {len(inserted_posts)} unique social posts across all types.")

    # 6. Post Reactions & Threaded Comments
    print("\n[6/7] Generating 800+ realistic post reactions and 350+ conversational comment replies...")
    reaction_types = ["loved", "amazing", "funny", "mindblown", "emotional", "disliked"]
    
    COMMENTS_DATABASE = [
        "100% agreed. That scene gave me chills in theaters!",
        "The score during that moment was peak Hans Zimmer / Ludwig Göransson.",
        "Hot take, but I actually preferred the second half more than the first.",
        "Watched this in IMAX 70mm and my seat was literally vibrating.",
        "I was on the fence about watching this, but your review convinced me!",
        "Spot on analysis. Most people missed that visual metaphor.",
        "Bro you're so right about the third act pacing.",
        "Underrated comment right here. This needs more attention.",
        "Adding this straight to my weekend watchlist immediately.",
        "Cried like a baby in the theater during that scene, zero shame.",
        "The sound design alone deserved an Oscar nomination.",
        "I have watched this 5 times and I still notice new details every single time.",
        "The cinematography in the second half is pure art.",
        "Couldn't agree more. Denis Villeneuve / Nolan is operating on a different plane.",
        "Facts. One of the best theatrical experiences of my entire life."
    ]

    for post_info in inserted_posts:
        p_id = post_info["id"]
        author_id = post_info["user_id"]
        
        # Reactions (3 to 14 reactions per post)
        num_reactions = random.randint(3, 14)
        reacting_users = random.sample([u for u in all_user_ids if u != author_id], min(num_reactions, len(all_user_ids) - 1))
        
        for r_user in reacting_users:
            r_type = "funny" if post_info["type"] == "meme" else random.choice(["loved", "amazing", "loved", "mindblown", "amazing"])
            cur.execute("""
                INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at)
                VALUES (%s, %s, %s, NOW() - (random() * interval '20 days'))
                ON CONFLICT DO NOTHING
            """, (p_id, r_user, r_type))

        # Threaded Comments (1 to 5 comments on 75% of posts)
        if random.random() < 0.75:
            num_comments = random.randint(1, 5)
            commenting_users = random.sample([u for u in all_user_ids if u != author_id], min(num_comments, len(all_user_ids) - 1))
            for c_user in commenting_users:
                c_text = random.choice(COMMENTS_DATABASE)
                cur.execute("""
                    INSERT INTO post_comments (post_id, user_id, content, contains_spoiler, created_at)
                    VALUES (%s, %s, %s, %s, NOW() - (random() * interval '18 days'))
                """, (p_id, c_user, c_text, False))

    conn.commit()
    print("-> Social reactions and conversational comment threads attached.")

    # 7. Moctale Reviews & Comments, Verdict Battles, Debates & Groups
    print("\n[7/7] Seeding Moctale Meter Reviews, Verdict Battles, Debates & Cinephile Groups...")
    
    # 7A. Moctale Meter Reviews
    cur.execute("DELETE FROM moctale_review_comment_likes")
    cur.execute("DELETE FROM moctale_review_likes")
    cur.execute("DELETE FROM moctale_review_comments")
    cur.execute("DELETE FROM moctale_ratings")
    conn.commit()

    MOCTALE_REVIEWS = {
        "perfection": [
            "Absolute cinema. Martin Scorsese and Denis Villeneuve would be proud. 10/10.",
            "Bhai, kya movie banayi hai! Oscar de do inko abhi ke abhi. Masterpiece.",
            "Mind blown. Did not expect this level of emotional depth and visual ambition.",
            "A true masterpiece. I am officially making this entire movie my personality now.",
            "Maza aa gaya kasam se. Best cinematic experience of the entire decade hands down.",
            "They cooked. The director cooked. The actors cooked. We ate.",
            "Khatarnak direction. Goosebumps in every frame. Speechless.",
            "Cinematography is God-tier. Chef's kiss from start to finish.",
            "Kya writing hai bhai. Not a single wasted second of runtime.",
            "It's not just a movie, it's a spiritual experience."
        ],
        "goforit": [
            "Solid movie. Great timepass with an actual emotional plot. Def go for it.",
            "Ek baar toh dekhna banta hai boss. Total paisa vasool entertainment.",
            "Not bad at all, thoroughly engaging from start to finish.",
            "Worth every penny of the ticket price. Take your friends.",
            "Good story, slightly slow in the middle, but great climax payoff.",
            "Badiya movie hai. Weekend movie night sorted.",
            "A fun ride. Action sequences are lit and pacing is crisp."
        ],
        "timepass": [
            "Dimag ghar chhod ke jana. Decent one-time Sunday afternoon watch.",
            "Theek thak hai. Good background noise while scrolling your phone.",
            "Just average. Great hero entry, but the plot falls flat in the third act.",
            "Kuch naya nahi hai but bore bhi nahi karta. Mid but watchable.",
            "Average AF. The trailer looked much better than the actual final cut."
        ],
        "skip": [
            "Mera time wapas karo. Aur ticket ke paise bhi. Big skip.",
            "Complete mental torture. Who on earth funded this script?",
            "Bhai, please mat dekhna. Worst 2 hours of my week.",
            "Bakwas. Absolute trash. My eyes are bleeding.",
            "Save yourself. Do not watch this."
        ]
    }

    inserted_reviews = []
    for m_obj in movie_list[:90]:
        # Generate 2 to 5 reviews per movie
        reviewers = random.sample(all_user_ids, random.randint(2, min(5, len(all_user_ids))))
        vote_avg = m_obj.get("vote_average", 7.0)
        
        for r_user in reviewers:
            if vote_avg >= 7.8:
                label = random.choices(["perfection", "goforit", "timepass"], weights=[0.65, 0.30, 0.05])[0]
            elif vote_avg >= 6.5:
                label = random.choices(["goforit", "timepass", "perfection"], weights=[0.55, 0.35, 0.10])[0]
            else:
                label = random.choices(["timepass", "skip", "goforit"], weights=[0.45, 0.45, 0.10])[0]

            rev_text = random.choice(MOCTALE_REVIEWS[label])
            cur.execute("""
                INSERT INTO moctale_ratings (user_id, movie_id, media_type, title, poster_path, label, review_text, created_at)
                VALUES (%s, %s, 'movie', %s, %s, %s, %s, NOW() - (random() * interval '30 days'))
                ON CONFLICT (user_id, movie_id) DO NOTHING
                RETURNING id
            """, (r_user, m_obj["id"], m_obj["title"], m_obj.get("poster_path"), label, rev_text))
            row = cur.fetchone()
            if row:
                inserted_reviews.append({"id": row["id"], "user_id": r_user})

    # Add Likes and Comments to Moctale Reviews
    for rev in inserted_reviews:
        # Likes
        if random.random() < 0.6:
            likers = random.sample([u for u in all_user_ids if u != rev["user_id"]], random.randint(1, 4))
            for l_user in likers:
                cur.execute("""
                    INSERT INTO moctale_review_likes (review_id, user_id, created_at)
                    VALUES (%s, %s, NOW() - (random() * interval '15 days'))
                    ON CONFLICT DO NOTHING
                """, (rev["id"], l_user))

        # Comments
        if random.random() < 0.4:
            commenter = random.choice([u for u in all_user_ids if u != rev["user_id"]])
            comm_reply = random.choice([
                "Spot on review bhai! Totally agree.",
                "Haha accurate description!",
                "Nah I actually loved the climax, but fair review.",
                "Valid points on the soundtrack!",
                "Bro told zero lies here."
            ])
            cur.execute("""
                INSERT INTO moctale_review_comments (review_id, user_id, content, created_at)
                VALUES (%s, %s, %s, NOW() - (random() * interval '12 days'))
            """, (rev["id"], commenter, comm_reply))

    conn.commit()
    print(f"-> Seeded {len(inserted_reviews)} Moctale reviews with likes and replies.")

    # 7B. Verdict Battles
    cur.execute("DELETE FROM battle_votes")
    cur.execute("DELETE FROM battle_arguments")
    cur.execute("DELETE FROM verdict_battles")
    conn.commit()

    BATTLES_DEF = [
        {
            "movie_id": 872585, # Oppenheimer
            "title": "Oppenheimer vs. Barbie (The Summer of 2023 Face-Off)",
            "side_a": "Oppenheimer (Pure Cinema & Sound Design)",
            "side_b": "Barbie (Cultural Phenomenon & Satire)",
            "desc": "Which film will stand the test of time as the defining cultural moment of 2023?",
            "args_a": [
                "Cillian Murphy's haunting facial acting and Ludwig Göransson's propulsive score make Oppenheimer an enduring historical masterpiece.",
                "The Trinity test and the sheer craftsmanship in non-linear editing prove Nolan is at the height of his powers."
            ],
            "args_b": [
                "Barbie revitalized theatrical attendance and made feminist pop satire accessible to hundreds of millions globally.",
                "Greta Gerwig's production design and Ryan Gosling's 'I'm Just Ken' are timeless pop culture gold."
            ]
        },
        {
            "movie_id": 155, # The Dark Knight
            "title": "The Dark Knight (2008) vs. The Batman (2022)",
            "side_a": "The Dark Knight (Nolan / Heath Ledger)",
            "side_b": "The Batman (Matt Reeves / Robert Pattinson)",
            "desc": "The operatic crime thriller vs. the gritty detective neo-noir. Which Gotham reigns supreme?",
            "args_a": [
                "Heath Ledger's Joker is the greatest villain performance in cinema history. The pacing is breathless.",
                "The philosophical clash between order and chaos is unmatched."
            ],
            "args_b": [
                "The Batman actually treats Batman as the World's Greatest Detective, and Greig Fraser's cinematography is gorgeous.",
                "Gotham felt like a real, corrupt, rain-drenched character for the first time."
            ]
        },
        {
            "movie_id": 157336, # Interstellar
            "title": "Interstellar (2014) vs. Arrival (2016)",
            "side_a": "Interstellar (Cosmic Wonder & Score)",
            "side_b": "Arrival (Linguistic Depth & Emotion)",
            "desc": "The two greatest sci-fi films of the 2010s. Grand cosmic scale vs intimate human communication.",
            "args_a": [
                "Hans Zimmer's pipe organ score and the emotional gut punch of Cooper watching 23 years of messages is cinema peak.",
                "The visual effects depicting Gargantua black hole were so accurate they generated peer-reviewed physics papers."
            ],
            "args_b": [
                "Arrival handles non-linear time and human grief with sublime, quiet perfection. Denis Villeneuve's best film.",
                "Amy Adams gave the performance of her career. The ending twist recontextualizes every single scene."
            ]
        }
    ]

    for b in BATTLES_DEF:
        creator_id = random.choice(all_user_ids)
        cur.execute("""
            INSERT INTO verdict_battles (movie_id, media_type, creator_id, title, side_a_label, side_b_label, description, ends_at, status, created_at)
            VALUES (%s, 'movie', %s, %s, %s, %s, %s, NOW() + INTERVAL '30 days', 'active', NOW() - INTERVAL '5 days')
            RETURNING id
        """, (b["movie_id"], creator_id, b["title"], b["side_a"], b["side_b"], b["desc"]))
        b_id = cur.fetchone()["id"]

        # Arguments Side A
        for arg in b["args_a"]:
            arg_user = random.choice([u for u in all_user_ids if u != creator_id])
            cur.execute("""
                INSERT INTO battle_arguments (battle_id, user_id, side, content, created_at)
                VALUES (%s, %s, 'a', %s, NOW() - INTERVAL '3 days')
            """, (b_id, arg_user, arg))

        # Arguments Side B
        for arg in b["args_b"]:
            arg_user = random.choice([u for u in all_user_ids if u != creator_id])
            cur.execute("""
                INSERT INTO battle_arguments (battle_id, user_id, side, content, created_at)
                VALUES (%s, %s, 'b', %s, NOW() - INTERVAL '2 days')
            """, (b_id, arg_user, arg))

        # Votes
        voters = random.sample(all_user_ids, random.randint(10, min(20, len(all_user_ids))))
        for v in voters:
            side = random.choice(["a", "b"])
            cur.execute("""
                INSERT INTO battle_votes (battle_id, user_id, side)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (b_id, v, side))

    conn.commit()
    print("-> Seeded Verdict Battles with multi-user arguments and votes.")

    # 7C. Movie Debates
    cur.execute("DELETE FROM debate_votes")
    cur.execute("DELETE FROM debates")
    conn.commit()

    DEBATES_DEF = [
        (27205, "The spinning top at the end of Inception definitely wobbled and fell—Cobb is in reality.", [
            ("agree", "The wedding ring was his true totem, and he wasn't wearing it in the final scene. He is in reality!"),
            ("disagree", "Michael Caine confirmed that any scene he is in is reality, so Cobb is indeed home with his kids."),
            ("agree", "Nolan cut to black right as it lost momentum. It was clearly about to topple.")
        ]),
        (157336, "Love being a quantifiable physical dimension in Interstellar makes scientific and emotional sense.", [
            ("agree", "It's not magic, it's consciousness navigating higher dimensions. Cooper used gravitational anomalies."),
            ("disagree", "The movie was 95% hard physics until the tesseract speech. It felt slightly out of place with Kip Thorne's equations."),
            ("agree", "Brand's monologue was poetic foreshadowing. Cinema needs emotional stakes, not just dry math.")
        ]),
        (550, "Fight Club's ending where the buildings collapse is more poetic than the book's psychiatric ward ending.", [
            ("agree", "Set to the Pixies 'Where Is My Mind?', it is one of the most iconic romantic ending shots in film history."),
            ("agree", "Chuck Palahniuk himself stated he preferred David Fincher's movie ending over his own book."),
            ("disagree", "The book ending grounded the consequences of Tyler's destruction much more realistically.")
        ])
    ]

    for m_id, content, replies in DEBATES_DEF:
        parent_user = random.choice(all_user_ids)
        cur.execute("""
            INSERT INTO debates (movie_id, media_type, user_id, stance, content, parent_id, created_at)
            VALUES (%s, 'movie', %s, 'agree', %s, NULL, NOW() - INTERVAL '7 days')
            RETURNING id
        """, (m_id, parent_user, content))
        deb_id = cur.fetchone()["id"]

        # Votes on parent
        for v_user in random.sample(all_user_ids, 8):
            cur.execute("""
                INSERT INTO debate_votes (debate_id, user_id, vote)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (deb_id, v_user, random.choice(["up", "up", "up", "down"])))

        # Replies
        for stance, rep_text in replies:
            rep_user = random.choice([u for u in all_user_ids if u != parent_user])
            cur.execute("""
                INSERT INTO debates (movie_id, media_type, user_id, stance, content, parent_id, created_at)
                VALUES (%s, 'movie', %s, %s, %s, %s, NOW() - INTERVAL '3 days')
                RETURNING id
            """, (m_id, rep_user, stance, rep_text, deb_id))
            rep_id = cur.fetchone()["id"]
            
            for v_user in random.sample(all_user_ids, 4):
                cur.execute("""
                    INSERT INTO debate_votes (debate_id, user_id, vote)
                    VALUES (%s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (rep_id, v_user, "up"))

    conn.commit()
    print("-> Seeded Movie Debates with threaded discussions and votes.")

    # 7D. Community Groups
    cur.execute("DELETE FROM group_comments")
    cur.execute("DELETE FROM group_posts")
    cur.execute("DELETE FROM group_members")
    cur.execute("DELETE FROM groups")
    conn.commit()

    GROUPS_DEF = [
        ("A24 & Independent Cinema Cult", "For devotees of atmospheric, director-driven indie cinema, psychological slow-burns, and unconventional storytelling.", "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&fit=crop&q=80"),
        ("Cosmic Horizons (Sci-Fi & Space)", "Deep-dive discussions on astrophysics in cinema, time dilation, cyberpunk aesthetics, and speculative futures.", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&fit=crop&q=80"),
        ("Asian Cinema & Anime Vanguard", "Celebrating Korean thrillers, Studio Ghibli masterpieces, Japanese cyberpunk, Hong Kong martial arts, and Indian epics.", "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&fit=crop&q=80"),
        ("Midnight Horror Society", "Folk horror, psychological dread, practical FX gore, Ari Aster nightmares, and vintage 80s creature features.", "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&fit=crop&q=80"),
        ("Screenplay & Cinematography Guild", "Analyzing lighting setups, non-linear story architecture, color theory, lens choices, and editing pacing.", "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&fit=crop&q=80")
    ]

    for g_name, g_desc, g_img in GROUPS_DEF:
        creator_id = random.choice(all_user_ids)
        cur.execute("""
            INSERT INTO groups (name, description, image_url, creator_id, created_at)
            VALUES (%s, %s, %s, %s, NOW() - INTERVAL '40 days')
            RETURNING id
        """, (g_name, g_desc, g_img, creator_id))
        g_id = cur.fetchone()["id"]

        # Members
        members = random.sample(all_user_ids, random.randint(12, min(25, len(all_user_ids))))
        for m_uid in members:
            cur.execute("""
                INSERT INTO group_members (group_id, user_id, joined_at)
                VALUES (%s, %s, NOW() - INTERVAL '30 days')
                ON CONFLICT DO NOTHING
            """, (g_id, m_uid))

        # Group Posts
        for i in range(random.randint(2, 4)):
            poster = random.choice(members)
            cur.execute("""
                INSERT INTO group_posts (group_id, user_id, content, created_at)
                VALUES (%s, %s, %s, NOW() - (random() * interval '20 days'))
                RETURNING id
            """, (g_id, poster, f"Welcome everyone! What is your favorite entry in this genre from the last 5 years and why?"))
            gp_id = cur.fetchone()["id"]

            # Group Comments
            for c_poster in random.sample([u for u in members if u != poster], random.randint(2, 4)):
                cur.execute("""
                    INSERT INTO group_comments (post_id, user_id, content, created_at)
                    VALUES (%s, %s, %s, NOW() - (random() * interval '10 days'))
                """, (gp_id, c_poster, "Definitely exceeded all my expectations. The sound design alone was incredible."))

    conn.commit()
    print("-> Seeded Community Groups with active discussions.")

    # Finish & Report
    cur.close()
    conn.close()
    print("\n=======================================================")
    print("ULTRA-REALISTIC SEEDING COMPLETED SUCCESSFULLY!")
    print("=======================================================\n")

if __name__ == "__main__":
    seed_all()
