#!/usr/bin/env python3
"""CLI entrypoint for scheduled or manual Open-Meteo weather & AQ ingestion."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.ingestion import ingest_weather
from app.notifications import dispatch_high_risk_alerts


def main():
    parser = argparse.ArgumentParser(description="Ingest Open-Meteo data for all 64 Bangladesh districts.")
    parser.add_argument("--days", type=int, default=7, help="Days to backfill (e.g., 90 for initial backfill)")
    parser.add_argument("--no-aq", action="store_true", help="Skip air quality ingestion")
    parser.add_argument("--notify", action="store_true", help="Dispatch high/critical alerts to subscribers")
    args = parser.parse_args()

    result = ingest_weather(days_back=args.days, include_air_quality=not args.no_aq)
    if args.notify:
        result["notifications"] = dispatch_high_risk_alerts()
    print(json.dumps(result, indent=2))
    if result.get("status") == "failed":
        sys.exit(1)


if __name__ == "__main__":
    main()
