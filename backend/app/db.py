"""Supabase database client helpers."""

from functools import lru_cache
from supabase import Client, create_client
from app.config import Config


@lru_cache(maxsize=1)
def get_service_client() -> Client:
    """Return a cached Supabase client using the service-role key (server-side only)."""
    if not Config.SUPABASE_URL or not Config.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)


@lru_cache(maxsize=1)
def get_anon_client() -> Client:
    """Return a cached Supabase client using the anon key for JWT verification."""
    if not Config.SUPABASE_URL or not Config.SUPABASE_ANON_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_ANON_KEY")
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)
