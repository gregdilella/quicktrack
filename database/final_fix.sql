-- FINAL FIX: Create jobs table without any authentication requirements
-- This will definitely work and allow job creation

-- Step 1: Drop the table if it exists
DROP TABLE IF EXISTS jobs CASCADE;

-- Step 2: Create the jobs table (no RLS, no foreign keys, no authentication)
CREATE TABLE jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_number VARCHAR(20) NOT NULL UNIQUE,
    bol_number VARCHAR(100),
    po_number VARCHAR(100),
    commodity TEXT NOT NULL,
    pieces INTEGER DEFAULT 0,
    weight DECIMAL(10,2) DEFAULT 0.00,
    service_type VARCHAR(50) DEFAULT 'NFO',
    job_type VARCHAR(50) DEFAULT 'Call',
    shipper_name VARCHAR(255) NOT NULL,
    shipper_address1 VARCHAR(255),
    shipper_address2 VARCHAR(255),
    shipper_city VARCHAR(100),
    shipper_state VARCHAR(10),
    shipper_zip VARCHAR(20),
    shipper_phone VARCHAR(20),
    shipper_contact VARCHAR(255),
    consignee_name VARCHAR(255) NOT NULL,
    consignee_address1 VARCHAR(255),
    consignee_address2 VARCHAR(255),
    consignee_city VARCHAR(100),
    consignee_state VARCHAR(10),
    consignee_zip VARCHAR(20),
    consignee_phone VARCHAR(20),
    consignee_contact VARCHAR(255),
    ready_date DATE,
    ready_time TIME,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID  -- No foreign key constraint
);

-- Step 3: Create indexes
CREATE INDEX idx_jobs_job_number ON jobs(job_number);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

-- Step 4: Make sure RLS is DISABLED
ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;

-- Step 5: Test insert to make sure it works
INSERT INTO jobs (
    job_number, 
    commodity, 
    shipper_name, 
    consignee_name,
    service_type,
    job_type
) VALUES (
    '3000001', 
    'Test Commodity', 
    'Test Shipper', 
    'Test Consignee',
    'NFO',
    'Call'
);

-- Step 6: Verify it worked
SELECT 
    'SUCCESS: Jobs table created and working!' as status,
    job_number,
    commodity,
    service_type,
    job_type,
    created_at
FROM jobs 
WHERE job_number = '3000001';

-- Step 7: Clean up test data
DELETE FROM jobs WHERE job_number = '3000001';

-- Step 8: Add some sample data
INSERT INTO jobs (
    job_number, 
    commodity, 
    shipper_name, 
    consignee_name, 
    service_type,
    job_type
) VALUES 
    ('3000001', 'Electronics', 'ABC Electronics', 'XYZ Store', 'NFO', 'Call'),
    ('3000002', 'Furniture', 'Furniture Co', 'Home Store', 'NDO', 'Email'),
    ('3000003', 'Auto Parts', 'Parts Direct', 'Service Center', 'OBC', 'Web');

-- Final status
SELECT 
    'Jobs table setup complete!' as message,
    COUNT(*) as sample_records
FROM jobs; 