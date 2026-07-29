CREATE TABLE media_links (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255)  NOT NULL,
  url         TEXT          NOT NULL,
  platform    platform_enum NOT NULL,
  department  department_enum NOT NULL,
  event_id    UUID          REFERENCES events(id) ON DELETE SET NULL,
  reach       INTEGER       NOT NULL DEFAULT 0,
  likes       INTEGER       NOT NULL DEFAULT 0,
  shares      INTEGER       NOT NULL DEFAULT 0,
  comments    INTEGER       NOT NULL DEFAULT 0,
  posted_at   DATE          NOT NULL,
  created_by  UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_links_department ON media_links(department);
CREATE INDEX idx_media_links_platform   ON media_links(platform);
CREATE INDEX idx_media_links_posted_at  ON media_links(posted_at DESC);

CREATE TABLE landing_content (
  id           UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  section      landing_section_enum NOT NULL UNIQUE,
  content_json TEXT                 NOT NULL DEFAULT '{}',
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
CREATE INDEX idx_activity_logs_entity     ON activity_logs(entity_type, entity_id);