import database, models

db = database.SessionLocal()
try:
    polls = db.query(models.SocialPost).filter(models.SocialPost.post_type == 'poll').all()
    print(f"Found {len(polls)} poll posts:")
    for p in polls:
        print(f"ID: {p.id} | Content: {p.content} | Payload: {p.payload}")
finally:
    db.close()
