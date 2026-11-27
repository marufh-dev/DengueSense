# DengueSense — Bangladesh 64-District Dengue Early Warning & Community Reporting Platform

[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://denguesense-flax.vercel.app)
[![Backend REST API](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://denguesense-api.onrender.com/api/health)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Python Version](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://www.python.org/)
[![React Version](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-stack, multi-page public health informatics and environmental monitoring web platform designed to calculate meteorological dengue suitability across all **64 districts of Bangladesh**, collect verified crowdsourced civic reports on waterlogging, and dispatch emergency health advisories via Telegram and Email.

- **Live Web Application:** [https://denguesense-flax.vercel.app](https://denguesense-flax.vercel.app)
- **Live REST API:** [https://denguesense-api.onrender.com/api/health](https://denguesense-api.onrender.com/api/health)
- **GitHub Repository:** [https://github.com/marufh-dev/DengueSense](https://github.com/marufh-dev/DengueSense)

---

## What is DengueSense?

DengueSense is a predictive environmental surveillance and civic action ecosystem tailored for Bangladesh. By shifting public health focus from **reactive post-infection treatment** to **proactive pre-transmission vector habitat suppression**, the platform provides actionable insights for citizens, municipal authorities, and researchers:

1. **Environmental Dengue Suitability Index (EDSI):** A daily, explainable 0–100 heuristic modeled across all 64 validated district boundary polygons (`BGD-ADM2`) derived from 21-day cumulative precipitation, ambient temperatures, and relative humidity.
2. **Citizen Waterlogging & Hotspot Reporting:** An authenticated community reporting pipeline allowing residents to flag standing water, uncleaned drains, and mosquito breeding clusters with photo documentation, rain tracking, and privacy-preserving GPS fuzzing.
3. **Multi-Channel Alert Gateway:** Real-time broadcast advisories delivered directly to citizens via **Telegram Bot (`@denguesense_alert_bot`)** and **Email (SMTP / Resend)**, featuring an automated `@userinfobot` helper for zero-friction ID pairing.
4. **Clinical Triage & Source Reduction:** WHO Group A/B/C symptom triage workflows and interactive weekly community container cleanup protocols.
5. **Dedicated User Profile Dashboard:** Manage identity, tactical predefined avatars (no photo upload needed), alert emails, and connected Telegram IDs from a single hub.

> **Scientific Disclaimer:** DengueSense calculates meteorological breeding suitability (EDSI) and monitors environmental community signals. It does **not** predict clinical patient counts or provide medical diagnostic certainty.

---

## Why DengueSense?

Bangladesh experiences recurring, severe dengue outbreaks during and following the monsoon season. Traditional public health management faces several critical systemic bottlenecks:

- **Epidemiological Surveillance Lag:** Hospitalization and serological data lag vector breeding events by **14 to 21 days**, meaning emergency vector control often begins only after transmission has peaked.
- **Monsoon Cloud Cover:** Optical earth-observation satellites (e.g., Sentinel-2, Landsat) cannot detect urban street-level waterlogging through persistent monsoon cloud decks.
- **Information Asymmetry:** Citizens lack real-time district-level environmental risk insights, preventive guidance in their native language, and direct channels to notify authorities of standing water hotspots.

**The Solution:** DengueSense combines daily automated Open-Meteo meteorological telemetry with ground-truth citizen reports. This provides early indicators **7 to 10 days before** *Aedes aegypti* mosquito larvae complete their aquatic cycle and emerge as adult vectors.

---

## Multi-Page Architecture

DengueSense is structured into dedicated, multi-page routes with route-level code splitting, vendor chunking, and lazy loading for instantaneous page loads:

| Page Route | Purpose | Access Level |
| :--- | :--- | :---: |
| **`/` (Dashboard)** | 64-District suitability KPI metrics, interactive Leaflet risk map, GPS auto-location, and local weather telemetry. | Public / Citizen |
| **`/map` (Risk Map)** | Dedicated full-screen interactive choropleth map with administrative division filtering. | Public / Citizen |
| **`/districts/:id`** | Historical climate analytics, 30/90-day temperature/rainfall charts, and air quality indices (PM2.5). | Public / Citizen |
| **`/reports` (Community)** | Real-time feed of approved citizen waterlogging reports with privacy-fuzzed coordinates. | Public / Citizen |
| **`/submit-report`** | Citizen submission form with interactive coordinate picker, photo upload, and rainfall verification. | Citizen |
| **`/triage` (Triage)** | Clinical symptom assessment tool categorizing cases based on WHO Group A/B/C warning signs. | Public |
| **`/prevention`** | Interactive weekly source-reduction checklist and vector biology educational guide. | Public |
| **`/my-alerts`** | District notification subscription manager for Telegram and Email channels. | Citizen |
| **`/profile` (Profile)** | User profile dashboard to manage tactical avatars, preferred alert email, and Telegram ID sync. | Authenticated |
| **`/methodology`** | Scientific documentation on the EDSI mathematical weighting formula and data sources. | Public |
| **`/moderation`** | Verification queue for health officers and moderators to review or reject community reports. | Moderator / Admin |
| **`/admin`** | Telemetry ingestion runner, user role management (RBAC), and municipal advisory dispatcher. | Admin |

---

## How It Works (System Architecture)

```
[ Open-Meteo Weather APIs ]       [ geoBoundaries BGD-ADM2 ]
              │                               │
              ▼                               ▼
     [ Ingestion Pipeline ]  ───►  [ Supabase PostGIS DB ]
                                              │
              ┌───────────────────────────────┴───────────────────────────────┐
              ▼                                                               ▼
   [ Flask REST API Backend ]                                      [ React 19 Frontend ]
   • EDSI Risk Computation Engine                                  • Code-Split Lazy Loaded SPA
   • Background Ingestion Runners                                  • Interactive Leaflet Choropleth
   • Multi-Channel Dispatch (Telegram+SMTP)                        • Recharts Telemetry Visualizers
   • Privacy Geolocation Fuzzer                                    • Full Bilingual Localization (EN/BN)
```

1. **Automated Ingestion:** The ingestion engine queries 21-day historical and forecast weather parameters (mean/max temperature, relative humidity, cumulative precipitation) for all 64 district centroids.
2. **Mathematical Heuristic Calculation:**
   $$\text{EDSI} = 0.4375 \times \text{Rainfall} + 0.3125 \times \text{Temperature} + 0.25 \times \text{Humidity}$$
3. **Spatial Risk Classification:** Normalizes scores to assign each district to an intuitive risk tier:
   - `LOW` (0–29.9) · `MODERATE` (30.0–54.9) · `HIGH` (55.0–74.9) · `CRITICAL` (75.0–100.0)
4. **Community Signal Blending:** Approved citizen waterlogging reports add localized municipal weight to the district's environmental profile.
5. **Automated Alert Broadcasts:** Dispatches high-risk early warnings via Telegram Bot API (`@denguesense_alert_bot`) and Resend SMTP to subscribed citizens.

---

## Key Platform Features

- **Tactile High-Contrast Day Palette:** Engineered with a focused palette (`#14080e` Rich Raisin Black and `#49475b` Slate Charcoal Violet) on clean white cards, adhering to accessible contrast ratios with zero reliance on emojis.
- **Telegram Automation Helper (`@userinfobot`):** 1-click launch to retrieve user IDs without searching, automated clipboard auto-detection, and a live test ping endpoint to verify bot connectivity.
- **100% Device-Responsive UI:** Fluid typography, custom horizontal scrollbars, and touch-optimized navigation across desktop, tablet, and mobile viewports.
- **Full Bilingual Localization:** Seamless instant switching between English and বাংলা across every component and analytic visualizer.
- **Privacy-Preserving Geolocation:** Community coordinates are truncated to 2 decimal places (~1.1 km area), preventing personal address exposure while preserving epidemiological value.
- **High Availability & Zero Sleep:** Automated keepalive workflow pings the Render backend, Vercel frontend, and Supabase endpoints to prevent free-tier instances from spinning down.

---

## Technology Stack

- **Frontend:** React 19, Vite 6, React Router 7, Leaflet / React Leaflet, Recharts, Lucide React
- **Backend:** Python 3.11+, Flask REST API, Gunicorn, `supabase-py`, `requests`
- **Database & Storage:** Supabase PostgreSQL with PostGIS extensions, Row Level Security (RLS), Supabase Storage
- **Notification Services:** Telegram Bot API (`@denguesense_alert_bot`), Resend HTTP API & SMTP
- **Geospatial & Climate Data:** Open-Meteo Historical & Forecast Weather APIs, geoBoundaries ADM2 Polygons
- **Hosting & Infrastructure:** Vercel (Frontend SPA), Render (Flask REST Service), GitHub Actions (Keepalive CI)

---

## AI Collaboration Disclosure

In accordance with academic and engineering integrity standards, **AI assistance was utilized for specific implementation tasks**:
- Assisting in the mathematical normalization formulas and unit test suites for the EDSI risk engine.
- Assisting in front-end styling token consistency, code-splitting refactors (`React.lazy` + `Suspense`), and responsive breakpoints.
- Assisting with Telegram Bot API payload formatting and SMTP fallback logic.

*All system architecture, database schemas, epidemiological heuristics, security validations, and software design decisions were guided, reviewed, and finalized by the project author.*

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
# Fill in your Supabase credentials, Telegram bot token, and Resend key

# Start the Flask backend server (port 5001)
PYTHONPATH=backend python backend/wsgi.py
```

### 2. Frontend Setup
```bash
# In a separate terminal:
cd frontend
npm install

# Start Vite development server
npm run dev
```

### 3. Running Automated Tests
```bash
# Execute full backend test suite (unit tests, risk heuristic, security RBAC)
./.venv/bin/pytest backend/tests/test_risk_engine_and_api.py -v
```

---

## Author & Academic Affiliation

- **Developer:** Maruf Hossain ([@marufh-dev](https://github.com/marufh-dev))
- **Email:** marufshakhawat653@gmail.com
- **Academic Submission:** Computer Science & Software Engineering Project Showcase
- **Live Deployment:** [https://denguesense-flax.vercel.app](https://denguesense-flax.vercel.app)
