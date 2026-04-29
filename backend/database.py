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
        return  # Postgres schema is managed by create_all() in main.py

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
