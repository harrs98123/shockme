import re
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request

class BotBlockerMiddleware(BaseHTTPMiddleware):
    """
    Hardened Bot Blocker Middleware:
    Blocks automated scrapers, vulnerability scanners, and malicious bots,
    while allowing legitimate browser users and verified Vercel SSR/Server Action requests.
    """

    # High-risk attack tools & aggressive scrapers (Blocked universally)
    MALICIOUS_ATTACK_TOOLS = [
        r"sqlmap", r"nikto", r"zgrab", r"nmap", r"masscan", r"dirbuster",
        r"gobuster", r"wpscan", r"acunetix", r"nessus", r"netsparker"
    ]

    # Automated crawlers & scrapers
    BOT_PATTERNS = [
        r"googlebot", r"bingbot", r"yandexbot", r"baiduspider", r"duckduckbot",
        r"chrome\-lighthouse", r"headlesschrome", r"puppeteer", r"selenium",
        r"playwright", r"cypress", r"scraper", r"crawler", r"spider", r"scrapy"
    ]

    EXEMPT_PATHS = ["/health", "/docs", "/openapi.json"]

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 0. Skip check for health checks & docs
        if any(path.startswith(ex) for ex in self.EXEMPT_PATHS):
            return await call_next(request)

        user_agent = request.headers.get("user-agent", "").lower()

        # 1. ALWAYS block known security attack tools / vulnerability scanners
        for tool_pattern in self.MALICIOUS_ATTACK_TOOLS:
            if re.search(tool_pattern, user_agent):
                print(f"🚨 Security Alert: Blocked attack tool on {path} - {tool_pattern}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Request blocked for security reasons."}
                )

        # NOTE: there used to be a bypass here for any request carrying a
        # header prefixed "x-vercel-", intended to whitelist the Next.js
        # frontend's server-side fetches. That check is spoofable — headers
        # are plain client-supplied text, so any scraper could send
        # `X-Vercel-Anything: 1` and skip every check below. It was removed.
        # The frontend's server-side fetches instead send a normal,
        # non-bot-matching User-Agent (see frontend/lib/backendFetch.ts) so
        # they pass rule 3/4 below like any other legitimate client.

        # 3. Block empty User-Agents for direct client requests
        if not user_agent:
            print(f"🛑 Blocking access to {path} - Missing User-Agent")
            return JSONResponse(
                status_code=403,
                content={"detail": "Access denied. Please use a standard browser."}
            )

        # 4. Block known automated bots & scrapers
        for pattern in self.BOT_PATTERNS:
            if re.search(pattern, user_agent):
                print(f"🛑 Blocking access to {path} - Bot detected: {pattern}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Automated access is strictly prohibited."}
                )

        # 5. Protective Origin Validation on sensitive telemetry routes
        if path.startswith("/secret") or path.startswith("/admin"):
            sf_site = request.headers.get("sec-fetch-site")
            if sf_site and sf_site not in ["same-origin", "same-site", "none", "cross-site"]:
                print(f"🛑 Blocking access to {path} - Invalid Sec-Fetch-Site: {sf_site}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Request origin validation failed."}
                )

        return await call_next(request)
