-- Rufus: adult/child role (for computed event visibility) and a school-domain
-- fallback table (for person detection when an email doesn't name a family
-- member by name, e.g. a school's automated mailer). See rufus repo's
-- lib/visibility.ts and scripts/pipeline/write.ts for how these are used.

ALTER TABLE rufus.family_members ADD COLUMN IF NOT EXISTS is_adult boolean NOT NULL DEFAULT false;

UPDATE rufus.family_members SET is_adult = true WHERE name IN ('Rick', 'Kim');

CREATE TABLE IF NOT EXISTS rufus.member_email_domains (
  id                uuid primary key default gen_random_uuid(),
  family_member_id  uuid not null references rufus.family_members(id) on delete cascade,
  domain            text not null,
  created_at        timestamptz not null default now()
);

ALTER TABLE rufus.member_email_domains ENABLE ROW LEVEL SECURITY;

GRANT ALL ON rufus.member_email_domains TO service_role;

INSERT INTO rufus.member_email_domains (family_member_id, domain)
SELECT fm.id, d.domain
FROM rufus.family_members fm
JOIN (VALUES
  ('Nora', 'austinprep.org'),
  ('Nora', 'veracross.com'),
  ('Ben',  'stjohnsprep.org')
) AS d(name, domain) ON d.name = fm.name
WHERE NOT EXISTS (SELECT 1 FROM rufus.member_email_domains);
