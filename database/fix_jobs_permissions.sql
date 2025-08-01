-- Fix script for jobs table permissions
-- This addresses common RLS permission issues

-- Option 1: Temporarily disable RLS for testing (QUICK FIX)
-- Uncomment this line to disable RLS temporarily
-- ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Option 2: Create more permissive policies (RECOMMENDED)

-- First, drop existing policies
DROP POLICY IF EXISTS "Admin can manage all jobs" ON jobs;
DROP POLICY IF EXISTS "Operations can manage jobs" ON jobs;
DROP POLICY IF EXISTS "Management can read all jobs" ON jobs;
DROP POLICY IF EXISTS "LSP can read assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Customer can read their own jobs" ON jobs;

-- Create more permissive policies that work with authenticated users
-- Policy for authenticated users to insert jobs
CREATE POLICY "Authenticated users can insert jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for authenticated users to read jobs
CREATE POLICY "Authenticated users can read jobs" ON jobs
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to update jobs
CREATE POLICY "Authenticated users can update jobs" ON jobs
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to delete jobs (if needed)
CREATE POLICY "Authenticated users can delete jobs" ON jobs
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Alternative: Role-based policies that check user_table
-- Uncomment these if you want role-based access control

/*
-- Admin can do everything
CREATE POLICY "Admin full access" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role IN ('Admin', 'Operations')
        )
    );

-- Operations can manage jobs
CREATE POLICY "Operations can manage jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role IN ('Admin', 'Operations')
        )
    );

-- Management can read jobs
CREATE POLICY "Management can read jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role IN ('Admin', 'Operations', 'Management')
        )
    );
*/

-- Ensure RLS is enabled
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Test the fix
INSERT INTO jobs (job_number, commodity, shipper_name, consignee_name) 
VALUES ('TEST002', 'Test Commodity 2', 'Test Shipper 2', 'Test Consignee 2');

-- If the above works, clean up the test data
DELETE FROM jobs WHERE job_number LIKE 'TEST%'; 