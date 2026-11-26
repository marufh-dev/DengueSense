# Architecture — DengueSense

## System Components
1. **React + Vite SPA (`frontend/`):**
   - Plain CSS3 design system (`src/styles/tokens.css`, `src/styles/global.css`) following `DESIGN.md`.
   - Interactive 64-district Leaflet choropleth map (`react-leaflet`) + Recharts trend visualizations.
   - Supabase JS Auth client for citizen registration/login/session persistence.
2. **Flask REST API (`backend/`):**
   - Modular Blueprints (`health`, `districts`, `reports`, `moderation`, `alerts`, `data_health`).
   - Server-side JWT verification & role enforcement (`citizen`, `moderator`, `admin`) via Supabase Auth + `user_profiles`.
   - Explainable V1 Environmental Dengue Suitability Engine (`risk_engine.py`).
3. **Supabase PostgreSQL + PostGIS (`supabase/migrations/`):**
   - Version-controlled SQL migrations, spatial GIST indexes, and Row Level Security (RLS) on all tables.
   - Private `report-photos` Storage bucket with signed URLs.
4. **Data Ingestion Pipeline (`scripts/` & `.github/workflows/`):**
   - Daily Open-Meteo Weather & Air Quality ingestion across all 64 district centroids in `Asia/Dhaka` timezone.
