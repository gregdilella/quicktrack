-- Migrate AWB table to use jobno instead of jobnumber for consistency
-- This aligns AWB table with the project convention that jobno is the canonical identifier

-- Step 1: Add jobno column to AWB table
ALTER TABLE awb 
ADD COLUMN IF NOT EXISTS jobno TEXT;

-- Step 2: Populate jobno column from existing jobnumber data
-- This maps jobnumber back to jobno using the jobsfile table
UPDATE awb 
SET jobno = jobsfile.jobno 
FROM jobsfile 
WHERE awb.jobnumber = jobsfile.jobnumber 
AND awb.jobno IS NULL;

-- Step 3: Create index on jobno for performance
CREATE INDEX IF NOT EXISTS idx_awb_jobno ON awb(jobno);

-- Step 4: Ensure no orphaned records before adding constraint
DELETE FROM awb WHERE jobno IS NULL;

-- Step 5: Add NOT NULL constraint to jobno
ALTER TABLE awb 
ALTER COLUMN jobno SET NOT NULL;

-- Step 6: Add foreign key constraint (simple approach)
-- Note: If this fails due to existing constraint, manually drop it first:
-- ALTER TABLE awb DROP CONSTRAINT IF EXISTS awb_jobno_fkey;
ALTER TABLE awb 
ADD CONSTRAINT awb_jobno_fkey 
FOREIGN KEY (jobno) REFERENCES jobsfile(jobno) ON DELETE CASCADE;

-- Step 7: Add comment to document the change
COMMENT ON COLUMN awb.jobno IS 'Job number identifier linking to jobsfile.jobno (canonical job identifier)';

-- Verify the migration worked
-- SELECT COUNT(*) as total_awb_records, COUNT(jobno) as records_with_jobno FROM awb;