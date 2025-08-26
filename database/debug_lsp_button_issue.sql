-- =====================================================
-- DEBUG LSP BUTTON ISSUE
-- Check database structure and data integrity
-- =====================================================

-- Check if required tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('lsps', 'lsp_level', 'jobsfile', 'awb')
ORDER BY table_name;

-- Check lsps table structure and data
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lsps'
ORDER BY ordinal_position;

-- Check lsp_level table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lsp_level'
ORDER BY ordinal_position;

-- Check current LSPs data (including problematic rows)
SELECT 
    id,
    vendor_name,
    vendor_code,
    contact_email,
    CASE 
        WHEN vendor_name IS NULL THEN 'NULL'
        WHEN TRIM(vendor_name) = '' THEN 'EMPTY'
        WHEN LENGTH(TRIM(vendor_name)) = 0 THEN 'WHITESPACE_ONLY'
        ELSE 'HAS_VALUE'
    END as vendor_name_status,
    LENGTH(vendor_name) as name_length
FROM lsps
ORDER BY vendor_name_status, vendor_name;

-- Count LSPs by status
SELECT 
    CASE 
        WHEN vendor_name IS NULL THEN 'NULL'
        WHEN TRIM(vendor_name) = '' THEN 'EMPTY'
        WHEN LENGTH(TRIM(vendor_name)) = 0 THEN 'WHITESPACE_ONLY'
        ELSE 'HAS_VALUE'
    END as status,
    COUNT(*) as count
FROM lsps
GROUP BY 
    CASE 
        WHEN vendor_name IS NULL THEN 'NULL'
        WHEN TRIM(vendor_name) = '' THEN 'EMPTY'
        WHEN LENGTH(TRIM(vendor_name)) = 0 THEN 'WHITESPACE_ONLY'
        ELSE 'HAS_VALUE'
    END
ORDER BY status;

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('lsp_level', 'lsp_costs')
ORDER BY tc.table_name, kcu.column_name;

-- Check RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('lsps', 'lsp_level')
ORDER BY tablename, policyname;

-- Test a simple insert to lsp_level (will fail if table doesn't exist or has permission issues)
-- This is a test - we'll rollback
BEGIN;

-- Try to insert a test record
INSERT INTO lsp_level (
    jobnumber,
    lsp_id,
    vendorcode,
    function,
    status,
    assigned_date
) VALUES (
    'TEST-JOB-123',
    (SELECT id FROM lsps WHERE vendor_name IS NOT NULL LIMIT 1),
    (SELECT vendor_code FROM lsps WHERE vendor_name IS NOT NULL LIMIT 1),
    'Pickup',
    'Assigned',
    NOW()
);

-- Check if the insert worked
SELECT * FROM lsp_level WHERE jobnumber = 'TEST-JOB-123';

-- Rollback the test
ROLLBACK;

-- =====================================================
-- SAMPLE GOOD LSPs DATA (if table is empty)
-- =====================================================

-- Uncomment to add some sample LSPs if your table is empty
/*
INSERT INTO lsps (vendor_name, vendor_code, contact_email, phone) VALUES
('Express Logistics LLC', 'EXP001', 'ops@expresslogistics.com', '+1-555-0001'),
('Global Transport Services', 'GTS002', 'dispatch@globaltransport.com', '+1-555-0002'),
('Metro Delivery Solutions', 'MDS003', 'info@metrodelivery.com', '+1-555-0003'),
('Rapid Freight Systems', 'RFS004', 'contact@rapidfreight.com', '+1-555-0004'),
('Elite Cargo Services', 'ECS005', 'service@elitecargo.com', '+1-555-0005')
ON CONFLICT (vendor_code) DO UPDATE SET
    vendor_name = EXCLUDED.vendor_name,
    contact_email = EXCLUDED.contact_email,
    phone = EXCLUDED.phone,
    updated_at = NOW();
*/



