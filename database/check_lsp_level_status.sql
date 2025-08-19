-- =====================================================
-- CHECK LSP_LEVEL TABLE STATUS
-- Verify structure, data, and permissions
-- =====================================================

-- STEP 1: Check if lsp_level table exists and its structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lsp_level'
ORDER BY ordinal_position;

-- STEP 2: Check current data in lsp_level table
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN jobnumber IS NOT NULL THEN 1 END) as records_with_jobnumber,
    COUNT(CASE WHEN lsp_id IS NOT NULL THEN 1 END) as records_with_lsp_id,
    COUNT(CASE WHEN function IS NOT NULL THEN 1 END) as records_with_function
FROM lsp_level;

-- STEP 3: Show sample data from lsp_level
SELECT * FROM lsp_level LIMIT 5;

-- STEP 4: Check RLS policies on lsp_level
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'lsp_level'
ORDER BY policyname;

-- STEP 5: Check foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'lsp_level'
ORDER BY kcu.column_name;

-- STEP 6: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'lsp_level';

-- STEP 7: Test current user permissions
SELECT 
    'CURRENT_USER_ROLE' as info,
    get_current_user_role() as role;

-- STEP 8: Test basic operations (safe version)
DO $$
DECLARE
    test_lsp_id UUID;
    test_vendor_code TEXT;
BEGIN
    -- Only test if we have actual LSP data
    SELECT id, vendor_code INTO test_lsp_id, test_vendor_code 
    FROM lsps 
    WHERE vendor_name IS NOT NULL 
    LIMIT 1;
    
    IF test_lsp_id IS NOT NULL THEN
        RAISE NOTICE 'PERMISSIONS TEST: LSP data available for testing';
        RAISE NOTICE 'Test LSP ID: %, Vendor Code: %', test_lsp_id, test_vendor_code;
    ELSE
        RAISE NOTICE 'PERMISSIONS TEST: No LSP data available - add LSPs first';
    END IF;
END $$;
