"""
migrate_user_follows.py
========================
Creates the user_follows table in PostgreSQL if not present.
Run: python migrate_user_follows.py
"""

import os, sys, re, subprocess

try:
    import psycopg2
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2

env_path = os.path.join(os.path.dirname(__file__), ".env")
env_vars = {}
if os.path.exists(env_path):
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

def migrate():
    conn = psycopg2.connect(
        host=db_host, port=int(db_port), dbname=db_name,
        user=db_user, password=db_pass, sslmode="require", connect_timeout=15
    )
    cur = conn.cursor()
    print("Creating user_follows table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_follows (
            id SERIAL PRIMARY KEY,
            follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT _user_follow_uc UNIQUE (follower_id, following_id)
        );
        CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
        CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
    """)
    conn.commit()
    print("user_follows table verified & ready!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate()
