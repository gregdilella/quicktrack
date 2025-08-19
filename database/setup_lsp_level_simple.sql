-- =====================================================
-- SETUP LSP_LEVEL TABLE - SIMPLIFIED AND WORKING
-- Ensure proper structure, RLS, and CRUD access
-- =====================================================

-- STEP 1: Fix function column if it's VARCHAR(1)
ALTER TABLE lsp_level DROP CONSTRAINT IF EXISTS lsp_level_function_check;
ALTER TABLE lsp_level ALTER COLUMN function TYPE VARCHAR(20);

-- STEP 2: Clean up any bad data in LSPs table
DELETE FROM lsps 
WHERE vendor_name IS NULL 
   OR TRIM(vendor_name) = '' 
   OR LENGTH(TRIM(vendor_name)) = 0;

-- STEP 3: Add sample LSPs if table is empty
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM lsps WHERE vendor_name IS NOT NULL) = 0 THEN
        INSERT INTO lsps (vendor_name, vendor_code, contact_email, phone) VALUES
        ('Express Logistics LLC', 'EXP001', 'ops@expresslogistics.com', '+1-555-0001'),
        ('Global Transport Services', 'GTS002', 'dispatch@globaltransport.com', '+1-555-0002'),
        ('Metro Delivery Solutions', 'MDS003', 'info@metrodelivery.com', '+1-555-0003'),
        ('Rapid Freight Systems', 'RFS004', 'contact@rapidfreight.com', '+1-555-0004'),
        ('Elite Cargo Services', 'ECS005', 'service@elitecargo.com', '+1-555-0005');
    END IF;
END $$;

-- STEP 4: Enable RLS on lsp_level
ALTER TABLE lsp_level ENABLE ROW LEVEL SECURITY;

-- STEP 5: Drop existing policies
DROP POLICY IF EXISTS "lsp_level_select" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_insert" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_update" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_delete" ON lsp_level;

-- STEP 6: Create simple, permissive policies for operations users
CREATE POLICY "lsp_level_select" ON lsp_level 
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "lsp_level_insert" ON lsp_level 
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "lsp_level_update" ON lsp_level 
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "lsp_level_delete" ON lsp_level 
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- STEP 7: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lsp_level TO authenticated;
GRANT SELECT ON lsps TO authenticated;
GRANT SELECT ON jobsfile TO authenticated;

-- STEP 8: Test basic operations (only if data exists)
DO $$
DECLARE
    test_lsp_id UUID;
    test_vendor_code TEXT;
BEGIN
    -- Only run test if we have LSPs available
    SELECT id, vendor_code INTO test_lsp_id, test_vendor_code 
    FROM lsps 
    WHERE vendor_name IS NOT NULL 
    LIMIT 1;
    
    IF test_lsp_id IS NOT NULL THEN
        -- Test insert
        INSERT INTO lsp_level (jobnumber, lsp_id, vendorcode, function, status) 
        VALUES (
            'TEST-SIMPLE', 
            test_lsp_id,
            test_vendor_code,
            'Pickup', 
            'Assigned'
        );
        
        -- Check if it worked
        IF EXISTS (SELECT 1 FROM lsp_level WHERE jobnumber = 'TEST-SIMPLE') THEN
            RAISE NOTICE 'LSP_LEVEL INSERT TEST: SUCCESS';
        ELSE
            RAISE NOTICE 'LSP_LEVEL INSERT TEST: FAILED';
        END IF;
        
        -- Clean up test data
        DELETE FROM lsp_level WHERE jobnumber = 'TEST-SIMPLE';
    ELSE
        RAISE NOTICE 'LSP_LEVEL TEST: SKIPPED - No LSPs available';
    END IF;
END $$;

-- STEP 9: Verification
SELECT 
    'SETUP_COMPLETE' as status,
    (SELECT COUNT(*) FROM lsps WHERE vendor_name IS NOT NULL) as available_lsps,
    (SELECT COUNT(*) FROM lsp_level) as existing_assignments;

-- Show current lsp_level structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lsp_level'
ORDER BY ordinal_position;

-- Show RLS policies
SELECT 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename = 'lsp_level'
ORDER BY policyname;
