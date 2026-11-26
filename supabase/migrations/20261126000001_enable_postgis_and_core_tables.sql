-- Enable PostGIS and pgcrypto
create extension if not exists postgis;
create extension if not exists pgcrypto;

-- 1. Districts (all 64 districts of Bangladesh)
create table if not exists public.districts (
    id uuid primary key default gen_random_uuid(),
    district_code text unique not null,
    name_en text unique not null,
    name_bn text,
    division text not null,
    centroid_lat double precision not null,
    centroid_lon double precision not null,
    population_estimate integer,
    area_sq_km double precision,
    geom geometry(MultiPolygon, 4326),
    created_at timestamptz not null default now()
);

create index if not exists idx_districts_geom on public.districts using gist (geom);
create index if not exists idx_districts_division on public.districts (division);

-- 2. Data Sources (provenance & licensing)
create table if not exists public.data_sources (
    id uuid primary key default gen_random_uuid(),
    source_name text not null,
    dataset_name text not null,
    source_url text not null,
    license text not null,
    attribution text not null,
    description text,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    constraint uq_data_sources_name_dataset unique (source_name, dataset_name)
);

-- 3. Daily Weather Metrics
create table if not exists public.daily_weather_metrics (
    id uuid primary key default gen_random_uuid(),
    district_id uuid not null references public.districts(id) on delete cascade,
    source_id uuid not null references public.data_sources(id) on delete restrict,
    recorded_date date not null,
    observation_type text not null check (observation_type in ('historical', 'reanalysis', 'current', 'forecast')),
    temp_mean double precision,
    temp_max double precision,
    temp_min double precision,
    humidity_mean double precision,
    rainfall_mm double precision,
    wind_speed double precision,
    soil_moisture double precision,
    data_quality text not null default 'valid',
    created_at timestamptz not null default now(),
    constraint uq_weather_district_date_source_type unique (district_id, recorded_date, source_id, observation_type)
);

create index if not exists idx_weather_district_date on public.daily_weather_metrics (district_id, recorded_date desc);

-- 4. Air Quality Metrics (supplementary research)
create table if not exists public.air_quality_metrics (
    id uuid primary key default gen_random_uuid(),
    district_id uuid not null references public.districts(id) on delete cascade,
    source_id uuid not null references public.data_sources(id) on delete restrict,
    recorded_date date not null,
    pm2_5 double precision,
    pm10 double precision,
    european_aqi integer,
    us_aqi integer,
    data_quality text not null default 'valid',
    created_at timestamptz not null default now(),
    constraint uq_aq_district_date_source unique (district_id, recorded_date, source_id)
);

create index if not exists idx_aq_district_date on public.air_quality_metrics (district_id, recorded_date desc);

-- 5. User Profiles & Roles
create table if not exists public.user_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    role text not null default 'citizen' check (role in ('citizen', 'moderator', 'admin')),
    preferred_district_id uuid references public.districts(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.user_profiles (id, display_name, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        'citizen'
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 6. Crowd Reports
create table if not exists public.crowd_reports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    district_id uuid not null references public.districts(id) on delete cascade,
    report_type text not null check (report_type in ('WATERLOGGING', 'STAGNANT_WATER', 'MOSQUITO_ACTIVITY', 'SUSPECTED_DENGUE_REPORT')),
    latitude double precision not null,
    longitude double precision not null,
    location_geom geometry(Point, 4326),
    generalized_lat double precision not null,
    generalized_lon double precision not null,
    description text not null,
    photo_path text,
    status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    moderator_notes text,
    expires_at timestamptz not null default (now() + interval '14 days'),
    created_at timestamptz not null default now()
);

create index if not exists idx_reports_geom on public.crowd_reports using gist (location_geom);
create index if not exists idx_reports_district_status on public.crowd_reports (district_id, status, created_at desc);

-- 7. Report Votes
create table if not exists public.report_votes (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.crowd_reports(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    vote smallint not null check (vote in (1, -1)),
    created_at timestamptz not null default now(),
    constraint uq_report_vote_user unique (report_id, user_id)
);

-- 8. Daily Risk Scores
create table if not exists public.daily_risk_scores (
    id uuid primary key default gen_random_uuid(),
    district_id uuid not null references public.districts(id) on delete cascade,
    score_date date not null,
    environmental_score double precision,
    community_signal_score double precision not null default 0,
    risk_level text not null check (risk_level in ('LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'NO DATA')),
    model_version text not null default 'v1-heuristic-1.0',
    score_explanation jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    constraint uq_risk_district_date_model unique (district_id, score_date, model_version)
);

create index if not exists idx_risk_district_date on public.daily_risk_scores (district_id, score_date desc);

-- 9. Epidemiological Observations (V2-ready)
create table if not exists public.epidemiological_observations (
    id uuid primary key default gen_random_uuid(),
    geography_id text not null,
    geography_level text not null check (geography_level in ('district', 'division', 'national')),
    reporting_period date not null,
    dengue_cases integer not null,
    hospitalizations integer,
    source_id uuid references public.data_sources(id) on delete set null,
    verification_status text not null default 'unverified',
    source_metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- 10. Alert Subscriptions
create table if not exists public.alert_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    district_id uuid not null references public.districts(id) on delete cascade,
    radius_km double precision,
    user_lat double precision,
    user_lon double precision,
    notification_channels text[] not null default array['email']::text[],
    telegram_chat_id text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    constraint uq_alert_user_district unique (user_id, district_id)
);

-- 11. Notification History
create table if not exists public.notification_history (
    id uuid primary key default gen_random_uuid(),
    subscription_id uuid not null references public.alert_subscriptions(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    district_id uuid not null references public.districts(id) on delete cascade,
    alert_date date not null,
    risk_level text not null,
    channel text not null,
    status text not null default 'sent',
    message text not null,
    created_at timestamptz not null default now(),
    constraint uq_notif_dedup unique (subscription_id, alert_date, risk_level, channel)
);

-- 12. Ingestion Logs
create table if not exists public.ingestion_logs (
    id uuid primary key default gen_random_uuid(),
    source_id uuid references public.data_sources(id) on delete set null,
    job_name text not null,
    status text not null check (status in ('running', 'success', 'partial', 'failed')),
    districts_updated integer not null default 0,
    records_upserted integer not null default 0,
    missing_districts jsonb not null default '[]'::jsonb,
    error_summary text,
    started_at timestamptz not null default now(),
    completed_at timestamptz
);

-- 13. Moderation Audit History
create table if not exists public.moderation_audit_history (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.crowd_reports(id) on delete cascade,
    moderator_id uuid not null references auth.users(id) on delete restrict,
    previous_status text not null,
    new_status text not null,
    notes text,
    created_at timestamptz not null default now()
);

-- 14. System Configuration
create table if not exists public.system_config (
    key text primary key,
    value jsonb not null,
    description text,
    updated_at timestamptz not null default now()
);
