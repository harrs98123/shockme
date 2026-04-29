import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request

class BotBlockerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to aggressively block known crawlers and bots on sensitive telemetry routes.
    Prevents Vercel, Google, and other automated systems from scanning our viewing feature.
    """
    
    # Comprehensive bot and scraper patterns
    BOT_PATTERNS = [
        # Standard search bots
        r"googlebot", r"bingbot", r"yandexbot", r"baiduspider", r"duckduckbot",
        # Development/Test tools
        r"chrome\-lighthouse", r"vercelbot", r"twitterbot", r"slackbot", 
        r"headlesschrome", r"puppeteer", r"selenium", r"playwright", r"cypress",
        # Scraping libraries
        r"python\-requests", r"httpx", r"aiohttp", r"urllib", r"node\-fetch", 
        r"axios", r"got", r"cheerio", r"beautifulsoup",
        # Generic patterns
        r"scraper", r"crawler", r"spider", r"bot", r"scanning", r"monitoring",
        r"wget", r"curl", r"postman", r"insomnia"
    ]
    
    # Protect EVERYTHING by default
    PROTECTED_PREFIXES = ["/"]
    
    # Exceptions (e.g. public assets if needed, but for now we block all)
    EXEMPT_PATHS = ["/health", "/docs", "/openapi.json"]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # Skip check for exempt paths
        if any(path.startswith(ex) for ex in self.EXEMPT_PATHS):
            return await call_next(request)
            
        user_agent = request.headers.get("user-agent", "").lower()
        
        # 1. Block empty User-Agents (very common in simple scrapers)
        if not user_agent:
            print(f"🛑 Blocking access to {path} - Missing User-Agent")
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied. Please use a standard browser."}
            )
        
        # 2. Block known bot patterns
        for pattern in self.BOT_PATTERNS:
            if re.search(pattern, user_agent):
                print(f"🛑 Blocking access to {path} - Bot detected: {pattern}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Automated access is strictly prohibited."}
                )
        
        # 3. Block Vercel/Infrastructure headers
        if any(h.startswith("x-vercel-") for h in request.headers.keys()):
             print(f"🛑 Blocking access to {path} - Vercel infrastructure detected")
             return JSONResponse(
                status_code=403,
                content={"detail": "Cross-deployment access restricted."}
            )
            
        # 4. Sec-Fetch-Site Check (Modern Browsers)
        # On sensitive routes, we expect 'same-origin' or 'none' (direct navigation)
        if path.startswith("/telemetry"):
            sf_site = request.headers.get("sec-fetch-site")
            if sf_site and sf_site not in ["same-origin", "same-site", "none"]:
                print(f"🛑 Blocking access to {path} - Suspicious Sec-Fetch-Site: {sf_site}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Request origin validation failed."}
                )

        response = await call_next(request)
        return response
