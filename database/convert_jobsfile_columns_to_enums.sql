-- Convert jobsfile columns to enum types
-- This migration is idempotent and can be run multiple times safely

-- Create enum types (replace if they exist to ensure idempotency)
DO $$ 
BEGIN
    -- Drop existing types if they exist
    DROP TYPE IF EXISTS job_type_enum CASCADE;
    DROP TYPE IF EXISTS service_type_enum CASCADE;
    DROP TYPE IF EXISTS status_enum CASCADE;
    DROP TYPE IF EXISTS vehicle_type_enum CASCADE;
    
    -- Create new enum types
    CREATE TYPE job_type_enum AS ENUM ('web', 'email', 'placement', 'return');
    CREATE TYPE service_type_enum AS ENUM ('NFO', 'NDO', 'OBC', 'CHAR');
    CREATE TYPE status_enum AS ENUM ('dispatch', 'live', 'delivered', 'billed', 'invoiced', 'collected');
    CREATE TYPE vehicle_type_enum AS ENUM ('car', 'van', 'boxtruck');
END $$;

-- Update the jobsfile table
-- First, remove any existing default values to avoid casting issues
ALTER TABLE jobsfile 
    ALTER COLUMN job_type DROP DEFAULT,
    ALTER COLUMN service_type DROP DEFAULT,
    ALTER COLUMN status DROP DEFAULT,
    ALTER COLUMN vehicle_type DROP DEFAULT;

-- Now convert columns to enum types
ALTER TABLE jobsfile 
    ALTER COLUMN job_type TYPE job_type_enum USING 
        CASE 
            WHEN LOWER(job_type) = 'web' THEN 'web'::job_type_enum
            WHEN LOWER(job_type) = 'email' THEN 'email'::job_type_enum
            WHEN LOWER(job_type) = 'placement' THEN 'placement'::job_type_enum
            WHEN LOWER(job_type) = 'return' THEN 'return'::job_type_enum
            ELSE 'web'::job_type_enum
        END;

ALTER TABLE jobsfile 
    ALTER COLUMN service_type TYPE service_type_enum USING 
        CASE 
            WHEN UPPER(service_type) = 'NFO' THEN 'NFO'::service_type_enum
            WHEN UPPER(service_type) = 'NDO' THEN 'NDO'::service_type_enum
            WHEN UPPER(service_type) = 'OBC' THEN 'OBC'::service_type_enum
            WHEN UPPER(service_type) = 'CHAR' THEN 'CHAR'::service_type_enum
            ELSE 'NFO'::service_type_enum
        END;

ALTER TABLE jobsfile 
    ALTER COLUMN status TYPE status_enum USING 
        CASE 
            WHEN LOWER(status) = 'dispatch' THEN 'dispatch'::status_enum
            WHEN LOWER(status) = 'live' THEN 'live'::status_enum
            WHEN LOWER(status) = 'delivered' THEN 'delivered'::status_enum
            WHEN LOWER(status) = 'billed' THEN 'billed'::status_enum
            WHEN LOWER(status) = 'invoiced' THEN 'invoiced'::status_enum
            WHEN LOWER(status) = 'collected' THEN 'collected'::status_enum
            ELSE 'dispatch'::status_enum
        END;

ALTER TABLE jobsfile 
    ALTER COLUMN vehicle_type TYPE vehicle_type_enum USING 
        CASE 
            WHEN LOWER(vehicle_type) = 'car' THEN 'car'::vehicle_type_enum
            WHEN LOWER(vehicle_type) = 'van' THEN 'van'::vehicle_type_enum
            WHEN LOWER(vehicle_type) = 'boxtruck' THEN 'boxtruck'::vehicle_type_enum
            ELSE 'car'::vehicle_type_enum
        END;

-- Set new default values
ALTER TABLE jobsfile ALTER COLUMN job_type SET DEFAULT 'web'::job_type_enum;
ALTER TABLE jobsfile ALTER COLUMN service_type SET DEFAULT 'NFO'::service_type_enum;
ALTER TABLE jobsfile ALTER COLUMN status SET DEFAULT 'dispatch'::status_enum;
ALTER TABLE jobsfile ALTER COLUMN vehicle_type SET DEFAULT 'car'::vehicle_type_enum;

-- Drop the service_level column
ALTER TABLE jobsfile DROP COLUMN IF EXISTS service_level;

-- Add comments for documentation
COMMENT ON TYPE job_type_enum IS 'Job type: web, email, placement, or return';
COMMENT ON TYPE service_type_enum IS 'Service type: NFO (Next Flight Out), NDO (Next Day Out), OBC (On Board Courier), CHAR (Charter)';
COMMENT ON TYPE status_enum IS 'Job status: dispatch, live, delivered, billed, invoiced, collected';
COMMENT ON TYPE vehicle_type_enum IS 'Vehicle type: car, van, boxtruck';

-- Add column comments
COMMENT ON COLUMN jobsfile.job_type IS 'Type of job: web, email, placement, or return';
COMMENT ON COLUMN jobsfile.service_type IS 'Service type: NFO, NDO, OBC, or CHAR';
COMMENT ON COLUMN jobsfile.status IS 'Current status of the job';
COMMENT ON COLUMN jobsfile.vehicle_type IS 'Type of vehicle required: car, van, or boxtruck';

-- Display summary of changes
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully:';
    RAISE NOTICE '- Created enum types: job_type_enum, service_type_enum, status_enum, vehicle_type_enum';
    RAISE NOTICE '- Converted jobsfile columns to use enum types';
    RAISE NOTICE '- Set default values: job_type=web, service_type=NFO, status=dispatch, vehicle_type=car';
    RAISE NOTICE '- Dropped service_level column';
    RAISE NOTICE '- Added documentation comments';
END $$;