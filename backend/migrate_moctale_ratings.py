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
        print("Adding 'title' column to moctale_ratings...")
        cursor.execute("ALTER TABLE moctale_ratings ADD COLUMN title TEXT")
    except sqlite3.OperationalError as e:
        print(f"Skipping 'title': {e}")

    try:
        print("Adding 'poster_path' column to moctale_ratings...")
        cursor.execute("ALTER TABLE moctale_ratings ADD COLUMN poster_path TEXT")
    except sqlite3.OperationalError as e:
        print(f"Skipping 'poster_path': {e}")

    conn.commit()
    conn.close()
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
