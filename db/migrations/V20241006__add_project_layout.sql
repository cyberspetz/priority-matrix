ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'board';

UPDATE projects
SET layout = COALESCE(layout, 'board');
