-- Migration: Remove 'placement' and 'return' from job_type_enum
-- This migration removes the 'placement' and 'return' values from the job_type_enum
-- and updates any existing records that use these values

-- First, update any existing records that use 'placement' or 'return' to use 'email' instead
-- This ensures data integrity before modifying the enum
UPDATE jobsfile 
SET job_type = 'email' 
WHERE job_type IN ('placement', 'return');

-- Remove any default value on the job_type column that might reference the old enum values
ALTER TABLE jobsfile ALTER COLUMN job_type DROP DEFAULT;

-- Create a new enum type without 'placement' and 'return'
CREATE TYPE job_type_enum_new AS ENUM ('web', 'email', 'call');

-- Update the jobsfile table to use the new enum type
ALTER TABLE jobsfile 
ALTER COLUMN job_type TYPE job_type_enum_new 
USING job_type::text::job_type_enum_new;

-- Drop the old enum type
DROP TYPE job_type_enum;

-- Rename the new enum type to the original name
ALTER TYPE job_type_enum_new RENAME TO job_type_enum;

-- Set a new default value using one of the remaining enum values
ALTER TABLE jobsfile ALTER COLUMN job_type SET DEFAULT 'email'::job_type_enum;

-- Add a comment to document the change
COMMENT ON TYPE job_type_enum IS 'Job type enumeration - placement and return types removed as they are no longer needed';
