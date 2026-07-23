-- Ranked full-text search for the AI glossary. Kept as a DB function (rather
-- than an unranked PostgREST `fts()` filter) so relevance ordering via
-- ts_rank lives in one place and is reusable outside the Next.js app.

CREATE OR REPLACE FUNCTION pm_rearchitected.search_terms(
  search_query text,
  filter_category text DEFAULT NULL,
  filter_max_priority smallint DEFAULT NULL
)
RETURNS TABLE (
  id_slug text,
  canonical_term text,
  short_definition text,
  category_id text,
  priority smallint,
  rank real
)
LANGUAGE sql STABLE AS $$
  SELECT
    t.id_slug,
    t.canonical_term,
    t.short_definition,
    t.category_id,
    t.priority,
    ts_rank(t.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM pm_rearchitected.terms t
  WHERE t.status = 'active'
    AND t.search_vector @@ websearch_to_tsquery('english', search_query)
    AND (filter_category IS NULL OR t.category_id = filter_category)
    AND (filter_max_priority IS NULL OR t.priority <= filter_max_priority)
  ORDER BY rank DESC, t.priority ASC, t.canonical_term ASC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION pm_rearchitected.search_terms(text, text, smallint) TO anon, service_role;
