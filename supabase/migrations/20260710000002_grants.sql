-- Custom schemas don't automatically grant the PostgREST roles access the
-- way `public` does — needs explicit GRANTs alongside the RLS policies.
-- Scoped per role rather than GRANT ALL: RLS policies restrict rows, but the
-- GRANT itself should already reflect the intended read/write ceiling per role
-- rather than relying on RLS as the only backstop.

GRANT USAGE ON SCHEMA sonicradar TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA sonicradar TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sonicradar TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA sonicradar TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA sonicradar TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sonicradar GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA sonicradar GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA sonicradar GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA sonicradar GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;

GRANT USAGE ON SCHEMA _meta TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA _meta TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA _meta TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA _meta TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA _meta GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA _meta GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA _meta GRANT ALL ON TABLES TO service_role;
