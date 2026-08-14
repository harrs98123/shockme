import json
from fastapi_cache import FastAPICache


async def cache_get(key: str):
    """Read a JSON-serialized value from the shared Redis/InMemory cache backend."""
    try:
        backend = FastAPICache.get_backend()
        if backend:
            cached = await backend.get(key)
            if cached:
                return json.loads(cached) if isinstance(cached, (str, bytes)) else cached
    except Exception as e:
        print(f"⚠️ Cache read error: {e}")
    return None


async def cache_set(key: str, value, ttl: int):
    """Write a JSON-serializable value to the shared Redis/InMemory cache backend."""
    try:
        backend = FastAPICache.get_backend()
        if backend:
            await backend.set(key, json.dumps(value), expire=ttl)
    except Exception as e:
        print(f"⚠️ Cache write error: {e}")
