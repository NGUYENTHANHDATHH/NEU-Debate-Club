ALTER TABLE events
  ADD COLUMN resource_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE events
  ADD CONSTRAINT events_resource_urls_array_check
  CHECK (jsonb_typeof(resource_urls) = 'array');
