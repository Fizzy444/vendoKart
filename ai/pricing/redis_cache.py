import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger("artisan.cache")


class RedisPricingCache:
    """
    Redis Cache for Pricing Intelligence, Market Benchmarks, and Negotiation State.
    Falls back gracefully to fast in-memory caching if Redis server is unavailable.
    """

    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._memory_cache = {}
        self._redis_client = None
        self._is_redis_available = False
        self._init_connection()

    def _init_connection(self):
        try:
            import redis
            self._redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=0.5,
                socket_connect_timeout=0.5
            )
            self._redis_client.ping()
            self._is_redis_available = True
            logger.info("Redis cache connected successfully.")
        except Exception:
            self._redis_client = None
            self._is_redis_available = False
            logger.info("Redis server offline. Active in-memory cache fallback.")

    def get(self, key: str) -> Optional[Any]:
        if self._is_redis_available and self._redis_client:
            try:
                val = self._redis_client.get(key)
                if val:
                    return json.loads(val)
            except Exception:
                pass
        return self._memory_cache.get(key)

    def set(self, key: str, value: Any, ttl_seconds: int = 3600):
        serialized = json.dumps(value, default=str)
        if self._is_redis_available and self._redis_client:
            try:
                self._redis_client.setex(key, ttl_seconds, serialized)
                return
            except Exception:
                pass
        self._memory_cache[key] = value

    def delete(self, key: str):
        if self._is_redis_available and self._redis_client:
            try:
                self._redis_client.delete(key)
            except Exception:
                pass
        self._memory_cache.pop(key, None)


# Global singleton instance
pricing_cache = RedisPricingCache()
