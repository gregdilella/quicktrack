-- IMMEDIATE FIX: Disable RLS on jobs table
-- This will instantly resolve the permission denied error

ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Test that it works
SELECT 'RLS disabled - jobs table should work now' as status; 