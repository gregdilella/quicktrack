-- =====================================================
-- ADD AWB TABLE AND ENHANCE LSP RELATIONSHIPS
-- For Operations Job Management - FIXED VERSION
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CREATE TABLES FIRST
-- =====================================================

-- CREATE AWB (Air Waybill) TABLE
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

-- ENSURE LSP_LEVEL TABLE EXISTS WITH PROPER STRUCTURE
CREATE TABLE IF NOT EXISTS lsp_level (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jobnumber TEXT REFERENCES jobsfile(jobnumber),
    lsp_id UUID REFERENCES lsps(id),
    vendorcode TEXT REFERENCES lsps(vendor_code),
    function VARCHAR(20), -- 'Pickup', 'Delivery', 'Transport', 'Customs'
    status VARCHAR(50) DEFAULT 'Assigned', -- 'Assigned', 'Dispatched', 'Completed', 'Cancelled'
    vehicle_type VARCHAR(50),
    waiting_time INTEGER DEFAULT 0, -- in minutes
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    completed_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UPDATE LSP_COSTS TABLE TO INCLUDE LSP_LEVEL_ID
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lsp_costs' AND column_name = 'lsp_level_id'
    ) THEN
        ALTER TABLE lsp_costs ADD COLUMN lsp_level_id UUID REFERENCES lsp_level(id);
    END IF;
END $$;

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- AWB Indexes
CREATE INDEX IF NOT EXISTS idx_awb_airline_id ON awb(airline_id);
CREATE INDEX IF NOT EXISTS idx_awb_jobnumber ON awb(jobnumber);
CREATE INDEX IF NOT EXISTS idx_awb_awb_number ON awb(awb_number);
CREATE INDEX IF NOT EXISTS idx_awb_flight_date ON awb(flight_date);

-- LSP Level Indexes
CREATE INDEX IF NOT EXISTS idx_lsp_level_jobnumber ON lsp_level(jobnumber);
CREATE INDEX IF NOT EXISTS idx_lsp_level_lsp_id ON lsp_level(lsp_id);
CREATE INDEX IF NOT EXISTS idx_lsp_level_vendorcode ON lsp_level(vendorcode);

-- LSP Costs Index for new relationship
CREATE INDEX IF NOT EXISTS idx_lsp_costs_lsp_level_id ON lsp_costs(lsp_level_id);

-- =====================================================
-- STEP 3: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE awb IS 'Air Waybill records linking jobs to airlines';
COMMENT ON COLUMN awb.awb_number IS 'Unique Air Waybill number';
COMMENT ON COLUMN awb.status IS 'AWB Status: Created, Confirmed, In Transit, Delivered, etc.';

COMMENT ON TABLE lsp_level IS 'LSP assignments for jobs - junction table';
COMMENT ON COLUMN lsp_level.function IS 'LSP role: Pickup, Delivery, Transport, Customs';
COMMENT ON COLUMN lsp_level.status IS 'Assignment status';

-- =====================================================
-- STEP 4: CREATE FUNCTIONS FOR BUSINESS LOGIC
-- =====================================================

-- Function to update updated_at timestamp (may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- STEP 5: CREATE TRIGGERS
-- =====================================================

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_awb_updated_at ON awb;
CREATE TRIGGER update_awb_updated_at 
    BEFORE UPDATE ON awb 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lsp_level_updated_at ON lsp_level;
CREATE TRIGGER update_lsp_level_updated_at 
    BEFORE UPDATE ON lsp_level 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: SETUP ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on tables (safe to run multiple times)
ALTER TABLE awb ENABLE ROW LEVEL SECURITY;
ALTER TABLE lsp_level ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (now that tables exist)
DROP POLICY IF EXISTS "awb_select" ON awb;
DROP POLICY IF EXISTS "awb_insert" ON awb;
DROP POLICY IF EXISTS "awb_update" ON awb;
DROP POLICY IF EXISTS "awb_delete" ON awb;

DROP POLICY IF EXISTS "lsp_level_select" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_insert" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_update" ON lsp_level;
DROP POLICY IF EXISTS "lsp_level_delete" ON lsp_level;

-- =====================================================
-- STEP 7: CREATE RLS POLICIES
-- =====================================================

-- AWB Policies
CREATE POLICY "awb_select" ON awb
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            JOIN jobsfile j ON j.customer_id = ut.customer_id
            WHERE ut.user_id = auth.uid() 
            AND j.jobnumber = awb.jobnumber
        )
    );

CREATE POLICY "awb_insert" ON awb
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "awb_update" ON awb
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "awb_delete" ON awb
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- LSP_LEVEL Policies
CREATE POLICY "lsp_level_select" ON lsp_level
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = lsp_level.lsp_id
        ) OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            JOIN jobsfile j ON j.customer_id = ut.customer_id
            WHERE ut.user_id = auth.uid() 
            AND j.jobnumber = lsp_level.jobnumber
        )
    );

CREATE POLICY "lsp_level_insert" ON lsp_level
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "lsp_level_update" ON lsp_level
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = lsp_level.lsp_id
        )
    );

CREATE POLICY "lsp_level_delete" ON lsp_level
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- =====================================================
-- STEP 8: GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON awb TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lsp_level TO authenticated;
GRANT SELECT ON airlines TO authenticated;
GRANT SELECT ON lsps TO authenticated;

-- =====================================================
-- STEP 9: VERIFICATION QUERIES (OPTIONAL)
-- =====================================================

-- Uncomment to verify the setup
/*
-- Check that tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('awb', 'lsp_level')
ORDER BY table_name, ordinal_position;

-- Check foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('awb', 'lsp_level');

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('awb', 'lsp_level')
ORDER BY tablename, policyname;
*/

-- =====================================================
-- STEP 10: SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Uncomment to add sample airlines if needed
/*
INSERT INTO airlines (airline_name, airline_code, contact_email, phone) VALUES
('American Airlines', 'AA', 'cargo@aa.com', '+1-800-433-7300'),
('Delta Air Lines', 'DL', 'cargo@delta.com', '+1-800-221-1212'),
('United Airlines', 'UA', 'cargo@united.com', '+1-800-864-8331'),
('FedEx', 'FX', 'customer@fedex.com', '+1-800-463-3339'),
('UPS Airlines', '5X', 'customer@ups.com', '+1-800-742-5877')
ON CONFLICT (airline_code) DO NOTHING;
*/



