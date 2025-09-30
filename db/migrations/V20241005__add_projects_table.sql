-- Projects catalog to align with Todoist-style workflow
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS projects_name_unique ON projects(name);

CREATE OR REPLACE FUNCTION set_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_set_updated_at ON projects;
CREATE TRIGGER trg_projects_set_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION set_projects_updated_at();

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

INSERT INTO projects (name, is_default)
SELECT 'Inbox', TRUE
WHERE NOT EXISTS (SELECT 1 FROM projects);

WITH default_proj AS (
  SELECT id FROM projects WHERE is_default = TRUE ORDER BY created_at LIMIT 1
)
UPDATE projects
SET is_default = projects.id = (SELECT id FROM default_proj)
WHERE is_default IS TRUE;

UPDATE tasks
SET project_id = (SELECT id FROM projects WHERE is_default = TRUE LIMIT 1)
WHERE project_id IS NULL;
