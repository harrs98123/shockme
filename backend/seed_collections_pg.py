"""
seed_collections_pg.py
========================
Seeds collections into the Supabase PostgreSQL database.
Auto-installs psycopg2-binary if missing.

Run from backend dir:
    python seed_collections_pg.py
"""

import os
import sys
import re
import subprocess
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
    print("psycopg2-binary installed successfully!\n")

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
if not DATABASE_URL or not DATABASE_URL.startswith("postgresql"):
    print("ERROR: No valid PostgreSQL DATABASE_URL found in .env")
    sys.exit(1)

# Parse connection string: postgresql://user:pass@host:port/dbname
pattern = r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)"
m = re.match(pattern, DATABASE_URL)
if not m:
    print(f"ERROR: Cannot parse DATABASE_URL: {DATABASE_URL}")
    sys.exit(1)

db_user, db_pass, db_host, db_port, db_name = m.groups()
print(f"Connecting to: {db_host}:{db_port}/{db_name} as {db_user}")

# ── Dummy bcrypt hash for seed users (password: SeedUser@123) ─────────────────
# Pre-computed valid bcrypt hash — backend can verify it with passlib
DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

TS = datetime.now(timezone.utc).isoformat()

FAKE_USERS = [
    ("Arjun Mehta",     "arjunwatchesfilms", "arjun.mehta.cinema@example.com",     "Bollywood loyalist who secretly cries at Pixar movies. Mumbai ka ladka, global taste."),
    ("Priya Sharma",    "priyacinephile",    "priya.sharma.films@example.com",     "Film student from Delhi. I rate movies the way I rate chai — very seriously."),
    ("Tyler Brooks",    "tylerreviews",      "tyler.brooks.movies@example.com",    "Ex-film school dropout. Now I just yell about movies on the internet."),
    ("Kavya Nair",      "kavya_frames",      "kavya.nair.cinema@example.com",      "Kerala girl obsessed with world cinema. If it has subtitles I've seen it."),
    ("Rohan Kapoor",    "rohan_reeltime",    "rohan.kapoor.reels@example.com",     "Watched Interstellar 7 times. Do not talk to me about the ending."),
    ("Jessica Martinez","jess_filmclub",     "jessica.martinez.films@example.com", "Runs a tiny film club in Austin. Horror aficionado. She/her."),
    ("Vikram Singh",    "vikram_the_critic", "vikram.singh.critic@example.com",    "Retired engineer. 3 movies a day, argue about them online. Living my best life."),
    ("Aisha Khan",      "aishainframes",     "aisha.khan.frames@example.com",      "Pakistani-Indian, London-based. Cinema is my love language."),
    ("Marcus Johnson",  "marcusonfilm",      "marcus.johnson.movies@example.com",  "Cinematography nerd. I notice bad lighting more than plot holes."),
    ("Sneha Reddy",     "sneha_cineworld",   "sneha.reddy.cine@example.com",       "Telugu movies + Korean dramas + anything Tarantino. Hyderabad represent!"),
    ("Ankita Joshi",    "ankita_watchlist",  "ankita.joshi.watch@example.com",     "I have 400 movies in my watchlist. I have watched 6 of them."),
    ("Nathan Lee",      "nathancinema",      "nathan.lee.cinema@example.com",      "Korean-American. East Asian cinema is underrated and I will die on this hill."),
]

COLLECTIONS = [
    # Arjun Mehta
    ("arjunwatchesfilms", "Movies That Made Me Call My Mom",
     "Emotional gut-punches disguised as cinema. Watched all of these alone. Mistake.",
     [(19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0),
      (862,"Toy Story","/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg","1995",7.9),
      (10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3)]),
    ("arjunwatchesfilms", "Peak Bollywood No Cringe Allowed",
     "Films that prove Bollywood can be genuinely great. Do NOT include Golmaal 4.",
     [(19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0),
      (453405,"Article 15","/oGFBphoKySSEXSZhQPMGzKBxiEp.jpg","2019",8.1),
      (571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0)]),

    # Priya Sharma
    ("priyacinephile", "Gaslit by a Fictional Man and I Loved It",
     "Unreliable narrators done so well I clapped.",
     [(745,"Se7en","/6yoghtyTpznpBik8EngEmJskVnS.jpg","1995",8.3),
      (238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (597,"Titanic","/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg","1997",7.9),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4)]),
    ("priyacinephile", "Watch This Before You Watch Anything Else",
     "My personal curriculum. You must earn the right to have movie opinions.",
     [(238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (240,"The Godfather Part II","/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg","1974",9.0),
      (424,"Schindler's List","/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg","1993",9.0),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (389,"12 Angry Men","/ppd84D2i9W8jXmsyInGyihiSyqz.jpg","1957",9.0)]),
    ("priyacinephile", "Movies That Broke Me and Put Me Back Differently",
     "A spiritual experience. You will not be the same. I am sorry in advance.",
     [(424,"Schindler's List","/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg","1993",9.0),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1),
      (10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7)]),

    # Tyler Brooks
    ("tylerreviews", "Films Where the Protagonist Needs Therapy Not a Hero Arc",
     "Touch grass, kings. Not every problem is solved by punching harder.",
     [(550,"Fight Club","/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg","1999",8.4),
      (77,"Memento","/gyNBz4NT69AiTnUJXYAUdv0fkNt.jpg","2000",8.2),
      (745,"Se7en","/6yoghtyTpznpBik8EngEmJskVnS.jpg","1995",8.3),
      (49521,"Black Swan","/wedMQQCMpRpnJFfMfqiuS3cAmba.jpg","2010",7.7),
      (475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2)]),
    ("tylerreviews", "Sequels Lowkey Better Than the Original Fight Me",
     "Controversial? Yes. Wrong? Absolutely not.",
     [(240,"The Godfather Part II","/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg","1974",9.0),
      (1396,"Terminator 2 Judgment Day","/5M0j0B18abtBI5bamgM7cx0hhuB.jpg","1991",8.1),
      (315635,"Spider-Man Homecoming","/c24sv2weTHPsmDa7jEMN0kjAMQF.jpg","2017",7.4)]),
    ("tylerreviews", "One-Take Sequences That Disrespect All Other Films",
     "Directors who said what if we just did not cut. Outstanding every time.",
     [(762509,"Oppenheimer","/8Gxv8giaFIqTJWmRUAECiTnQfcX.jpg","2023",8.2),
      (512200,"Dunkirk","/ebSnODDg9lbsMIaWg2uAbjn7TO5.jpg","2017",7.8),
      (155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (16869,"Inglourious Basterds","/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg","2009",8.3),
      (335984,"Blade Runner 2049","/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg","2017",7.8)]),

    # Kavya Nair
    ("kavya_frames", "Non-English Films That Will Ruin Hollywood for You",
     "Once you go subtitles, you never go back. Sorry not sorry.",
     [(129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0)]),
    ("kavya_frames", "Animated Films That Are Not For Children At All",
     "Parents do your research first. These will cause questions.",
     [(129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1)]),

    # Rohan Kapoor
    ("rohan_reeltime", "Christopher Nolan Understood the Assignment",
     "Every film here made me question time, reality, and my life choices.",
     [(157336,"Interstellar","/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","2014",8.4),
      (155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (77,"Memento","/gyNBz4NT69AiTnUJXYAUdv0fkNt.jpg","2000",8.2),
      (27205,"Inception","/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg","2010",8.4),
      (512200,"Dunkirk","/ebSnODDg9lbsMIaWg2uAbjn7TO5.jpg","2017",7.8),
      (762509,"Oppenheimer","/8Gxv8giaFIqTJWmRUAECiTnQfcX.jpg","2023",8.2)]),
    ("rohan_reeltime", "Movies Where I Sided with the Villain Not Ashamed",
     "Sympathetic antagonists are the highest form of cinema. Change my mind.",
     [(475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2),
      (155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (16869,"Inglourious Basterds","/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg","2009",8.3),
      (550,"Fight Club","/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg","1999",8.4)]),
    ("rohan_reeltime", "Space Films That Actually Tried the Science",
     "Roughly 70 percent scientifically accurate. Good enough for me.",
     [(157336,"Interstellar","/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","2014",8.4),
      (9543,"The Martian","/5BHuvQ6p9kfc091Z8RiFNhCwL4b.jpg","2015",7.7),
      (348,"Alien","/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg","1979",8.1),
      (333339,"Ready Player One","/pU1UecbQJVRDQDgDk4jNf41Y8jP.jpg","2018",7.4)]),

    # Jessica Martinez
    ("jess_filmclub", "Horror That Actually Scared Me No Torture Porn",
     "Difference between fear and disgust. These are FEAR. No Saw franchise.",
     [(539,"Psycho","/81d8oyEFgj7FlxJqSDXWr8JH8kV.jpg","1960",8.5),
      (694,"The Shining","/xazWoLealQwEgqZ89MLZklLZD3k.jpg","1980",8.4),
      (346648,"Hereditary","/l32aGIuBGHnoJZFplDmDoNFQFjE.jpg","2018",7.3),
      (345887,"The Witch","/aGnGMGN5PfSdXEZn8MauRe6bLY2.jpg","2015",6.7)]),
    ("jess_filmclub", "Date Night Films That Won't End the Relationship",
     "No Lars von Trier. No Requiem for a Dream. We want a second date.",
     [(597,"Titanic","/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg","1997",7.9),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1)]),

    # Vikram Singh
    ("vikram_the_critic", "Old Man Cinema That Still Hits Different",
     "Pre-2000 films my grandchildren will find and claim they discovered.",
     [(238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (240,"The Godfather Part II","/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg","1974",9.0),
      (278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (389,"12 Angry Men","/ppd84D2i9W8jXmsyInGyihiSyqz.jpg","1957",9.0),
      (539,"Psycho","/81d8oyEFgj7FlxJqSDXWr8JH8kV.jpg","1960",8.5),
      (694,"The Shining","/xazWoLealQwEgqZ89MLZklLZD3k.jpg","1980",8.4),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5)]),
    ("vikram_the_critic", "Oscar Winners I Actually Agree With Short List",
     "The Academy has made some choices. These are the correct ones.",
     [(278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (424,"Schindler's List","/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg","1993",9.0),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (762509,"Oppenheimer","/8Gxv8giaFIqTJWmRUAECiTnQfcX.jpg","2023",8.2),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5)]),
    ("vikram_the_critic", "Movies My Kids Made Me Watch Some Were Actually Good",
     "I would not have chosen these. I am glad I watched them.",
     [(862,"Toy Story","/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg","1995",7.9),
      (10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1)]),

    # Aisha Khan
    ("aishainframes", "South Asian Films That Deserve Global Awards Season",
     "Karan Johar won't submit them so I'm making my own ceremony.",
     [(453405,"Article 15","/oGFBphoKySSEXSZhQPMGzKBxiEp.jpg","2019",8.1),
      (571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0)]),
    ("aishainframes", "Cinema That Rewired My Brain Neuroscientists Hate This",
     "You'll leave these films a different person. Cannot promise better or worse.",
     [(27205,"Inception","/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg","2010",8.4),
      (77,"Memento","/gyNBz4NT69AiTnUJXYAUdv0fkNt.jpg","2000",8.2),
      (550,"Fight Club","/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg","1999",8.4),
      (49521,"Black Swan","/wedMQQCMpRpnJFfMfqiuS3cAmba.jpg","2010",7.7),
      (475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2)]),
    ("aishainframes", "Tarantino Dialogue Scenes Better Than Most Full Films",
     "The man writes conversations like other directors shoot action sequences.",
     [(680,"Pulp Fiction","/dM2w364MScsjFf8pfMbaWUcWrR.jpg","1994",8.5),
      (16869,"Inglourious Basterds","/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg","2009",8.3),
      (11324,"Django Unchained","/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg","2012",8.3),
      (393,"Kill Bill Vol 1","/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg","2003",8.2)]),

    # Marcus Johnson
    ("marcusonfilm", "Cinematography That Slaps So Hard It Should Be Illegal",
     "These DPs ate and left no crumbs. Every frame a painting.",
     [(157336,"Interstellar","/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","2014",8.4),
      (335984,"Blade Runner 2049","/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg","2017",7.8),
      (762509,"Oppenheimer","/8Gxv8giaFIqTJWmRUAECiTnQfcX.jpg","2023",8.2),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (27205,"Inception","/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg","2010",8.4)]),
    ("marcusonfilm", "Superhero Movies That Remembered They Could Be Art",
     "Not all capes, not all cliches. These transcended the genre.",
     [(155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7),
      (475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2)]),
    ("marcusonfilm", "Movies With Soundtracks I Actually Bought Yes Bought",
     "Hans Zimmer, Ennio Morricone, A.R. Rahman - live rent-free in my head.",
     [(157336,"Interstellar","/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","2014",8.4),
      (597,"Titanic","/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg","1997",7.9),
      (238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4)]),

    # Sneha Reddy
    ("sneha_cineworld", "Telugu Hits I Will Defend with My Life",
     "Baahubali was not a fluke. We just don't talk about the ending of part 2.",
     [(453405,"Article 15","/oGFBphoKySSEXSZhQPMGzKBxiEp.jpg","2019",8.1),
      (571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0)]),
    ("sneha_cineworld", "Tarantino Ranked Hot Take Edition",
     "Kill Bill Vol 1 is overrated. Inglourious Basterds is a masterpiece. I said it.",
     [(680,"Pulp Fiction","/dM2w364MScsjFf8pfMbaWUcWrR.jpg","1994",8.5),
      (393,"Kill Bill Vol 1","/v7TaX8kXMXs5yFFGR41guUDNcnB.jpg","2003",8.2),
      (1152,"Kill Bill Vol 2","/6HhS8sFrEPVeblLWRUYmRovLuft.jpg","2004",7.9),
      (16869,"Inglourious Basterds","/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg","2009",8.3),
      (11324,"Django Unchained","/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg","2012",8.3)]),

    # Ankita Joshi
    ("ankita_watchlist", "Movies I Keep Recommending But Never Re-watch",
     "These films are too emotionally dangerous for a second viewing.",
     [(278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (424,"Schindler's List","/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg","1993",9.0),
      (10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0)]),
    ("ankita_watchlist", "Comfort Movies for When Life is Absolutely Not It",
     "Bad day? Breakup? Existential dread? Here. Sit. Watch these.",
     [(862,"Toy Story","/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg","1995",7.9),
      (10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3)]),
    ("ankita_watchlist", "Films to Watch When You Cannot Cry But Need To",
     "You know what I mean. Do not pretend you do not.",
     [(10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5)]),

    # Nathan Lee
    ("nathancinema", "Korean Cinema Ate Hollywood Lunch and Dessert",
     "Parasite winning Best Picture was justice. The industry has not recovered.",
     [(496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7),
      (389,"12 Angry Men","/ppd84D2i9W8jXmsyInGyihiSyqz.jpg","1957",9.0)]),
    ("nathancinema", "Movies That Pass the Would Tell a Friend at 2am Test",
     "The highest possible standard. These all passed. Some barely.",
     [(550,"Fight Club","/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg","1999",8.4),
      (27205,"Inception","/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg","2010",8.4),
      (157336,"Interstellar","/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","2014",8.4),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0)]),
    ("nathancinema", "Movies Where the Guy Did Not Deserve Her At All",
     "Cinema's oldest tradition: wildly outmatched male lead, impossibly patient woman.",
     [(597,"Titanic","/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg","1997",7.9),
      (19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3)]),
]


def seed():
    conn = psycopg2.connect(
        host=db_host, port=int(db_port), dbname=db_name,
        user=db_user, password=db_pass,
        sslmode="require", connect_timeout=15
    )
    conn.autocommit = False
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    print("\nCreating seed users...")
    user_map = {}

    for (name, username, email, bio) in FAKE_USERS:
        cur.execute("SELECT id FROM users WHERE username=%s", (username,))
        row = cur.fetchone()
        if row:
            user_map[username] = row["id"]
            print(f"  Skipped (exists): @{username}")
            continue
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        row = cur.fetchone()
        if row:
            user_map[username] = row["id"]
            print(f"  Skipped (email exists): @{username}")
            continue

        cur.execute("""
            INSERT INTO users (name, username, email, bio, hashed_password, is_admin, failed_login_attempts, created_at)
            VALUES (%s,%s,%s,%s,%s,false,0,NOW())
            RETURNING id
        """, (name, username, email, bio, DUMMY_HASH))
        uid = cur.fetchone()["id"]
        conn.commit()
        user_map[username] = uid
        print(f"  Created: @{username} (id={uid})")

    print(f"\nCreating {len(COLLECTIONS)} collections...")
    created = 0
    skipped = 0

    for (owner, col_name, col_desc, movies) in COLLECTIONS:
        owner_id = user_map.get(owner)
        if not owner_id:
            print(f"  Unknown owner: {owner}")
            continue

        cur.execute("SELECT id FROM collections WHERE user_id=%s AND name=%s", (owner_id, col_name))
        if cur.fetchone():
            skipped += 1
            continue

        cur.execute("""
            INSERT INTO collections (user_id, name, description, is_public, is_rank_list, created_at)
            VALUES (%s,%s,%s,true,false,NOW())
            RETURNING id
        """, (owner_id, col_name, col_desc))
        col_id = cur.fetchone()["id"]

        for (movie_id, title, poster, year, rating) in movies:
            cur.execute("""
                INSERT INTO collection_items (collection_id, movie_id, media_type, title, poster_path, release_year, vote_average, added_at)
                VALUES (%s,%s,'movie',%s,%s,%s,%s,NOW())
                ON CONFLICT DO NOTHING
            """, (col_id, movie_id, title, poster, year, rating))

        conn.commit()
        created += 1
        print(f"  Created: '{col_name[:58]}' by @{owner}")

    cur.close()
    conn.close()
    print(f"\nDone! Created {created} collections, skipped {skipped} existing.")
    print("Visit http://localhost:3000/collections to see them!\n")


if __name__ == "__main__":
    seed()
