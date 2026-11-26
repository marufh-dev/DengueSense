"""Modular notification dispatcher (Email SMTP & Telegram) with deduplication."""

from __future__ import annotations

import logging
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from typing import Any
from zoneinfo import ZoneInfo

import requests
from app.db import get_service_client

logger = logging.getLogger(__name__)
DHAKA_TZ = ZoneInfo("Asia/Dhaka")
ALERT_LEVELS = {"HIGH", "CRITICAL"}


def send_telegram_message(chat_id: str, text: str) -> bool:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token or not chat_id:
        return False
    resp = requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": text},
        timeout=15,
    )
    resp.raise_for_status()
    return True


def send_email_message(to_email: str, subject: str, body: str) -> bool:
    host = os.getenv("SMTP_HOST", "").strip()
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    sender = os.getenv("SMTP_FROM", user).strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    if not host or not user or not password or not to_email:
        return False

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(user, password)
        server.send_message(msg)
    return True


def dispatch_high_risk_alerts() -> dict[str, int]:
    """Send deduplicated alerts to opted-in active subscribers for HIGH/CRITICAL districts."""
    svc = get_service_client()
    today_str = datetime.now(DHAKA_TZ).date().isoformat()

    risk_rows = (
        svc.table("daily_risk_scores")
        .select("district_id, risk_level, environmental_score, districts(name_en)")
        .eq("score_date", today_str)
        .in_("risk_level", list(ALERT_LEVELS))
        .execute()
        .data
    )
    if not risk_rows:
        return {"sent": 0, "skipped_dedup": 0, "skipped_unconfigured": 0}

    risk_by_dist = {r["district_id"]: r for r in risk_rows}
    subs = (
        svc.table("alert_subscriptions")
        .select("id, user_id, district_id, notification_channels, telegram_chat_id, is_active")
        .eq("is_active", True)
        .in_("district_id", list(risk_by_dist.keys()))
        .execute()
        .data
    )

    sent = 0
    skipped_dedup = 0
    skipped_unconfigured = 0

    for sub in subs or []:
        rk = risk_by_dist[sub["district_id"]]
        dist_name = (rk.get("districts") or {}).get("name_en", "District")
        level = rk["risk_level"]
        score = rk["environmental_score"]
        msg_text = (
            f"DengueSense Alert ({today_str}): {dist_name} is at {level} "
            f"environmental dengue suitability (EDSI: {score}/100). "
            "Check local stagnant water conditions."
        )

        for channel in sub.get("notification_channels") or ["email"]:
            # Deduplication check
            existing = (
                svc.table("notification_history")
                .select("id")
                .eq("subscription_id", sub["id"])
                .eq("alert_date", today_str)
                .eq("risk_level", level)
                .eq("channel", channel)
                .maybe_single()
                .execute()
            )
            if existing and existing.data:
                skipped_dedup += 1
                continue

            delivered = False
            try:
                if channel == "telegram" and sub.get("telegram_chat_id"):
                    delivered = send_telegram_message(sub["telegram_chat_id"], msg_text)
                elif channel == "email":
                    user_obj = svc.auth.admin.get_user_by_id(sub["user_id"])
                    email = getattr(getattr(user_obj, "user", None), "email", None)
                    if email:
                        delivered = send_email_message(
                            email,
                            f"[DengueSense] {level} Environmental Suitability — {dist_name}",
                            msg_text,
                        )
            except Exception as exc:
                logger.warning("Failed to send %s alert for sub %s: %s", channel, sub["id"], exc)

            if not delivered:
                skipped_unconfigured += 1
                continue

            svc.table("notification_history").insert({
                "subscription_id": sub["id"],
                "user_id": sub["user_id"],
                "district_id": sub["district_id"],
                "alert_date": today_str,
                "risk_level": level,
                "channel": channel,
                "status": "sent",
                "message": msg_text,
            }).execute()
            sent += 1

    return {
        "sent": sent,
        "skipped_dedup": skipped_dedup,
        "skipped_unconfigured": skipped_unconfigured,
    }
