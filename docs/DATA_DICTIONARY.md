# Data Dictionary — DengueSense

Database: Supabase PostgreSQL 17 with PostGIS (`sxyplbnkktyizspphfbi`).

## Core Tables

1. **`districts`** (64 rows)
   - `id` (`uuid`, PK), `district_code` (`text`, unique `BD-01`..`BD-64`), `name_en` (`text`, unique), `name_bn` (`text`), `division` (`text`), `centroid_lat` (`double precision`), `centroid_lon` (`double precision`), `population_estimate` (`integer`, nullable), `area_sq_km` (`double precision`), `geom` (`geometry(MultiPolygon, 4326)`, GIST-indexed), `created_at` (`timestamptz`).
2. **`data_sources`** (3+ rows)
   - `id` (`uuid`, PK), `source_name`, `dataset_name`, `source_url`, `license`, `attribution`, `description`, `active` (`boolean`), `created_at`.
3. **`daily_weather_metrics`**
   - `id` (`uuid`, PK), `district_id` (FK → `districts`), `source_id` (FK → `data_sources`), `recorded_date` (`date`), `observation_type` (`historical | reanalysis | current | forecast`), `temp_mean`, `temp_max`, `temp_min`, `humidity_mean`, `rainfall_mm`, `wind_speed`, `soil_moisture`, `data_quality`, `created_at`.
   - Unique: `(district_id, recorded_date, source_id, observation_type)`.
4. **`air_quality_metrics`**
   - `id` (`uuid`, PK), `district_id` (FK), `source_id` (FK), `recorded_date` (`date`), `pm2_5`, `pm10`, `european_aqi`, `us_aqi`, `data_quality`, `created_at`.
   - Unique: `(district_id, recorded_date, source_id)`.
5. **`user_profiles`**
   - `id` (`uuid`, PK → `auth.users`), `display_name`, `role` (`citizen | moderator | admin`), `preferred_district_id` (FK → `districts`), `created_at`, `updated_at`.
6. **`crowd_reports`**
   - `id` (`uuid`, PK), `user_id` (FK → `auth.users`), `district_id` (FK → `districts`), `report_type` (`WATERLOGGING | STAGNANT_WATER | MOSQUITO_ACTIVITY | SUSPECTED_DENGUE_REPORT`), `latitude`, `longitude`, `location_geom` (`geometry(Point, 4326)`), `generalized_lat`, `generalized_lon`, `description`, `photo_path`, `status` (`PENDING | APPROVED | REJECTED | EXPIRED`), `moderator_notes`, `expires_at` (default `+14 days`), `created_at`.
7. **`report_votes`**
   - `id` (`uuid`, PK), `report_id` (FK → `crowd_reports`), `user_id` (FK → `auth.users`), `vote` (`1 | -1`), `created_at`. Unique `(report_id, user_id)`.
8. **`daily_risk_scores`**
   - `id` (`uuid`, PK), `district_id` (FK), `score_date` (`date`), `environmental_score` (`double precision`, nullable), `community_signal_score` (`double precision`), `risk_level` (`LOW | MODERATE | HIGH | CRITICAL | NO DATA`), `model_version`, `score_explanation` (`jsonb`), `created_at`.
9. **`epidemiological_observations`** (V2-ready)
   - `id` (`uuid`, PK), `geography_id`, `geography_level` (`district | division | national`), `reporting_period` (`date`), `dengue_cases` (`integer`), `hospitalizations` (`integer`, nullable), `source_id` (FK), `verification_status`, `source_metadata` (`jsonb`), `created_at`.
10. **`alert_subscriptions`**
    - `id` (`uuid`, PK), `user_id` (FK), `district_id` (FK), `radius_km`, `user_lat`, `user_lon`, `notification_channels` (`text[]`), `telegram_chat_id`, `is_active`, `created_at`. Unique `(user_id, district_id)`.
11. **`notification_history`**
    - `id` (`uuid`, PK), `subscription_id` (FK), `user_id` (FK), `district_id` (FK), `alert_date` (`date`), `risk_level`, `channel`, `status`, `message`, `created_at`. Unique `(subscription_id, alert_date, risk_level, channel)`.
12. **`ingestion_logs`**, **`moderation_audit_history`**, **`system_config`**
    - Operational logging, moderation audit trail, and configurable parameters.
