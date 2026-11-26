"""Simple sliding-window in-memory rate limiter for API protection."""

import time
from collections import defaultdict, deque
from functools import wraps
from flask import g, jsonify, request

_BUCKETS: dict[str, deque[float]] = defaultdict(deque)


def rate_limit(max_requests: int, window_seconds: int, key_prefix: str = "rl"):
    """Limit requests per authenticated user ID (or client IP) within a sliding window."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, "current_user", None)
            ident = user["id"] if user else (request.remote_addr or "unknown")
            bucket_key = f"{key_prefix}:{ident}"
            now = time.monotonic()
            q = _BUCKETS[bucket_key]
            while q and q[0] <= now - window_seconds:
                q.popleft()
            if len(q) >= max_requests:
                return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429
            q.append(now)
            return fn(*args, **kwargs)
        return wrapper
    return decorator
