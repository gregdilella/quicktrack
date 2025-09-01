-- Auto-create timetable entry when new jobs are created
-- This ensures jobcreated timestamp is populated automatically

-- Step 1: Create function to auto-create timetable entry
CREATE OR REPLACE FUNCTION create_timetable_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new timetable entry for the newly created job
    INSERT INTO timetable (jobnumber, jobcreated, created_at, updated_at)
    VALUES (
        NEW.jobno,  -- Use jobno field since that's what the foreign key references
        NOW(),      -- Set jobcreated to current timestamp
        NOW(),      -- Set created_at to current timestamp
        NOW()       -- Set updated_at to current timestamp
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the job creation
        RAISE WARNING 'Failed to create timetable entry for job %: %', NEW.jobno, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on jobsfile table
DROP TRIGGER IF EXISTS trigger_create_timetable_entry ON jobsfile;

CREATE TRIGGER trigger_create_timetable_entry
    AFTER INSERT ON jobsfile
    FOR EACH ROW
    EXECUTE FUNCTION create_timetable_entry();

-- Step 3: Test the trigger by checking if it exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_timetable_entry';

-- Step 4: Show current timetable entries for reference
SELECT jobnumber, jobcreated, created_at 
FROM timetable 
ORDER BY created_at DESC 
LIMIT 5;
