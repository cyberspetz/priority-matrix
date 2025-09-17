-- Enable Row Level Security on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Option 1: Restrict to specific IP (not recommended for dynamic IPs)
-- CREATE POLICY "Allow specific IP only" ON tasks
-- FOR ALL USING (inet_client_addr() = '203.0.113.1'::inet);

-- Option 2: Allow all for now but prepare for authentication
CREATE POLICY "Allow all operations for now" ON tasks
FOR ALL USING (true);

-- When you add authentication later, replace with:
-- DROP POLICY "Allow all operations for now" ON tasks;
-- CREATE POLICY "Users can manage their own tasks" ON tasks
-- FOR ALL USING (auth.uid()::text = user_id);

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'tasks';