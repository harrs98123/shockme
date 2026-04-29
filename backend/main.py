from dotenv import load_dotenv
import os

# Load environment variables with absolute path
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path, override=True)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from database import engine, Base, run_security_migration

import redis.asyncio as redis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

# Import all models so SQLAlchemy can create tables
import models  # noqa: F401

# Routers
from auth.router import router as auth_router
from movies.router import router as movies_router
from user.favorites import router as favorites_router
from user.watchlist import router as watchlist_router
from user.watched import router as watched_router
from user.ratings import router as ratings_router
from user.comments import router as comments_router
from user.debates import router as debates_router
from user.recommendations import router as recommendations_router
from user.ai_recommendations import router as ai_recommendations_router
from user.explanation_engine import router as explanation_router
from user.alternate_ending import router as alternate_ending_router
from user.moctale import router as moctale_router
from user.collections import router as collections_router
from user.tierlist import router as tierlist_router
from user.groups import router as groups_router
from user.verdict_battles import router as battles_router
from user.hidden_gems import router as hidden_gems_router
from user.predictions import router as predictions_router
from user.interests import router as interests_router
from user.secret import router as secret_router, limiter
from admin.router import router as admin_router
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.request_logging import RequestLoggingMiddleware
from middleware.bot_blocker import BotBlockerMiddleware

# Create all DB tables
Base.metadata.create_all(bind=engine)

# ── Environment ────────────────────────────────────────────────────────────────
APP_ENV = os.getenv("APP_ENV", "development")
IS_PRODUCTION = APP_ENV == "production"

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CineMatch API",
    description="Movie recommendation platform powered by TMDB",
    version="1.0.0",
    # Disable interactive docs in production — they expose the full API surface to bots
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

# ── Rate Limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware (order matters: added last = executed first) ────────────────────

# 1. GZip — compress responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. Trusted Hosts — reject requests with unexpected Host headers (prod only)
if IS_PRODUCTION:
    allowed_hosts = os.getenv("ALLOWED_HOSTS", "").split(",")
    allowed_hosts = [h.strip() for h in allowed_hosts if h.strip()]
    if allowed_hosts:
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# 3. CORS — explicit origins, methods, and headers only
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if IS_PRODUCTION:
    prod_origins = os.getenv("CORS_ORIGINS", "").split(",")
    CORS_ORIGINS = [o.strip() for o in prod_origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "X-Request-ID",
    ],
    expose_headers=["X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"],
    max_age=600,  # Cache preflight for 10 minutes
)

# 4. Security Headers
app.add_middleware(SecurityHeadersMiddleware)

# 5. Request Logging
app.add_middleware(RequestLoggingMiddleware)

# 6. Bot Blocker (Strict protection for telemetry)
app.add_middleware(BotBlockerMiddleware)

# ── Generic Error Handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Prevent internal stack traces from leaking in production."""
    if not IS_PRODUCTION:
        raise exc
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(movies_router)
app.include_router(favorites_router)
app.include_router(watchlist_router)
app.include_router(watched_router)
app.include_router(ratings_router)
app.include_router(comments_router)
app.include_router(debates_router)
app.include_router(recommendations_router)
app.include_router(ai_recommendations_router)
app.include_router(explanation_router)
app.include_router(alternate_ending_router)
app.include_router(moctale_router)
app.include_router(collections_router)
app.include_router(tierlist_router)
app.include_router(groups_router)
app.include_router(battles_router)
app.include_router(hidden_gems_router)
app.include_router(predictions_router)
app.include_router(interests_router)
app.include_router(secret_router)
app.include_router(admin_router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    # 0. Run DB migration first (idempotent — safe to call on every startup)
    run_security_migration()
    print("[System] Security migration verified")

    # 1. Initialize Redis Cache
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    FastAPICache.init(RedisBackend(r), prefix="fastapi-cache")
    print(f"[Cache] Redis Cache initialized: {redis_url[:30]}...")

    # 2. Verify Redis is reachable
    try:
        await r.ping()
        print("[Health] Redis health check passed")
    except Exception as e:
        print(f"[Warning] Redis health check failed: {e}")

    # 3. Seed admin account (after migration, so columns exist)
    seed_admin()

    print(f"[System] CineMatch API started in {APP_ENV.upper()} mode")


def seed_admin():
    """Seed the admin account on startup if it doesn't exist."""
    from database import SessionLocal
    from auth.utils import hash_password

    admin_email = os.getenv("ADMIN_EMAIL", "admin@cinematch.dev")
    admin_password = os.getenv("ADMIN_PASSWORD", "CineAdmin#2026")

    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == admin_email).first()
        if not existing:
            admin = models.User(
                name="Admin",
                email=admin_email,
                hashed_password=hash_password(admin_password),
                is_admin=True,
            )
            db.add(admin)
            db.commit()
            print(f"[Admin] Admin account seeded: {admin_email}")
        elif not existing.is_admin:
            existing.is_admin = True
            db.commit()
            print("[Admin] Existing account promoted to admin")
    finally:
        db.close()


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "🎬 CineMatch API is running!",
        "version": "1.0.0",
    }


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok", "env": APP_ENV}
