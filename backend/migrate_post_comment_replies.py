"""
migrate_post_comment_replies.py
================================
Adds threaded-reply support to post_comments: a nullable self-referential
parent_id column + an index for looking up a comment's replies. create_all()
only creates missing tables, not columns on tables that already exist, so
this fills the gap the same way migrate_social_feed_indexes.py does.
Run: python migrate_post_comment_replies.py
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
    print("Adding post_comments.parent_id for threaded replies...")
    cur.execute("""
        ALTER TABLE post_comments
            ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);
    """)
    conn.commit()
    print("post_comments.parent_id verified & ready!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate()
