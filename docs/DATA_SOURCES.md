# Data Sources & Provenance Matrix

All environmental and geographical data in DengueSense is sourced from open, verifiable providers with explicit licensing and provenance tracking in `public.data_sources`.

## Source Availability Matrix

| Source | Dataset / Endpoint | Variables | Bangladesh Coverage | Temporal / Spatial Resolution | Update Frequency | License | Auth | Status |
|---|---|---|---|---|---|---|---|---|
| **geoBoundaries** | `BGD-ADM2` (2020) / BBS & OCHA ROAP | 64 district polygons, names, centroids | Complete (64/64 districts) | Static administrative polygons | Static (2020) | CC BY 3.0 IGO | None | **Verified and integrated** |
| **Open-Meteo** | Historical Weather API (`/v1/archive`) | Temp (mean/max/min), RH, precipitation, wind, soil moisture | Complete (64/64 centroids) | Daily, ~0.1°–0.25° ERA5 reanalysis | Daily (~5-day lag) | CC BY 4.0 | None | **Verified and integrated** |
| **Open-Meteo** | Forecast Weather API (`/v1/forecast`, `past_days=7`) | Recent Temp, RH, precipitation, wind | Complete (64/64 centroids) | Daily, `Asia/Dhaka` | Hourly / Daily | CC BY 4.0 | None | **Verified and integrated** |
| **Open-Meteo** | Air Quality API (`/v1/air-quality`) | PM2.5, PM10, European AQI, US AQI (supplementary) | Complete (64/64 centroids) | Hourly aggregated to daily | Hourly | CC BY 4.0 | None | **Verified and integrated** |
| **CHIRPS v3** | UCSB Climate Hazards Center | Long-term gridded precipitation | Full Bangladesh | Daily / Pentadal, 0.05° | Monthly / Dekadal | Public Domain / CC BY | None | **Verified but not integrated** (V2 research) |
| **ERA5-Land** | Copernicus CDS | High-res land surface & climate | Full Bangladesh | Hourly, 0.1° | Monthly / ~5-day | Copernicus License | API Key | **Requires authentication** (V2 research) |
| **WorldPop** | Population Density | Gridded population counts | Full Bangladesh | 100m–1km | Annual | CC BY 4.0 | None | **Verified but not integrated** (V2 research) |
| **Sentinel-1 SAR** | Copernicus Data Space | Surface water / flood extent | Full Bangladesh | 10m, 6–12 days | 6–12 days | Copernicus Open | OAuth | **Requires authentication** (V2 research) |
| **DGHS / OpenDengue** | Dengue Surveillance | Confirmed dengue cases / hospitalizations | National / Division (limited district) | Daily / Weekly | Daily | Open / Public | None | **Accessible with limitations** (V2 ground truth) |

## Observation Type Provenance
- `reanalysis`: Historical ERA5/model-derived daily records from Open-Meteo Archive or recent `past_days`.
- `current`: Same-day observations for `Asia/Dhaka`.
- Missing values are preserved as `NULL` and **never** replaced with `0`.
