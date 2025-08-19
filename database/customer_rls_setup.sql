-- =====================================================
-- CUSTOMER RLS SETUP
-- Ensure proper Row Level Security for customer data isolation
-- =====================================================

-- First, let's check if RLS is enabled on key tables
ALTER TABLE jobsfile ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "jobsfile_select" ON jobsfile;
DROP POLICY IF EXISTS "jobsfile_insert" ON jobsfile;
DROP POLICY IF EXISTS "jobsfile_update" ON jobsfile;

-- Create comprehensive jobsfile policies
-- SELECT: Customers can only see their own jobs
CREATE POLICY "jobsfile_customer_select" ON jobsfile
    FOR SELECT USING (
        -- Admin, Management, Operations can see all
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        -- Customers can only see jobs for their customer_id
        (
            get_current_user_role() = 'Customer' AND
            EXISTS (
                SELECT 1 FROM user_table ut 
                WHERE ut.user_id = auth.uid() 
                AND ut.customer_id = jobsfile.customer_id
            )
        ) OR
        -- LSPs can see jobs with their vendorcode
        (
            get_current_user_role() = 'LSP' AND
            EXISTS (
                SELECT 1 FROM user_table ut 
                JOIN lsps l ON ut.lsp_id = l.id
                WHERE ut.user_id = auth.uid() 
                AND l.vendor_code = jobsfile.vendorcode
            )
        )
    );

-- INSERT: Customers can create jobs, but only for their own customer_id
CREATE POLICY "jobsfile_customer_insert" ON jobsfile
    FOR INSERT WITH CHECK (
        -- Admin, Management, Operations can insert any job
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        -- Customers can only insert jobs for their own customer_id
        (
            get_current_user_role() = 'Customer' AND
            EXISTS (
                SELECT 1 FROM user_table ut 
                WHERE ut.user_id = auth.uid() 
                AND ut.customer_id = jobsfile.customer_id
            )
        )
    );

-- UPDATE: Only admin/management/operations can update jobs
CREATE POLICY "jobsfile_customer_update" ON jobsfile
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- Ensure customers table policies allow customers to see their own data
DROP POLICY IF EXISTS "customers_select" ON customers;
CREATE POLICY "customers_customer_select" ON customers
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        -- Customers can see their own customer record
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = customers.id
        )
    );

-- Create a function to get current user's customer info
CREATE OR REPLACE FUNCTION get_current_user_customer()
RETURNS TABLE(customer_id UUID, customer_name TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.customer_id,
        c.name as customer_name
    FROM user_table ut
    LEFT JOIN customers c ON ut.customer_id = c.id
    WHERE ut.user_id = auth.uid()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to auto-populate customer info on job creation
CREATE OR REPLACE FUNCTION auto_populate_customer_info()
RETURNS TRIGGER AS $$
DECLARE
    user_customer_id UUID;
    user_customer_name TEXT;
BEGIN
    -- Get the current user's customer info
    SELECT customer_id, customer_name 
    INTO user_customer_id, user_customer_name
    FROM get_current_user_customer();
    
    -- If user is a customer and customer_id is not set, auto-populate it
    IF get_current_user_role() = 'Customer' THEN
        IF NEW.customer_id IS NULL THEN
            NEW.customer_id := user_customer_id;
        END IF;
        
        IF NEW.customer_name IS NULL THEN
            NEW.customer_name := user_customer_name;
        END IF;
        
        -- Set created_by to current user
        NEW.created_by := auth.uid()::TEXT;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-populating customer info
DROP TRIGGER IF EXISTS auto_populate_customer_trigger ON jobsfile;
CREATE TRIGGER auto_populate_customer_trigger
    BEFORE INSERT ON jobsfile
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_customer_info();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON jobsfile TO authenticated;
GRANT SELECT ON customers TO authenticated;
GRANT SELECT ON user_table TO authenticated;

-- Test the setup with some sample data verification
-- This is commented out for safety, uncomment to test
/*
-- Test query to verify customer can only see their jobs
-- SELECT * FROM jobsfile WHERE customer_id IN (
--     SELECT customer_id FROM user_table WHERE user_id = auth.uid()
-- );
*/

COMMENT ON POLICY "jobsfile_customer_select" ON jobsfile IS 'Customers can only view jobs for their own customer_id';
COMMENT ON POLICY "jobsfile_customer_insert" ON jobsfile IS 'Customers can create jobs, auto-populated with their customer_id';
COMMENT ON FUNCTION get_current_user_customer() IS 'Returns current users customer information for auto-population';
