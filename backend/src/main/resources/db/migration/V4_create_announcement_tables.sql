CREATE TABLE announcements (
  id                UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(255)             NOT NULL,
  content           TEXT                     NOT NULL,
  target_role       VARCHAR(50)              NOT NULL DEFAULT 'all',
  target_department department_enum,
  is_pinned         BOOLEAN                  NOT NULL DEFAULT false,
  created_by        UUID                     NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ              NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ              NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_created_at        ON announcements(created_at DESC);


