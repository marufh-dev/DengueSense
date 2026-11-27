-- Add traffic anomaly and rainy day inundation detection fields
ALTER TABLE public.crowd_reports 
  ADD COLUMN IF NOT EXISTS is_rain_event boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS congestion_level text DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'STANDARD';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_crowd_reports_congestion'
  ) THEN
    ALTER TABLE public.crowd_reports 
      ADD CONSTRAINT chk_crowd_reports_congestion 
      CHECK (congestion_level IN ('NONE', 'MODERATE', 'SEVERE_STANDSTILL'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_crowd_reports_priority'
  ) THEN
    ALTER TABLE public.crowd_reports 
      ADD CONSTRAINT chk_crowd_reports_priority 
      CHECK (priority IN ('STANDARD', 'HIGH_WATERLOGGING_ALERT'));
  END IF;
END $$;
