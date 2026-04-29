"""
Security Headers Middleware
Injects hardened HTTP security headers into every response to protect against
XSS, clickjacking, MIME-sniffing, and other common browser-based attacks.
"""
import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        app_env = os.getenv("APP_ENV", "development")

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        # Note: frame-ancestors in CSP (below) overrides this in modern browsers
        response.headers["X-Frame-Options"] = "SAMEORIGIN"

        # Stop sending Referer to third-party sites
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Limit browser feature access
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), "
            "payment=(), usb=(), interest-cohort=()"
        )

        # Remove server version info
        response.headers["X-Powered-By"] = "CineMatch"
        if "server" in response.headers:
            del response.headers["server"]

        # HSTS — only meaningful over HTTPS, safe to add always
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )

        # Content Security Policy
        # Allows: same-origin, TMDB images, Cloudinary images, Cloudflare Turnstile
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' https://challenges.cloudflare.com",
            "style-src 'self' 'unsafe-inline'", # 'unsafe-inline' is needed for some UI libs, but restricted to 'self' styles
            "img-src 'self' data: https://image.tmdb.org https://res.cloudinary.com https://lh3.googleusercontent.com",
            "font-src 'self' data:",
            "connect-src 'self' https://api.themoviedb.org https://challenges.cloudflare.com https://res.cloudinary.com",
            "frame-src 'self' http://localhost:8000 https://www.youtube.com https://youtube.com https://challenges.cloudflare.com https://screenscape.me https://widget.cloudinary.com https://upload-widget.cloudinary.com",
            "frame-ancestors 'self' http://localhost:3000",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "worker-src 'none'",
            "manifest-src 'self'",
            "upgrade-insecure-requests" if app_env == "production" else "",
        ]
        # Filter empty directives
        csp = "; ".join(d for d in csp_directives if d)
        response.headers["Content-Security-Policy"] = csp

        # X-XSS-Protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        return response
