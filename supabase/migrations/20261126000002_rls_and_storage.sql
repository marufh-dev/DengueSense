-- Helper function to check moderator/admin role safely
create or replace function public.is_moderator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1 from public.user_profiles
        where id = auth.uid()
          and role in ('moderator', 'admin')
    );
$$;

-- Prevent non-admins from escalating their own role
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.role is distinct from old.role then
        if not exists (
            select 1 from public.user_profiles
            where id = auth.uid() and role = 'admin'
        ) and current_user not in ('postgres', 'service_role') then
            raise exception 'Unauthorized role modification';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.user_profiles;
create trigger trg_prevent_role_escalation
    before update on public.user_profiles
    for each row execute function public.prevent_role_self_escalation();

-- Enable RLS on all tables
alter table public.districts enable row level security;
alter table public.data_sources enable row level security;
alter table public.daily_weather_metrics enable row level security;
alter table public.air_quality_metrics enable row level security;
alter table public.user_profiles enable row level security;
alter table public.crowd_reports enable row level security;
alter table public.report_votes enable row level security;
alter table public.daily_risk_scores enable row level security;
alter table public.epidemiological_observations enable row level security;
alter table public.alert_subscriptions enable row level security;
alter table public.notification_history enable row level security;
alter table public.ingestion_logs enable row level security;
alter table public.moderation_audit_history enable row level security;
alter table public.system_config enable row level security;

-- Public read-only environmental & reference tables
create policy "Public read districts" on public.districts for select using (true);
create policy "Public read data_sources" on public.data_sources for select using (true);
create policy "Public read weather" on public.daily_weather_metrics for select using (true);
create policy "Public read air_quality" on public.air_quality_metrics for select using (true);
create policy "Public read risk_scores" on public.daily_risk_scores for select using (true);
create policy "Public read epi_observations" on public.epidemiological_observations for select using (true);
create policy "Public read ingestion_logs" on public.ingestion_logs for select using (true);

-- User Profiles
create policy "Users read own profile" on public.user_profiles
    for select using (auth.uid() = id or public.is_moderator_or_admin());
create policy "Users update own profile" on public.user_profiles
    for update using (auth.uid() = id)
    with check (auth.uid() = id);

-- Crowd Reports
create policy "Read approved or own or mod reports" on public.crowd_reports
    for select using (
        status = 'APPROVED'
        or auth.uid() = user_id
        or public.is_moderator_or_admin()
    );

create policy "Authenticated users insert own pending reports" on public.crowd_reports
    for insert with check (
        auth.uid() = user_id
        and status = 'PENDING'
    );

create policy "Moderators update reports" on public.crowd_reports
    for update using (public.is_moderator_or_admin());

-- Report Votes
create policy "Public read votes" on public.report_votes
    for select using (true);

create policy "Authenticated users insert own vote" on public.report_votes
    for insert with check (auth.uid() = user_id);

create policy "Users delete own vote" on public.report_votes
    for delete using (auth.uid() = user_id);

-- Alert Subscriptions (strictly private)
create policy "Users manage own alerts" on public.alert_subscriptions
    for all using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Notification History (strictly private)
create policy "Users read own notifications" on public.notification_history
    for select using (auth.uid() = user_id or public.is_moderator_or_admin());

-- Moderation Audit History (moderators/admins only)
create policy "Moderators read audit history" on public.moderation_audit_history
    for select using (public.is_moderator_or_admin());

create policy "Moderators insert audit history" on public.moderation_audit_history
    for insert with check (public.is_moderator_or_admin() and auth.uid() = moderator_id);

-- System Config (moderators/admins read only)
create policy "Admins read system config" on public.system_config
    for select using (public.is_moderator_or_admin());

-- Private Storage bucket for citizen report photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'report-photos',
    'report-photos',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

create policy "Authenticated users upload own report photos"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users read own photos or moderators read all"
on storage.objects for select
to authenticated
using (
    bucket_id = 'report-photos'
    and (
        (storage.foldername(name))[1] = auth.uid()::text
        or public.is_moderator_or_admin()
    )
);
