-- Enhanced Task Management System Migration
-- Run this in your Supabase SQL editor to add the new columns

-- Add new columns to existing tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'cancelled', 'deferred')),
ADD COLUMN IF NOT EXISTS completed_at timestamp,
ADD COLUMN IF NOT EXISTS archived_at timestamp,
ADD COLUMN IF NOT EXISTS priority_level text DEFAULT 'p3' CHECK (priority_level IN ('p1', 'p2', 'p3', 'p4')),
ADD COLUMN IF NOT EXISTS time_estimate integer, -- in minutes
ADD COLUMN IF NOT EXISTS actual_time integer,   -- in minutes
ADD COLUMN IF NOT EXISTS tags text[],           -- for categorization
ADD COLUMN IF NOT EXISTS notes text;            -- additional notes

-- Update existing tasks to have proper status
UPDATE tasks
SET status = CASE
  WHEN is_completed = true THEN 'completed'
  ELSE 'active'
END
WHERE status IS NULL;

-- Update existing tasks to have proper completed_at timestamp
UPDATE tasks
SET completed_at = updated_at
WHERE is_completed = true AND completed_at IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_level ON tasks(priority_level);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at);

-- Create a view for active tasks (most commonly queried)
CREATE OR REPLACE VIEW active_tasks AS
SELECT * FROM tasks
WHERE status = 'active'
ORDER BY priority_level, due_date NULLS LAST, created_at;

-- Create a view for reporting queries
CREATE OR REPLACE VIEW task_reports AS
SELECT
  DATE(completed_at) as completion_date,
  quadrant,
  priority_level,
  COUNT(*) as task_count,
  AVG(actual_time) as avg_time,
  SUM(actual_time) as total_time
FROM tasks
WHERE status = 'completed'
GROUP BY DATE(completed_at), quadrant, priority_level
ORDER BY completion_date DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT ON active_tasks TO authenticated;
-- GRANT SELECT ON task_reports TO authenticated;