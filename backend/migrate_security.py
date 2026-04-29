"""
Migration: Add security columns to users table and create refresh_tokens table.
Run once: python migrate_security.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "cinematch.db")


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("🔐 Running security migration...")

    # 1. Add failed_login_attempts to users (if not exists)
    try:
        cursor.execute(
            "ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0"
        )
        print("  ✅ Added users.failed_login_attempts")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("  ⏭  users.failed_login_attempts already exists")
        else:
            raise

    # 2. Add locked_until to users (if not exists)
    try:
        cursor.execute(
            "ALTER TABLE users ADD COLUMN locked_until DATETIME"
        )
        print("  ✅ Added users.locked_until")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("  ⏭  users.locked_until already exists")
        else:
            raise

    # 3. Create refresh_tokens table (if not exists)
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
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash ON refresh_tokens (token_hash)"
    )
    print("  ✅ refresh_tokens table ready")

    conn.commit()
    conn.close()
    print("✅ Security migration complete!")


if __name__ == "__main__":
    migrate()
