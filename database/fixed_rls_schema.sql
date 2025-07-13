-- Complete Database Schema Recreation with PROPER RLS POLICIES
-- This recreates the entire schema as defined in supabase.types.ts with proper CRUD permissions

-- Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the user_role enum
CREATE TYPE user_role AS ENUM (
    'Admin',
    'LSP', 
    'Management',
    'Operations',
    'Customer',
    'Not-Assigned'
);

-- ===== CUSTOMERS TABLE =====
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ===== LSPS TABLE =====
CREATE TABLE lsps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    vendorcode TEXT UNIQUE,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lsps ENABLE ROW LEVEL SECURITY;

-- ===== JOBSFILE TABLE =====
CREATE TABLE jobsfile (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT,
    vendorcode TEXT REFERENCES lsps(vendorcode),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobsfile ENABLE ROW LEVEL SECURITY;

-- ===== USER_TABLE =====
CREATE TABLE user_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role user_role DEFAULT 'Customer',
    customer_id UUID REFERENCES customers(id),
    lsp_id UUID REFERENCES lsps(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_table ENABLE ROW LEVEL SECURITY;

-- ===== BILLING TABLE =====
CREATE TABLE billing (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT NOT NULL REFERENCES jobsfile(jobnumber),
    chargecode TEXT,
    charge DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- ===== FLIGHTS TABLE =====
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT REFERENCES jobsfile(jobnumber),
    org TEXT,
    destination TEXT,
    mawb TEXT,
    cost DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE flights ENABLE ROW LEVEL SECURITY;

-- ===== TIMETABLE TABLE =====
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

ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- ===== LSP_COSTS TABLE =====
CREATE TABLE lsp_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendorcode TEXT NOT NULL REFERENCES lsps(vendorcode),
    jobnumber TEXT REFERENCES jobsfile(jobnumber),
    ledgercode TEXT NOT NULL,
    cost DECIMAL NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lsp_costs ENABLE ROW LEVEL SECURITY;

-- ===== CREATE INDEXES FOR PERFORMANCE =====
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

-- ===== CREATE FUNCTIONS =====
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

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM user_table 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== CREATE TRIGGERS =====
-- Trigger to auto-update updated_at on user_table
CREATE TRIGGER handle_user_table_updated_at
    BEFORE UPDATE ON user_table
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Trigger to auto-update updated_at on timetable
CREATE TRIGGER handle_timetable_updated_at
    BEFORE UPDATE ON timetable
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- ===== ROW LEVEL SECURITY POLICIES =====

-- ========== USER_TABLE POLICIES ==========
-- SELECT: Admins see all, users see their own profile
CREATE POLICY "user_table_select" ON user_table
    FOR SELECT USING (
        get_current_user_role() = 'Admin' OR 
        user_id = auth.uid()
    );

-- INSERT: Only admins can manually create users (auto-trigger handles normal creation)
CREATE POLICY "user_table_insert" ON user_table
    FOR INSERT WITH CHECK (
        get_current_user_role() = 'Admin'
    );

-- UPDATE: Admins can update all, users can update their own profile (except role)
CREATE POLICY "user_table_update" ON user_table
    FOR UPDATE USING (
        get_current_user_role() = 'Admin' OR 
        user_id = auth.uid()
    ) WITH CHECK (
        get_current_user_role() = 'Admin' OR 
        (user_id = auth.uid() AND role = OLD.role) -- Users can't change their own role
    );

-- DELETE: Only admins can delete users
CREATE POLICY "user_table_delete" ON user_table
    FOR DELETE USING (
        get_current_user_role() = 'Admin'
    );

-- ========== CUSTOMERS POLICIES ==========
-- SELECT: Admins/Management/Operations see all, Customers see their own
CREATE POLICY "customers_select" ON customers
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = customers.id
        )
    );

-- INSERT: Admins/Management/Operations can create customers
CREATE POLICY "customers_insert" ON customers
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- UPDATE: Admins/Management/Operations can update customers
CREATE POLICY "customers_update" ON customers
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- DELETE: Admins/Management/Operations can delete customers
CREATE POLICY "customers_delete" ON customers
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- ========== LSPS POLICIES ==========
-- SELECT: Admins/Management/Operations see all, LSPs see their own
CREATE POLICY "lsps_select" ON lsps
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = lsps.id
        )
    );

-- INSERT: Admins/Management/Operations can create LSPs
CREATE POLICY "lsps_insert" ON lsps
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- UPDATE: Admins/Management/Operations can update all, LSPs can update their own
CREATE POLICY "lsps_update" ON lsps
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = lsps.id
        )
    );

-- DELETE: Admins/Management/Operations can delete LSPs
CREATE POLICY "lsps_delete" ON lsps
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- ========== JOBSFILE POLICIES ==========
-- SELECT: Role-based access
CREATE POLICY "jobsfile_select" ON jobsfile
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        -- Customers see their jobs
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = jobsfile.customer_id
        ) OR
        -- LSPs see jobs assigned to them
        EXISTS (
            SELECT 1 FROM user_table ut, lsps l
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = l.id
            AND l.vendorcode = jobsfile.vendorcode
        )
    );

-- INSERT: Only Admins/Management/Operations can create jobs
CREATE POLICY "jobsfile_insert" ON jobsfile
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- UPDATE: Only Admins/Management/Operations can update jobs
CREATE POLICY "jobsfile_update" ON jobsfile
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- DELETE: Only Admins can delete jobs
CREATE POLICY "jobsfile_delete" ON jobsfile
    FOR DELETE USING (
        get_current_user_role() = 'Admin'
    );

-- ========== BILLING POLICIES ==========
-- SELECT: Same as jobs
CREATE POLICY "billing_select" ON billing
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut, jobsfile j
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = j.customer_id
            AND j.jobnumber = billing.jobnumber
        )
    );

-- INSERT: Only Admins/Management/Operations can create billing
CREATE POLICY "billing_insert" ON billing
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- UPDATE: Only Admins/Management can update billing
CREATE POLICY "billing_update" ON billing
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management')
    );

-- DELETE: Only Admins can delete billing
CREATE POLICY "billing_delete" ON billing
    FOR DELETE USING (
        get_current_user_role() = 'Admin'
    );

-- ========== FLIGHTS POLICIES ==========
-- SELECT: Same pattern as jobs
CREATE POLICY "flights_select" ON flights
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut, jobsfile j
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = j.customer_id
            AND j.jobnumber = flights.jobnumber
        )
    );

-- INSERT: Admins/Management/Operations can create flights
CREATE POLICY "flights_insert" ON flights
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- UPDATE: Admins/Management/Operations can update flights
CREATE POLICY "flights_update" ON flights
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- DELETE: Only Admins can delete flights
CREATE POLICY "flights_delete" ON flights
    FOR DELETE USING (
        get_current_user_role() = 'Admin'
    );

-- ========== TIMETABLE POLICIES ==========
-- SELECT: Same pattern as jobs
CREATE POLICY "timetable_select" ON timetable
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut, jobsfile j
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = j.customer_id
            AND j.jobnumber = timetable.jobnumber
        )
    );

-- INSERT: Admins/Management/Operations can create timetable entries
CREATE POLICY "timetable_insert" ON timetable
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- UPDATE: Admins/Management/Operations can update timetable
CREATE POLICY "timetable_update" ON timetable
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- DELETE: Only Admins can delete timetable entries
CREATE POLICY "timetable_delete" ON timetable
    FOR DELETE USING (
        get_current_user_role() = 'Admin'
    );

-- ========== LSP_COSTS POLICIES ==========
-- SELECT: Admins/Management/Operations see all, LSPs see their own
CREATE POLICY "lsp_costs_select" ON lsp_costs
    FOR SELECT USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut, lsps l
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = l.id
            AND l.vendorcode = lsp_costs.vendorcode
        )
    );

-- INSERT: Admins/Management/Operations and LSPs can create their costs
CREATE POLICY "lsp_costs_insert" ON lsp_costs
    FOR INSERT WITH CHECK (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut, lsps l
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = l.id
            AND l.vendorcode = lsp_costs.vendorcode
        )
    );

-- UPDATE: Admins/Management/Operations and LSPs can update their costs
CREATE POLICY "lsp_costs_update" ON lsp_costs
    FOR UPDATE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations') OR
        EXISTS (
            SELECT 1 FROM user_table ut, lsps l
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = l.id
            AND l.vendorcode = lsp_costs.vendorcode
        )
    );

-- DELETE: Admins/Management/Operations can delete LSP costs
CREATE POLICY "lsp_costs_delete" ON lsp_costs
    FOR DELETE USING (
        get_current_user_role() IN ('Admin', 'Management', 'Operations')
    );

-- ===== TRIGGER FOR AUTO USER CREATION =====
-- This creates a user_table entry when a new auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_table (user_id, email, role)
    VALUES (NEW.id, NEW.email, 'Customer');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 