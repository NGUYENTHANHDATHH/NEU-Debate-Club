CREATE TABLE events (
  id                 UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  title              VARCHAR(255)      NOT NULL,
  description        TEXT,
  event_date         TIMESTAMPTZ       NOT NULL,
  location           VARCHAR(255),
  status             event_status_enum NOT NULL DEFAULT 'upcoming',
  is_public          BOOLEAN           NOT NULL DEFAULT true,
  budget             DECIMAL(15,2)     NOT NULL DEFAULT 0,
  actual_attendees   INTEGER,
  expected_attendees INTEGER,
  post_event_notes   TEXT,
  post_event_rating  SMALLINT CHECK (post_event_rating BETWEEN 1 AND 5),
  created_by         UUID              NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ       NOT NULL DEFAULT now(),
  CONSTRAINT events_budget_check CHECK (budget >= 0)
);

CREATE INDEX idx_events_event_date ON events(event_date);

CREATE TABLE event_checklist_items (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID                  NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title             VARCHAR(255)          NOT NULL,
  status            checklist_status_enum NOT NULL DEFAULT 'pending',
  priority          task_priority_enum    NOT NULL DEFAULT 'medium',
  assigned_to       UUID                  REFERENCES users(id) ON DELETE SET NULL,
  deadline          TIMESTAMPTZ,
  days_before_event INTEGER,
  order_index       INTEGER               NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_event       ON event_checklist_items(event_id);
CREATE INDEX idx_checklist_items_assigned_to ON event_checklist_items(assigned_to);