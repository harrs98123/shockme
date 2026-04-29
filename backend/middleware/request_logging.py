"""
Request Logging Middleware
Logs all incoming requests with method, path, status code, and duration.
Automatically redacts Authorization headers to avoid logging tokens.
"""
import time
import uuid
import logging
import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Configure structured logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("cinematch.access")

# Paths to skip verbose logging (health checks etc.)
SKIP_PATHS = {"/", "/health"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Generate unique request ID for tracing
        request_id = str(uuid.uuid4())[:8]
        start_time = time.perf_counter()

        # Get client IP (handle proxies)
        client_ip = (
            request.headers.get("CF-Connecting-IP")
            or request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
            or (request.client.host if request.client else "unknown")
        )

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000
        path = request.url.path

        if path not in SKIP_PATHS:
            log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
            logger.log(
                log_level,
                f"[{request_id}] {request.method} {path} "
                f"status={response.status_code} "
                f"ip={client_ip} "
                f"duration={duration_ms:.1f}ms"
            )

            # Log suspicious activity
            if response.status_code == 429:
                logger.warning(
                    f"[{request_id}] RATE_LIMITED ip={client_ip} path={path}"
                )
            elif response.status_code in (401, 403) and "/auth" in path:
                logger.warning(
                    f"[{request_id}] AUTH_FAILURE ip={client_ip} path={path}"
                )

        # Attach request ID to response headers for debugging
        response.headers["X-Request-ID"] = request_id
        return response
