from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from database import get_db
from models import User, WatchParty, WatchPartyParticipant
from auth.utils import get_current_user

router = APIRouter()

# ----------------- SCHEMAS -----------------

class WatchPartyCreate(BaseModel):
    movie_id: int
    title: str
    scheduled_time: datetime

class ParticipantOut(BaseModel):
    user_id: int
    name: str
    username: str
    avatar_url: str
    joined_at: datetime

class WatchPartyOut(BaseModel):
    id: int
    movie_id: int
    title: str
    scheduled_time: datetime
    status: str
    host: Dict[str, Any]
    participants: List[ParticipantOut]


# ----------------- ENDPOINTS -----------------

@router.post("/", response_model=WatchPartyOut)
def create_watch_party(party: WatchPartyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_party = WatchParty(
        host_id=current_user.id,
        movie_id=party.movie_id,
        title=party.title,
        scheduled_time=party.scheduled_time
    )
    db.add(new_party)
    db.commit()
    db.refresh(new_party)
    
    # Automatically add host as participant
    participant = WatchPartyParticipant(party_id=new_party.id, user_id=current_user.id)
    db.add(participant)
    db.commit()
    
    return format_watch_party(new_party)


@router.post("/{party_id}/join")
def join_watch_party(party_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    party = db.query(WatchParty).filter(WatchParty.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Watch Party not found")
        
    existing = db.query(WatchPartyParticipant).filter(
        WatchPartyParticipant.party_id == party_id,
        WatchPartyParticipant.user_id == current_user.id
    ).first()
    
    if existing:
        return {"status": "already joined"}
        
    participant = WatchPartyParticipant(party_id=party_id, user_id=current_user.id)
    db.add(participant)
    db.commit()
    
    return {"status": "joined"}


@router.get("/{party_id}", response_model=WatchPartyOut)
def get_watch_party(party_id: int, db: Session = Depends(get_db)):
    party = db.query(WatchParty).filter(WatchParty.id == party_id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Watch Party not found")
    return format_watch_party(party)


@router.get("/", response_model=List[WatchPartyOut])
def list_watch_parties(db: Session = Depends(get_db)):
    parties = db.query(WatchParty).order_by(WatchParty.scheduled_time.asc()).limit(50).all()
    return [format_watch_party(p) for p in parties]


# ----------------- HELPERS -----------------

def format_watch_party(party: WatchParty) -> Dict[str, Any]:
    participants = []
    for p in party.participants:
        participants.append({
            "user_id": p.user.id,
            "name": p.user.name,
            "username": p.user.username,
            "avatar_url": p.user.avatar_url,
            "joined_at": p.joined_at
        })
        
    return {
        "id": party.id,
        "movie_id": party.movie_id,
        "title": party.title,
        "scheduled_time": party.scheduled_time,
        "status": party.status,
        "host": {
            "id": party.host.id,
            "name": party.host.name,
            "username": party.host.username,
            "avatar_url": party.host.avatar_url
        },
        "participants": participants
    }
