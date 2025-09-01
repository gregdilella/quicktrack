-- Fix timetable foreign key constraint to reference jobno instead of jobnumber
-- This will resolve the foreign key constraint violation error

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE timetable DROP CONSTRAINT IF EXISTS timetable_jobnumber_fkey;
ALTER TABLE timetable DROP CONSTRAINT IF EXISTS timetable_jobnumber_fkey1;
ALTER TABLE timetable DROP CONSTRAINT IF EXISTS timetable_jobnumber_fkey2;

-- Step 2: First, ensure jobno field has a unique constraint in jobsfile
-- Check if unique constraint already exists
DO $$
BEGIN
    -- Add unique constraint on jobno if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'jobsfile_jobno_unique' 
        AND table_name = 'jobsfile'
    ) THEN
        ALTER TABLE jobsfile ADD CONSTRAINT jobsfile_jobno_unique UNIQUE (jobno);
        RAISE NOTICE 'Added unique constraint on jobsfile.jobno';
    ELSE
        RAISE NOTICE 'Unique constraint on jobsfile.jobno already exists';
    END IF;
END $$;

-- Step 3: Add the correct foreign key constraint referencing jobsfile(jobno)
ALTER TABLE timetable 
ADD CONSTRAINT timetable_jobnumber_fkey 
FOREIGN KEY (jobnumber) REFERENCES jobsfile(jobno);

-- Step 4: Verify the constraints exist
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    contype as constraint_type
FROM pg_constraint 
WHERE conname IN ('timetable_jobnumber_fkey', 'jobsfile_jobno_unique')
ORDER BY conname;
