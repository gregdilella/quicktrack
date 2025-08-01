-- Debug script to check jobs table permissions and user roles
-- Run this in your Supabase SQL editor to diagnose the permission issue

-- 1. Check if jobs table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'jobs';

-- 2. Check current user authentication
SELECT auth.uid() as current_user_id, auth.role() as current_role;

-- 3. Check if current user exists in user_table
SELECT user_id, email, role, first_name, last_name
FROM user_table 
WHERE user_id = auth.uid();

-- 4. Check RLS policies on jobs table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'jobs';

-- 5. Check if RLS is enabled on jobs table
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'jobs';

-- 6. Test a simple insert (this will show the exact error)
-- Note: This will fail but show us the specific permission issue
INSERT INTO jobs (job_number, commodity, shipper_name, consignee_name) 
VALUES ('TEST001', 'Test Commodity', 'Test Shipper', 'Test Consignee'); 