# Security Audit — DengueSense (Stage 9)

**Audit Date:** 2026-11-26  
**Methodology:** VibeSec-Skill invariants + automated `pytest` security tests + RLS verification + `npm audit` + production bundle inspection.

## 1. Automated & Manual Checks Performed
| Check | Scope | Result |
|---|---|---|
| **Git Secret Scan** | `git ls-files` | Pass — only `.env.example` tracked; `.env` is gitignored |
| **Production Bundle Scan** | `frontend/dist/` | Pass — zero `service_role` / SMTP / Telegram secrets; zero `.map` source maps |
| **Frontend Dependency Audit** | `npm audit --omit=dev --audit-level=high` | Pass — `0` high/critical vulnerabilities |
| **RLS Verification** | Unauthenticated `anon` client against Supabase | Pass — public tables readable; private tables (`alert_subscriptions`, `user_profiles`, `moderation_audit_history`) return 0 rows; anon insert to `crowd_reports` rejected |
| **API Auth & RBAC Tests** | `pytest backend/tests/test_risk_engine_and_api.py` | Pass (`7/7`) — `401` on all protected routes without JWT; `403` when citizen calls `/api/moderation/reports`; `404` on unowned/missing alert delete |
| **Security Headers** | Flask `after_request` | Pass — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`, and `Cache-Control: no-store` on `/api/auth`, `/api/alerts`, `/api/moderation` |

## 2. Remediations Applied During QA
1. **Thread-safe Supabase client (`backend/app/db.py`):** Replaced shared `@lru_cache` client with `threading.local()` to prevent `httpx.ReadError: [Errno 35]` under concurrent requests.
2. **Safe `.maybe_single()` null handling:** Guarded all `.maybe_single().execute()` calls across `auth.py`, `alerts.py`, `reports.py`, `moderation.py`, `districts.py`, and `notifications.py` so missing/unowned records cleanly return `404` instead of `500`.
3. **Sensitive response caching:** Added `Cache-Control: no-store` on `/api/auth`, `/api/alerts`, and `/api/moderation` responses.

## 3. Known Limitations
- In-memory rate limiter (`rate_limit.py`) is per-worker process; for multi-instance scaling in V2, migrate to a shared store.
- No absolute security is claimed; ongoing dependency updates and periodic RLS reviews are recommended.
