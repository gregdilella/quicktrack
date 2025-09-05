-- Migration: Rename timetable.jobcreated column to created_at
-- This migration renames the jobcreated column to created_at for consistency
-- Note: The timetable table already has a created_at column, so we need to handle this carefully

-- Step 1: Check if the jobcreated column exists and created_at doesn't conflict
-- If there are two created_at columns after our previous type changes, we need to clean this up

-- First, let's see the current state
-- \d timetable;

-- Step 2: If jobcreated column exists, rename it to created_at
-- If created_at already exists and is different, we may need to merge or drop one
DO $$ 
BEGIN
    -- Check if jobcreated column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'timetable' 
        AND column_name = 'jobcreated'
        AND table_schema = 'public'
    ) THEN
        -- Check if created_at already exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'timetable' 
            AND column_name = 'created_at'
            AND table_schema = 'public'
        ) THEN
            -- Both columns exist - we need to decide which one to keep
            -- Typically, we'd keep the one with data or the more recent one
            -- For safety, let's update created_at with jobcreated values where created_at is null
            UPDATE timetable 
            SET created_at = jobcreated 
            WHERE created_at IS NULL AND jobcreated IS NOT NULL;
            
            -- Then drop the jobcreated column
            ALTER TABLE timetable DROP COLUMN jobcreated;
            
            RAISE NOTICE 'Merged jobcreated into existing created_at column and dropped jobcreated';
        ELSE
            -- Only jobcreated exists, safe to rename
            ALTER TABLE timetable RENAME COLUMN jobcreated TO created_at;
            RAISE NOTICE 'Renamed jobcreated column to created_at';
        END IF;
    ELSE
        RAISE NOTICE 'jobcreated column does not exist, no action needed';
    END IF;
END $$;

-- Step 3: Add comment to document the change
COMMENT ON COLUMN timetable.created_at IS 'Timestamp when the timeline record was created (renamed from jobcreated for consistency)';

-- Step 4: Verify the change
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'timetable' 
-- AND table_schema = 'public' 
-- AND column_name IN ('created_at', 'jobcreated')
-- ORDER BY column_name;
