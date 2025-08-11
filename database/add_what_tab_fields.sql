-- Add WHAT Tab CRUD Fields to jobsfile table
-- This adds the missing commodity/cargo information fields for the WHAT tab

DO $$
BEGIN
    -- Add commodity_code field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'commodity_code') THEN
        ALTER TABLE jobsfile ADD COLUMN commodity_code VARCHAR(50);
        RAISE NOTICE 'Added commodity_code column';
    END IF;
    
    -- Add weight_unit field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'weight_unit') THEN
        ALTER TABLE jobsfile ADD COLUMN weight_unit VARCHAR(10) DEFAULT 'lbs';
        RAISE NOTICE 'Added weight_unit column';
    END IF;
    
    -- Add dimensions field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'dimensions') THEN
        ALTER TABLE jobsfile ADD COLUMN dimensions VARCHAR(100);
        RAISE NOTICE 'Added dimensions column';
    END IF;
    
    -- Add declared_value field (using declared_value instead of just 'value' to be more specific)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'declared_value') THEN
        ALTER TABLE jobsfile ADD COLUMN declared_value DECIMAL(12,2);
        RAISE NOTICE 'Added declared_value column';
    END IF;
    
    -- Add description field (for commodity description)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'description') THEN
        ALTER TABLE jobsfile ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    END IF;
    
    RAISE NOTICE 'WHAT tab fields added successfully!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding WHAT tab fields: %', SQLERRM;
        RAISE;
END $$;

-- Add indexes for better performance on WHAT tab fields
CREATE INDEX IF NOT EXISTS idx_jobsfile_commodity_code ON jobsfile(commodity_code);
CREATE INDEX IF NOT EXISTS idx_jobsfile_weight_unit ON jobsfile(weight_unit);
CREATE INDEX IF NOT EXISTS idx_jobsfile_declared_value ON jobsfile(declared_value);

-- Update the existing trigger to ensure updated_at is set when these fields change
-- (The trigger should already exist from previous setup)

-- Test update to verify the new fields work (optional - you can comment this out)
-- UPDATE jobsfile 
-- SET 
--     commodity_code = 'GEN001',
--     weight_unit = 'lbs',
--     dimensions = '48x40x36',
--     declared_value = 1500.00,
--     description = 'General freight - electronic components'
-- WHERE jobnumber = (SELECT jobnumber FROM jobsfile LIMIT 1);

RAISE NOTICE 'WHAT tab CRUD fields setup completed successfully!';
