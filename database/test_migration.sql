-- Test script to verify the migration worked correctly
-- Run this after the migration to test job creation

-- Test 1: Verify table structure
SELECT 
    'Table structure verification' as test_name,
    COUNT(*) as total_columns,
    COUNT(CASE WHEN column_name = 'jobno' THEN 1 END) as has_jobno,
    COUNT(CASE WHEN column_name = 'job_number' THEN 1 END) as has_job_number,
    COUNT(CASE WHEN column_name = 'commodity' THEN 1 END) as has_commodity
FROM information_schema.columns 
WHERE table_name = 'jobsfile';

-- Test 2: Check that jobs table is gone
SELECT 
    'Jobs table existence check' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'ERROR: Jobs table still exists' 
        ELSE 'SUCCESS: Jobs table removed' 
    END as result;

-- Test 3: Test job creation
INSERT INTO jobsfile (
    jobno, 
    job_number, 
    jobnumber,
    commodity, 
    pieces, 
    weight,
    service_type,
    job_type,
    shipper_name, 
    consignee_name,
    status,
    created_at
) VALUES (
    '3000001C',
    '3000001',
    '3000001',
    'Test Electronics',
    1,
    1.00,
    'NFO',
    'Call',
    'Test Shipper Company',
    'Test Consignee Company',
    'pending',
    NOW()
);

-- Test 4: Verify the insert worked
SELECT 
    'Job creation test' as test_name,
    jobno,
    job_number,
    commodity,
    shipper_name,
    consignee_name,
    created_at
FROM jobsfile 
WHERE jobno = '3000001C';

-- Test 5: Clean up test data
DELETE FROM jobsfile WHERE jobno = '3000001C';

-- Final verification
SELECT 
    'Migration test completed' as status,
    COUNT(*) as total_rows_in_jobsfile
FROM jobsfile; 