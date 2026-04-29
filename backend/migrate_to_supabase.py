"""
migrate_to_supabase.py
======================
One-time migration: copies all data from local SQLite → Supabase PostgreSQL.

Usage:
    1. Set SUPABASE_URL in your .env (the postgresql:// connection string)
    2. Run:  python migrate_to_supabase.py

This script is SAFE to run multiple times (it checks for existing records before inserting).
"""
import os
import sqlite3
import sys
from dotenv import load_dotenv

load_dotenv(override=True)

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "cinematch.db")
SUPABASE_URL = os.getenv("DATABASE_URL", "")

if not SUPABASE_URL or not (
    SUPABASE_URL.startswith("postgresql://") or SUPABASE_URL.startswith("postgres://")
):
    print("❌ DATABASE_URL must be a PostgreSQL URL (from Supabase)")
    print("   e.g. postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres")
    sys.exit(1)

# Fix prefix if needed
if SUPABASE_URL.startswith("postgres://"):
    SUPABASE_URL = SUPABASE_URL.replace("postgres://", "postgresql://", 1)

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

print("🚀 Starting SQLite → Supabase migration...")
print(f"   Source: {SQLITE_PATH}")
print(f"   Target: {SUPABASE_URL[:50]}...")

# ── Open connections ───────────────────────────────────────────────────────────
sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row

pg_conn = psycopg2.connect(SUPABASE_URL, sslmode="require")
pg_conn.autocommit = False

src = sqlite_conn.cursor()
dst = pg_conn.cursor()

# ── Helper ─────────────────────────────────────────────────────────────────────
def migrate_table(table: str, columns: list[str], conflict_target: str = "id"):
    src.execute(f"SELECT * FROM {table}")
    rows = src.fetchall()
    if not rows:
        print(f"  ⏭  {table}: empty, skipping")
        return

    col_str = ", ".join(columns)
    placeholders = ", ".join(["%s"] * len(columns))
    
    # Use the specified conflict target (e.g., 'id' or 'email')
    sql = (
        f"INSERT INTO {table} ({col_str}) VALUES ({placeholders}) "
        f"ON CONFLICT ({conflict_target}) DO NOTHING"
    )

    count = 0
    for row in rows:
        # Convert values (PostgreSQL needs actual Booleans, SQLite uses 0/1)
        values = []
        for col in columns:
            val = row[col]
            # Convert 0/1 to False/True for boolean columns (is_admin, revoked, etc.)
            if col in ["is_admin", "revoked", "is_public", "is_rank_list", "contains_spoiler", "is_like"]:
                val = bool(val) if val is not None else None
            values.append(val)
        
        try:
            dst.execute(sql, tuple(values))
            pg_conn.commit() # Save progress after every successful row
            count += 1
        except psycopg2.IntegrityError:
            pg_conn.rollback() # Only rollback the single failed row
            continue # Skip this row and move to the next one
        except Exception as e:
            pg_conn.rollback()
            print(f"  ⚠️ Error in {table}: {e}")
            raise

    pg_conn.commit()
    print(f"  ✅ {table}: {count} rows migrated")


# ── Detect available tables ────────────────────────────────────────────────────
src.execute("SELECT name FROM sqlite_master WHERE type='table'")
existing_tables = {r[0] for r in src.fetchall()}
print(f"\n📋 Found {len(existing_tables)} tables in SQLite: {', '.join(sorted(existing_tables))}\n")

# ── Migrate in dependency order ────────────────────────────────────────────────

# 1. Users (no FK deps)
if "users" in existing_tables:
    # Check which columns exist in SQLite
    src.execute("PRAGMA table_info(users)")
    user_cols_in_sqlite = {row[1] for row in src.fetchall()}
    user_cols = ["id", "name", "username", "bio", "avatar_url", "email",
                 "hashed_password", "is_admin", "created_at"]
    if "failed_login_attempts" in user_cols_in_sqlite:
        user_cols.append("failed_login_attempts")
    if "locked_until" in user_cols_in_sqlite:
        user_cols.append("locked_until")
    # Use 'email' as conflict target for users since IDs might shift but emails are unique
    migrate_table("users", user_cols, conflict_target="email")

# 2. Password Resets
if "password_resets" in existing_tables:
    migrate_table("password_resets", ["id", "email", "code", "expires_at", "created_at"])

# 3. Refresh Tokens
if "refresh_tokens" in existing_tables:
    migrate_table("refresh_tokens", ["id", "user_id", "token_hash", "expires_at", "revoked", "created_at"])

# 4. Favorites
if "favorites" in existing_tables:
    migrate_table("favorites", ["id", "user_id", "movie_id", "media_type", "title",
                                "poster_path", "backdrop_path", "release_year", "vote_average", "added_at"])

# 5. Watchlist
if "watchlist" in existing_tables:
    migrate_table("watchlist", ["id", "user_id", "movie_id", "media_type", "title",
                                "poster_path", "backdrop_path", "release_year", "vote_average", "added_at"])

# 6. Watched
if "watched" in existing_tables:
    migrate_table("watched", ["id", "user_id", "movie_id", "media_type", "title",
                              "poster_path", "backdrop_path", "release_year", "vote_average", "watched_at"])

# 7. Ratings
if "ratings" in existing_tables:
    migrate_table("ratings", ["id", "user_id", "movie_id", "media_type", "rating",
                              "genre_ids", "created_at", "updated_at"])

# 8. Comments
if "comments" in existing_tables:
    migrate_table("comments", ["id", "user_id", "movie_id", "media_type", "content",
                               "contains_spoiler", "created_at", "updated_at"])

# 9. Comment Likes
if "comment_likes" in existing_tables:
    migrate_table("comment_likes", ["id", "comment_id", "user_id", "is_like"], conflict_target="id")

# 10. Debates
if "debates" in existing_tables:
    migrate_table("debates", ["id", "movie_id", "media_type", "user_id", "stance",
                              "content", "parent_id", "created_at"])

# 11. Debate Votes
if "debate_votes" in existing_tables:
    migrate_table("debate_votes", ["id", "debate_id", "user_id", "vote"], conflict_target="id")

# 12. Moctale Ratings
if "moctale_ratings" in existing_tables:
    migrate_table("moctale_ratings", ["id", "user_id", "movie_id", "media_type", "title",
                                      "poster_path", "label", "review_text", "created_at", "updated_at"])

# 13. Moctale Review Likes
if "moctale_review_likes" in existing_tables:
    migrate_table("moctale_review_likes", ["id", "review_id", "user_id", "created_at"])

# 14. Moctale Review Comments
if "moctale_review_comments" in existing_tables:
    migrate_table("moctale_review_comments", ["id", "review_id", "user_id", "parent_id",
                                              "content", "created_at", "updated_at"])

# 15. Moctale Review Comment Likes
if "moctale_review_comment_likes" in existing_tables:
    migrate_table("moctale_review_comment_likes", ["id", "comment_id", "user_id", "created_at"])

# 16. Collections
if "collections" in existing_tables:
    migrate_table("collections", ["id", "user_id", "name", "description", "is_public",
                                  "is_rank_list", "banner_path", "banner_movie_id", "created_at", "updated_at"])

# 17. Collection Items
if "collection_items" in existing_tables:
    migrate_table("collection_items", ["id", "collection_id", "movie_id", "media_type", "title",
                                       "poster_path", "backdrop_path", "release_year", "vote_average", "added_at"])

# 18. Tier Lists
if "tier_lists" in existing_tables:
    migrate_table("tier_lists", ["id", "user_id", "title", "tiers_json", "updated_at"])

# 19. Groups
if "groups" in existing_tables:
    migrate_table("groups", ["id", "name", "description", "image_url", "creator_id", "created_at"])

# 20. Group Members
if "group_members" in existing_tables:
    migrate_table("group_members", ["id", "group_id", "user_id", "joined_at"])

# 21. Group Posts
if "group_posts" in existing_tables:
    migrate_table("group_posts", ["id", "group_id", "user_id", "content", "created_at"])

# 22. Group Comments
if "group_comments" in existing_tables:
    migrate_table("group_comments", ["id", "post_id", "user_id", "content", "created_at"])

# 23. Verdict Battles
if "verdict_battles" in existing_tables:
    migrate_table("verdict_battles", ["id", "movie_id", "media_type", "creator_id", "title",
                                      "side_a_label", "side_b_label", "description", "ends_at",
                                      "status", "created_at"])

# 24. Battle Arguments
if "battle_arguments" in existing_tables:
    migrate_table("battle_arguments", ["id", "battle_id", "user_id", "side", "content", "created_at"])

# 25. Battle Votes
if "battle_votes" in existing_tables:
    migrate_table("battle_votes", ["id", "battle_id", "user_id", "side"], conflict_target="id")

# 26. User Badges
if "user_badges" in existing_tables:
    migrate_table("user_badges", ["id", "user_id", "badge_type", "badge_name", "movie_id", "earned_at"])

# 27. Prediction Seasons
if "prediction_seasons" in existing_tables:
    migrate_table("prediction_seasons", ["id", "name", "ceremony", "status", "created_at"])

# 28. Prediction Categories
if "prediction_categories" in existing_tables:
    migrate_table("prediction_categories", ["id", "season_id", "name", "nominees_json", "winner_movie_id"])

# 29. User Predictions
if "user_predictions" in existing_tables:
    migrate_table("user_predictions", ["id", "user_id", "category_id", "predicted_movie_id", "created_at"])

# 30. Franchises
if "franchises" in existing_tables:
    migrate_table("franchises", ["id", "name", "description", "color", "icon_emoji",
                                 "movie_ids", "created_at", "updated_at"])

# 31. Gem Overrides
if "gem_overrides" in existing_tables:
    migrate_table("gem_overrides", ["id", "movie_id", "title", "poster_path", "backdrop_path",
                                    "vote_average", "vote_count", "release_date", "overview",
                                    "gem_score", "rarity", "trailer_url", "added_at"])

# 32. Must Watch
if "must_watch" in existing_tables:
    migrate_table("must_watch", ["id", "movie_id", "title", "poster_path", "backdrop_path",
                                 "vote_average", "release_date", "overview", "trailer_url", "added_at"])

# 33. Movie Interests
if "movie_interests" in existing_tables:
    migrate_table("movie_interests", ["id", "user_id", "movie_id", "media_type", "title",
                                      "poster_path", "backdrop_path", "release_date", "created_at"])

# ── Reset sequences (PostgreSQL auto-increment won't work if IDs already set) ──
print("\n🔄 Resetting PostgreSQL sequences...")
tables_with_serial = [
    "users", "password_resets", "refresh_tokens", "favorites", "watchlist", "watched",
    "ratings", "comments", "comment_likes", "debates", "debate_votes", "moctale_ratings",
    "moctale_review_likes", "moctale_review_comments", "moctale_review_comment_likes",
    "collections", "collection_items", "tier_lists", "groups", "group_members",
    "group_posts", "group_comments", "verdict_battles", "battle_arguments", "battle_votes",
    "user_badges", "prediction_seasons", "prediction_categories", "user_predictions",
    "franchises", "gem_overrides", "must_watch", "movie_interests"
]

for table in tables_with_serial:
    try:
        dst.execute(
            f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
            f"COALESCE((SELECT MAX(id) FROM {table}), 1))"
        )
        pg_conn.commit()
    except Exception as e:
        pg_conn.rollback()
        print(f"  ⚠️  Could not reset sequence for {table}: {e}")

print("\n✅ Migration complete! All data is now in Supabase PostgreSQL.")
print("   Next step: Set DATABASE_URL in Railway/Vercel and deploy.")

sqlite_conn.close()
pg_conn.close()
