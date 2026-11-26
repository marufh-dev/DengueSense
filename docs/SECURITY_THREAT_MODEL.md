# Security Threat Model — DengueSense

## 1. Assets & Data Classification
| Asset | Classification | Storage / Access |
|---|---|---|
| Environmental metrics (`daily_weather_metrics`, `air_quality_metrics`, `daily_risk_scores`) | Public Open Data | Supabase PostgreSQL (RLS public `SELECT`) |
| 64 District geometries & names (`districts`, `data_sources`) | Public Reference | Supabase PostgreSQL + `bangladesh_districts.geojson` |
| Approved community report summaries | Public (Generalized) | Public API returns 2-decimal rounded coords (~1.1 km) only |
| Exact reporter coordinates (`latitude`, `longitude`) | Sensitive / PII | Stored in `crowd_reports`; exposed only to moderators/admins |
| Citizen report photos (`report-photos` bucket) | Private | Private Supabase Storage; short-lived (120s) signed URLs |
| User profiles, roles, alert subscriptions, notification history | Private | Strictly scoped by `auth.uid()` via RLS + server JWT |
| `SUPABASE_SERVICE_ROLE_KEY`, SMTP/Telegram tokens | Secret | Server/CI environment variables only; never in client bundle |

## 2. Trust Boundaries
1. **Browser ↔ Flask API:** Untrusted client input. All requests validated server-side; identity and role derived strictly from Supabase JWT (`anon.auth.get_user(token)`) + `user_profiles.role`.
2. **Browser ↔ Supabase Data API:** Protected by Row Level Security (RLS) on all 14 tables; anon key cannot read private tables or escalate roles.
3. **Flask API / GitHub Actions ↔ Supabase:** Uses `service_role` key strictly on server/CI.

## 3. Threats & Mitigations
- **Privilege Escalation:** `trg_prevent_role_escalation` trigger + RLS `WITH CHECK` prevent non-admins from modifying `user_profiles.role`; Flask `@require_role` checks DB role on every request.
- **IDOR / Enumeration:** Alert deletion and photo access scope by `user_id` and return `404` for unauthorized/missing IDs.
- **Coordinate Privacy Leak:** Public `/api/reports` projects `generalized_lat`/`generalized_lon` only.
- **Spam / Abuse:** Rate limiting (`5` reports/hr, `30` votes/hr), 24h duplicate guard, 14-day report expiration, 5 MB MIME-checked photo uploads.
- **CORS / Header Attacks:** Exact-origin CORS allowlist (`ALLOWED_ORIGINS`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Cache-Control: no-store` on sensitive routes.
