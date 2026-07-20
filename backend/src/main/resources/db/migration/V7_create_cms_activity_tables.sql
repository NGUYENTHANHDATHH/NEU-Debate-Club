CREATE TABLE landing_content (
  id           UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  section      landing_section_enum NOT NULL UNIQUE,
  content_json JSONB                NOT NULL DEFAULT '{}',
  is_published BOOLEAN              NOT NULL DEFAULT true,
  updated_by   UUID                 NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at   TIMESTAMPTZ          NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   UUID         NOT NULL,
  metadata    JSONB        DEFAULT '{}',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);