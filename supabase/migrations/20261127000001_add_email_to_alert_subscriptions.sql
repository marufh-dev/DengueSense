-- Add custom alert email column to alert_subscriptions
ALTER TABLE public.alert_subscriptions ADD COLUMN IF NOT EXISTS email text;
