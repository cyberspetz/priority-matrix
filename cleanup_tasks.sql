-- Script to delete all non-active tasks (completed and archived)
-- This will keep only active tasks in the database

-- Show what will be deleted (for confirmation)
SELECT
  status,
  COUNT(*) as task_count,
  string_agg(title, ', ' ORDER BY created_at) as sample_titles
FROM tasks
WHERE status != 'active'
GROUP BY status;

-- Delete all completed tasks
DELETE FROM tasks WHERE status = 'completed';

-- Delete all archived tasks
DELETE FROM tasks WHERE status = 'archived';

-- Delete any other non-active tasks (cancelled, deferred, etc.)
DELETE FROM tasks WHERE status != 'active';

-- Show remaining tasks
SELECT
  status,
  COUNT(*) as remaining_tasks
FROM tasks
GROUP BY status;