"""
seed_reviews.py
================
Seeds ~100 Moctale reviews with Hinglish/English sarcasm across popular and new TMDB movies.
Run: python seed_reviews.py
"""

import os, sys, re, json, time, random, urllib.request, urllib.parse
from datetime import datetime, timezone

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2
    import psycopg2.extras

env_path = os.path.join(os.path.dirname(__file__), ".env")
env_vars = {}
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env_vars[k.strip()] = v.strip()

DATABASE_URL = env_vars.get("DATABASE_URL", "")
TMDB_API_KEY = env_vars.get("TMDB_API_KEY", "")

m = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", DATABASE_URL)
if not m:
    print("ERROR: Cannot parse DATABASE_URL"); sys.exit(1)
db_user, db_pass, db_host, db_port, db_name = m.groups()


def fetch_movies(endpoint="popular", page=1):
    base_url = f"https://api.themoviedb.org/3/movie/{endpoint}"
    params = {"api_key": TMDB_API_KEY, "language": "en-US", "page": str(page)}
    query = urllib.parse.urlencode(params)
    url = f"{base_url}?{query}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode()).get("results", [])
        except Exception:
            time.sleep(2)
    return []

# Sarcastic / Hinglish / English Reviews mapped to labels
REVIEWS_DB = {
    "perfection": [
        "Absolute cinema. Martin Scorsese would be proud.",
        "Bhai, kya movie thi! Oscar de do inko abhi ke abhi.",
        "Mind blown. Did not expect this level of perfection.",
        "A true masterpiece. I'm going to make this my entire personality now.",
        "Maza aa gaya kasam se. Best movie of the decade hands down.",
        "They cooked. The director cooked. The actors cooked. We ate.",
        "Khatarnak direction. Speechless.",
        "I cried, I laughed, I questioned my existence. 10/10.",
        "If you haven't watched this, what are you even doing with your life?",
        "Perfection. Har scene ek painting hai.",
        "Goosebumps! That climax sequence is going in the history books.",
        "Cinematography is God-tier. Chef's kiss.",
        "Kya writing hai bhai. Not a single boring second.",
        "I'm forcing everyone in my family to watch this. No exceptions.",
        "It's not just a movie, it's an experience.",
        "This film pays my therapy bills.",
        "Bawaal cheez banayi hai. Repeated watch guaranteed.",
        "I am respectfully obsessed. Pure art.",
        "Give them all the awards. Right now.",
        "Speechless. Literal perfection on screen."
    ],
    "goforit": [
        "Solid movie. Good timepass but with an actual plot.",
        "Ek baar toh dekhna banta hai boss.",
        "Not bad, quite entertaining from start to finish.",
        "Paisa vasool. Total popcorn entertainment.",
        "Worth the ticket price. Take your friends.",
        "Good story, slightly slow in the middle, but great ending.",
        "Badiya movie hai. Weekend sorted.",
        "A fun ride. Don't overthink the physics though.",
        "Actually surprisingly good. Def go for it.",
        "Sahi hai yaar. Acchi acting ki hai sabne.",
        "Enjoyed it way more than I thought I would.",
        "Action scenes are lit. Plot is decent.",
        "Aaram se dekh sakte ho with family.",
        "Keeps you hooked. Good pacing.",
        "Mast timepass plus good acting. Yes from me."
    ],
    "timepass": [
        "Dimag ghar chhod ke jana. It's okay.",
        "Theek thak hai. Sunday afternoon Netflix watch.",
        "Just average. Hero ne entry achhi li bas, baaki story flat hai.",
        "Kuch naya nahi hai but bore bhi nahi karta.",
        "One time watch. Kal tak bhool jaunga ki maine ye dekhi thi.",
        "Mid. Very mid. Not bad, not great. Just... exists.",
        "Timepass. Watch it while scrolling Instagram.",
        "Cliché story but decent execution.",
        "Kaam chalau movie. Don't expect a masterpiece.",
        "Average AF. Trailer looked much better.",
        "It was... fine. I guess.",
        "Boring in parts, fun in parts. 50-50.",
        "Decent background noise while I fold my laundry.",
        "Thik hai. Neither hate it nor love it.",
        "Not my favorite but it killed 2 hours successfully."
    ],
    "skip": [
        "Mera time wapas karo. Aur paise bhi.",
        "Torture. Complete mental torture. Who funded this?",
        "Bhai, please mat jana. Worst mistake of my week.",
        "I want a refund. And a public apology from the director.",
        "Bakwas. Absolute trash. My eyes are bleeding.",
        "Main 10 min baad nikal gaya hall se. Unbearable.",
        "Script kahan hai? Did they forget to write a script?",
        "0 logic, 0 acting, 0 direction. Just 0.",
        "Save yourself. Do not watch this.",
        "Sardard. Paracetamol leni padegi iske baad.",
        "I survived this movie. Barely.",
        "A literal waste of electricity and camera equipment.",
        "They really thought they did something here. They didn't.",
        "Cringe level: 100. I couldn't even finish it.",
        "Worst movie of the year candidate."
    ]
}

def seed():
    conn = psycopg2.connect(
        host=db_host, port=int(db_port), dbname=db_name,
        user=db_user, password=db_pass, sslmode="require", connect_timeout=15
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # 1. Clear old reviews to avoid massive duplicates if run multiple times
    print("\n1. Deleting existing Moctale ratings/reviews to start fresh...")
    cur.execute("DELETE FROM moctale_ratings")
    conn.commit()

    # 2. Get all valid users
    cur.execute("SELECT id FROM users")
    users = [row['id'] for row in cur.fetchall()]
    if not users:
        print("No users found. Run the seed_real_collections.py script first.")
        sys.exit(1)

    # 3. Fetch movies from TMDB
    print("\n2. Fetching Popular, Top Rated and Now Playing movies from TMDB...")
    movies = []
    for page in range(1, 4):
        movies.extend(fetch_movies("popular", page))
        movies.extend(fetch_movies("top_rated", page))
        movies.extend(fetch_movies("now_playing", page))
    
    # Deduplicate movies
    unique_movies = {}
    for m in movies:
        if m.get("id"):
            unique_movies[m["id"]] = m
    movies = list(unique_movies.values())
    print(f"   Got {len(movies)} unique movies.")

    # 4. Generate ~300 Authentic Reviews based on rating
    print("\n3. Generating highly opinionated sarcastic reviews aligned with real IMDB/TMDB ratings...")
    created = 0
    used_pairs = set()

    for _ in range(400): # Try to create 400 reviews
        user_id = random.choice(users)
        movie = random.choice(movies)
        movie_id = movie["id"]
        
        pair = f"{user_id}_{movie_id}"
        if pair in used_pairs:
            continue
        used_pairs.add(pair)
        
        # Decide label based on actual rating
        rating = movie.get("vote_average", 0)
        vote_count = movie.get("vote_count", 0)
        
        if vote_count < 10:
            label = random.choice(["timepass", "skip"])
        elif rating >= 7.8:
            # High rating: mostly perfection, some goforit
            label = random.choices(["perfection", "goforit", "timepass"], weights=[70, 25, 5])[0]
        elif rating >= 6.5:
            # Good rating
            label = random.choices(["goforit", "perfection", "timepass"], weights=[70, 10, 20])[0]
        elif rating >= 5.0:
            # Average rating
            label = random.choices(["timepass", "goforit", "skip"], weights=[70, 15, 15])[0]
        else:
            # Low rating
            label = random.choices(["skip", "timepass"], weights=[80, 20])[0]
            
        review_text = random.choice(REVIEWS_DB[label])
        
        title = movie.get("title")
        poster = movie.get("poster_path")
        
        if not title or not poster: continue
        
        try:
            cur.execute("""
                INSERT INTO moctale_ratings (user_id, movie_id, media_type, title, poster_path, label, review_text, created_at, updated_at)
                VALUES (%s, %s, 'movie', %s, %s, %s, %s, NOW(), NOW())
            """, (user_id, movie_id, title, poster, label, review_text))
            created += 1
        except Exception as e:
            conn.rollback()
            continue
            
    conn.commit()
    print(f"\nDone! Successfully seeded {created} authentic sarcastic reviews aligned with real ratings.")
    print("Refresh your Moctale Feed / Reviews page to see them!\n")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    seed()
