-- Base schema: create tasks table with full columns used by the app
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quadrant VARCHAR(50) NOT NULL CHECK (quadrant IN (
    'urgent-important',
    'not-urgent-important',
    'urgent-not-important',
    'not-urgent-not-important'
  )),
  -- Status & completion
  is_completed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','completed','archived','cancelled','deferred')),
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  -- Priority & scheduling
  priority_level TEXT DEFAULT 'p3' CHECK (priority_level IN ('p1','p2','p3','p4')),
  due_date TIMESTAMPTZ,
  sort_index INTEGER,

  -- Time tracking
  time_estimate INTEGER,
  actual_time INTEGER,

  -- Organization
  tags TEXT[],
  notes TEXT,

  -- Timestamps & user
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_quadrant ON tasks(quadrant);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_level ON tasks(priority_level);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_archived_at ON tasks(archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_quadrant_sort ON tasks(quadrant, sort_index);

