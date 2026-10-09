CREATE TABLE landing_content_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section      landing_section_enum NOT NULL,
  content_json JSONB NOT NULL,
  status       VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
  created_by   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_landing_content_versions_section_created
  ON landing_content_versions(section, created_at DESC);