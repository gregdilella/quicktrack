-- Add Customer CRUD Fields to jobsfile table
-- This adds the missing customer fields for the WHO tab

DO $$
BEGIN
    -- Add customer_account field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'customer_account') THEN
        ALTER TABLE jobsfile ADD COLUMN customer_account VARCHAR(100);
        RAISE NOTICE 'Added customer_account column';
    END IF;
    
    -- Add customer_contact field (contact person)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'customer_contact') THEN
        ALTER TABLE jobsfile ADD COLUMN customer_contact VARCHAR(255);
        RAISE NOTICE 'Added customer_contact column';
    END IF;
    
    -- Add customer_phone field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'customer_phone') THEN
        ALTER TABLE jobsfile ADD COLUMN customer_phone VARCHAR(20);
        RAISE NOTICE 'Added customer_phone column';
    END IF;
    
    -- Add customer_email field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobsfile' AND column_name = 'customer_email') THEN
        ALTER TABLE jobsfile ADD COLUMN customer_email VARCHAR(255);
        RAISE NOTICE 'Added customer_email column';
    END IF;
    
    RAISE NOTICE 'Customer fields added successfully!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding customer fields: %', SQLERRM;
        RAISE;
END $$;

-- Add indexes for better performance on customer fields
CREATE INDEX IF NOT EXISTS idx_jobsfile_customer_account ON jobsfile(customer_account);
CREATE INDEX IF NOT EXISTS idx_jobsfile_customer_email ON jobsfile(customer_email);

-- Add a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_jobsfile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at when jobsfile is modified
DROP TRIGGER IF EXISTS trigger_update_jobsfile_updated_at ON jobsfile;
CREATE TRIGGER trigger_update_jobsfile_updated_at
    BEFORE UPDATE ON jobsfile
    FOR EACH ROW
    EXECUTE FUNCTION update_jobsfile_updated_at();

-- Test the new fields (optional - you can comment this out)
-- UPDATE jobsfile 
-- SET 
--     customer_account = 'TEST001',
--     customer_contact = 'John Doe',
--     customer_phone = '555-123-4567',
--     customer_email = 'john.doe@example.com'
-- WHERE jobnumber = (SELECT jobnumber FROM jobsfile LIMIT 1);

RAISE NOTICE 'Customer CRUD fields setup completed successfully!';
