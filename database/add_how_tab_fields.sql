-- Add HOW Tab CRUD Fields to jobsfile table
-- This adds the missing transportation/service fields for the HOW tab

DO $$
BEGIN
    -- Add transport_mode field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'transport_mode') THEN
        ALTER TABLE jobsfile ADD COLUMN transport_mode VARCHAR(50);
        RAISE NOTICE 'Added transport_mode column';
    END IF;
    
    -- Add equipment_type field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'equipment_type') THEN
        ALTER TABLE jobsfile ADD COLUMN equipment_type VARCHAR(50);
        RAISE NOTICE 'Added equipment_type column';
    END IF;
    
    -- Add service_level field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'service_level') THEN
        ALTER TABLE jobsfile ADD COLUMN service_level VARCHAR(50) DEFAULT 'standard';
        RAISE NOTICE 'Added service_level column';
    END IF;
    
    -- Add special_instructions field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'special_instructions') THEN
        ALTER TABLE jobsfile ADD COLUMN special_instructions TEXT;
        RAISE NOTICE 'Added special_instructions column';
    END IF;
    
    RAISE NOTICE 'HOW tab fields added successfully!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding HOW tab fields: %', SQLERRM;
        RAISE;
END $$;

-- Add indexes for better performance on HOW tab fields
CREATE INDEX IF NOT EXISTS idx_jobsfile_transport_mode ON jobsfile(transport_mode);
CREATE INDEX IF NOT EXISTS idx_jobsfile_equipment_type ON jobsfile(equipment_type);
CREATE INDEX IF NOT EXISTS idx_jobsfile_service_level ON jobsfile(service_level);

-- Update the existing trigger to ensure updated_at is set when these fields change
-- (The trigger should already exist from previous customer fields setup)

-- Test update to verify the new fields work (optional - you can comment this out)
-- UPDATE jobsfile 
-- SET 
--     transport_mode = 'truck',
--     equipment_type = 'van',
--     service_level = 'standard',
--     special_instructions = 'Handle with care'
-- WHERE jobnumber = (SELECT jobnumber FROM jobsfile LIMIT 1);

RAISE NOTICE 'HOW tab CRUD fields setup completed successfully!';
