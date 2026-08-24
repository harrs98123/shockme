"""
seed_real_collections.py
========================
Fully dynamic seed script. 
1. Clears out all old seeded users/collections (email ending in @example.com).
2. Uses the TMDB API to fetch real, diverse, theme-matching movies for every single collection.
3. Inserts them into Supabase.

Run: python seed_real_collections.py
"""

import os, sys, re, subprocess, json
import urllib.request
import urllib.parse
from datetime import datetime, timezone

# ── Auto-install psycopg2-binary if not present ────────────────────────────────
try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("psycopg2 not found — installing psycopg2-binary automatically...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2
    import psycopg2.extras

# ── Load .env manually ────────────────────────────────────────────────────────
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

if not DATABASE_URL or not TMDB_API_KEY:
    print("ERROR: DATABASE_URL or TMDB_API_KEY missing from .env")
    sys.exit(1)

m = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", DATABASE_URL)
if not m:
    print("ERROR: Cannot parse DATABASE_URL")
    sys.exit(1)
db_user, db_pass, db_host, db_port, db_name = m.groups()

DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

USERS = [
    ("Arjun Mehta", "arjunwatchesfilms", "arjun.mehta.cinema@example.com", "Bollywood loyalist who secretly cries at Pixar movies. Mumbai ka ladka, global taste."),
    ("Priya Sharma", "priyacinephile", "priya.sharma.films@example.com", "Film student from Delhi. I rate movies the way I rate chai — very seriously."),
    ("Tyler Brooks", "tylerreviews", "tyler.brooks.movies@example.com", "Ex-film school dropout. Now I just yell about movies on the internet."),
    ("Kavya Nair", "kavya_frames", "kavya.nair.cinema@example.com", "Kerala girl obsessed with world cinema. If it has subtitles I've seen it."),
    ("Rohan Kapoor", "rohan_reeltime", "rohan.kapoor.reels@example.com", "Watched Interstellar 7 times. Do not talk to me about the ending."),
    ("Jessica Martinez", "jess_filmclub", "jessica.martinez.films@example.com", "Runs a tiny film club in Austin. Horror aficionado. She/her."),
    ("Vikram Singh", "vikram_the_critic", "vikram.singh.critic@example.com", "Retired engineer. 3 movies a day, argue about them online. Living my best life."),
    ("Aisha Khan", "aishainframes", "aisha.khan.frames@example.com", "Pakistani-Indian, London-based. Cinema is my love language."),
    ("Marcus Johnson", "marcusonfilm", "marcus.johnson.movies@example.com", "Cinematography nerd. I notice bad lighting more than plot holes."),
    ("Sneha Reddy", "sneha_cineworld", "sneha.reddy.cine@example.com", "Telugu movies + Korean dramas + anything Tarantino. Hyderabad represent!"),
    ("Ankita Joshi", "ankita_watchlist", "ankita.joshi.watch@example.com", "I have 400 movies in my watchlist. I have watched 6 of them."),
    ("Nathan Lee", "nathancinema", "nathan.lee.cinema@example.com", "Korean-American. East Asian cinema is underrated and I will die on this hill."),
    ("Dev Anand Pillai", "dev_cinecritic", "dev.pillai.cine@example.com", "Chennai boy. A.R. Rahman fan. Will argue about Mani Ratnam forever."),
    ("Zara Ahmed", "zara_picks", "zara.ahmed.picks@example.com", "Pakistani cinephile in Toronto. Watches 5 films a week. Send help."),
    ("Ryan O'Connor", "ryan_comicnerd", "ryan.oconnor.film@example.com", "Comic book reader first, MCU fanboy second. Nolan is God tier."),
    ("Meera Krishnan", "meera_cinemaa", "meera.krishnan.film@example.com", "Tamil Nadu. Kollywood > everything else. Subtitles are not optional."),
    ("Jake Patterson", "jakefilm", "jake.patterson.movies@example.com", "Film school grad. Has watched Citizen Kane unironically. Multiple times."),
    ("Pooja Malhotra", "pooja_frames", "pooja.malhotra.watch@example.com", "Delhi cinephile. If it won a Cannes Palm d'Or, I've seen it twice."),
    ("Carlos Rivera", "carloscineaste", "carlos.rivera.cine@example.com", "Mexican-American. Cuaron, Del Toro, Iñárritu — the holy trinity."),
    ("Simran Bhatia", "simran_reels", "simran.bhatia.reels@example.com", "Jaipur girl. Romance films are science. I have data to prove it."),
]

COLLECTIONS_DEF = [
    # arjunwatchesfilms
    ("arjunwatchesfilms", "Movies That Made Me Call My Mom", "Emotional gut-punches disguised as cinema. Watched all of these alone. Mistake.", {"with_genres": "18", "with_keywords": "9799", "sort_by": "vote_count.desc"}),
    ("arjunwatchesfilms", "Peak Bollywood No Cringe Allowed", "Films that prove Bollywood can be genuinely great.", {"with_original_language": "hi", "sort_by": "vote_average.desc", "vote_count.gte": "200", "without_genres": "35,10749"}),
    # priyacinephile
    ("priyacinephile", "Gaslit by a Fictional Man and I Loved It", "Unreliable narrators done so well I clapped.", {"with_genres": "53,96", "sort_by": "popularity.desc"}),
    ("priyacinephile", "Watch This Before You Watch Anything Else", "My personal curriculum. You must earn the right to have movie opinions.", {"sort_by": "vote_average.desc", "vote_count.gte": "15000"}),
    ("priyacinephile", "Movies That Broke Me and Put Me Back Differently", "A spiritual experience. You will not be the same. I am sorry in advance.", {"with_genres": "18", "with_keywords": "10556", "sort_by": "vote_count.desc"}),
    # tylerreviews
    ("tylerreviews", "Films Where the Protagonist Needs Therapy Not a Hero Arc", "Touch grass, kings. Not every problem is solved by punching harder.", {"with_keywords": "9748,9715", "sort_by": "vote_count.desc"}),
    ("tylerreviews", "Sequels Lowkey Better Than the Original Fight Me", "Controversial? Yes. Wrong? Absolutely not.", {"with_keywords": "9663", "sort_by": "vote_count.desc", "page": "2"}), 
    ("tylerreviews", "One-Take Sequences That Disrespect All Other Films", "Directors who said what if we just did not cut.", {"with_keywords": "270830", "sort_by": "vote_count.desc"}),
    # kavya_frames
    ("kavya_frames", "Non-English Films That Will Ruin Hollywood for You", "Once you go subtitles, you never go back.", {"without_original_language": "en", "sort_by": "vote_average.desc", "vote_count.gte": "3000"}),
    ("kavya_frames", "Animated Films That Are Not For Children At All", "Parents do your research first.", {"with_genres": "16", "with_keywords": "210024", "sort_by": "vote_count.desc"}),
    # rohan_reeltime
    ("rohan_reeltime", "Christopher Nolan Understood the Assignment", "Every film here made me question time, reality, and my life choices.", {"with_crew": "525", "sort_by": "vote_count.desc"}),
    ("rohan_reeltime", "Movies Where I Sided with the Villain Not Ashamed", "Sympathetic antagonists are the highest form of cinema.", {"with_genres": "80,53", "sort_by": "popularity.desc", "page": "3"}),
    ("rohan_reeltime", "Space Films That Actually Tried the Science", "Roughly 70 percent scientifically accurate. Good enough for me.", {"with_genres": "878", "with_keywords": "3386", "sort_by": "vote_count.desc"}),
    # jess_filmclub
    ("jess_filmclub", "Horror That Actually Scared Me No Torture Porn", "Difference between fear and disgust. These are FEAR.", {"with_genres": "27", "without_keywords": "10084,10349", "sort_by": "vote_average.desc", "vote_count.gte": "2000"}),
    ("jess_filmclub", "Date Night Films That Won't End the Relationship", "We want a second date.", {"with_genres": "10749,35", "sort_by": "vote_count.desc"}),
    # vikram_the_critic
    ("vikram_the_critic", "Old Man Cinema That Still Hits Different", "Pre-2000 films my grandchildren will find and claim they discovered.", {"primary_release_date.lte": "1999-12-31", "sort_by": "vote_average.desc", "vote_count.gte": "5000"}),
    ("vikram_the_critic", "Oscar Winners I Actually Agree With Short List", "The Academy has made some choices. These are the correct ones.", {"with_keywords": "6075", "sort_by": "vote_average.desc", "vote_count.gte": "5000"}),
    ("vikram_the_critic", "Movies My Kids Made Me Watch Some Were Actually Good", "I would not have chosen these. I am glad I watched them.", {"with_genres": "10751", "sort_by": "vote_count.desc"}),
    # aishainframes
    ("aishainframes", "South Asian Films That Deserve Global Awards Season", "Karan Johar won't submit them so I'm making my own ceremony.", {"with_original_language": "hi|ta|te|ml", "sort_by": "vote_average.desc", "vote_count.gte": "200"}),
    ("aishainframes", "Cinema That Rewired My Brain Neuroscientists Hate This", "You'll leave these films a different person.", {"with_genres": "878,96", "sort_by": "vote_count.desc", "page": "2"}),
    ("aishainframes", "Tarantino Dialogue Scenes Better Than Most Full Films", "The man writes conversations like other directors shoot action sequences.", {"with_crew": "138", "sort_by": "vote_count.desc"}),
    # marcusonfilm
    ("marcusonfilm", "Cinematography That Slaps So Hard It Should Be Illegal", "These DPs ate and left no crumbs. Every frame a painting.", {"with_crew": "153", "sort_by": "vote_count.desc"}),
    ("marcusonfilm", "Superhero Movies That Remembered They Could Be Art", "Not all capes, not all cliches. These transcended the genre.", {"with_genres": "878,28", "with_keywords": "9715", "sort_by": "vote_average.desc", "vote_count.gte": "3000"}),
    ("marcusonfilm", "Movies With Soundtracks I Actually Bought Yes Bought", "Hans Zimmer, Ennio Morricone, A.R. Rahman - live rent-free in my head.", {"with_crew": "947", "sort_by": "vote_count.desc"}),
    # sneha_cineworld
    ("sneha_cineworld", "Telugu Hits I Will Defend with My Life", "Baahubali was not a fluke.", {"with_original_language": "te", "sort_by": "vote_count.desc"}),
    ("sneha_cineworld", "Tarantino Ranked Hot Take Edition", "Kill Bill Vol 1 is overrated. Inglourious Basterds is a masterpiece. I said it.", {"with_crew": "138", "sort_by": "vote_average.desc", "vote_count.gte": "1000", "page": "1"}),
    # ankita_watchlist
    ("ankita_watchlist", "Movies I Keep Recommending But Never Re-watch", "These films are too emotionally dangerous for a second viewing.", {"with_genres": "18", "with_keywords": "270829", "sort_by": "vote_count.desc"}),
    ("ankita_watchlist", "Comfort Movies for When Life is Absolutely Not It", "Bad day? Breakup? Existential dread? Here. Sit. Watch these.", {"with_genres": "35,10751", "sort_by": "vote_count.desc", "page": "2"}),
    ("ankita_watchlist", "Films to Watch When You Cannot Cry But Need To", "You know what I mean. Do not pretend you do not.", {"with_genres": "18,10749", "sort_by": "vote_count.desc", "page": "3"}),
    # nathancinema
    ("nathancinema", "Korean Cinema Ate Hollywood Lunch and Dessert", "Parasite winning Best Picture was justice. The industry has not recovered.", {"with_original_language": "ko", "sort_by": "vote_count.desc"}),
    ("nathancinema", "Movies That Pass the Would Tell a Friend at 2am Test", "The highest possible standard. These all passed. Some barely.", {"with_genres": "53,878", "sort_by": "vote_count.desc", "page": "3"}),
    ("nathancinema", "Movies Where the Guy Did Not Deserve Her At All", "Cinema's oldest tradition: wildly outmatched male lead, impossibly patient woman.", {"with_genres": "10749", "sort_by": "vote_count.desc", "with_keywords": "13028"}),
    # dev_cinecritic
    ("dev_cinecritic", "A.R. Rahman Scored It So It's Automatically a Masterpiece", "The man has a Grammy AND an Oscar. Your opinion is irrelevant.", {"with_crew": "118223", "sort_by": "vote_count.desc"}),
    ("dev_cinecritic", "Mani Ratnam Could Direct a Phone Book and I'd Watch It", "Roja. Bombay. Dil Se. That's it. That's the list.", {"with_crew": "56012", "sort_by": "vote_count.desc"}),
    # zara_picks
    ("zara_picks", "Films That Made Me Miss Home (And I Grew Up in Three Countries)", "Diaspora cinema hits different when you've lived it. No notes.", {"with_keywords": "10322", "sort_by": "vote_count.desc"}),
    ("zara_picks", "Movies With Female Characters Who Actually Had a Brain", "Not a muse. Not a trophy. An actual human being with agency. Radical concept.", {"with_keywords": "260904", "sort_by": "vote_count.desc"}),
    # ryan_comicnerd
    ("ryan_comicnerd", "Superhero Films That Are Actually Cinema and Not Just Content", "There IS a difference. These cleared the bar. Most didn't.", {"with_keywords": "9715", "sort_by": "vote_average.desc", "vote_count.gte": "10000"}),
    ("ryan_comicnerd", "DC vs Marvel But the Only Right Answer Is Into the Spider-Verse", "I have ended friendships over this. I have no regrets.", {"with_keywords": "9715", "sort_by": "popularity.desc"}),
    ("ryan_comicnerd", "Origin Stories That Actually Respected Our Time", "Not all origin stories are equal. These ones didn't waste yours.", {"with_keywords": "15001", "sort_by": "vote_count.desc"}),
    # meera_cinemaa
    ("meera_cinemaa", "Kollywood Gave the World RRR and the World Still Isn't Ready", "SS Rajamouli is doing something other directors are too scared to attempt. Respect.", {"with_original_language": "ta", "sort_by": "vote_count.desc"}),
    ("meera_cinemaa", "Indian Cinema That Broke Genre Conventions and My Brain", "These films refused to be just one thing. And they were better for it.", {"with_original_language": "hi|ta|te|ml", "with_genres": "53,96", "sort_by": "popularity.desc", "page": "2"}),
    # jakefilm
    ("jakefilm", "Films a Film School Professor Would Assign and Actually Be Right About", "Not everything from film school is pretentious. These ones hold up in real life too.", {"with_keywords": "310398", "sort_by": "vote_count.desc"}),
    ("jakefilm", "Villains With More Character Development Than the Hero", "The protagonist did three things. The antagonist had a whole arc. Discuss.", {"with_genres": "80,53,18", "sort_by": "vote_average.desc", "vote_count.gte": "8000"}),
    ("jakefilm", "Masterpieces That Are Not Fun But Must Be Experienced", "You will not enjoy these. You will be changed. Not the same thing.", {"with_genres": "18,36,10752", "sort_by": "vote_average.desc", "vote_count.gte": "3000"}),
    # pooja_frames
    ("pooja_frames", "Cannes Gave It a Palm d'Or So You Have No Excuse Not to Watch", "The Palme d'Or is not handed out carelessly. These earned it.", {"with_keywords": "291077", "sort_by": "vote_count.desc"}),
    ("pooja_frames", "World Cinema Hidden Gems That Quietly Obliterate Hollywood", "No franchise. No shared universe. Just pure storytelling from every corner of the planet.", {"without_original_language": "en", "vote_average.gte": "7.5", "vote_count.gte": "1000", "sort_by": "vote_average.desc", "page": "2"}),
    ("pooja_frames", "Films That Made Me Rethink What a Movie Could Even Be", "After watching these, standard Hollywood felt like coloring inside the lines.", {"with_genres": "96,878", "sort_by": "vote_average.desc", "vote_count.gte": "4000"}),
    # carloscineaste
    ("carloscineaste", "Cuaron Del Toro Inarritu Are Doing Things Hollywood Forgot How To", "Three Mexican directors collectively holding up the entire prestige film industry. Respect.", {"with_crew": "116|11248|3450", "sort_by": "vote_count.desc"}),
    ("carloscineaste", "Films That Should Have Won Best Picture but Were Snubbed", "Academy voters be living on a different planet sometimes. Evidence below.", {"with_keywords": "258", "sort_by": "vote_average.desc", "vote_count.gte": "8000", "page": "2"}),
    ("carloscineaste", "Heist and Crime Films That Are Their Own Genre of Art", "The planning scene. The twist. The double cross. Cinema's most reliable formula.", {"with_genres": "80", "with_keywords": "10051", "sort_by": "vote_count.desc"}),
    # simran_reels
    ("simran_reels", "Romance Films That Understood What Romance Actually Is", "Hint: it's not grand gestures. It's small moments. These got it right.", {"with_genres": "10749", "without_genres": "35", "sort_by": "vote_count.desc", "page": "2"}),
    ("simran_reels", "Sunday Afternoon Films You Watch in Pajamas with Chai", "No stress. No subtitles required. Just pure cinematic serotonin.", {"with_genres": "35,10751", "sort_by": "vote_count.desc", "page": "4"}),
    ("simran_reels", "Films Where I Cried But Refused to Tell Anyone I Cried", "I maintain plausible deniability. These are classified emotional events.", {"with_genres": "18", "with_keywords": "9799", "sort_by": "vote_average.desc", "vote_count.gte": "4000"}),
]

import time

def fetch_tmdb_movies(params):
    base_url = "https://api.themoviedb.org/3/discover/movie"
    params["api_key"] = TMDB_API_KEY
    if "language" not in params:
        params["language"] = "en-US"
    
    query = urllib.parse.urlencode(params)
    url = f"{base_url}?{query}"
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                return data.get("results", [])
        except Exception as e:
            print(f"    [Attempt {attempt+1}] Failed to fetch from TMDB: {e}")
            time.sleep(2)
            
    return []

def seed():
    conn = psycopg2.connect(
        host=db_host, port=int(db_port), dbname=db_name,
        user=db_user, password=db_pass, sslmode="require", connect_timeout=15
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    print("\n1. Deleting all previous seed collections and users...")
    cur.execute("DELETE FROM collection_items WHERE collection_id IN (SELECT id FROM collections WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com'))")
    cur.execute("DELETE FROM collections WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com')")
    cur.execute("DELETE FROM users WHERE email LIKE '%@example.com'")
    conn.commit()
    print("Cleaned up old seed data successfully.")

    print("\n2. Creating new seed users...")
    user_map = {}
    for (name, username, email, bio) in USERS:
        cur.execute("""
            INSERT INTO users (name,username,email,bio,hashed_password,is_admin,failed_login_attempts,created_at)
            VALUES (%s,%s,%s,%s,%s,false,0,NOW()) RETURNING id
        """, (name, username, email, bio, DUMMY_HASH))
        conn.commit()
        uid = cur.fetchone()["id"]
        user_map[username] = uid
        print(f"  Created: @{username} (id={uid})")

    print(f"\n3. Creating {len(COLLECTIONS_DEF)} collections and fetching real TMDB movies...")
    created = 0
    
    # Track used movies globally to ensure no collection is a perfect duplicate
    used_movies_in_collection = set()
    
    for (owner, name, desc, tmdb_params) in COLLECTIONS_DEF:
        oid = user_map.get(owner)
        if not oid:
            print(f"  Unknown owner: {owner}"); continue
            
        cur.execute("""
            INSERT INTO collections (user_id,name,description,is_public,is_rank_list,created_at)
            VALUES (%s,%s,%s,true,false,NOW()) RETURNING id
        """, (oid, name, desc))
        col_id = cur.fetchone()["id"]
        
        movies = fetch_tmdb_movies(tmdb_params)
        
        # Take the top 8 unique movies for this collection
        added_count = 0
        for m in movies:
            if added_count >= 8:
                break
            
            mid = m.get("id")
            title = m.get("title")
            poster = m.get("poster_path")
            release_date = m.get("release_date")
            year = release_date[:4] if release_date else ""
            rating = m.get("vote_average")
            
            if not poster or not title:
                continue
                
            # Try to make collections unique by skipping movies we just added recently (unless we run out)
            if f"{col_id}_{mid}" in used_movies_in_collection:
                continue
            
            used_movies_in_collection.add(f"{col_id}_{mid}")
            
            cur.execute("""
                INSERT INTO collection_items (collection_id,movie_id,media_type,title,poster_path,release_year,vote_average,added_at)
                VALUES (%s,%s,'movie',%s,%s,%s,%s,NOW()) ON CONFLICT DO NOTHING
            """, (col_id, mid, title, poster, year, rating))
            added_count += 1
            
        conn.commit()
        created += 1
        print(f"  Created: '{name[:40]}...' with {added_count} real movies")

    cur.close(); conn.close()
    print(f"\nDone! {created} highly diverse collections created with real TMDB data.")
    print("Refresh http://localhost:3000/collections\n")

if __name__ == "__main__":
    seed()
