# Deployment & Operations Guide

## Production Endpoints
- **Frontend (Vercel):** `https://denguesense-flax.vercel.app`
- **Backend API (Render):** `https://denguesense-api.onrender.com`
- **Database & Auth (Supabase):** `https://sxyplbnkktyizspphfbi.supabase.co` (`ap-northeast-2`)
- **Repository (GitHub):** `https://github.com/marufh-dev/DengueSense`

## Environment Variables
### Vercel (`frontend/`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL=https://denguesense-api.onrender.com`

### Render (`render.yaml`)
- `FLASK_ENV=production`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS=https://denguesense-flax.vercel.app,http://localhost:5173`

### GitHub Actions (`.github/workflows/daily_ingest.yml` & `keepalive.yml`)
- Required secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Optional free Gmail SMTP secrets: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASSWORD` (16-char App Password), `SMTP_FROM`
- Optional Telegram secret: `TELEGRAM_BOT_TOKEN`

## Maintenance
- **Manual Ingestion / Backfill:**
  ```bash
  .venv/bin/python scripts/ingest_weather.py --days 7 --notify
  ```
- **Keep Render Free Tier Warm:** `.github/workflows/keepalive.yml` pings `/api/health` every 10 minutes (requires GitHub Actions enabled on the account, or configure free UptimeRobot monitoring on `https://denguesense-api.onrender.com/api/health`).
