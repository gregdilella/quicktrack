-- Jobs Table Schema
-- This table stores all job/shipment information

CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Job identification
    job_number VARCHAR(20) NOT NULL UNIQUE,
    bol_number VARCHAR(100),
    po_number VARCHAR(100),
    
    -- Job basic information
    commodity TEXT NOT NULL,
    pieces INTEGER DEFAULT 0,
    weight DECIMAL(10,2) DEFAULT 0.00,
    service_type VARCHAR(50) DEFAULT 'NFO',
    job_type VARCHAR(50) DEFAULT 'Call',
    
    -- Shipper information
    shipper_name VARCHAR(255) NOT NULL,
    shipper_address1 VARCHAR(255),
    shipper_address2 VARCHAR(255),
    shipper_city VARCHAR(100),
    shipper_state VARCHAR(10),
    shipper_zip VARCHAR(20),
    shipper_phone VARCHAR(20),
    shipper_contact VARCHAR(255),
    
    -- Consignee information
    consignee_name VARCHAR(255) NOT NULL,
    consignee_address1 VARCHAR(255),
    consignee_address2 VARCHAR(255),
    consignee_city VARCHAR(100),
    consignee_state VARCHAR(10),
    consignee_zip VARCHAR(20),
    consignee_phone VARCHAR(20),
    consignee_contact VARCHAR(255),
    
    -- Ready date and time (new fields)
    ready_date DATE,
    ready_time TIME,
    
    -- Job status and tracking
    status VARCHAR(50) DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to user who created the job
    created_by UUID REFERENCES user_table(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs(job_number);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_ready_date ON jobs(ready_date);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs(created_by);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for different user roles
-- Admin can do everything
CREATE POLICY "Admin can manage all jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role = 'Admin'
        )
    );

-- Operations can create, read, and update jobs
CREATE POLICY "Operations can manage jobs" ON jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role = 'Operations'
        )
    );

-- Management can read all jobs
CREATE POLICY "Management can read all jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role = 'Management'
        )
    );

-- LSP can read jobs assigned to them (for future implementation)
CREATE POLICY "LSP can read assigned jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role = 'LSP'
        )
    );

-- Customer can read their own jobs (for future implementation)
CREATE POLICY "Customer can read their own jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_table 
            WHERE user_table.user_id = auth.uid() 
            AND user_table.role = 'Customer'
        )
    );

-- Add some sample data for testing (optional)
INSERT INTO jobs (
    job_number, 
    commodity, 
    shipper_name, 
    consignee_name, 
    service_type,
    job_type,
    status
) VALUES 
    ('3000001', 'Electronics', 'ABC Electronics Inc', 'XYZ Retail Store', 'NFO', 'Call', 'pending'),
    ('3000002', 'Furniture', 'Furniture World', 'Home Depot', 'NDO', 'Email', 'pending'),
    ('3000003', 'Automotive Parts', 'Auto Parts Direct', 'Service Center', 'OBC', 'Web', 'pending')
ON CONFLICT (job_number) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Main jobs/shipments table storing all job information';
COMMENT ON COLUMN jobs.job_number IS 'Sequential job number starting with 3, 7 digits total (e.g., 3000001)';
COMMENT ON COLUMN jobs.ready_date IS 'Date when shipment is ready for pickup';
COMMENT ON COLUMN jobs.ready_time IS 'Time when shipment is ready for pickup';
COMMENT ON COLUMN jobs.status IS 'Current job status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN jobs.service_type IS 'Type of service: NFO, NDO, OBC, Charter';
COMMENT ON COLUMN jobs.job_type IS 'Job type: Call, Email, Web'; 