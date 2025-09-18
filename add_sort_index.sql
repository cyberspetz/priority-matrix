-- Add sort_index column to maintain manual ordering within each quadrant
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS sort_index integer;

-- Initialize sort_index based on created_at per quadrant where NULL
WITH ordered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY quadrant ORDER BY created_at) - 1 AS rn
  FROM tasks
  WHERE sort_index IS NULL
)
UPDATE tasks t
SET sort_index = o.rn
FROM ordered o
WHERE t.id = o.id;

-- Helpful index for ordering queries
CREATE INDEX IF NOT EXISTS idx_tasks_quadrant_sort ON tasks(quadrant, sort_index);

