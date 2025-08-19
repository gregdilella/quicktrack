-- =====================================================
-- COMPLETE LSP FIX - Address All Issues
-- Fix function column, remove notes, ensure proper structure
-- =====================================================

-- STEP 1: Fix the function column constraint issue
ALTER TABLE lsp_level DROP CONSTRAINT IF EXISTS lsp_level_function_check;

-- STEP 2: Update existing single-character functions to full words
UPDATE lsp_level SET function = 
    CASE 
        WHEN function = 'P' THEN 'Pickup'
        WHEN function = 'D' THEN 'Delivery' 
        WHEN function = 'T' THEN 'Transport'
        WHEN function = 'C' THEN 'Customs'
        ELSE function
    END
WHERE function IN ('P', 'D', 'T', 'C');

-- STEP 3: Alter function column to allow full words
ALTER TABLE lsp_level ALTER COLUMN function TYPE VARCHAR(20);

-- STEP 4: Remove notes column if it exists (since it's not in your schema)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lsp_level' AND column_name = 'notes'
    ) THEN
        ALTER TABLE lsp_level DROP COLUMN notes;
    END IF;
END $$;

-- STEP 5: Remove completed_date column if it exists (not in your schema)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lsp_level' AND column_name = 'completed_date'
    ) THEN
        ALTER TABLE lsp_level DROP COLUMN completed_date;
    END IF;
END $$;

-- STEP 6: Ensure lsp_level table matches your exact schema
-- Check current structure vs expected structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    'CURRENT_STRUCTURE' as status
FROM information_schema.columns 
WHERE table_name = 'lsp_level'
ORDER BY ordinal_position;

-- STEP 7: Clean up blank LSPs
DELETE FROM lsps 
WHERE vendor_name IS NULL 
   OR TRIM(vendor_name) = '' 
   OR LENGTH(TRIM(vendor_name)) = 0;

-- STEP 8: Add sample LSPs if table is empty
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM lsps WHERE vendor_name IS NOT NULL) = 0 THEN
        INSERT INTO lsps (vendor_name, vendor_code, contact_email, phone, address) VALUES
        ('Express Logistics LLC', 'EXP001', 'ops@expresslogistics.com', '+1-555-0001', '123 Logistics Ave, Miami, FL'),
        ('Global Transport Services', 'GTS002', 'dispatch@globaltransport.com', '+1-555-0002', '456 Transport Blvd, Los Angeles, CA'),
        ('Metro Delivery Solutions', 'MDS003', 'info@metrodelivery.com', '+1-555-0003', '789 Metro St, New York, NY'),
        ('Rapid Freight Systems', 'RFS004', 'contact@rapidfreight.com', '+1-555-0004', '321 Freight Way, Chicago, IL'),
        ('Elite Cargo Services', 'ECS005', 'service@elitecargo.com', '+1-555-0005', '654 Cargo Dr, Atlanta, GA'),
        ('Prime Logistics Group', 'PLG006', 'ops@primelogistics.com', '+1-555-0006', '987 Prime Rd, Dallas, TX'),
        ('Swift Transport Co', 'STC007', 'dispatch@swifttransport.com', '+1-555-0007', '147 Swift Ave, Seattle, WA'),
        ('Reliable Delivery Inc', 'RDI008', 'info@reliabledelivery.com', '+1-555-0008', '258 Reliable St, Denver, CO');
    END IF;
END $$;

-- STEP 9: Ensure AWB table exists
CREATE TABLE IF NOT EXISTS awb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    awb_number VARCHAR(20) NOT NULL UNIQUE,
    airline_id INTEGER NOT NULL REFERENCES airlines(id),
    jobnumber TEXT NOT NULL REFERENCES jobsfile(jobnumber),
    pieces INTEGER,
    weight DECIMAL(10,2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    dimensions VARCHAR(100),
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    flight_number VARCHAR(20),
    flight_date DATE,
    origin_airport VARCHAR(10),
    destination_airport VARCHAR(10),
    status VARCHAR(50) DEFAULT 'Created',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- STEP 10: Ensure lsp_level_id exists in lsp_costs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lsp_costs' AND column_name = 'lsp_level_id'
    ) THEN
        ALTER TABLE lsp_costs ADD COLUMN lsp_level_id UUID REFERENCES lsp_level(id);
        CREATE INDEX IF NOT EXISTS idx_lsp_costs_lsp_level_id ON lsp_costs(lsp_level_id);
    END IF;
END $$;

-- STEP 11: Create indexes
CREATE INDEX IF NOT EXISTS idx_lsp_level_jobnumber ON lsp_level(jobnumber);
CREATE INDEX IF NOT EXISTS idx_lsp_level_lsp_id ON lsp_level(lsp_id);
CREATE INDEX IF NOT EXISTS idx_lsp_level_vendorcode ON lsp_level(vendorcode);
CREATE INDEX IF NOT EXISTS idx_awb_jobnumber ON awb(jobnumber);
CREATE INDEX IF NOT EXISTS idx_awb_airline_id ON awb(airline_id);

-- STEP 12: Enable RLS
ALTER TABLE lsp_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE awb ENABLE ROW LEVEL SECURITY;
ALTER TABLE lsp_costs ENABLE ROW LEVEL SECURITY;

-- STEP 13: Drop and recreate policies
DROP POLICY IF EXISTS "lsp_level_select" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_insert" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_update" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_delete" ON lsp_level;

DROP POLICY IF EXISTS "awb_select" ON awb;
DROP POLICY IF EXISTS "awb_insert" ON awb;
DROP POLICY IF EXISTS "awb_update" ON awb;
DROP POLICY IF EXISTS "awb_delete" ON awb;

DROP POLICY IF EXISTS "lsp_costs_select" ON lsp_costs;
DROP POLICY IF EXISTS "lsp_costs_insert" ON lsp_costs;
DROP POLICY IF EXISTS "lsp_costs_update" ON lsp_costs;
DROP POLICY IF EXISTS "lsp_costs_delete" ON lsp_costs;

-- Create policies for operations users
CREATE POLICY "lsp_level_select" ON lsp_level FOR SELECT USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "lsp_level_insert" ON lsp_level FOR INSERT WITH CHECK (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "lsp_level_update" ON lsp_level FOR UPDATE USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "lsp_level_delete" ON lsp_level FOR DELETE USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "awb_select" ON awb FOR SELECT USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "awb_insert" ON awb FOR INSERT WITH CHECK (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "awb_update" ON awb FOR UPDATE USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "awb_delete" ON awb FOR DELETE USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "lsp_costs_select" ON lsp_costs FOR SELECT USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "lsp_costs_insert" ON lsp_costs FOR INSERT WITH CHECK (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "lsp_costs_update" ON lsp_costs FOR UPDATE USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

CREATE POLICY "lsp_costs_delete" ON lsp_costs FOR DELETE USING (
    get_current_user_role() IN ('Admin', 'Management', 'Operations')
);

-- STEP 14: Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lsp_level TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON awb TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lsp_costs TO authenticated;
GRANT SELECT ON lsps TO authenticated;
GRANT SELECT ON airlines TO authenticated;

-- STEP 15: Test LSP insertion with exact schema match
BEGIN;
INSERT INTO lsp_level (
    jobnumber, 
    lsp_id, 
    vendorcode, 
    function, 
    status, 
    vehicle_type, 
    waiting_time, 
    assigned_date
) VALUES (
    'TEST-LSP-456', 
    (SELECT id FROM lsps WHERE vendor_name IS NOT NULL LIMIT 1),
    (SELECT vendor_code FROM lsps WHERE vendor_name IS NOT NULL LIMIT 1),
    'Pickup', 
    'Assigned',
    'Van',
    30,
    NOW()
);

SELECT 'LSP_LEVEL_INSERT_SUCCESS' as test_result, * FROM lsp_level WHERE jobnumber = 'TEST-LSP-456';
ROLLBACK;

-- STEP 16: Final verification
SELECT 
    'LSP_LEVEL_STRUCTURE_FIXED' as status,
    COUNT(*) as total_valid_lsps
FROM lsps 
WHERE vendor_name IS NOT NULL AND TRIM(vendor_name) != '';

SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'lsp_level' 
ORDER BY ordinal_position;

