-- ============================================================
-- Schedule the update-weather-cache Edge Function every 30 minutes,
-- per the intent already documented in the weather_cache table comment
-- ("Populated by a Supabase Edge Function on a cron schedule (every 30
-- min)") but never actually built until now.
-- ============================================================

-- Weather/tide is shown on the Home screen in guest mode too (like alerts),
-- but was only granted to `authenticated` — widen it the same way alerts
-- already works for anon.
DROP POLICY IF EXISTS "weather_cache: authenticated read" ON village_summer.weather_cache;
CREATE POLICY "weather_cache: anyone can read"
  ON village_summer.weather_cache FOR SELECT
  USING (true);
GRANT SELECT ON village_summer.weather_cache TO anon;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'update-weather-cache',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kywdezqgrtpzuecxxvfc.supabase.co/functions/v1/update-weather-cache',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5d2RlenFncnRwenVlY3h4dmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODczOTYsImV4cCI6MjA5OTI2MzM5Nn0.LvsbmkQKAMLoC0z4J_pqlhyrInm-9FgLBV2Xb8MrDVc',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
