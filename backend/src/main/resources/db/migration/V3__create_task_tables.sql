CREATE TABLE tasks (
  id                  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  title               VARCHAR(255)       NOT NULL,
  description         TEXT,
  priority            task_priority_enum NOT NULL DEFAULT 'medium',
  status              task_status_enum   NOT NULL DEFAULT 'todo',
  deadline            TIMESTAMPTZ,
  assigned_to         UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_by         UUID               NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department          department_enum,
  is_cross_department BOOLEAN            NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ        NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_assigned_to  ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by  ON tasks(assigned_by);
CREATE INDEX idx_tasks_status       ON tasks(status);
CREATE INDEX idx_tasks_deadline     ON tasks(deadline);
CREATE INDEX idx_tasks_department   ON tasks(department);

CREATE TABLE task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id)        ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)        ON DELETE RESTRICT,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_task_comments_task ON task_comments(task_id);