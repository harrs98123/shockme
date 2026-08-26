"""
migrate_social_feed_indexes.py
================================
Adds composite indexes for the social feed's actual query patterns
(filter + order by created_at) to PostgreSQL. create_all() only creates
missing tables, not indexes on tables that already exist, so this fills
the gap the same way migrate_user_follows.py does for its table.
Run: python migrate_social_feed_indexes.py
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
    print("Creating social feed composite indexes...")
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_social_posts_user_created ON social_posts(user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_social_posts_movie_created ON social_posts(movie_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, created_at ASC);
    """)
    conn.commit()
    print("Social feed indexes verified & ready!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate()
