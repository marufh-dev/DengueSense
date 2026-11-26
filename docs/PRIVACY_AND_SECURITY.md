# Privacy & Security Practices — DengueSense

1. **Zero-Trust Server Verification:** Every protected Flask endpoint verifies the Supabase JWT via `anon.auth.get_user(token)` and reads `user_profiles.role` from the database. Client-supplied user IDs or roles are never trusted.
2. **Row Level Security (RLS):** Enabled on all 14 tables. Private tables (`alert_subscriptions`, `notification_history`, `user_profiles`) are strictly scoped to `auth.uid()`. `trg_prevent_role_escalation` blocks non-admins from changing roles.
3. **Coordinate Privacy:** Public `/api/reports` responses return `generalized_lat` and `generalized_lon` rounded to 2 decimal places (~1.1 km). Exact coordinates are visible only to moderators/admins.
4. **Private Photo Storage:** Citizen uploads go to the private `report-photos` bucket (`5 MB` max, JPEG/PNG/WebP only) and are served exclusively via short-lived (120s) signed URLs.
5. **Transport & Browser Security:** Restricted CORS allowlist, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Cache-Control: no-store` on sensitive endpoints, and `sourcemap: false` on Vite production builds.
