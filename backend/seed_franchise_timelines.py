"""
One-off content-population script for the Cinematic Universe / Watch Order feature.

Run manually: `python seed_franchise_timelines.py`

For each franchise below, resolves every title to a real TMDB id via a live
TMDB search (never hand-typed ids) and upserts a FranchiseEntry. Idempotent —
safe to re-run; existing (franchise, movie_id, media_type) rows are skipped.

Titles/order/phase/saga for the 21 "full" franchises are transcribed directly
from what the app owner specified. The remaining long-tail franchises are
seeded as empty stubs (name/description/icon only) for the admin UI to fill
in later via Admin > Franchises > search TMDB > add.
"""
import asyncio
import re
import sys

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from database import SessionLocal, Base, engine
import models
from movies.router import tmdb_get

Base.metadata.create_all(bind=engine)
FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")


def e(title, media_type="movie", search=None, phase=None, saga=None,
      sub_timeline=None, timeline_order=None, multiverse=False, year=None):
    """One franchise entry. `search` overrides `title` as the TMDB query string."""
    return {
        "title": title,
        "media_type": media_type,
        "search": search or title,
        "phase": phase,
        "saga": saga,
        "sub_timeline": sub_timeline,
        "timeline_order": timeline_order,
        "multiverse": multiverse,
        "year": year,
    }


# ─── Marvel Cinematic Universe ────────────────────────────────────────────────
# Phase groupings + explicit Phase-1 chronological order transcribed as given.
_MCU_PHASE1 = [
    e("Captain America: The First Avenger", phase="Phase 1", timeline_order=1),
    e("Captain Marvel", phase="Phase 1", timeline_order=2),
    e("Iron Man", phase="Phase 1", timeline_order=3),
    e("Iron Man 2", phase="Phase 1", timeline_order=4),
    e("The Incredible Hulk", phase="Phase 1", timeline_order=5),
    e("Thor", phase="Phase 1", timeline_order=6),
    e("The Avengers", phase="Phase 1", timeline_order=7),
]
_MCU_PHASE2 = [
    e("Iron Man 3", phase="Phase 2"),
    e("Thor: The Dark World", phase="Phase 2"),
    e("Captain America: The Winter Soldier", phase="Phase 2"),
    e("Guardians of the Galaxy", phase="Phase 2"),
    e("Guardians of the Galaxy Vol. 2", phase="Phase 2"),
    e("Avengers: Age of Ultron", phase="Phase 2"),
    e("Ant-Man", phase="Phase 2"),
]
_MCU_PHASE3 = [
    e("Captain America: Civil War", phase="Phase 3"),
    e("Black Widow", phase="Phase 3"),
    e("Black Panther", phase="Phase 3"),
    e("Spider-Man: Homecoming", phase="Phase 3"),
    e("Doctor Strange", phase="Phase 3"),
    e("Thor: Ragnarok", phase="Phase 3"),
    e("Ant-Man and the Wasp", phase="Phase 3"),
    e("Avengers: Infinity War", phase="Phase 3"),
    e("Avengers: Endgame", phase="Phase 3"),
]
_MCU_PHASE4 = [
    e("Loki", media_type="tv", search="Loki", phase="Phase 4"),
    e("WandaVision", media_type="tv", phase="Phase 4"),
    e("Shang-Chi and the Legend of the Ten Rings", media_type="movie", search="Shang-Chi", phase="Phase 4"),
    e("The Falcon and the Winter Soldier", media_type="tv", phase="Phase 4"),
    e("Spider-Man: Far From Home", phase="Phase 4"),
    e("Spider-Man: No Way Home", phase="Phase 4", multiverse=True),
    e("Eternals", phase="Phase 4"),
    e("Hawkeye", media_type="tv", phase="Phase 4"),
    e("Moon Knight", media_type="tv", phase="Phase 4"),
    e("Doctor Strange in the Multiverse of Madness", phase="Phase 4", multiverse=True),
    e("Ms. Marvel", media_type="tv", phase="Phase 4"),
    e("Thor: Love and Thunder", phase="Phase 4"),
    e("She-Hulk: Attorney at Law", media_type="tv", search="She-Hulk", phase="Phase 4"),
    e("Werewolf by Night", phase="Phase 4"),
    e("Black Panther: Wakanda Forever", phase="Phase 4"),
    e("The Guardians of the Galaxy Holiday Special", phase="Phase 4"),
]
_MCU_PHASE5 = [
    e("Ant-Man and the Wasp: Quantumania", phase="Phase 5", multiverse=True),
    e("Guardians of the Galaxy Vol. 3", phase="Phase 5"),
    e("Secret Invasion", media_type="tv", phase="Phase 5"),
    e("Loki", media_type="tv", search="Loki", phase="Phase 5"),  # Season 2, same TMDB show as Phase 4 Loki
    e("The Marvels", phase="Phase 5", multiverse=True),
    e("Echo", media_type="tv", phase="Phase 5"),
    e("Deadpool & Wolverine", phase="Phase 5", multiverse=True),
    e("Agatha All Along", media_type="tv", phase="Phase 5"),
    e("Daredevil: Born Again", media_type="tv", phase="Phase 5"),
    e("Captain America: Brave New World", phase="Phase 5"),
    e("Thunderbolts*", search="Thunderbolts", phase="Phase 5"),
    e("Ironheart", media_type="tv", phase="Phase 5"),
]
_MCU_PHASE6 = [
    e("The Fantastic Four: First Steps", search="Fantastic Four First Steps", phase="Phase 6"),
    e("Avengers: Doomsday", phase="Phase 6"),
    e("Spider-Man: Brand New Day", phase="Phase 6"),
    e("Avengers: Secret Wars", phase="Phase 6"),
]

for _group in (_MCU_PHASE1, _MCU_PHASE2, _MCU_PHASE3):
    for _entry in _group:
        _entry["saga"] = "Infinity Saga"
for _group in (_MCU_PHASE4, _MCU_PHASE5, _MCU_PHASE6):
    for _entry in _group:
        _entry["saga"] = "Multiverse Saga"

MCU_ENTRIES = _MCU_PHASE1 + _MCU_PHASE2 + _MCU_PHASE3 + _MCU_PHASE4 + _MCU_PHASE5 + _MCU_PHASE6

# Explicit "MCU Watch Order" chain (canonical titles matching the entries above).
MCU_WATCH_ORDER_CHAIN = [
    "Captain America: The First Avenger", "Captain Marvel", "Iron Man", "Iron Man 2",
    "The Incredible Hulk", "Thor", "The Avengers", "Iron Man 3", "Thor: The Dark World",
    "Captain America: The Winter Soldier", "Guardians of the Galaxy", "Guardians of the Galaxy Vol. 2",
    "Avengers: Age of Ultron", "Ant-Man", "Captain America: Civil War", "Black Widow",
    "Black Panther", "Spider-Man: Homecoming", "Doctor Strange", "Thor: Ragnarok",
    "Ant-Man and the Wasp", "Avengers: Infinity War", "Avengers: Endgame", "Loki",
    "WandaVision", "Spider-Man: Far From Home", "Spider-Man: No Way Home",
    "Doctor Strange in the Multiverse of Madness",
]

FRANCHISES = [
    {
        "name": "Marvel Cinematic Universe",
        "description": "The interconnected superhero franchise produced by Marvel Studios.",
        "color": "#ED1D24",
        "icon_emoji": "🛡️",
        "entries": MCU_ENTRIES,
    },
    {
        "name": "Sony's Spider-Man Universe",
        "description": "Sony's Spider-Man-adjacent villain universe.",
        "color": "#8B0000",
        "icon_emoji": "🕸️",
        "entries": [
            e("Venom"), e("Venom: Let There Be Carnage"), e("Morbius"),
            e("Madame Web"), e("Venom: The Last Dance"), e("Kraven the Hunter"),
        ],
    },
    {
        "name": "Fox X-Men Universe",
        "description": "20th Century Fox's X-Men film series, spanning two timelines.",
        "color": "#F4C430",
        "icon_emoji": "🧬",
        "entries": [
            e("X-Men: First Class", search="X-Men First Class", year=2011, sub_timeline="Original Timeline"),
            e("X-Men Origins: Wolverine", search="X-Men Origins Wolverine", sub_timeline="Original Timeline"),
            e("X-Men", year=2000, sub_timeline="Original Timeline"),
            e("X2", search="X2 X-Men United", sub_timeline="Original Timeline"),
            e("X-Men: The Last Stand", search="X-Men The Last Stand", sub_timeline="Original Timeline"),
            e("The Wolverine", sub_timeline="Original Timeline"),
            e("X-Men: Days of Future Past", search="X-Men Days of Future Past", sub_timeline="Original Timeline", multiverse=True),
            e("X-Men: Apocalypse", search="X-Men Apocalypse", sub_timeline="New Timeline"),
            e("Dark Phoenix", sub_timeline="New Timeline"),
            e("Deadpool", year=2016, sub_timeline="New Timeline"),
            e("Deadpool 2", sub_timeline="New Timeline"),
            e("The New Mutants", search="New Mutants", sub_timeline="New Timeline"),
            e("Logan", sub_timeline="New Timeline"),
        ],
    },
    {
        "name": "Spider-Man (Raimi Trilogy)",
        "description": "Sam Raimi's original Spider-Man trilogy starring Tobey Maguire.",
        "color": "#B71C1C",
        "icon_emoji": "🕷️",
        "entries": [e("Spider-Man", year=2002), e("Spider-Man 2"), e("Spider-Man 3")],
    },
    {
        "name": "The Amazing Spider-Man",
        "description": "Marc Webb's Amazing Spider-Man duology starring Andrew Garfield.",
        "color": "#1565C0",
        "icon_emoji": "🕷️",
        "entries": [e("The Amazing Spider-Man", search="Amazing Spider-Man", year=2012), e("The Amazing Spider-Man 2")],
    },
    {
        "name": "Spider-Verse",
        "description": "Sony's animated multiverse-spanning Spider-Man saga.",
        "color": "#6A1B9A",
        "icon_emoji": "🌌",
        "entries": [
            e("Spider-Man: Into the Spider-Verse", search="Into the Spider-Verse", multiverse=True),
            e("Spider-Man: Across the Spider-Verse", search="Across the Spider-Verse", multiverse=True),
            e("Spider-Man: Beyond the Spider-Verse", search="Beyond the Spider-Verse", multiverse=True),
        ],
    },
    {
        "name": "Fantastic Four (Pre-MCU)",
        "description": "20th Century Fox's Fantastic Four films, before the property returned to Marvel Studios. The MCU incarnation is tracked under Marvel Cinematic Universe.",
        "color": "#1E88E5",
        "icon_emoji": "4️⃣",
        "entries": [
            e("Fantastic Four", year=2005, sub_timeline="Original"),
            e("Fantastic Four: Rise of the Silver Surfer", search="Rise of the Silver Surfer", sub_timeline="Original"),
            e("Fantastic Four", year=2015, sub_timeline="Reboot"),
        ],
    },
    {
        "name": "Blade",
        "description": "New Line Cinema's Blade vampire-hunter trilogy.",
        "color": "#37474F",
        "icon_emoji": "🗡️",
        "entries": [e("Blade"), e("Blade II"), e("Blade: Trinity", search="Blade Trinity")],
    },
    {
        "name": "Ghost Rider",
        "description": "Columbia Pictures' Ghost Rider films.",
        "color": "#FF6F00",
        "icon_emoji": "🔥",
        "entries": [e("Ghost Rider", year=2007), e("Ghost Rider: Spirit of Vengeance", search="Spirit of Vengeance")],
    },
    {
        "name": "The Punisher (Legacy)",
        "description": "Pre-MCU Punisher films.",
        "color": "#212121",
        "icon_emoji": "💀",
        "entries": [e("The Punisher", year=2004, search="The Punisher"), e("Punisher: War Zone")],
    },
    {
        "name": "Daredevil (Legacy)",
        "description": "Pre-MCU Daredevil films.",
        "color": "#8B0000",
        "icon_emoji": "🥊",
        "entries": [e("Daredevil", year=2003), e("Elektra")],
    },
    {
        "name": "DC Extended Universe (DCEU)",
        "description": "Warner Bros.' shared DC universe, 2013-2023 (Snyder-era continuity).",
        "color": "#0D47A1",
        "icon_emoji": "🦇",
        "entries": [
            e("Wonder Woman", year=2017, sub_timeline="Snyder Timeline"),
            e("Wonder Woman 1984", sub_timeline="Snyder Timeline"),
            e("Man of Steel", sub_timeline="Snyder Timeline"),
            e("Batman v Superman: Dawn of Justice", search="Batman v Superman", sub_timeline="Snyder Timeline"),
            e("Suicide Squad", year=2016, sub_timeline="Snyder Timeline"),
            e("Justice League", year=2017, sub_timeline="Snyder Timeline"),
            e("Zack Snyder's Justice League", sub_timeline="Snyder Timeline"),
            e("Aquaman", year=2018, sub_timeline="Snyder Timeline"),
            e("Shazam!", search="Shazam", sub_timeline="Snyder Timeline"),
            e("Birds of Prey", sub_timeline="Snyder Timeline"),
            e("The Suicide Squad", year=2021, sub_timeline="Snyder Timeline"),
            e("Peacemaker", media_type="tv", search="Peacemaker", sub_timeline="Snyder Timeline"),
            e("Black Adam", sub_timeline="Snyder Timeline"),
            e("Shazam! Fury of the Gods", search="Shazam Fury of the Gods", sub_timeline="Snyder Timeline"),
            e("The Flash", sub_timeline="Snyder Timeline"),
            e("Blue Beetle", sub_timeline="Snyder Timeline"),
            e("Aquaman and the Lost Kingdom", sub_timeline="Snyder Timeline"),
        ],
    },
    {
        "name": "DC Universe (DCU)",
        "description": "James Gunn & Peter Safran's relaunched DC Universe, starting with Chapter One: Gods and Monsters.",
        "color": "#1976D2",
        "icon_emoji": "⚡",
        "entries": [
            e("Creature Commandos", media_type="tv", phase="Chapter One"),
            e("Superman", year=2025, phase="Chapter One"),
            e("Peacemaker", media_type="tv", search="Peacemaker", phase="Chapter One"),
            e("Supergirl", search="Supergirl Woman of Tomorrow", phase="Chapter One"),
            e("Lanterns", media_type="tv", phase="Chapter One"),
            e("Clayface", phase="Chapter One"),
            e("The Brave and the Bold", search="DCU Dynamic Duo Batman", phase="Chapter One"),
            e("Swamp Thing", phase="Chapter One"),
        ],
    },
    {
        "name": "Batman (Nolan Trilogy)",
        "description": "Christopher Nolan's The Dark Knight Trilogy.",
        "color": "#000000",
        "icon_emoji": "🦇",
        "entries": [e("Batman Begins"), e("The Dark Knight"), e("The Dark Knight Rises")],
    },
    {
        "name": "The Batman Universe",
        "description": "Matt Reeves' standalone Batman universe.",
        "color": "#263238",
        "icon_emoji": "🦇",
        "entries": [
            e("The Batman", year=2022),
            e("The Penguin", media_type="tv"),
            e("The Batman Part II"),
        ],
    },
    {
        "name": "Joker Universe",
        "description": "Todd Phillips' standalone Joker films.",
        "color": "#6A1B9A",
        "icon_emoji": "🃏",
        "entries": [e("Joker", year=2019), e("Joker: Folie à Deux", search="Joker Folie a Deux")],
    },
    {
        "name": "Superman (Christopher Reeve)",
        "description": "The original Superman film series starring Christopher Reeve.",
        "color": "#B71C1C",
        "icon_emoji": "🦸",
        "entries": [
            e("Superman", year=1978, search="Superman The Movie"),
            e("Superman II", year=1980),
            e("Superman III", year=1983),
            e("Superman IV: The Quest for Peace", search="Superman IV Quest for Peace"),
        ],
    },
    {
        "name": "Superman Returns",
        "description": "Bryan Singer's 2006 continuation of the Reeve-era Superman films.",
        "color": "#1565C0",
        "icon_emoji": "🦸",
        "entries": [e("Superman Returns")],
    },
    {
        "name": "Batman (Tim Burton)",
        "description": "Tim Burton's Batman films starring Michael Keaton.",
        "color": "#212121",
        "icon_emoji": "🦇",
        "entries": [e("Batman", year=1989), e("Batman Returns")],
    },
    {
        "name": "Batman (Joel Schumacher)",
        "description": "Joel Schumacher's Batman films.",
        "color": "#546E7A",
        "icon_emoji": "🦇",
        "entries": [e("Batman Forever", year=1995), e("Batman & Robin", search="Batman & Robin", year=1997)],
    },
    {
        "name": "Watchmen",
        "description": "Alan Moore's Watchmen — Zack Snyder's film and the HBO limited series continuation.",
        "color": "#FFEB3B",
        "icon_emoji": "🕰️",
        "entries": [
            e("Watchmen", year=2009),
            e("Watchmen", media_type="tv", search="Watchmen", year=2019),
        ],
    },
    {
        "name": "Constantine",
        "description": "The John Constantine film series.",
        "color": "#3E2723",
        "icon_emoji": "🔥",
        "entries": [e("Constantine", year=2005), e("Constantine 2")],
    },
    {
        "name": "V for Vendetta",
        "description": "Standalone dystopian thriller based on Alan Moore's graphic novel.",
        "color": "#C62828",
        "icon_emoji": "🎭",
        "entries": [e("V for Vendetta")],
    },
    {
        "name": "The League of Extraordinary Gentlemen",
        "description": "Standalone Victorian-era adventure film.",
        "color": "#4E342E",
        "icon_emoji": "🎩",
        "entries": [e("The League of Extraordinary Gentlemen")],
    },
]

# ─── Long-tail franchises: stubs only (no entries yet) — filled via admin UI ──
STUB_FRANCHISES = [
    ("Transformers", "🤖", "#FFC107"),
    ("Harry Potter & Fantastic Beasts", "⚡", "#7B1FA2"),
    ("The Lord of the Rings & The Hobbit", "💍", "#33691E"),
    ("Star Wars", "🚀", "#FBC02D"),
    ("Jurassic Park / Jurassic World", "🦖", "#2E7D32"),
    ("Alien & Predator", "👽", "#455A64"),
    ("Fast & Furious", "🏎️", "#D84315"),
    ("Mission: Impossible", "🕶️", "#B71C1C"),
    ("John Wick", "🔫", "#212121"),
    ("The Conjuring Universe", "👻", "#4A148C"),
    ("MonsterVerse (Godzilla / Kong)", "🦍", "#00695C"),
    ("Planet of the Apes", "🦍", "#5D4037"),
    ("Pirates of the Caribbean", "🏴‍☠️", "#01579B"),
    ("James Bond", "🍸", "#000000"),
    ("The Matrix", "💊", "#1B5E20"),
    ("Final Destination", "💀", "#B71C1C"),
]


def _normalize(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"[!?*.:]+$", "", s)   # strip trailing punctuation (Shazam!, Thunderbolts*, ...)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def _title_of(r: dict) -> str:
    return _normalize(r.get("title") or r.get("name") or "")


def _date_of(r: dict) -> str:
    return r.get("release_date") or r.get("first_air_date") or ""


async def search_tmdb(query: str, media_type: str, year: int | None):
    """
    TMDB's raw relevance ranking is not reliable for short/ambiguous titles
    (e.g. searching "Blade" ranks "Blade II" first; "Deadpool" ranks
    "Deadpool & Wolverine" first). Prefer an exact (case-insensitive) title
    match — optionally narrowed by year — over raw result order.
    """
    path = "/search/movie" if media_type == "movie" else "/search/tv"
    data = await tmdb_get(path, {"query": query, "language": "en-US"}, ttl=86400)
    results = data.get("results", [])
    if not results:
        return None

    query_norm = _normalize(query)
    year_matches = [r for r in results if year and _date_of(r)[:4] == str(year)]

    exact_and_year = [r for r in year_matches if _title_of(r) == query_norm]
    if exact_and_year:
        return exact_and_year[0]
    if year_matches:
        return year_matches[0]

    exact = [r for r in results if _title_of(r) == query_norm]
    if exact:
        return exact[0]

    return results[0]


async def seed():
    db = SessionLocal()
    unresolved = []
    created = 0
    skipped = 0

    try:
        for spec in FRANCHISES:
            franchise = db.query(models.Franchise).filter(models.Franchise.name == spec["name"]).first()
            if not franchise:
                franchise = models.Franchise(
                    name=spec["name"], description=spec["description"],
                    color=spec["color"], icon_emoji=spec["icon_emoji"], movie_ids=[],
                )
                db.add(franchise)
                db.commit()
                db.refresh(franchise)
                print(f"[franchise] created '{franchise.name}'")

            for idx, entry in enumerate(spec["entries"], start=1):
                result = await search_tmdb(entry["search"], entry["media_type"], entry["year"])
                if not result:
                    unresolved.append(f"{spec['name']} :: {entry['title']} ({entry['media_type']})")
                    continue

                movie_id = result["id"]

                # Keep the legacy Franchise.movie_ids list (used by the admin
                # "Current Collection" grid and the public /browse/franchise
                # page) in sync regardless of whether the entry is new.
                if movie_id not in (franchise.movie_ids or []):
                    franchise.movie_ids = [*(franchise.movie_ids or []), movie_id]
                    db.commit()

                existing = db.query(models.FranchiseEntry).filter(
                    models.FranchiseEntry.franchise_id == franchise.id,
                    models.FranchiseEntry.movie_id == movie_id,
                    models.FranchiseEntry.media_type == entry["media_type"],
                ).first()
                if existing:
                    skipped += 1
                    continue

                title = result.get("title") or result.get("name") or entry["title"]
                release_date = result.get("release_date") or result.get("first_air_date")
                watch_order = None
                if entry["title"] in MCU_WATCH_ORDER_CHAIN:
                    watch_order = MCU_WATCH_ORDER_CHAIN.index(entry["title"]) + 1

                row = models.FranchiseEntry(
                    franchise_id=franchise.id,
                    movie_id=movie_id,
                    media_type=entry["media_type"],
                    title=title,
                    poster_path=result.get("poster_path"),
                    release_date=release_date,
                    saga=entry["saga"],
                    phase=entry["phase"],
                    sub_timeline=entry["sub_timeline"],
                    timeline_order=entry["timeline_order"],
                    release_order=idx,
                    watch_order=watch_order,
                    multiverse=entry["multiverse"],
                )
                db.add(row)
                db.commit()
                created += 1
                print(f"  [entry] {spec['name']} :: {title} ({entry['media_type']}, tmdb={movie_id})")

        for name, icon, color in STUB_FRANCHISES:
            franchise = db.query(models.Franchise).filter(models.Franchise.name == name).first()
            if not franchise:
                db.add(models.Franchise(
                    name=name, description="Stub — add movies via Admin > Franchises.",
                    color=color, icon_emoji=icon, movie_ids=[],
                ))
                db.commit()
                print(f"[stub] created '{name}'")

    finally:
        db.close()

    print(f"\nDone. {created} entries created, {skipped} already existed.")
    if unresolved:
        print(f"\n{len(unresolved)} titles could not be resolved on TMDB (review manually via Admin > Franchises):")
        for u in unresolved:
            print(f"  - {u}")


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed())
