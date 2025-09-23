-- Normalize due_date to a pure DATE while keeping existing values
DROP VIEW IF EXISTS task_reports;
DROP VIEW IF EXISTS active_tasks;

ALTER TABLE tasks
  ALTER COLUMN due_date TYPE DATE USING due_date::date;

-- Ensure existing NULL semantics remain unchanged
ALTER TABLE tasks
  ALTER COLUMN due_date DROP DEFAULT;

-- Refresh dependent indexes/views if needed
DROP INDEX IF EXISTS idx_tasks_due_date;
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Update views relying on due_date ordering
CREATE OR REPLACE VIEW active_tasks AS
SELECT * FROM tasks
WHERE status = 'active'
ORDER BY priority_level, due_date NULLS LAST, created_at;

CREATE OR REPLACE VIEW task_reports AS
SELECT
  DATE(completed_at) AS completion_date,
  quadrant,
  priority_level,
  COUNT(*) AS task_count,
  AVG(actual_time) AS avg_time,
  SUM(actual_time) AS total_time
FROM tasks
WHERE status = 'completed'
GROUP BY DATE(completed_at), quadrant, priority_level
ORDER BY completion_date DESC;
