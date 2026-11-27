"""Modular notification dispatcher (Email SMTP & Telegram) with deduplication."""

from __future__ import annotations

import logging
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

import requests
from app.db import get_service_client

# Force load .env from project root and backend dir
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logger = logging.getLogger(__name__)
DHAKA_TZ = ZoneInfo("Asia/Dhaka")
ALERT_LEVELS = {"HIGH", "CRITICAL"}

# Verified live gateway fallback configurations (read securely from environment)
DEFAULT_TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
DEFAULT_RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
DEFAULT_SMTP_HOST = os.getenv("SMTP_HOST", "smtp.resend.com").strip()
DEFAULT_SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
DEFAULT_SMTP_USER = os.getenv("SMTP_USER", "resend").strip()
DEFAULT_SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
DEFAULT_SMTP_FROM = os.getenv("SMTP_FROM", "onboarding@resend.dev").strip()


def send_telegram_message(chat_id: str, text: str) -> bool:
    token = (os.getenv("TELEGRAM_BOT_TOKEN") or DEFAULT_TELEGRAM_BOT_TOKEN).strip()
    if not token or not chat_id:
        return False
    resp = requests.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": text},
        timeout=15,
    )
    resp.raise_for_status()
    logger.info("Telegram message sent successfully to chat_id=%s", chat_id)
    return True


def send_email_message(to_email: str, subject: str, body: str) -> bool:
    resend_key = (os.getenv("RESEND_API_KEY") or DEFAULT_RESEND_API_KEY).strip()
    host = (os.getenv("SMTP_HOST") or DEFAULT_SMTP_HOST).strip()
    user = (os.getenv("SMTP_USER") or DEFAULT_SMTP_USER).strip()
    password = (os.getenv("SMTP_PASSWORD") or DEFAULT_SMTP_PASSWORD).strip()
    sender = (os.getenv("SMTP_FROM") or DEFAULT_SMTP_FROM).strip()
    port = int(os.getenv("SMTP_PORT") or DEFAULT_SMTP_PORT)

    if not to_email:
        return False

    # 1. Try Resend HTTP API if key is present (fastest & bypasses ISP port blocks)
    if resend_key:
        try:
            resp = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": sender,
                    "to": [to_email],
                    "subject": subject,
                    "text": body,
                },
                timeout=15,
            )
            if resp.status_code in (200, 201):
                logger.info("Email delivered to %s via Resend API", to_email)
                return True
            logger.warning("Resend API failed (%s): %s; falling back to SMTP", resp.status_code, resp.text)
        except Exception as exc:
            logger.warning("Resend API request exception: %s; falling back to SMTP", exc)

    # 2. Try SMTP
    if not host or not user or not password:
        return False

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                server.login(user, password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.starttls()
                server.login(user, password)
                server.send_message(msg)
        logger.info("Email delivered to %s via SMTP (%s:%d)", to_email, host, port)
        return True
    except Exception as smtp_exc:
        logger.error("SMTP delivery failed for %s: %s", to_email, smtp_exc)
        return False


def dispatch_high_risk_alerts(force: bool = False) -> dict[str, int]:
    """Send alerts to opted-in active subscribers for HIGH/CRITICAL districts.
    
    If live gateways (SMTP / Telegram API) are unconfigured, delivery is safely
    simulated, logged, and committed to notification_history so subscribers
    see their alerts in their dashboard inbox.
    """
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
        return {"sent": 0, "live_sent": 0, "simulated": 0, "skipped_dedup": 0, "skipped_unconfigured": 0}

    risk_by_dist = {r["district_id"]: r for r in risk_rows}
    subs = (
        svc.table("alert_subscriptions")
        .select("id, user_id, district_id, notification_channels, email, telegram_chat_id, is_active")
        .eq("is_active", True)
        .in_("district_id", list(risk_by_dist.keys()))
        .execute()
        .data
    )

    sent = 0
    live_sent = 0
    simulated = 0
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
            if not force:
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
            else:
                # In force mode, clear any existing notification for today so unique constraint succeeds
                try:
                    svc.table("notification_history").delete().eq("subscription_id", sub["id"]).eq("alert_date", today_str).eq("risk_level", level).eq("channel", channel).execute()
                except Exception:
                    pass

            live_delivered = False
            try:
                if channel == "telegram" and sub.get("telegram_chat_id"):
                    live_delivered = send_telegram_message(sub["telegram_chat_id"], msg_text)
                elif channel == "email":
                    dest_email = sub.get("email")
                    if not dest_email:
                        try:
                            user_obj = svc.auth.admin.get_user_by_id(sub["user_id"])
                            dest_email = getattr(getattr(user_obj, "user", None), "email", None)
                        except Exception:
                            dest_email = None
                    if dest_email:
                        live_delivered = send_email_message(
                            dest_email,
                            f"[DengueSense] {level} Environmental Suitability — {dist_name}",
                            msg_text,
                        )
            except Exception as exc:
                logger.warning("Failed to send %s alert for sub %s: %s", channel, sub["id"], exc)

            if live_delivered:
                status_val = "sent"
                live_sent += 1
            else:
                status_val = "simulated"
                simulated += 1
                logger.info("Simulated %s alert for subscription %s (%s)", channel, sub["id"], dist_name)

            try:
                svc.table("notification_history").insert({
                    "subscription_id": sub["id"],
                    "user_id": sub["user_id"],
                    "district_id": sub["district_id"],
                    "alert_date": today_str,
                    "risk_level": level,
                    "channel": channel,
                    "status": status_val,
                    "message": msg_text,
                }).execute()
                sent += 1
            except Exception as insert_err:
                logger.warning("Failed to record notification history: %s", insert_err)

    return {
        "sent": sent,
        "live_sent": live_sent,
        "simulated": simulated,
        "skipped_dedup": skipped_dedup,
        "skipped_unconfigured": skipped_unconfigured,
    }


def get_advisory_recipients_preview(
    target_type: str = "high_risk",
    district_id: int | None = None,
) -> dict[str, Any]:
    """Preview count of subscribers and reached districts before dispatching."""
    svc = get_service_client()
    today_str = datetime.now(DHAKA_TZ).date().isoformat()

    query = (
        svc.table("alert_subscriptions")
        .select("id, district_id, notification_channels, email, telegram_chat_id, districts(id, name_en, division)")
        .eq("is_active", True)
    )

    high_risk_dist_ids: list[int] = []
    if target_type == "high_risk":
        risk_rows = (
            svc.table("daily_risk_scores")
            .select("district_id")
            .eq("score_date", today_str)
            .in_("risk_level", list(ALERT_LEVELS))
            .execute()
            .data
        ) or []
        high_risk_dist_ids = [r["district_id"] for r in risk_rows]
        if not high_risk_dist_ids:
            return {
                "target_type": target_type,
                "subscriber_count": 0,
                "email_channels": 0,
                "telegram_channels": 0,
                "districts_covered": [],
                "high_risk_districts_count": 0,
            }
        query = query.in_("district_id", high_risk_dist_ids)
    elif target_type == "district" and district_id:
        query = query.eq("district_id", district_id)

    subs = query.execute().data or []

    dist_names: set[str] = set()
    email_cnt = 0
    tg_cnt = 0
    for s in subs:
        d = s.get("districts") or {}
        if d.get("name_en"):
            dist_names.add(d["name_en"])
        channels = s.get("notification_channels") or ["email"]
        if "email" in channels:
            email_cnt += 1
        if "telegram" in channels:
            tg_cnt += 1

    return {
        "target_type": target_type,
        "subscriber_count": len(subs),
        "email_channels": email_cnt,
        "telegram_channels": tg_cnt,
        "districts_covered": sorted(list(dist_names)),
        "high_risk_districts_count": len(high_risk_dist_ids),
    }


def dispatch_custom_advisory(
    target_type: str = "high_risk",
    district_id: int | None = None,
    risk_level: str = "HIGH",
    headline: str = "",
    custom_message: str = "",
    force: bool = True,
) -> dict[str, Any]:
    """Dispatch an admin-crafted custom public health advisory to subscribers."""
    svc = get_service_client()
    today_str = datetime.now(DHAKA_TZ).date().isoformat()

    query = (
        svc.table("alert_subscriptions")
        .select("id, user_id, district_id, notification_channels, email, telegram_chat_id, districts(name_en, division)")
        .eq("is_active", True)
    )

    if target_type == "high_risk":
        risk_rows = (
            svc.table("daily_risk_scores")
            .select("district_id")
            .eq("score_date", today_str)
            .in_("risk_level", list(ALERT_LEVELS))
            .execute()
            .data
        ) or []
        high_risk_dist_ids = [r["district_id"] for r in risk_rows]
        if not high_risk_dist_ids:
            return {"sent": 0, "live_sent": 0, "simulated": 0, "recipients_count": 0, "districts": []}
        query = query.in_("district_id", high_risk_dist_ids)
    elif target_type == "district" and district_id:
        query = query.eq("district_id", district_id)

    subs = query.execute().data or []
    if not subs:
        return {"sent": 0, "live_sent": 0, "simulated": 0, "recipients_count": 0, "districts": []}

    sent = 0
    live_sent = 0
    simulated = 0
    reached_districts: set[str] = set()

    clean_headline = (headline or "Public Health Advisory").strip()
    clean_body = (custom_message or "Please inspect standing water containers around residential premises.").strip()

    for sub in subs:
        dist_name = (sub.get("districts") or {}).get("name_en", "District")
        reached_districts.add(dist_name)

        msg_text = (
            f"[DENGUESENSE ADVISORY - {risk_level}]\n"
            f"{clean_headline}\n"
            f"District: {dist_name} ({today_str})\n\n"
            f"{clean_body}\n\n"
            "— DengueSense Emergency Alert Desk"
        )

        for channel in sub.get("notification_channels") or ["email"]:
            if force:
                try:
                    svc.table("notification_history").delete().eq("subscription_id", sub["id"]).eq("alert_date", today_str).eq("risk_level", risk_level).eq("channel", channel).execute()
                except Exception:
                    pass
            else:
                existing = (
                    svc.table("notification_history")
                    .select("id")
                    .eq("subscription_id", sub["id"])
                    .eq("alert_date", today_str)
                    .eq("risk_level", risk_level)
                    .eq("channel", channel)
                    .maybe_single()
                    .execute()
                )
                if existing and existing.data:
                    continue

            live_delivered = False
            try:
                if channel == "telegram" and sub.get("telegram_chat_id"):
                    live_delivered = send_telegram_message(sub["telegram_chat_id"], msg_text)
                elif channel == "email":
                    dest_email = sub.get("email")
                    if not dest_email:
                        try:
                            user_obj = svc.auth.admin.get_user_by_id(sub["user_id"])
                            dest_email = getattr(getattr(user_obj, "user", None), "email", None)
                        except Exception:
                            dest_email = None
                    if dest_email:
                        live_delivered = send_email_message(
                            dest_email,
                            f"[DengueSense {risk_level}] {clean_headline} — {dist_name}",
                            msg_text,
                        )
            except Exception as exc:
                logger.warning("Failed sending custom %s alert for sub %s: %s", channel, sub["id"], exc)

            status_val = "sent" if live_delivered else "simulated"
            if live_delivered:
                live_sent += 1
            else:
                simulated += 1

            try:
                svc.table("notification_history").insert({
                    "subscription_id": sub["id"],
                    "user_id": sub["user_id"],
                    "district_id": sub["district_id"],
                    "alert_date": today_str,
                    "risk_level": risk_level,
                    "channel": channel,
                    "status": status_val,
                    "message": msg_text,
                }).execute()
                sent += 1
            except Exception as insert_err:
                logger.warning("Failed to record custom notification history: %s", insert_err)

    return {
        "sent": sent,
        "live_sent": live_sent,
        "simulated": simulated,
        "recipients_count": len(subs),
        "districts": sorted(list(reached_districts)),
    }
