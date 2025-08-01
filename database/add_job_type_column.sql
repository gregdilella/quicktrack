-- Migration to add job_type column to existing jobs table
-- Run this only if you already have a jobs table without the job_type column

-- Add the job_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'job_type'
    ) THEN
        ALTER TABLE jobs ADD COLUMN job_type VARCHAR(50) DEFAULT 'Call';
    END IF;
END $$;

-- Update the comment for the new column
COMMENT ON COLUMN jobs.job_type IS 'Job type: Call, Email, Web';

-- Update existing service_type values if they use old values
UPDATE jobs 
SET service_type = 'NFO' 
WHERE service_type IN ('ground', 'air', 'ocean', 'express');

-- Set default job_type for existing records
UPDATE jobs 
SET job_type = 'Call' 
WHERE job_type IS NULL; 