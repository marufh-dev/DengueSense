# DengueSense — Bangladesh 64-District Dengue Early Warning & Community Reporting Platform

An open-data environmental dengue suitability monitoring and community-reporting platform covering all **64 districts of Bangladesh**.

> **Scientific Disclaimer:** V1 computes an explainable **Environmental Dengue Suitability Index (EDSI)** from meteorological variables (rainfall accumulation, temperature, relative humidity) and tracks community waterlogging/mosquito reports separately. It does **not** predict confirmed medical dengue infection probabilities.

## Architecture Overview
- **Frontend:** React + Vite + JavaScript + Plain CSS (`frontend/`) → Vercel
- **Backend:** Python + Flask REST API (`backend/`) → Render
- **Database & Auth:** Supabase PostgreSQL + PostGIS + Auth + Storage + RLS (`supabase/`)
- **Automated Ingestion:** GitHub Actions daily cron + manual trigger (`.github/workflows/`)

## Local Development Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase URL, anon key, and service-role key (never commit `.env`).

### 2. Backend (Flask)
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/wsgi.py
```
The API runs on `http://localhost:5001` (`GET /api/health`).

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The web app runs on `http://localhost:5173`.
