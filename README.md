# DengueSense — Bangladesh 64-District Dengue Early Warning & Community Reporting Platform

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://denguesense-flax.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://denguesense-api.onrender.com/api/health)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)

A multi-page environmental monitoring and community reporting web application designed to forecast meteorological dengue suitability across all **64 districts of Bangladesh**, collect verified ground-truth citizen reports, and dispatch emergency health advisories via Telegram and Email.

- **Live Web Application:** [https://denguesense-flax.vercel.app](https://denguesense-flax.vercel.app)
- **Live REST API:** [https://denguesense-api.onrender.com/api/health](https://denguesense-api.onrender.com/api/health)
- **GitHub Repository:** [https://github.com/marufh-dev/DengueSense](https://github.com/marufh-dev/DengueSense)

---

## What is DengueSense?

DengueSense is a public health informatics platform built specifically for Bangladesh. It monitors environmental suitability for *Aedes aegypti* mosquito proliferation and provides civic tools for waterlogging mitigation:

1. **Environmental Suitability Index (EDSI):** A transparent, explainable 0–100 heuristic calculated daily across 64 validated district polygons (`BGD-ADM2`) using 21-day cumulative precipitation, ambient temperatures, and relative humidity.
2. **Citizen Waterlogging Reporting:** Enables residents to report localized standing water and high-density mosquito breeding spots with geo-location pinning, rain event tracking, and image verification.
3. **Multi-Channel Alert Gateway:** Delivers automated and custom municipal advisories to citizens via **Telegram Bot (`@denguesense_alert_bot`)** and **Email (SMTP / Resend)**.
4. **Clinical Triage & Prevention:** Informational WHO Group A/B/C symptom triage workflow and weekly community source-reduction checklist.

> **Scientific Disclaimer:** DengueSense calculates meteorological suitability for mosquito breeding (EDSI) and tracks community environmental signals. It does **not** predict medical dengue infection counts or diagnostic probability.

---

## Why DengueSense?

Bangladesh faces recurring dengue outbreaks during and immediately following the monsoon season. Traditional public health responses suffer from critical bottlenecks:
- **Delayed Surveillance:** Hospitalization records lag vector breeding cycles by 2 to 3 weeks.
- **Cloud Cover Obstruction:** Optical satellites (Sentinel-2) cannot observe urban street waterlogging through monsoon clouds.
- **Data Fragmentation:** Citizens lack real-time district-level environmental risk insights and localized prevention advisories.

**The Solution:** DengueSense combines automated Open-Meteo meteorological pipelines with crowdsourced ground-truth mobility and waterlogging reports. This enables municipal teams and citizens to identify breeding hotspots 7 to 10 days before mosquito larvae mature into flying adults.

---

## Multi-Page Architecture

DengueSense is architected with discrete, independently accessible pages with route-level code splitting and lazy loading:

| Page Route | Purpose | Access |
| :--- | :--- | :---: |
| **`/` (Dashboard)** | 64-District suitability KPI summary, interactive risk map, and local telemetry. | Citizen / Public |
| **`/map` (Risk Map)** | Full-screen interactive district polygon explorer with division filtering. | Citizen / Public |
| **`/districts/:id`** | Historical climate analytics, 30-day weather trends, and air quality charts. | Citizen / Public |
| **`/reports` (Community)** | Feed of community-verified waterlogging signals and localized warnings. | Citizen / Public |
| **`/submit-report`** | Form with map pin-picker and photo upload to report street waterlogging. | Citizen |
| **`/triage` (Symptom Triage)**| Interactive clinical symptom questionnaire following WHO Group A/B/C guidelines. | Public |
| **`/prevention`** | Interactive weekly container clean-up checklist and vector biology guide. | Public |
| **`/my-alerts`** | District notification subscription manager for Telegram and Email channels. | Citizen |
| **`/methodology`** | Scientific documentation on the EDSI mathematical formula and data sources. | Public |
| **`/moderation`** | Queue for health officials to review, verify, or reject community reports. | Moderator / Admin |
| **`/admin`** | Meteorological data ingestion trigger, role manager, and live alert dispatcher. | Admin |

---

## How It Works (System Architecture)

```
[ Open-Meteo Weather APIs ]       [ geoBoundaries BGD-ADM2 ]
              │                               │
              ▼                               ▼
       [ Ingestion Pipeline ] ──► [ Supabase PostGIS DB ]
                                              │
              ┌───────────────────────────────┴───────────────────────────────┐
              ▼                                                               ▼
   [ Flask REST API Backend ]                                      [ React 19 Frontend ]
   • EDSI Risk Engine                                              • Code-Split Lazy Routes
   • Ingestion Schedulers                                          • Leaflet GeoJSON Polygon Map
   • Dual Alert Gateway (SMTP + Telegram)                          • Recharts Climate Trends
```

1. **Data Ingestion:** Daily automated job fetches 21-day historical and forecast weather (temperature, relative humidity, cumulative rainfall) for all 64 district coordinates.
2. **Suitability Computation:** 
   $$\text{EDSI} = 0.4375 \times \text{Rainfall} + 0.3125 \times \text{Temperature} + 0.25 \times \text{Humidity}$$
3. **Spatial Mapping:** Renders GeoJSON district polygons colored dynamically based on calculated suitability thresholds (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
4. **Community Signal Aggregation:** Approved citizen reports generate a secondary signal score that elevates district priority when heavy rain and traffic standstills coincide.
5. **Alert Delivery:** Transmits high-risk warnings via Telegram Bot API and Resend SMTP to subscribed users.

---

## Technology Stack

- **Frontend:** React 19, Vite 6, React Router 7, Leaflet / React Leaflet, Recharts, Lucide React
- **Backend:** Python 3.11+, Flask REST API, Gunicorn, `supabase-py`
- **Database & Auth:** Supabase PostgreSQL + PostGIS, Row Level Security (RLS), Supabase Storage
- **Design System:** High-contrast Day Mode (`#14080e` Rich Raisin Black & `#49475b` Slate Charcoal Violet), zero emojis, sharp geometric aesthetic
- **Deployment:** Vercel (Frontend SPA), Render (Flask Backend)

---

## AI Collaboration Disclosure

In the development of this project, **AI assistance was utilized for specific implementation tasks**, including:
- Assisting with the mathematical normalization formulas and unit test fixtures for the EDSI risk engine.
- Assisting in styling token conversions and code-splitting refactors (`React.lazy` + `Suspense`).
- Assisting in structuring Telegram Bot API integration and dual SMTP payload handlers.

*Core system architecture, data models, domain logic, verification, and engineering decisions were guided and reviewed by the project author.*

---

## Local Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Free Supabase project (PostgreSQL)

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/marufh-dev/DengueSense.git
cd DengueSense

# Setup Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase, Telegram, and Resend credentials

# Start the backend server (runs on port 5001)
PYTHONPATH=backend python backend/wsgi.py
```

### 2. Frontend Setup
```bash
# In a new terminal:
cd frontend
npm install

# Start Vite development server
npm run dev
```

### 3. Running Automated Tests
```bash
# Run backend test suite (unit tests, risk heuristic, RBAC)
./.venv/bin/pytest backend/tests/test_risk_engine_and_api.py -v
```

---

## Author
- **Developer:** Maruf Hossain ([@marufh-dev](https://github.com/marufh-dev))
- **Email:** marufshakhawat653@gmail.com
- **Academic Project Submission:** Computer Science & Software Engineering Curriculum
