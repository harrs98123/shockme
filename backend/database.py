from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Use override=True to ensure .env values take priority over OS variables
load_dotenv(override=True)

# ── Database URL ───────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cinematch.db")

# Auto-fix: if someone set DATABASE_URL=./cinematch.db (missing sqlite:/// prefix)
if DATABASE_URL and not DATABASE_URL.startswith(("sqlite", "postgresql", "postgres")):
    DATABASE_URL = f"sqlite:///{DATABASE_URL}"

# Auto-fix: SQLAlchemy needs "postgresql://" not "postgres://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = DATABASE_URL.startswith("postgresql")

# ── Engine ─────────────────────────────────────────────────────────────────────
if IS_POSTGRES:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,       # Health-check connections before use
        pool_size=5,              # 5 persistent connections (fine for Supabase free tier)
        max_overflow=10,          # Allow 10 extra under burst load
        pool_recycle=300,         # Recycle connections every 5 minutes
        connect_args={
            "sslmode": "require", # Supabase requires SSL
            "connect_timeout": 10,
        },
    )
    print("[DB] Using PostgreSQL (Supabase)")
else:
    # SQLite for local development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragmas(dbapi_connection, connection_record):
        """Apply hardening pragmas on every new SQLite connection."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-64000")
        cursor.close()

    print("[DB] Using SQLite (local dev)")


def run_security_migration():
    """
    Idempotent migration for SQLite ONLY.
    PostgreSQL: SQLAlchemy create_all() handles schema automatically.
    """
    if IS_POSTGRES:
        try:
            from sqlalchemy import text
            with engine.connect() as pg_conn:
                pg_conn.execute(text("ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;"))
                pg_conn.commit()
                print("[DB] PostgreSQL migration verified: social_posts.is_archived")
        except Exception as e:
            print(f"[DB] PostgreSQL migration notice: {e}")
        return

    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), "cinematch.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Add failed_login_attempts (if missing)
    try:
        cursor.execute(
            "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0"
        )
    except sqlite3.OperationalError:
        pass

    # Add locked_until (if missing)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN locked_until DATETIME")
    except sqlite3.OperationalError:
        pass

    # Add parent_id to post_comments for threaded replies (if missing)
    try:
        cursor.execute(
            "ALTER TABLE post_comments ADD COLUMN parent_id INTEGER REFERENCES post_comments(id)"
        )
    except sqlite3.OperationalError:
        pass

    # Add is_archived to social_posts (if missing)
    try:
        cursor.execute(
            "ALTER TABLE social_posts ADD COLUMN is_archived BOOLEAN DEFAULT 0"
        )
    except sqlite3.OperationalError:
        pass

    # Create stories table (if missing)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            movie_id INTEGER,
            movie_title TEXT,
            movie_poster TEXT,
            movie_backdrop TEXT,
            media_type TEXT DEFAULT 'movie',
            caption TEXT,
            story_type TEXT DEFAULT 'pulse',
            rating REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_stories_user_id ON stories (user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_stories_created_at ON stories (created_at)")

    # Create story_reactions table (if missing)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS story_reactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reaction_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT _story_reaction_uc UNIQUE (story_id, user_id)
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_story_reactions_story_id ON story_reactions (story_id)")

    # Create refresh_tokens table (if missing)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            revoked INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash "
        "ON refresh_tokens (token_hash)"
    )

    conn.commit()
    conn.close()


# ── Session & Base ─────────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
