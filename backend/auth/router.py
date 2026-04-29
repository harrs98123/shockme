from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth.utils import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_refresh_token, hash_token, get_current_user,
    check_account_locked, record_failed_login, reset_failed_logins,
    validate_password_strength, blacklist_access_token
)
from fastapi.security import OAuth2PasswordBearer
import random
import string
from datetime import datetime, timedelta, timezone
from auth.email import send_reset_email
import requests
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
import redis.asyncio as aioredis

router = APIRouter(prefix="/auth", tags=["auth"])

# Auth-specific rate limiter
_limiter = Limiter(key_func=get_remote_address)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_redis() -> aioredis.Redis:
    """Get async Redis client from env."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    return aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True)


def validate_turnstile(token: str, request: Request) -> bool:
    """Validate Turnstile CAPTCHA token with Cloudflare API."""
    secret_key = os.getenv("TURNSTILE_SECRET_KEY")
    app_env = os.getenv("APP_ENV", "development")
    
    if not secret_key:
        print("❌ Turnstile Error: TURNSTILE_SECRET_KEY not found in environment.")
        raise HTTPException(status_code=500, detail="Turnstile not configured")

    # Local development bypasses
    if app_env == "development":
        if token == "P1_TOKEN_ALWAYS_PASS" or token == "DEV_PASS":
            print("✅ Turnstile Bypass: Development mode bypass triggered.")
            return True

    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    data = {"secret": secret_key, "response": token}

    # Getting remote IP for verification (Cloudflare requires this to be accurate)
    remoteip = (
        request.headers.get("CF-Connecting-IP")
        or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
        or (request.client.host if request.client else None)
    )
    if remoteip and remoteip not in ["127.0.0.1", "::1"]:
        data["remoteip"] = remoteip

    try:
        response = requests.post(url, data=data, timeout=10)
        response.raise_for_status()
        result = response.json()
        
        success = result.get("success", False)
        if not success:
            error_codes = result.get("error-codes", ["unknown error"])
            print(f"❌ Turnstile Validation Failed: {error_codes}")
            # If the error is related to domain mismatch on localhost, we might want to log that specifically
        else:
            print(f"✅ Turnstile Validation Success for trace: {result.get('action')}")
            
        return success
    except requests.RequestException as e:
        print(f"⚠️ Turnstile Network Error: {e}")
        # In development, we might want to be more lenient if the network is down
        if app_env == "development":
            print("⚠️ Dev Mode: Allowing request despite Turnstile network error.")
            return True
        return False


def _store_refresh_token(user_id: int, refresh_token: str, db: Session) -> None:
    """Hash and persist a refresh token in the DB."""
    token_hash = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    record = models.RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(record)
    db.commit()


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/check-username", response_model=schemas.UsernameCheckResponse)
@_limiter.limit("30/minute")
def check_username(request: Request, username: str, db: Session = Depends(get_db)):
    """Check if username is available and provide suggestions if taken."""
    if not username or len(username) < 3:
        return {"available": False, "suggestions": []}

    taken = db.query(models.User).filter(models.User.username == username).first()
    if not taken:
        return {"available": True, "suggestions": []}

    suggestions = [
        f"{username}{random.randint(100, 999)}",
        f"{username}_cine",
        f"{username}_match",
        f"{username}_fan",
    ]
    available_suggestions = [
        s for s in suggestions
        if not db.query(models.User).filter(models.User.username == s).first()
    ]
    return {"available": False, "suggestions": available_suggestions[:3]}


@router.post("/register", response_model=schemas.Token)
@_limiter.limit("5/minute")
def register(user_data: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    # 1. CAPTCHA check
    if not user_data.turnstile_token or not validate_turnstile(user_data.turnstile_token, request):
        raise HTTPException(status_code=400, detail="Invalid captcha verification")

    # 2. Password strength
    pw_error = validate_password_strength(user_data.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    # 3. Duplicate checks
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    # 4. Create user
    user = models.User(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    _store_refresh_token(user.id, refresh_token, db)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=schemas.Token)
@_limiter.limit("10/minute")
def login(credentials: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    # 1. CAPTCHA check
    if not credentials.turnstile_token or not validate_turnstile(credentials.turnstile_token, request):
        raise HTTPException(status_code=400, detail="Invalid captcha verification")

    # 2. Find user (by email or username)
    user = db.query(models.User).filter(
        (models.User.email == credentials.login_id) |
        (models.User.username == credentials.login_id)
    ).first()

    # 3. Account lockout check
    if user:
        check_account_locked(user)

    # 4. Verify password
    if not user or not verify_password(credentials.password, user.hashed_password):
        if user:
            record_failed_login(user, db)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password",
        )

    # 5. Successful login — reset counters
    reset_failed_logins(user, db)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    _store_refresh_token(user.id, refresh_token, db)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/refresh")
@_limiter.limit("20/minute")
async def refresh_token_endpoint(
    request: Request,
    payload: schemas.RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """Exchange a valid refresh token for a new access token."""
    token_payload = decode_refresh_token(payload.refresh_token)
    if not token_payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    token_hash = hash_token(payload.refresh_token)
    stored = db.query(models.RefreshToken).filter(
        models.RefreshToken.token_hash == token_hash,
        models.RefreshToken.revoked == False,
    ).first()

    if not stored or stored.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Refresh token invalid or expired")

    # Rotate: revoke old, issue new
    stored.revoked = True
    db.commit()

    user_id = int(token_payload["sub"])
    new_access = create_access_token({"sub": str(user_id)})
    new_refresh = create_refresh_token({"sub": str(user_id)})
    _store_refresh_token(user_id, new_refresh, db)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Invalidate the current access token and all refresh tokens for the user."""
    redis_client = get_redis()
    await blacklist_access_token(token, redis_client)

    # Revoke all refresh tokens for this user
    db.query(models.RefreshToken).filter(
        models.RefreshToken.user_id == current_user.id,
        models.RefreshToken.revoked == False,
    ).update({"revoked": True})
    db.commit()

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=schemas.UserOut)
def update_profile(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.username is not None:
        if payload.username != current_user.username:
            taken = db.query(models.User).filter(models.User.username == payload.username).first()
            if taken:
                raise HTTPException(400, "Username already taken")
        current_user.username = payload.username
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
@_limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    payload: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        # Don't reveal if the email exists
        return {"message": "If your email is registered, you will receive a verification code."}

    # Delete any stale reset codes first
    db.query(models.PasswordReset).filter(models.PasswordReset.email == payload.email).delete()
    db.commit()

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    reset_entry = models.PasswordReset(email=payload.email, code=code, expires_at=expires_at)
    db.add(reset_entry)
    db.commit()

    background_tasks.add_task(send_reset_email, payload.email, code)
    return {"message": "Verification code sent to your email."}


@router.post("/verify-code")
@_limiter.limit("10/minute")
def verify_code(request: Request, payload: schemas.VerifyCodeRequest, db: Session = Depends(get_db)):
    reset_entry = db.query(models.PasswordReset).filter(
        models.PasswordReset.email == payload.email,
        models.PasswordReset.code == payload.code,
        models.PasswordReset.expires_at > datetime.now(timezone.utc),
    ).first()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    return {"message": "Code verified successfully."}


@router.post("/reset-password")
@_limiter.limit("5/minute")
def reset_password(request: Request, payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    # Re-verify code
    reset_entry = db.query(models.PasswordReset).filter(
        models.PasswordReset.email == payload.email,
        models.PasswordReset.code == payload.code,
        models.PasswordReset.expires_at > datetime.now(timezone.utc),
    ).first()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    # Password strength check
    pw_error = validate_password_strength(payload.new_password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    # Clean up all reset codes
    db.query(models.PasswordReset).filter(models.PasswordReset.email == payload.email).delete()
    db.commit()

    return {"message": "Password reset successfully. You can now log in with your new password."}
