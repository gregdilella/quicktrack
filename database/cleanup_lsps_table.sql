-- =====================================================
-- CLEANUP LSPs TABLE
-- Remove rows without vendor_name (nulls, empty strings, whitespace)
-- =====================================================

-- STEP 1: Inspect what we're about to delete
SELECT 
    'BEFORE CLEANUP' as status,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN vendor_name IS NULL THEN 1 END) as null_names,
    COUNT(CASE WHEN TRIM(vendor_name) = '' THEN 1 END) as empty_names,
    COUNT(CASE WHEN LENGTH(TRIM(vendor_name)) = 0 THEN 1 END) as whitespace_names,
    COUNT(CASE WHEN vendor_name IS NOT NULL AND TRIM(vendor_name) != '' THEN 1 END) as valid_names
FROM lsps;

-- STEP 2: Show the problematic rows that will be deleted
SELECT 
    id,
    vendor_name,
    vendor_code,
    contact_email,
    'WILL BE DELETED' as action,
    CASE 
        WHEN vendor_name IS NULL THEN 'NULL'
        WHEN TRIM(vendor_name) = '' THEN 'EMPTY STRING'
        WHEN LENGTH(TRIM(vendor_name)) = 0 THEN 'WHITESPACE ONLY'
        ELSE 'UNKNOWN'
    END as reason
FROM lsps 
WHERE vendor_name IS NULL 
   OR TRIM(vendor_name) = '' 
   OR LENGTH(TRIM(vendor_name)) = 0;

-- STEP 3: Delete the problematic rows
-- This will remove ALL rows where vendor_name is NULL, empty, or whitespace-only
DELETE FROM lsps 
WHERE vendor_name IS NULL 
   OR TRIM(vendor_name) = '' 
   OR LENGTH(TRIM(vendor_name)) = 0;

-- =====================================================
-- VERIFICATION AFTER CLEANUP
-- =====================================================

-- Show remaining records
SELECT 
    COUNT(*) as remaining_lsps,
    COUNT(CASE WHEN vendor_name IS NOT NULL AND TRIM(vendor_name) != '' THEN 1 END) as valid_vendor_names
FROM lsps;

-- Show sample of remaining data
SELECT 
    id,
    vendor_name,
    vendor_code,
    contact_email,
    created_at
FROM lsps 
ORDER BY vendor_name
LIMIT 10;

-- =====================================================
-- OPTIONAL: ADD CONSTRAINTS TO PREVENT FUTURE ISSUES
-- =====================================================

-- Uncomment to add constraints that prevent empty vendor_names in the future
/*
-- Add NOT NULL constraint
ALTER TABLE lsps 
ALTER COLUMN vendor_name SET NOT NULL;

-- Add CHECK constraint to prevent empty strings
ALTER TABLE lsps 
ADD CONSTRAINT lsps_vendor_name_not_empty 
CHECK (LENGTH(TRIM(vendor_name)) > 0);
*/

COMMENT ON TABLE lsps IS 'Logistics Service Providers - cleaned up to remove entries without vendor names';
