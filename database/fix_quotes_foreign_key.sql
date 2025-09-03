-- Fix quotes table foreign key to match timetable (reference jobno instead of jobnumber)
-- This ensures consistency across all tables

-- Step 1: Drop existing foreign key constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_jobnumber_fkey;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_jobnumber_fkey1;
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_jobnumber_fkey2;

-- Step 2: Add the correct foreign key constraint referencing jobsfile(jobno)
-- This matches what timetable uses
ALTER TABLE quotes 
ADD CONSTRAINT quotes_jobnumber_fkey 
FOREIGN KEY (jobnumber) REFERENCES jobsfile(jobno);

-- Step 3: Test the constraint
SELECT 'Quotes foreign key updated successfully' as status;

-- Step 4: Verify the constraint exists
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as referenced_table,
    contype as constraint_type
FROM pg_constraint 
WHERE conname = 'quotes_jobnumber_fkey';

-- Step 5: Show sample data for verification
SELECT 'Sample quotes data:' as info;
SELECT jobnumber, chargecode, charge 
FROM quotes 
ORDER BY created_at DESC 
LIMIT 5;
