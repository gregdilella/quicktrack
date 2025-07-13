-- Complete Database Schema Recreation
-- This recreates the entire schema as defined in supabase.types.ts with RLS enabled

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

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ===== LSPS TABLE =====
CREATE TABLE lsps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    vendorcode TEXT UNIQUE,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
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

-- Enable RLS
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

-- Enable RLS
ALTER TABLE user_table ENABLE ROW LEVEL SECURITY;

-- ===== BILLING TABLE =====
CREATE TABLE billing (
    id SERIAL PRIMARY KEY,
    jobnumber TEXT NOT NULL REFERENCES jobsfile(jobnumber),
    chargecode TEXT,
    charge DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
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

-- Enable RLS
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

-- Enable RLS
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

-- Enable RLS
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

-- USER_TABLE POLICIES
-- Admins can see all users
CREATE POLICY "admin_can_view_all_users" ON user_table
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() AND ut.role = 'Admin'
        )
    );

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON user_table
    FOR ALL USING (user_id = auth.uid());

-- CUSTOMERS POLICIES  
-- Admins and Management can see all customers
CREATE POLICY "admin_management_can_view_customers" ON customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.role IN ('Admin', 'Management')
        )
    );

-- Customers can only see their own data
CREATE POLICY "customers_can_view_own_data" ON customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = customers.id
        )
    );

-- LSPS POLICIES
-- Admins and Management can see all LSPs
CREATE POLICY "admin_management_can_view_lsps" ON lsps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.role IN ('Admin', 'Management')
        )
    );

-- LSPs can only see their own data
CREATE POLICY "lsps_can_view_own_data" ON lsps
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = lsps.id
        )
    );

-- JOBSFILE POLICIES
-- Admins, Management, Operations can see all jobs
CREATE POLICY "admin_management_ops_can_view_jobs" ON jobsfile
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.role IN ('Admin', 'Management', 'Operations')
        )
    );

-- Customers can only see their jobs
CREATE POLICY "customers_can_view_own_jobs" ON jobsfile
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = jobsfile.customer_id
        )
    );

-- LSPs can only see jobs assigned to them
CREATE POLICY "lsps_can_view_assigned_jobs" ON jobsfile
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut, lsps l
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = l.id
            AND l.vendorcode = jobsfile.vendorcode
        )
    );

-- BILLING POLICIES
-- Same access pattern as jobs
CREATE POLICY "admin_management_ops_can_view_billing" ON billing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "customers_can_view_own_billing" ON billing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut, jobsfile j
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = j.customer_id
            AND j.jobnumber = billing.jobnumber
        )
    );

-- FLIGHTS POLICIES
CREATE POLICY "admin_management_ops_can_view_flights" ON flights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "customers_can_view_own_flights" ON flights
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut, jobsfile j
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = j.customer_id
            AND j.jobnumber = flights.jobnumber
        )
    );

-- TIMETABLE POLICIES
CREATE POLICY "admin_management_ops_can_view_timetable" ON timetable
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.role IN ('Admin', 'Management', 'Operations')
        )
    );

CREATE POLICY "customers_can_view_own_timetable" ON timetable
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut, jobsfile j
            WHERE ut.user_id = auth.uid() 
            AND ut.customer_id = j.customer_id
            AND j.jobnumber = timetable.jobnumber
        )
    );

-- LSP_COSTS POLICIES
CREATE POLICY "admin_management_can_view_lsp_costs" ON lsp_costs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut 
            WHERE ut.user_id = auth.uid() 
            AND ut.role IN ('Admin', 'Management')
        )
    );

CREATE POLICY "lsps_can_view_own_costs" ON lsp_costs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table ut, lsps l
            WHERE ut.user_id = auth.uid() 
            AND ut.lsp_id = l.id
            AND l.vendorcode = lsp_costs.vendorcode
        )
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