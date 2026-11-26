"""Application configuration loaded from environment variables."""

import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")


class Config:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    ALLOWED_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]
    FLASK_ENV: str = os.getenv("FLASK_ENV", "development")
    PORT: int = int(os.getenv("PORT", "5001"))
    MAX_CONTENT_LENGTH: int = 6 * 1024 * 1024

    # V1 Environmental Dengue Suitability Engine (normalized weights summing to 1.0)
    ENV_WEIGHT_RAINFALL: float = 0.4375
    ENV_WEIGHT_TEMPERATURE: float = 0.3125
    ENV_WEIGHT_HUMIDITY: float = 0.2500
    RAINFALL_LAG_DAYS: int = 21
    MODEL_VERSION: str = "v1-heuristic-1.0"
