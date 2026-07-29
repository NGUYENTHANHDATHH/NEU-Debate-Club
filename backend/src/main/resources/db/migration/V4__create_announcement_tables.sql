CREATE TABLE announcements (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(255) NOT NULL,
  content           TEXT        NOT NULL,
  target_role       VARCHAR(50) NOT NULL DEFAULT 'all',
  target_department department_enum,
  is_pinned         BOOLEAN     NOT NULL DEFAULT false,
  created_by        UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_announcements_created_at        ON announcements(created_at DESC);
CREATE INDEX idx_announcements_target_department ON announcements(target_department);
CREATE INDEX idx_announcements_is_pinned         ON announcements(is_pinned);

CREATE TABLE notifications (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  type       VARCHAR(50)  NOT NULL,
  entity_id  UUID,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);