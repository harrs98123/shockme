"""
seed_more_collections.py
=========================
Adds more diverse users & collections: superhero, masterpiece, international, dark comedy etc.
Run:  python seed_more_collections.py
"""

import os, sys, re, subprocess
from datetime import datetime, timezone

try:
    import psycopg2, psycopg2.extras
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2, psycopg2.extras

env_path = os.path.join(os.path.dirname(__file__), ".env")
env_vars = {}
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env_vars[k.strip()] = v.strip()

DATABASE_URL = env_vars.get("DATABASE_URL", "")
m = re.match(r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)", DATABASE_URL)
if not m:
    print("ERROR: Cannot parse DATABASE_URL"); sys.exit(1)
db_user, db_pass, db_host, db_port, db_name = m.groups()
print(f"Connecting to: {db_host}:{db_port}/{db_name}")

DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

NEW_USERS = [
    ("Dev Anand Pillai",  "dev_cinecritic",    "dev.pillai.cine@example.com",      "Chennai boy. A.R. Rahman fan. Will argue about Mani Ratnam forever."),
    ("Zara Ahmed",        "zara_picks",         "zara.ahmed.picks@example.com",     "Pakistani cinephile in Toronto. Watches 5 films a week. Send help."),
    ("Ryan O'Connor",     "ryan_comicnerd",     "ryan.oconnor.film@example.com",    "Comic book reader first, MCU fanboy second. Nolan is God tier."),
    ("Meera Krishnan",    "meera_cinemaa",      "meera.krishnan.film@example.com",  "Tamil Nadu. Kollywood > everything else. Subtitles are not optional."),
    ("Jake Patterson",    "jakefilm",           "jake.patterson.movies@example.com","Film school grad. Has watched Citizen Kane unironically. Multiple times."),
    ("Pooja Malhotra",    "pooja_frames",       "pooja.malhotra.watch@example.com", "Delhi cinephile. If it won a Cannes Palm d'Or, I've seen it twice."),
    ("Carlos Rivera",     "carloscineaste",     "carlos.rivera.cine@example.com",   "Mexican-American. Cuaron, Del Toro, Iñárritu — the holy trinity."),
    ("Simran Bhatia",     "simran_reels",       "simran.bhatia.reels@example.com",  "Jaipur girl. Romance films are science. I have data to prove it."),
]

NEW_COLLECTIONS = [
    # Dev Anand Pillai
    ("dev_cinecritic", "A.R. Rahman Scored It So It's Automatically a Masterpiece",
     "The man has a Grammy AND an Oscar. Your opinion is irrelevant.",
     [(19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (597,"Titanic","/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg","1997",7.9),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0)]),
    ("dev_cinecritic", "Mani Ratnam Could Direct a Phone Book and I'd Watch It",
     "Roja. Bombay. Dil Se. That's it. That's the list.",
     [(19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0),
      (453405,"Article 15","/oGFBphoKySSEXSZhQPMGzKBxiEp.jpg","2019",8.1),
      (571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5)]),

    # Zara Ahmed
    ("zara_picks", "Films That Made Me Miss Home (And I Grew Up in Three Countries)",
     "Diaspora cinema hits different when you've lived it. No notes.",
     [(19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5)]),
    ("zara_picks", "Movies With Female Characters Who Actually Had a Brain",
     "Not a muse. Not a trophy. An actual human being with agency. Radical concept.",
     [(49521,"Black Swan","/wedMQQCMpRpnJFfMfqiuS3cAmba.jpg","2010",7.7),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5)]),

    # Ryan O'Connor — SUPERHERO FOCUS
    ("ryan_comicnerd", "Superhero Films That Are Actually Cinema and Not Just Content",
     "There IS a difference. These cleared the bar. Most didn't. Endgame is content. Dark Knight is cinema.",
     [(155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7),
      (475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2),
      (315635,"Spider-Man Homecoming","/c24sv2weTHPsmDa7jEMN0kjAMQF.jpg","2017",7.4),
      (429617,"Spider-Man No Way Home","/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg","2021",7.9)]),
    ("ryan_comicnerd", "DC vs Marvel But the Only Right Answer Is Into the Spider-Verse",
     "I have ended friendships over this. I have no regrets.",
     [(155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7),
      (475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2),
      (1124620,"Superman","/aEE0mJFSNHNhKnepfXI6kf2aGVH.jpg","2025",7.2)]),
    ("ryan_comicnerd", "Origin Stories That Actually Respected Our Time",
     "Not all origin stories are equal. These ones didn't waste yours.",
     [(155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2),
      (315635,"Spider-Man Homecoming","/c24sv2weTHPsmDa7jEMN0kjAMQF.jpg","2017",7.4),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (1396,"Terminator 2 Judgment Day","/5M0j0B18abtBI5bamgM7cx0hhuB.jpg","1991",8.1)]),

    # Meera Krishnan
    ("meera_cinemaa", "Kollywood Gave the World RRR and the World Still Isn't Ready",
     "SS Rajamouli is doing something other directors are too scared to attempt. Respect.",
     [(453405,"Article 15","/oGFBphoKySSEXSZhQPMGzKBxiEp.jpg","2019",8.1),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0)]),
    ("meera_cinemaa", "Indian Cinema That Broke Genre Conventions and My Brain",
     "These films refused to be just one thing. And they were better for it.",
     [(571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (453405,"Article 15","/oGFBphoKySSEXSZhQPMGzKBxiEp.jpg","2019",8.1),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (77,"Memento","/gyNBz4NT69AiTnUJXYAUdv0fkNt.jpg","2000",8.2),
      (27205,"Inception","/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg","2010",8.4)]),

    # Jake Patterson — CINEPHILE
    ("jakefilm", "Films a Film School Professor Would Assign and Actually Be Right About",
     "Not everything from film school is pretentious. These ones hold up in real life too.",
     [(238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (389,"12 Angry Men","/ppd84D2i9W8jXmsyInGyihiSyqz.jpg","1957",9.0),
      (539,"Psycho","/81d8oyEFgj7FlxJqSDXWr8JH8kV.jpg","1960",8.5),
      (278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (762509,"Oppenheimer","/8Gxv8giaFIqTJWmRUAECiTnQfcX.jpg","2023",8.2),
      (335984,"Blade Runner 2049","/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg","2017",7.8)]),
    ("jakefilm", "Villains With More Character Development Than the Hero",
     "The protagonist did three things. The antagonist had a whole arc. Discuss.",
     [(475557,"Joker","/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg","2019",8.2),
      (155,"The Dark Knight","/qJ2tW6WMUDux911r6m7haRef0WH.jpg","2008",9.0),
      (238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (240,"The Godfather Part II","/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg","1974",9.0),
      (16869,"Inglourious Basterds","/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg","2009",8.3),
      (539,"Psycho","/81d8oyEFgj7FlxJqSDXWr8JH8kV.jpg","1960",8.5)]),
    ("jakefilm", "Masterpieces That Are Not Fun But Must Be Experienced",
     "You will not enjoy these. You will be changed. Not the same thing.",
     [(424,"Schindler's List","/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg","1993",9.0),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (389,"12 Angry Men","/ppd84D2i9W8jXmsyInGyihiSyqz.jpg","1957",9.0),
      (694,"The Shining","/xazWoLealQwEgqZ89MLZklLZD3k.jpg","1980",8.4)]),

    # Pooja Malhotra — WORLD CINEMA + CANNES
    ("pooja_frames", "Cannes Gave It a Palm d'Or So You Have No Excuse Not to Watch",
     "The Palme d'Or is not handed out carelessly. These earned it.",
     [(496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5)]),
    ("pooja_frames", "World Cinema Hidden Gems That Quietly Obliterate Hollywood",
     "No franchise. No shared universe. Just pure storytelling from every corner of the planet.",
     [(496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3),
      (571252,"Andhadhun","/cOISDyFEaJsLdIo2chYnRfHHq1o.jpg","2018",8.2),
      (1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4)]),
    ("pooja_frames", "Films That Made Me Rethink What a Movie Could Even Be",
     "After watching these, standard Hollywood felt like coloring inside the lines.",
     [(27205,"Inception","/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg","2010",8.4),
      (157336,"Interstellar","/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","2014",8.4),
      (335984,"Blade Runner 2049","/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg","2017",7.8),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7)]),

    # Carlos Rivera
    ("carloscineaste", "Cuaron Del Toro Inarritu Are Doing Things Hollywood Forgot How To",
     "Three Mexican directors collectively holding up the entire prestige film industry. Respect.",
     [(424,"Schindler's List","/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg","1993",9.0),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (762509,"Oppenheimer","/8Gxv8giaFIqTJWmRUAECiTnQfcX.jpg","2023",8.2),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3)]),
    ("carloscineaste", "Films That Should Have Won Best Picture but Were Snubbed",
     "Academy voters be living on a different planet sometimes. Evidence below.",
     [(278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7),
      (680,"Pulp Fiction","/dM2w364MScsjFf8pfMbaWUcWrR.jpg","1994",8.5),
      (496243,"Parasite","/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg","2019",8.5),
      (324857,"Spider-Man Into the Spider-Verse","/iiZZdaQBEYBv6id8su7ImL0oCbD.jpg","2018",8.4),
      (569094,"Spider-Man Across the Spider-Verse","/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg","2023",8.7),
      (157336,"Interstellar","/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg","2014",8.4)]),
    ("carloscineaste", "Heist and Crime Films That Are Their Own Genre of Art",
     "The planning scene. The twist. The double cross. Cinema's most reliable formula.",
     [(238,"The Godfather","/3bhkrj58Vtu7enYsLegHnDcdh9b.jpg","1972",9.2),
      (680,"Pulp Fiction","/dM2w364MScsjFf8pfMbaWUcWrR.jpg","1994",8.5),
      (240,"The Godfather Part II","/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg","1974",9.0),
      (11324,"Django Unchained","/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg","2012",8.3),
      (745,"Se7en","/6yoghtyTpznpBik8EngEmJskVnS.jpg","1995",8.3)]),

    # Simran Bhatia — ROMANCE + COMFORT
    ("simran_reels", "Romance Films That Understood What Romance Actually Is",
     "Hint: it's not grand gestures. It's small moments. These got it right.",
     [(19404,"Dilwale Dulhania Le Jayenge","/uC6TTUhPpQCmgldGyYveKRAu8JN.jpg","1995",8.0),
      (597,"Titanic","/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg","1997",7.9),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5)]),
    ("simran_reels", "Sunday Afternoon Films You Watch in Pajamas with Chai",
     "No stress. No subtitles required. Just pure cinematic serotonin.",
     [(862,"Toy Story","/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg","1995",7.9),
      (10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1),
      (4935,"Howl's Moving Castle","/TkP2HMmSLZfHarJViAcBIzJYqh.jpg","2004",8.4),
      (129,"Spirited Away","/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg","2001",8.5),
      (77338,"The Intouchables","/clnyhPqj1SNgpAdeSS6a6fwE6Bo.jpg","2011",8.3)]),
    ("simran_reels", "Films Where I Cried But Refused to Tell Anyone I Cried",
     "I maintain plausible deniability. These are classified emotional events.",
     [(1726246,"12th Fail","/e1L6qnO0zXbQPU5iyS8Z3QvzwgU.jpg","2023",9.0),
      (10681,"WALL-E","/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg","2008",8.1),
      (637,"Life Is Beautiful","/74hLDKjD5aGYOotO6esUVaeISa2.jpg","1997",8.5),
      (508442,"Soul","/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg","2020",8.1),
      (278,"The Shawshank Redemption","/lyQBXAf8bhM8GXF9DXDo5ezqmTi.jpg","1994",8.7)]),
]


def seed():
    conn = psycopg2.connect(
        host=db_host, port=int(db_port), dbname=db_name,
        user=db_user, password=db_pass, sslmode="require", connect_timeout=15
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    print("\nCreating new seed users...")
    user_map = {}
    for (name, username, email, bio) in NEW_USERS:
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
            INSERT INTO users (name,username,email,bio,hashed_password,is_admin,failed_login_attempts,created_at)
            VALUES (%s,%s,%s,%s,%s,false,0,NOW()) RETURNING id
        """, (name, username, email, bio, DUMMY_HASH))
        conn.commit()
        uid = cur.fetchone()["id"]
        user_map[username] = uid
        print(f"  Created: @{username} (id={uid})")

    print(f"\nCreating {len(NEW_COLLECTIONS)} new collections...")
    created = skipped = 0
    for (owner, name, desc, movies) in NEW_COLLECTIONS:
        oid = user_map.get(owner)
        if not oid:
            print(f"  Unknown owner: {owner}"); continue
        cur.execute("SELECT id FROM collections WHERE user_id=%s AND name=%s", (oid, name))
        if cur.fetchone():
            skipped += 1; continue
        cur.execute("""
            INSERT INTO collections (user_id,name,description,is_public,is_rank_list,created_at)
            VALUES (%s,%s,%s,true,false,NOW()) RETURNING id
        """, (oid, name, desc))
        col_id = cur.fetchone()["id"]
        for (mid, title, poster, year, rating) in movies:
            cur.execute("""
                INSERT INTO collection_items (collection_id,movie_id,media_type,title,poster_path,release_year,vote_average,added_at)
                VALUES (%s,%s,'movie',%s,%s,%s,%s,NOW()) ON CONFLICT DO NOTHING
            """, (col_id, mid, title, poster, year, rating))
        conn.commit()
        created += 1
        print(f"  Created: '{name[:60]}' by @{owner}")

    cur.close(); conn.close()
    print(f"\nDone! {created} collections created, {skipped} skipped.")
    print("Refresh http://localhost:3000/collections\n")

if __name__ == "__main__":
    seed()
