"""Thread-safe Supabase database client helpers."""

import threading
from supabase import Client, create_client
from app.config import Config

_thread_local = threading.local()


def get_service_client() -> Client:
    """Return a thread-local Supabase client using the service-role key."""
    if not Config.SUPABASE_URL or not Config.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    client = getattr(_thread_local, "service_client", None)
    if client is None:
        client = create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)
        _thread_local.service_client = client
    return client


def get_anon_client() -> Client:
    """Return a thread-local Supabase client using the anon key for JWT verification."""
    if not Config.SUPABASE_URL or not Config.SUPABASE_ANON_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_ANON_KEY")
    client = getattr(_thread_local, "anon_client", None)
    if client is None:
        client = create_client(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY)
        _thread_local.anon_client = client
    return client
