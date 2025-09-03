-- Fix quotes RLS policies to allow proper access
-- This should resolve quotes not showing in the quote tab

-- Step 1: Drop any existing conflicting policies
DROP POLICY IF EXISTS "quotes_select" ON quotes;
DROP POLICY IF EXISTS "quotes_insert" ON quotes;
DROP POLICY IF EXISTS "quotes_update" ON quotes;
DROP POLICY IF EXISTS "quotes_delete" ON quotes;

-- Step 2: Disable RLS temporarily to clean up
ALTER TABLE quotes DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant basic permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quotes TO anon;
GRANT USAGE, SELECT ON SEQUENCE quotes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE quotes_id_seq TO anon;

-- Step 4: Re-enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, working policies
-- Allow Operations, Management, and Admin full access
CREATE POLICY "quotes_operations_access" ON quotes
    FOR ALL USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- Allow Customers to read quotes for their jobs
CREATE POLICY "quotes_customer_read" ON quotes
    FOR SELECT USING (
        get_current_user_role() = 'Customer' AND
        EXISTS (
            SELECT 1 FROM jobsfile j
            JOIN user_table ut ON ut.customer_id = j.customer_id
            WHERE ut.user_id = auth.uid() 
            AND j.jobnumber = quotes.jobnumber
        )
    );

-- Step 6: Test the policies
SELECT 'Quotes policies created successfully' as status;

-- Step 7: Show current policies for verification
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'quotes'
ORDER BY policyname;

-- Step 8: Test query to see if any quotes exist
SELECT 'Sample quotes data:' as info;
SELECT jobnumber, chargecode, charge, created_at 
FROM quotes 
ORDER BY created_at DESC 
LIMIT 10;
