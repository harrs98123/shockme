from dotenv import load_dotenv
import os

# Load environment variables with absolute path
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path, override=True)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse
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
from user.public_profile import router as public_profile_router
from user.social_feed import router as social_feed_router
from user.stories import router as stories_router
from user.watch_party import router as watch_party_router
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
    # orjson serializes 2-5x faster than the stdlib json used by the default response class
    default_response_class=ORJSONResponse,
)

# ── Rate Limiter ───────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Middleware (order matters: added last = executed first) ────────────────────

# 1. GZip — compress responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. Trusted Hosts — reject requests with unexpected Host headers (prod only)
# NOTE: Render proxies requests through their load balancer. The Host header
# can be the external domain OR an internal Render hostname. We include both.
if IS_PRODUCTION:
    env_hosts = os.getenv("ALLOWED_HOSTS", "")
    if env_hosts.strip():
        allowed_hosts = [h.strip() for h in env_hosts.split(",") if h.strip()]
        # Always include Render-internal patterns and localhost for health checks
        render_defaults = [
            "*.onrender.com",
            "localhost",
            "127.0.0.1",
        ]
        for h in render_defaults:
            if h not in allowed_hosts:
                allowed_hosts.append(h)
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)
        print(f"[Security] TrustedHostMiddleware active for: {allowed_hosts}")
    else:
        # ALLOWED_HOSTS not configured — skip middleware to avoid blocking all traffic.
        # Set this env var in Render dashboard: ALLOWED_HOSTS=shockme-1.onrender.com,shockme.vercel.app
        print("[Warning] ALLOWED_HOSTS not set — TrustedHostMiddleware disabled. Set it in Render env vars.")

# 3. CORS — explicit origins in prod, permissive regex in dev
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:19006",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:19006",
]
if IS_PRODUCTION:
    prod_origins = os.getenv("CORS_ORIGINS", "").split(",")
    CORS_ORIGINS = [o.strip() for o in prod_origins if o.strip()]
    if not CORS_ORIGINS:
        CORS_ORIGINS = [
            "https://shockme.vercel.app",
            "http://localhost:3000",
        ]
        print("[Warning] CORS_ORIGINS not set — using fallback origins.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=None if IS_PRODUCTION else r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$",
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
app.include_router(public_profile_router)
app.include_router(social_feed_router, tags=["Social Feed"])
app.include_router(stories_router)
app.include_router(watch_party_router, prefix="/watch-parties", tags=["Watch Parties"])
app.include_router(secret_router)
app.include_router(admin_router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    # 0. Run DB migration first (idempotent — safe to call on every startup)
    run_security_migration()
    print("[System] Security migration verified")

    # 1. Initialize Cache with graceful Redis check & InMemory fallback
    redis_url = os.getenv("REDIS_URL", "")
    redis_connected = False

    if redis_url:
        try:
            r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True, socket_connect_timeout=3)
            await r.ping()
            FastAPICache.init(RedisBackend(r), prefix="fastapi-cache")
            redis_connected = True
            print(f"[Cache] Redis Cache initialized: {redis_url[:30]}...")
        except Exception as e:
            print(f"[Warning] Redis connection failed ({e}). Falling back to InMemoryBackend.")

    if not redis_connected:
        from fastapi_cache.backends.inmemory import InMemoryBackend
        FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")
        print("[Cache] InMemoryBackend initialized for local caching.")

    # 3. Seed admin account (after migration, so columns exist)
    seed_admin()

    print(f"[System] CineMatch API started in {APP_ENV.upper()} mode")
    print(f"[Config] ALLOWED_HOSTS={os.getenv('ALLOWED_HOSTS', '<not set>')}")
    print(f"[Config] CORS_ORIGINS={os.getenv('CORS_ORIGINS', '<not set>')}")
    print(f"[Config] TMDB_API_KEY={'set' if os.getenv('TMDB_API_KEY') else 'MISSING!'}")
    print(f"[Config] DATABASE_URL={'set' if os.getenv('DATABASE_URL') else 'MISSING!'}")
    print(f"[Config] REDIS_URL={'set' if os.getenv('REDIS_URL') else 'not set (using InMemory cache)'})")


def seed_admin():
    """Seed the admin account on startup if it doesn't exist."""
    from database import SessionLocal
    from auth.utils import hash_password

    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if not admin_email or not admin_password:
        print("[Admin] WARNING: ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin seed.")
        return

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
@app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
def root():
    return {
        "message": "🎬 CineMatch API is running!",
        "version": "1.0.0",
    }


@app.api_route("/health", methods=["GET", "HEAD"], include_in_schema=False)
def health():
    return {"status": "ok", "env": APP_ENV}


if __name__ == "__main__":
    import subprocess
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    venv_python = os.path.join(project_root, ".venv", "Scripts", "python.exe")

    if os.path.exists(venv_python) and os.path.normpath(sys.executable).lower() != os.path.normpath(venv_python).lower():
        sys.exit(subprocess.call([venv_python] + sys.argv))

    import uvicorn
    host = os.getenv("HOST", "0.0.0.0" if IS_PRODUCTION else "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=not IS_PRODUCTION)


