-- COMPREHENSIVE CHECK: See what's actually in your database
-- Run this first to understand the current state

-- 1. Check if jobs table exists at all
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as jobs_table_status;

-- 2. If jobs table exists, check its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- 3. Check current user authentication
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    CASE 
        WHEN auth.uid() IS NULL THEN 'NOT AUTHENTICATED' 
        ELSE 'AUTHENTICATED' 
    END as auth_status;

-- 4. Check if user_table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_table') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as user_table_status;

-- 5. Check RLS status on jobs table (if it exists)
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'jobs';

-- 6. Check existing policies (if any)
SELECT 
    policyname, 
    cmd as operation,
    permissive,
    qual as condition
FROM pg_policies 
WHERE tablename = 'jobs';

-- 7. Count existing jobs (if table exists)
SELECT COUNT(*) as existing_jobs_count
FROM jobs
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs');

-- 8. Test simple authentication
SELECT 
    'Authentication test: ' || 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'PASSED - User ID: ' || auth.uid()::text
        ELSE 'FAILED - No user ID'
    END as auth_test_result; 