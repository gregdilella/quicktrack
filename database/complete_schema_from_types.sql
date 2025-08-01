-- =====================================================
-- COMPLETE CERTRACK DATABASE SCHEMA
-- Generated from supabase.types.ts
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM (
    'Admin',
    'LSP', 
    'Management',
    'Operations',
    'Customer',
    'Not-Assigned'
);

-- =====================================================
-- TABLES
-- =====================================================

-- CUSTOMERS TABLE
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LSPS TABLE  
CREATE TABLE lsps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    vendorcode TEXT UNIQUE,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOBSFILE TABLE
CREATE TABLE jobsfile (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    vendorcode TEXT REFERENCES lsps(vendorcode),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER_TABLE
CREATE TABLE user_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'Not-Assigned',
    customer_id UUID REFERENCES customers(id),
    lsp_id UUID REFERENCES lsps(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BILLING TABLE
CREATE TABLE billing (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT NOT NULL REFERENCES jobsfile(jobnumber),
    chargecode TEXT,
    charge DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FLIGHTS TABLE
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT REFERENCES jobsfile(jobnumber),
    org TEXT,
    destination TEXT,
    mawb TEXT,
    cost DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TIMETABLE TABLE
CREATE TABLE timetable (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT NOT NULL REFERENCES jobsfile(jobnumber),
    jobcreated TIMESTAMPTZ,
    pdriver_dispatched TIMESTAMPTZ,
    pdriver_arrived TIMESTAMPTZ,
    pdriver_pickup TIMESTAMPTZ,
    airport_dropoff TIMESTAMPTZ,
    flight_tenured TIMESTAMPTZ,
    flight_recovered TIMESTAMPTZ,
    ddriver_dispatched TIMESTAMPTZ,
    ddriver_recovered TIMESTAMPTZ,
    ddriver_delivery TIMESTAMPTZ,
    pod TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LSP_COSTS TABLE
CREATE TABLE lsp_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendorcode TEXT NOT NULL REFERENCES lsps(vendorcode),
    jobnumber TEXT REFERENCES jobsfile(jobnumber),
    ledgercode TEXT NOT NULL,
    cost DECIMAL NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_user_table_user_id ON user_table(user_id);
CREATE INDEX idx_user_table_email ON user_table(email);
CREATE INDEX idx_user_table_role ON user_table(role);
CREATE INDEX idx_jobs_customer_id ON jobsfile(customer_id);
CREATE INDEX idx_jobs_vendorcode ON jobsfile(vendorcode);
CREATE INDEX idx_billing_jobnumber ON billing(jobnumber);
CREATE INDEX idx_flights_jobnumber ON flights(jobnumber);
CREATE INDEX idx_timetable_jobnumber ON timetable(jobnumber);
CREATE INDEX idx_lsp_costs_jobnumber ON lsp_costs(jobnumber);
CREATE INDEX idx_lsp_costs_vendorcode ON lsp_costs(vendorcode);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to generate job numbers
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'JOB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('jobsfile_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_table 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to prevent role self-change
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow if user is Admin
    IF (SELECT role FROM user_table WHERE user_id = auth.uid()) = 'Admin' THEN
        RETURN NEW;
    END IF;
    
    -- Prevent users from changing their own role
    IF OLD.user_id = auth.uid() AND OLD.role IS DISTINCT FROM NEW.role THEN
        RAISE EXCEPTION 'Users cannot change their own role';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Security definer function for service role access
CREATE OR REPLACE FUNCTION get_user_role_secure(user_uuid UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role::TEXT FROM user_table WHERE user_id = user_uuid LIMIT 1;
$$;

-- Function to create user profile on auth signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_table (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'Not-Assigned');
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail auth
        RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE TRIGGER handle_user_table_updated_at
    BEFORE UPDATE ON user_table
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_timetable_updated_at
    BEFORE UPDATE ON timetable
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Prevent role self-change
CREATE TRIGGER prevent_user_role_self_change
    BEFORE UPDATE ON user_table
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_self_change();

-- Auto-create user profiles
CREATE TRIGGER create_profile_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lsps ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobsfile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;
ALTER TABLE lsp_costs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- USER_TABLE POLICIES
CREATE POLICY "user_table_select" ON user_table
    FOR SELECT USING (
        get_current_user_role() = 'Admin' OR 
        user_id = auth.uid()
    );

CREATE POLICY "user_table_insert" ON user_table
    FOR INSERT WITH CHECK (
        get_current_user_role() = 'Admin'
    );

CREATE POLICY "user_table_update" ON user_table
    FOR UPDATE USING (
        get_current_user_role() = 'Admin' OR 
        user_id = auth.uid()
    );

CREATE POLICY "user_table_delete" ON user_table
    FOR DELETE USING (
        get_current_user_role() = 'Admin'
    );

-- Service role bypass policy
CREATE POLICY "service_role_bypass_rls" ON user_table
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- CUSTOMERS POLICIES
CREATE POLICY "customers_select" ON customers
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = customers.id
        )
    );

CREATE POLICY "customers_insert" ON customers
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "customers_update" ON customers
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "customers_delete" ON customers
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- LSPS POLICIES
CREATE POLICY "lsps_select" ON lsps
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = lsps.id
        )
    );

CREATE POLICY "lsps_insert" ON lsps
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "lsps_update" ON lsps
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = lsps.id
        )
    );

CREATE POLICY "lsps_delete" ON lsps
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- JOBSFILE POLICIES
CREATE POLICY "jobsfile_select" ON jobsfile
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        -- Customers see their jobs
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = jobsfile.customer_id
        ) OR
        -- LSPs see jobs for their vendorcode
        EXISTS (
            SELECT 1 FROM user_table ut 
            JOIN lsps l ON ut.lsp_id = l.id
            WHERE ut.user_id = auth.uid() 
            AND l.vendorcode = jobsfile.vendorcode
        )
    );

CREATE POLICY "jobsfile_insert" ON jobsfile
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations', 'Customer')
    );

CREATE POLICY "jobsfile_update" ON jobsfile
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "jobsfile_delete" ON jobsfile
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- BILLING POLICIES
CREATE POLICY "billing_select" ON billing
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM jobsfile j
            JOIN user_table ut ON ut.customer_id = j.customer_id
            WHERE ut.user_id = auth.uid() 
            AND j.jobnumber = billing.jobnumber
        )
    );

CREATE POLICY "billing_insert" ON billing
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "billing_update" ON billing
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "billing_delete" ON billing
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- FLIGHTS POLICIES
CREATE POLICY "flights_select" ON flights
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM jobsfile j
            JOIN user_table ut ON ut.customer_id = j.customer_id
            WHERE ut.user_id = auth.uid() 
            AND j.jobnumber = flights.jobnumber
        )
    );

CREATE POLICY "flights_insert" ON flights
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "flights_update" ON flights
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "flights_delete" ON flights
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- TIMETABLE POLICIES
CREATE POLICY "timetable_select" ON timetable
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations', 'LSP') OR
        EXISTS (
            SELECT 1 FROM jobsfile j
            JOIN user_table ut ON ut.customer_id = j.customer_id
            WHERE ut.user_id = auth.uid() 
            AND j.jobnumber = timetable.jobnumber
        )
    );

CREATE POLICY "timetable_insert" ON timetable
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

CREATE POLICY "timetable_update" ON timetable
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations', 'LSP')
    );

CREATE POLICY "timetable_delete" ON timetable
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- LSP_COSTS POLICIES
CREATE POLICY "lsp_costs_select" ON lsp_costs
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            JOIN lsps l ON ut.lsp_id = l.id
            WHERE ut.user_id = auth.uid() 
            AND l.vendorcode = lsp_costs.vendorcode
        )
    );

CREATE POLICY "lsp_costs_insert" ON lsp_costs
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations', 'LSP')
    );

CREATE POLICY "lsp_costs_update" ON lsp_costs
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations', 'LSP')
    );

CREATE POLICY "lsp_costs_delete" ON lsp_costs
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to service_role for admin operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_job_number() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_secure(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_user_role_secure(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_user_role_secure(UUID) TO authenticated;

-- Grant trigger function permissions
GRANT EXECUTE ON FUNCTION handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION prevent_role_self_change() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile() TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Schema created successfully!' as status;

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verify policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTES
-- =====================================================
-- This schema includes:
-- ✅ All tables with correct data types
-- ✅ Foreign key relationships
-- ✅ Performance indexes
-- ✅ Business logic functions
-- ✅ Row Level Security policies
-- ✅ Service role permissions
-- ✅ Automatic user profile creation
-- ✅ Role-based access control
-- ✅ Timestamp management
-- ✅ Data integrity constraints
-- ===================================================== 