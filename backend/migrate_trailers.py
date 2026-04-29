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
        print("Adding trailer_url to must_watch...")
        cursor.execute("ALTER TABLE must_watch ADD COLUMN trailer_url TEXT;")
        print("Column added successfully.")
    except sqlite3.OperationalError as e:
        print(f"MustWatch migration: {e} (likely already exists)")

    try:
        print("Adding trailer_url to gem_overrides...")
        cursor.execute("ALTER TABLE gem_overrides ADD COLUMN trailer_url TEXT;")
        print("Column added successfully.")
    except sqlite3.OperationalError as e:
        print(f"GemOverride migration: {e} (likely already exists)")

    conn.commit()
    conn.close()
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
