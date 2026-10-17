-- Make the catalog tables the initial source for public projects and achievements.
-- Existing catalog rows are preserved; legacy landing JSON is used only when a catalog is empty.

INSERT INTO projects (
    title, slug, description, image_url, category, display_order, is_visible
)
SELECT
    item->>'title',
    item->>'id',
    item->>'desc',
    item->>'image',
    CASE item->>'category'
        WHEN 'Talkshow' THEN 'talkshow'
        WHEN 'Workshop' THEN 'workshop'
        WHEN 'Competition' THEN 'debate_tournament'
        ELSE 'other'
    END::landing_project_enum,
    (item->>'id')::integer,
    true
FROM landing_content
CROSS JOIN LATERAL jsonb_array_elements(content_json->'items') AS item
WHERE section = 'projects'
  AND NOT EXISTS (SELECT 1 FROM projects);

INSERT INTO achievements (
    title, slug, description, image_url, category, display_order, is_visible
)
SELECT
    item->>'title',
    item->>'id',
    item->>'desc',
    item->>'image',
    CASE item->>'id'
        WHEN '1' THEN 'award'
        WHEN '2' THEN 'championship'
        ELSE 'other'
    END::landing_achievement_enum,
    (item->>'id')::integer,
    true
FROM landing_content
CROSS JOIN LATERAL jsonb_array_elements(content_json->'items') AS item
WHERE section = 'achievements'
  AND NOT EXISTS (SELECT 1 FROM achievements);
