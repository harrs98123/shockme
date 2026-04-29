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
        print("Creating 'must_watch' table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS must_watch (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                movie_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                poster_path TEXT,
                backdrop_path TEXT,
                vote_average REAL,
                release_date TEXT,
                overview TEXT,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS _must_watch_movie_id_uc ON must_watch (movie_id)")
        print("Table 'must_watch' created or already exists.")
    except sqlite3.OperationalError as e:
        print(f"Error creating 'must_watch': {e}")

    conn.commit()
    conn.close()
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
