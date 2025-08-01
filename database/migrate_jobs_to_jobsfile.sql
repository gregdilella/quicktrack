-- Simple Migration: Add job columns to jobsfile and drop jobs table
-- This script adds all job-related columns to jobsfile and removes the jobs table

-- Step 1: Add all job columns to jobsfile table
DO $$
BEGIN
    -- Add job identification columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'jobno') THEN
        ALTER TABLE jobsfile ADD COLUMN jobno VARCHAR(25);
        RAISE NOTICE 'Added jobno column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'job_number') THEN
        ALTER TABLE jobsfile ADD COLUMN job_number VARCHAR(20);
        RAISE NOTICE 'Added job_number column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'bol_number') THEN
        ALTER TABLE jobsfile ADD COLUMN bol_number VARCHAR(100);
        RAISE NOTICE 'Added bol_number column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'po_number') THEN
        ALTER TABLE jobsfile ADD COLUMN po_number VARCHAR(100);
        RAISE NOTICE 'Added po_number column';
    END IF;
    
    -- Add job information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'commodity') THEN
        ALTER TABLE jobsfile ADD COLUMN commodity TEXT;
        RAISE NOTICE 'Added commodity column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'pieces') THEN
        ALTER TABLE jobsfile ADD COLUMN pieces INTEGER DEFAULT 0;
        RAISE NOTICE 'Added pieces column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'weight') THEN
        ALTER TABLE jobsfile ADD COLUMN weight DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added weight column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'service_type') THEN
        ALTER TABLE jobsfile ADD COLUMN service_type VARCHAR(50) DEFAULT 'NFO';
        RAISE NOTICE 'Added service_type column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'job_type') THEN
        ALTER TABLE jobsfile ADD COLUMN job_type VARCHAR(50) DEFAULT 'Call';
        RAISE NOTICE 'Added job_type column';
    END IF;
    
    -- Add shipper information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_name') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_name VARCHAR(255);
        RAISE NOTICE 'Added shipper_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_address1') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_address1 VARCHAR(255);
        RAISE NOTICE 'Added shipper_address1 column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_address2') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_address2 VARCHAR(255);
        RAISE NOTICE 'Added shipper_address2 column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_city') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_city VARCHAR(100);
        RAISE NOTICE 'Added shipper_city column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_state') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_state VARCHAR(10);
        RAISE NOTICE 'Added shipper_state column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_zip') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_zip VARCHAR(20);
        RAISE NOTICE 'Added shipper_zip column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_phone') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_phone VARCHAR(20);
        RAISE NOTICE 'Added shipper_phone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'shipper_contact') THEN
        ALTER TABLE jobsfile ADD COLUMN shipper_contact VARCHAR(255);
        RAISE NOTICE 'Added shipper_contact column';
    END IF;
    
    -- Add consignee information columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_name') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_name VARCHAR(255);
        RAISE NOTICE 'Added consignee_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_address1') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_address1 VARCHAR(255);
        RAISE NOTICE 'Added consignee_address1 column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_address2') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_address2 VARCHAR(255);
        RAISE NOTICE 'Added consignee_address2 column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_city') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_city VARCHAR(100);
        RAISE NOTICE 'Added consignee_city column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_state') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_state VARCHAR(10);
        RAISE NOTICE 'Added consignee_state column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_zip') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_zip VARCHAR(20);
        RAISE NOTICE 'Added consignee_zip column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_phone') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_phone VARCHAR(20);
        RAISE NOTICE 'Added consignee_phone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'consignee_contact') THEN
        ALTER TABLE jobsfile ADD COLUMN consignee_contact VARCHAR(255);
        RAISE NOTICE 'Added consignee_contact column';
    END IF;
    
    -- Add additional job columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'ready_date') THEN
        ALTER TABLE jobsfile ADD COLUMN ready_date DATE;
        RAISE NOTICE 'Added ready_date column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'ready_time') THEN
        ALTER TABLE jobsfile ADD COLUMN ready_time TIME;
        RAISE NOTICE 'Added ready_time column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'status') THEN
        ALTER TABLE jobsfile ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added status column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'updated_at') THEN
        ALTER TABLE jobsfile ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'created_by') THEN
        ALTER TABLE jobsfile ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column';
    END IF;
    
    RAISE NOTICE 'All column additions completed successfully!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding columns: %', SQLERRM;
        RAISE;
END $$;

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobsfile_jobno ON jobsfile(jobno);
CREATE INDEX IF NOT EXISTS idx_jobsfile_job_number ON jobsfile(job_number);
CREATE INDEX IF NOT EXISTS idx_jobsfile_status ON jobsfile(status);
CREATE INDEX IF NOT EXISTS idx_jobsfile_created_at ON jobsfile(created_at);
CREATE INDEX IF NOT EXISTS idx_jobsfile_commodity ON jobsfile(commodity);
CREATE INDEX IF NOT EXISTS idx_jobsfile_shipper_name ON jobsfile(shipper_name);
CREATE INDEX IF NOT EXISTS idx_jobsfile_consignee_name ON jobsfile(consignee_name);

-- Step 3: Add unique constraints
DO $$
BEGIN
    -- Add unique constraint on jobno if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'jobsfile' 
        AND constraint_name = 'unique_jobno'
        AND table_schema = current_schema()
    ) THEN
        ALTER TABLE jobsfile ADD CONSTRAINT unique_jobno UNIQUE (jobno);
        RAISE NOTICE 'Added unique constraint on jobno';
    ELSE
        RAISE NOTICE 'Unique constraint on jobno already exists';
    END IF;
    
    -- Add unique constraint on job_number if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'jobsfile' 
        AND constraint_name = 'unique_job_number'
        AND table_schema = current_schema()
    ) THEN
        ALTER TABLE jobsfile ADD CONSTRAINT unique_job_number UNIQUE (job_number);
        RAISE NOTICE 'Added unique constraint on job_number';
    ELSE
        RAISE NOTICE 'Unique constraint on job_number already exists';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists, skipping';
    WHEN others THEN
        RAISE NOTICE 'Error adding constraints: %', SQLERRM;
END $$;

-- Step 4: Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Add trigger to update updated_at timestamp
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.triggers 
               WHERE trigger_name = 'update_jobsfile_updated_at') THEN
        DROP TRIGGER update_jobsfile_updated_at ON jobsfile;
    END IF;
END $$;

CREATE TRIGGER update_jobsfile_updated_at 
    BEFORE UPDATE ON jobsfile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Drop the jobs table completely
DROP TABLE IF EXISTS jobs CASCADE;

-- Step 7: Final verification
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'jobsfile';

-- Show the new table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobsfile' 
ORDER BY ordinal_position; 