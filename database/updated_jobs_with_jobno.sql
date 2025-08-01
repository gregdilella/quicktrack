-- Updated jobs table with jobno column
-- This adds the jobno field which combines job_number + job_type letter

-- Step 1: Add the jobno column to existing jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jobno VARCHAR(25);

-- Step 2: Create index on jobno for efficient lookups
CREATE INDEX IF NOT EXISTS idx_jobs_jobno ON jobs(jobno);

-- Step 3: Update existing records to populate jobno (if any exist)
UPDATE jobs 
SET jobno = job_number || 
    CASE 
        WHEN job_type = 'Call' THEN 'C'
        WHEN job_type = 'Email' THEN 'M'
        WHEN job_type = 'Web' THEN 'M'
        ELSE 'C'  -- Default to 'C' if unknown type
    END
WHERE jobno IS NULL;

-- Step 4: Make jobno NOT NULL after population
ALTER TABLE jobs ALTER COLUMN jobno SET NOT NULL;

-- Step 5: Add unique constraint on jobno
ALTER TABLE jobs ADD CONSTRAINT unique_jobno UNIQUE (jobno);

-- For reference, the complete jobs table structure now includes:
-- - job_number (original job number like "3000007")
-- - job_type (Call, Email, Web)
-- - jobno (combined field like "3000007C", "3000007M") 