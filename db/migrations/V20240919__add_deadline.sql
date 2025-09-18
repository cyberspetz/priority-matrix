-- Add deadline field to tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMPTZ;

-- Optional index if filtering by deadline often
CREATE INDEX IF NOT EXISTS idx_tasks_deadline_at ON tasks(deadline_at);

