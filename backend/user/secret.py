import httpx
import os
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth.router import get_current_user
import models
from slowapi import Limiter
from slowapi.util import get_remote_address
from cryptography.fernet import Fernet

# Initialize limiter
limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/telemetry", tags=["system"])

import time

# Encryption Key setup
ENCRYPTION_KEY = os.getenv("SECURITY_ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # Use a dummy key if not provided to prevent crashes, but warn in console
    print("⚠️  SECURITY_ENCRYPTION_KEY not found in environment!")
    ENCRYPTION_KEY = "XksT7gz5rSEvD5IiuvKy-8HCYqw8CrPnmG6H8X2NS7A="

cipher = Fernet(ENCRYPTION_KEY.encode())

def generate_opaque_token(movie_id: int, media_type: str) -> str:
    """Generate an encrypted token containing movie info and expiration."""
    # Token valid for 15 minutes
    data = {
        "id": movie_id, 
        "type": media_type, 
        "exp": int(time.time()) + 900 
    }
    return cipher.encrypt(json.dumps(data).encode()).decode()

def parse_opaque_token(token: str) -> dict:
    """Decrypt the opaque token and verify expiration."""
    try:
        data = json.loads(cipher.decrypt(token.encode()).decode())
        # Check expiration
        if int(time.time()) > data.get("exp", 0):
            print("🕒 Blocking access - Token expired")
            return None
        return data
    except Exception:
        return None

class ProvisionData(BaseModel):
    id: int
    media_type: str = "movie"

@router.post("/provision")
@limiter.limit("10/minute")
async def provision_access(
    request: Request,
    body: ProvisionData,
    current_user: models.User = Depends(get_current_user)
):
    """
    Generate a one-time encrypted token for system diagnostics.
    Cloaks the object ID from being logged in plaintext.
    """
    token = generate_opaque_token(body.id, body.media_type)
    return {"token": token}


@router.get("/stream-viewer", response_class=HTMLResponse)
async def stream_viewer(request: Request, t: str):
    """
    Secure stream viewer proxy.
    Requires an encrypted token 't' instead of raw IDs.
    """
    # 1. Referer verification (ensure request comes from our own frontend)
    referer = request.headers.get("referer", "")
    app_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    if not referer.startswith(app_url) and os.getenv("APP_ENV") == "production":
        print(f"🛑 Blocking access to stream-viewer - Unauthorized Referer: {referer}")
        raise HTTPException(status_code=403, detail="Unauthorized request source.")

    # 2. Token verification
    info = parse_opaque_token(t)
    if not info:
        raise HTTPException(status_code=403, detail="Diagnostic token invalid or expired.")

    # Safety extraction with type casting
    movie_id = int(info.get("id") or 0)
    media_type = str(info.get("type") or "movie")
    
    if not movie_id:
        raise HTTPException(status_code=400, detail="Malformed diagnostic data.")

    # Provider selection
    provider_url = f"https://screenscape.me/embed?tmdb={movie_id}&type={media_type}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="robots" content="noindex, nofollow">
        <title>System Diagnostics - Feed Active</title>
        <style>
            body, html {{
                margin: 0; padding: 0; width: 100%; height: 100%;
                overflow: hidden; background-color: #000;
                display: flex; align-items: center; justify-content: center;
                font-family: monospace;
            }}
            .container {{ width: 100%; height: 100%; position: relative; }}
            iframe {{ width: 100%; height: 100%; border: none; background-color: #000; }}
            .overlay {{
                position: absolute; top: 10px; right: 10px;
                background: rgba(0,0,0,0.7); color: rgba(0,255,0,0.5);
                padding: 4px 10px; border-radius: 4px; font-size: 10px;
                pointer-events: none; z-index: 10;
                border: 1px solid rgba(0,255,0,0.2);
                text-transform: uppercase; letter-spacing: 1px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <iframe 
                src="{provider_url}" 
                allowfullscreen 
                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                referrerpolicy="no-referrer"
            ></iframe>
        </div>
    </body>
    </html>
    """
    headers = {
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache"
    }
    return HTMLResponse(content=html_content, headers=headers)

class OpaqueTelemetryData(BaseModel):
    cid: int  # Cloaked ID (movie_id)
    sid: str  # Session ID (session_code)
    stk: str  # Security Token (security_token)

@router.post("/sync")
@limiter.limit("5/minute")
async def sync_telemetry(
    request: Request,
    body: OpaqueTelemetryData,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Internal telemetry sync using cloaked fields.
    """
    # 0. Check System Logging Mode
    is_verbose_logging = os.getenv("SYSTEM_VERBOSE_LOGGING", "true").lower() == "true"
    if is_verbose_logging:
        raise HTTPException(
            status_code=403, 
            detail="Extended diagnostics disabled in this environment."
        )

    # 1. Verify Token
    turnstile_secret = os.getenv("TURNSTILE_SECRET_KEY")
    app_env = os.getenv("APP_ENV", "development")

    if turnstile_secret:
        if app_env == "development" and body.stk == "DEV_PASS":
            pass
        else:
            async with httpx.AsyncClient() as client:
                data = {"secret": turnstile_secret, "response": body.stk}
                remoteip = request.client.host if request.client else None
                if remoteip and remoteip not in ["127.0.0.1", "::1"]:
                    data["remoteip"] = remoteip

                resp = await client.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", data=data)
                outcome = resp.json()
                if not outcome.get("success"):
                    raise HTTPException(status_code=400, detail="Security verification failed.")

    # 2. Check Session Code
    expected_code = os.getenv("TELEMETRY_SESSION_CODE", "amanbhansingh3388")
    if body.sid != expected_code:
        raise HTTPException(status_code=403, detail="Invalid diagnostic session.")

    # 3. Verify Engagement (Rating >= 3.5)
    rating = db.query(models.Rating).filter(
        models.Rating.user_id == current_user.id,
        models.Rating.movie_id == body.cid,
        models.Rating.media_type == "movie"
    ).first()

    if not rating or rating.rating < 3.5:
        raise HTTPException(status_code=403, detail="Insufficient telemetry density.")

    # 4. Verify Label (Status 1)
    moctale = db.query(models.MoctaleRating).filter(
        models.MoctaleRating.user_id == current_user.id,
        models.MoctaleRating.movie_id == body.cid,
        models.MoctaleRating.media_type == "movie"
    ).first()

    if not moctale or moctale.label != "perfection":
        raise HTTPException(status_code=403, detail="Diagnostic validation failed.")

    return {
        "status": "synchronized",
        "sync_id": f"D-{body.cid}-OK"
    }

