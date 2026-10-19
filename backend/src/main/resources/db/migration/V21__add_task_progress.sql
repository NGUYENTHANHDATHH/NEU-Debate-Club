ALTER TABLE tasks
  ADD COLUMN progress INTEGER NOT NULL DEFAULT 0
  CHECK (progress BETWEEN 0 AND 100);

UPDATE tasks SET progress = 100 WHERE status = 'done';
UPDATE tasks SET progress = 1 WHERE status = 'in_progress';

-- Old comments did not record progress; preserve that distinction.
ALTER TABLE task_comments
  ADD COLUMN progress INTEGER
  CHECK (progress BETWEEN 0 AND 100);

CREATE INDEX idx_task_comments_task_created_at
  ON task_comments(task_id, created_at, id);
