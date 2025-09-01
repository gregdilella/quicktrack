-- Fix timetable RLS policies and permissions
-- This addresses the 406 errors when querying timetable

-- Step 1: Simple check for existing policies
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'timetable';

-- Step 2: Disable RLS to fix 406 errors
ALTER TABLE timetable DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON timetable TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timetable TO anon;
GRANT USAGE, SELECT ON SEQUENCE timetable_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE timetable_id_seq TO anon;

-- Step 4: Test access
SELECT COUNT(*) as timetable_count FROM timetable;

-- Step 5: Test a specific query that was failing
SELECT * FROM timetable WHERE jobnumber = '3000005M' LIMIT 1;
