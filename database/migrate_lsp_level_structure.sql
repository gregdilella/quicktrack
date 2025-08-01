-- ========================================
-- MIGRATION: Update lsp_costs to use lsp_level junction table
-- ========================================

-- Step 1: Check current policies (for reference)
-- Run this first to see what we're working with
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'lsp_costs';

-- Step 2: Drop existing policies that depend on vendorcode
-- These will be recreated with the new structure
DROP POLICY IF EXISTS lsp_costs_select ON lsp_costs;
DROP POLICY IF EXISTS lsp_costs_insert ON lsp_costs;  
DROP POLICY IF EXISTS lsp_costs_update ON lsp_costs;
DROP POLICY IF EXISTS lsp_costs_delete ON lsp_costs;

-- Step 3: Add function field to lsp_level table
-- This tracks the LSP's role in the logistics process
ALTER TABLE lsp_level ADD COLUMN function VARCHAR(1) CHECK (function IN ('P', 'D', 'T', 'C'));

-- Add comments for clarity
COMMENT ON COLUMN lsp_level.function IS 'LSP Function: P=Pickup, D=Delivery, T=Transport, C=Customs';
COMMENT ON COLUMN lsp_level.waiting_time IS 'Waiting time in minutes';
COMMENT ON COLUMN lsp_level.vehicle_type IS 'Vehicle type used by LSP';

-- Step 4: Add new lsp_level_id column to lsp_costs
-- This creates the new relationship before dropping the old one
ALTER TABLE lsp_costs ADD COLUMN lsp_level_id UUID REFERENCES lsp_level(id);

-- Step 5: Migrate existing data (if any exists)
-- This creates lsp_level records for existing lsp_costs and updates the references
-- Only run if you have existing data to migrate
/*
INSERT INTO lsp_level (jobnumber, lsp_id, vendorcode, waiting_time, vehicle_type, function, assigned_date)
SELECT DISTINCT 
    lc.jobnumber,
    l.id as lsp_id,
    lc.vendorcode,
    0 as waiting_time,  -- Default value, update as needed
    'unknown' as vehicle_type,  -- Default value, update as needed
    'P' as function,  -- Default to Pickup, update as needed
    NOW() as assigned_date
FROM lsp_costs lc
JOIN lsps l ON l.vendorcode = lc.vendorcode
WHERE lc.lsp_level_id IS NULL;

-- Update lsp_costs to reference the new lsp_level records
UPDATE lsp_costs 
SET lsp_level_id = ll.id
FROM lsp_level ll
WHERE lsp_costs.jobnumber = ll.jobnumber 
  AND lsp_costs.vendorcode = ll.vendorcode
  AND lsp_costs.lsp_level_id IS NULL;
*/

-- Step 6: Make lsp_level_id NOT NULL (after data migration)
-- Uncomment after running data migration above
-- ALTER TABLE lsp_costs ALTER COLUMN lsp_level_id SET NOT NULL;

-- Step 7: Drop the old vendorcode column
-- Only run after data migration is complete
-- ALTER TABLE lsp_costs DROP COLUMN vendorcode;

-- Step 8: Enable RLS on lsp_level table
ALTER TABLE lsp_level ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for lsp_level table
CREATE POLICY "lsp_level_select" ON lsp_level
    FOR SELECT USING (
        -- Allow if user belongs to this LSP
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.lsp_id = lsp_level.lsp_id 
            AND user_table.user_id = auth.uid()
        )
        OR
        -- Allow if user is Admin, Management, or Operations
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "lsp_level_insert" ON lsp_level
    FOR INSERT WITH CHECK (
        -- Allow if user belongs to this LSP
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.lsp_id = lsp_level.lsp_id 
            AND user_table.user_id = auth.uid()
        )
        OR
        -- Allow if user is Admin, Management, or Operations
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "lsp_level_update" ON lsp_level
    FOR UPDATE USING (
        -- Allow if user belongs to this LSP
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.lsp_id = lsp_level.lsp_id 
            AND user_table.user_id = auth.uid()
        )
        OR
        -- Allow if user is Admin, Management, or Operations
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "lsp_level_delete" ON lsp_level
    FOR DELETE USING (
        -- Only Admin, Management, or Operations can delete
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

-- Step 9: Recreate RLS policies for lsp_costs with new structure
CREATE POLICY "lsp_costs_select" ON lsp_costs
    FOR SELECT USING (
        -- Allow if user has access to the LSP through lsp_level
        EXISTS (
            SELECT 1 FROM lsp_level ll
            JOIN user_table ut ON ut.lsp_id = ll.lsp_id 
            WHERE ll.id = lsp_costs.lsp_level_id 
            AND ut.user_id = auth.uid()
        )
        OR
        -- Allow if user is Admin, Management, or Operations
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "lsp_costs_insert" ON lsp_costs
    FOR INSERT WITH CHECK (
        -- Allow if user has access to the LSP through lsp_level
        EXISTS (
            SELECT 1 FROM lsp_level ll
            JOIN user_table ut ON ut.lsp_id = ll.lsp_id 
            WHERE ll.id = lsp_costs.lsp_level_id 
            AND ut.user_id = auth.uid()
        )
        OR
        -- Allow if user is Admin, Management, or Operations
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "lsp_costs_update" ON lsp_costs
    FOR UPDATE USING (
        -- Allow if user has access to the LSP through lsp_level
        EXISTS (
            SELECT 1 FROM lsp_level ll
            JOIN user_table ut ON ut.lsp_id = ll.lsp_id 
            WHERE ll.id = lsp_costs.lsp_level_id 
            AND ut.user_id = auth.uid()
        )
        OR
        -- Allow if user is Admin, Management, or Operations
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "lsp_costs_delete" ON lsp_costs
    FOR DELETE USING (
        -- Only Admin, Management, or Operations can delete
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid()
            AND user_table.role IN ('Admin', 'Management', 'Operations')
        )
    );

-- Step 10: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_lsp_level_jobnumber ON lsp_level(jobnumber);
CREATE INDEX IF NOT EXISTS idx_lsp_level_lsp_id ON lsp_level(lsp_id);
CREATE INDEX IF NOT EXISTS idx_lsp_level_vendorcode ON lsp_level(vendorcode);
CREATE INDEX IF NOT EXISTS idx_lsp_costs_lsp_level_id ON lsp_costs(lsp_level_id);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check the new structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('lsp_level', 'lsp_costs')
ORDER BY table_name, ordinal_position;

-- Check policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('lsp_level', 'lsp_costs')
ORDER BY tablename, policyname;

-- ========================================
-- ROLLBACK SCRIPT (if needed)
-- ========================================
/*
-- Uncomment and run if you need to rollback

-- Drop new policies
DROP POLICY IF EXISTS lsp_level_select ON lsp_level;
DROP POLICY IF EXISTS lsp_level_insert ON lsp_level;
DROP POLICY IF EXISTS lsp_level_update ON lsp_level;
DROP POLICY IF EXISTS lsp_level_delete ON lsp_level;

DROP POLICY IF EXISTS lsp_costs_select ON lsp_costs;
DROP POLICY IF EXISTS lsp_costs_insert ON lsp_costs;
DROP POLICY IF EXISTS lsp_costs_update ON lsp_costs;
DROP POLICY IF EXISTS lsp_costs_delete ON lsp_costs;

-- Re-add vendorcode column
ALTER TABLE lsp_costs ADD COLUMN vendorcode VARCHAR REFERENCES lsps(vendorcode);

-- Update vendorcode from lsp_level (if data exists)
UPDATE lsp_costs 
SET vendorcode = ll.vendorcode
FROM lsp_level ll
WHERE lsp_costs.lsp_level_id = ll.id;

-- Drop lsp_level_id column
ALTER TABLE lsp_costs DROP COLUMN lsp_level_id;

-- Recreate original policies (adjust based on your original policies)
-- ... add your original policies here
*/ 