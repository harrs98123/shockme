"""
Auth Utilities — JWT, Password Hashing, Refresh Tokens, Token Blacklist
"""
import hashlib
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import redis.asyncio as aioredis
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
import models
from dotenv import load_dotenv

load_dotenv()

# ── Keys & Config ──────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "cinematch-default-secret-you-must-change-this")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", SECRET_KEY + "-refresh")
ALGORITHM = "HS256"

# Short-lived access token (30 minutes)
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
# Longer-lived refresh token (7 days)
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Account lockout: 5 failed attempts → 15-minute lockout
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# ── Password ───────────────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def validate_password_strength(password: str) -> str:
    """
    Enforce strong password policy.
    Returns error message string or empty string if valid.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return "Password must contain at least one digit."
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?`~]", password):
        return "Password must contain at least one special character."
    return ""


# ── JWT Access Token ───────────────────────────────────────────────────────────
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return int(user_id)
    except JWTError:
        return None


# ── JWT Refresh Token ──────────────────────────────────────────────────────────
def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh", "jti": secrets.token_hex(16)})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)


def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


def hash_token(token: str) -> str:
    """SHA-256 hash a token for safe storage."""
    return hashlib.sha256(token.encode()).hexdigest()


# ── Token Blacklist (Redis) ────────────────────────────────────────────────────
async def blacklist_access_token(token: str, redis_client: aioredis.Redis) -> None:
    """Add an access token to the Redis blacklist until it expires."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        exp = payload.get("exp")
        if exp:
            ttl = int(exp - datetime.now(timezone.utc).timestamp())
            if ttl > 0:
                await redis_client.setex(f"blacklist:{token}", ttl, "1")
    except Exception:
        pass


async def is_token_blacklisted(token: str, redis_client: aioredis.Redis) -> bool:
    """Check if an access token has been blacklisted (logged out)."""
    try:
        result = await redis_client.get(f"blacklist:{token}")
        return result is not None
    except Exception:
        return False


# ── Account Lockout ────────────────────────────────────────────────────────────
def check_account_locked(user: models.User) -> None:
    """Raise HTTP 423 if account is locked due to too many failed attempts."""
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        remaining = int((user.locked_until - datetime.now(timezone.utc)).total_seconds() / 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account temporarily locked due to too many failed login attempts. "
                   f"Try again in {remaining} minute(s).",
        )


def record_failed_login(user: models.User, db: Session) -> None:
    """Increment failed attempts; lock account after MAX_FAILED_ATTEMPTS."""
    user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
    db.commit()


def reset_failed_logins(user: models.User, db: Session) -> None:
    """Reset failed attempt counter after a successful login."""
    if user.failed_login_attempts:
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()


# ── Current User Dependency ────────────────────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
