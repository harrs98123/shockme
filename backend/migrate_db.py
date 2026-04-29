import sqlite3
import os

DB_PATH = "cinematch.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Adding 'username' column...")
        cursor.execute("ALTER TABLE users ADD COLUMN username TEXT")
    except sqlite3.OperationalError as e:
        print(f"Skipping 'username': {e}")

    try:
        print("Adding 'bio' column...")
        cursor.execute("ALTER TABLE users ADD COLUMN bio TEXT")
    except sqlite3.OperationalError as e:
        print(f"Skipping 'bio': {e}")

    try:
        print("Adding 'avatar_url' column...")
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url TEXT")
    except sqlite3.OperationalError as e:
        print(f"Skipping 'avatar_url': {e}")

    try:
        print("Adding 'is_admin' column...")
        # SQLite doesn't support BOOLEAN natively, it uses INTEGER (0/1). 
        # But SQLAlchemy handles Booleans as 0/1.
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL")
    except sqlite3.OperationalError as e:
        print(f"Skipping 'is_admin': {e}")

    conn.commit()
    conn.close()
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
