"""
seed_follows.py
===============
Seeds realistic follow relationships between seed users so the social feed is active!
Run: python seed_follows.py
"""

import os, sys, re, random

try:
    import psycopg2, psycopg2.extras
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "--quiet"])
    import psycopg2, psycopg2.extras

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

def seed_follows():
    conn = psycopg2.connect(
        host=db_host, port=int(db_port), dbname=db_name,
        user=db_user, password=db_pass, sslmode="require", connect_timeout=15
    )
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    cur.execute("SELECT id, username FROM users")
    users = cur.fetchall()
    user_ids = [u["id"] for u in users]

    if len(user_ids) < 2:
        print("Not enough users to seed follows.")
        return

    print(f"Seeding follow relations among {len(user_ids)} users...")
    created = 0

    for uid in user_ids:
        # Each user follows 4 to 8 other random users
        target_count = min(random.randint(4, 8), len(user_ids) - 1)
        potential_targets = [tid for tid in user_ids if tid != uid]
        targets = random.sample(potential_targets, target_count)

        for tid in targets:
            try:
                cur.execute("""
                    INSERT INTO user_follows (follower_id, following_id, created_at)
                    VALUES (%s, %s, NOW())
                    ON CONFLICT DO NOTHING
                """, (uid, tid))
                created += 1
            except Exception:
                conn.rollback()

    conn.commit()
    print(f"Done! Seeded {created} follow connections across the community.")
    print("Your Following Feed at http://localhost:3000/feed is now live!\n")
    cur.close()
    conn.close()

if __name__ == "__main__":
    seed_follows()
