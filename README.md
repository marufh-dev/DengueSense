# DengueSense — Bangladesh 64-District Dengue Early Warning & Community Reporting Platform

An open-data environmental dengue suitability monitoring and community-reporting platform covering all **64 districts of Bangladesh**.

- **Live Frontend (Vercel):** https://denguesense-flax.vercel.app
- **Live Backend API (Render):** https://denguesense-api.onrender.com/api/health
- **Repository:** https://github.com/marufh-dev/DengueSense

> **Scientific Disclaimer:** V1 computes an explainable **Environmental Dengue Suitability Index (EDSI)** from meteorological variables (rainfall accumulation, temperature, relative humidity) and tracks community waterlogging/mosquito reports separately. It does **not** predict confirmed medical dengue infection probabilities.

## Tech Stack
- **Frontend:** React 19, Vite 6, React Router, Plain CSS3 (`DESIGN.md`), Leaflet / React Leaflet, Recharts, Lucide React
- **Backend:** Python, Flask REST API, Gunicorn, `supabase-py`
- **Database & Auth:** Supabase PostgreSQL + PostGIS, Supabase Auth, Private Storage, Row Level Security (RLS)
- **Data Sources:** Open-Meteo Historical/Forecast Weather & Air Quality APIs (`Asia/Dhaka`), geoBoundaries BGD-ADM2 (64 district polygons)

## Local Development Setup
1. Copy `.env.example` to `.env` and fill in your Supabase credentials.
2. **Backend:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   python backend/wsgi.py
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. **Tests:**
   ```bash
   .venv/bin/pytest backend/tests/test_risk_engine_and_api.py -v
   ```
   *(All 7 backend unit, API, and RBAC/security tests passing.)*

## Documentation
- [DESIGN.md](DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Data Sources](docs/DATA_SOURCES.md)
- [Data Dictionary](docs/DATA_DICTIONARY.md)
- [Risk Methodology](docs/RISK_METHODOLOGY.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Privacy & Security](docs/PRIVACY_AND_SECURITY.md)
- [Security Threat Model](docs/SECURITY_THREAT_MODEL.md)
- [Security Audit](docs/SECURITY_AUDIT.md)
- [V2 Research Roadmap](docs/RESEARCH_ROADMAP.md)

## Known Limitations & Maintenance
- Render's Free tier spins down after 15 minutes of inactivity; `.github/workflows/keepalive.yml` is configured to ping `/api/health` every 10 minutes (requires GitHub Actions enabled on your GitHub account, or an external free uptime monitor like UptimeRobot).
- Daily ingestion (`.github/workflows/daily_ingest.yml`) and optional Gmail SMTP alerts require GitHub Actions to be enabled on `marufh-dev`.
