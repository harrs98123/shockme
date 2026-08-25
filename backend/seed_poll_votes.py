import database, models, random
from sqlalchemy.orm.attributes import flag_modified

db = database.SessionLocal()
try:
    users = db.query(models.User).all()
    user_ids = [u.id for u in users]
    polls = db.query(models.SocialPost).filter(models.SocialPost.post_type == 'poll').all()
    
    print(f"Distributing realistic votes across {len(polls)} polls from {len(user_ids)} users...")
    for p in polls:
        payload = dict(p.payload or {})
        options = payload.get("options", [])
        if not options:
            continue
            
        num_options = len(options)
        voters = {}
        # Pick 15 to 35 random users to vote on this poll
        voter_sample = random.sample(user_ids, min(len(user_ids), random.randint(18, 36)))
        
        # Biased distribution so some options are clearly leading
        weights = [random.uniform(1.0, 4.0) for _ in range(num_options)]
        total_w = sum(weights)
        norm_weights = [w / total_w for w in weights]
        
        for uid in voter_sample:
            chosen_opt = random.choices(range(num_options), weights=norm_weights)[0]
            voters[str(uid)] = chosen_opt
            
        counts = [0] * num_options
        for opt in voters.values():
            counts[opt] += 1
            
        payload["voters"] = voters
        payload["votes"] = counts
        payload["total_votes"] = len(voters)
        
        p.payload = payload
        flag_modified(p, "payload")
        print(f"Poll ID {p.id} ({p.content[:40]}...) -> Total Votes: {len(voters)} | Counts: {counts}")
        
    db.commit()
    print("All polls successfully seeded with votes!")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
