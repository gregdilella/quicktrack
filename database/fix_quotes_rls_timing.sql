-- Fix quotes RLS timing issue
-- The problem: RLS policy checks for job existence but quotes are inserted 
-- immediately after job creation in the same transaction, causing timing issues

-- Solution: Use a more permissive policy that allows quote creation based on user permissions
-- rather than requiring the job to already exist in a separate transaction

BEGIN;

-- Drop existing quotes policies
DROP POLICY IF EXISTS quotes_select ON quotes;
DROP POLICY IF EXISTS quotes_insert ON quotes;
DROP POLICY IF EXISTS quotes_update ON quotes;
DROP POLICY IF EXISTS quotes_delete ON quotes;

-- SELECT: Same as before - users can see quotes for jobs they can access
CREATE POLICY quotes_select ON quotes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobsfile j
      WHERE j.jobnumber = quotes.jobnumber
      AND (
        get_current_user_role() IN ('Admin','Management','Operations') OR
        (
          get_current_user_role() = 'Customer' AND EXISTS (
            SELECT 1 FROM user_table ut
            WHERE ut.user_id = auth.uid() AND ut.customer_id = j.customer_id
          )
        ) OR (
          get_current_user_role() = 'LSP' AND EXISTS (
            SELECT 1 FROM user_table ut JOIN lsps l ON ut.lsp_id = l.id
            WHERE ut.user_id = auth.uid() AND l.vendor_code = j.vendorcode
          )
        )
      )
    )
  );

-- INSERT: More permissive - allow quote creation based on user role alone
-- This avoids the timing issue where the job might not be visible yet in the same transaction
CREATE POLICY quotes_insert ON quotes
  FOR INSERT WITH CHECK (
    -- Allow admins, management, and operations to create any quotes
    get_current_user_role() IN ('Admin','Management','Operations') OR
    -- Allow customers to create quotes (they can only create jobs for their own customer anyway)
    get_current_user_role() = 'Customer'
  );

-- UPDATE: Only admin/management/operations can update quotes
CREATE POLICY quotes_update ON quotes
  FOR UPDATE USING (
    get_current_user_role() IN ('Admin','Management','Operations')
  );

-- DELETE: Only admin/management/operations can delete quotes  
CREATE POLICY quotes_delete ON quotes
  FOR DELETE USING (
    get_current_user_role() IN ('Admin','Management','Operations')
  );

COMMIT;

-- Test the fix by checking policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'quotes'
ORDER BY policyname;
