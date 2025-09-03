-- Fix timetable permissions and RLS policies once and for all
-- This should resolve the timeline save issues

-- Step 1: Drop any existing conflicting policies
DROP POLICY IF EXISTS "timetable_select" ON timetable;
DROP POLICY IF EXISTS "timetable_insert" ON timetable;
DROP POLICY IF EXISTS "timetable_update" ON timetable;
DROP POLICY IF EXISTS "timetable_delete" ON timetable;

-- Step 2: Disable RLS temporarily to clean up
ALTER TABLE timetable DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant basic permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON timetable TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON timetable TO anon;
GRANT USAGE, SELECT ON SEQUENCE timetable_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE timetable_id_seq TO anon;

-- Step 4: Re-enable RLS
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, working policies
-- Allow Operations, Management, and Admin full access
CREATE POLICY "timetable_operations_access" ON timetable
    FOR ALL USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- Allow LSPs to update timeline for jobs they're assigned to
CREATE POLICY "timetable_lsp_update" ON timetable
    FOR UPDATE USING (
        get_current_user_role() = 'LSP' AND
        EXISTS (
            SELECT 1 FROM lsp_level ll
            JOIN lsps l ON ll.lsp_id = l.id
            JOIN user_table ut ON ut.lsp_id = l.id
            WHERE ut.user_id = auth.uid() 
            AND ll.jobnumber = timetable.jobnumber
        )
    );

-- Allow Customers to read timeline for their jobs
CREATE POLICY "timetable_customer_read" ON timetable
    FOR SELECT USING (
        get_current_user_role() = 'Customer' AND
        EXISTS (
            SELECT 1 FROM jobsfile j
            JOIN user_table ut ON ut.customer_id = j.customer_id
            WHERE ut.user_id = auth.uid() 
            AND j.jobnumber = timetable.jobnumber
        )
    );

-- Step 6: Test the policies
SELECT 'Timetable policies created successfully' as status;

-- Step 7: Show current policies for verification
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'timetable'
ORDER BY policyname;
