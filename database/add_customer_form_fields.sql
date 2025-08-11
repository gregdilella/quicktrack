-- Add additional fields to customers table for the add-new-customer form
-- This adds address, billing, and other fields needed for comprehensive customer management

DO $$
BEGIN
    -- Add address fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address1') THEN
        ALTER TABLE customers ADD COLUMN address1 TEXT;
        RAISE NOTICE 'Added address1 column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'address2') THEN
        ALTER TABLE customers ADD COLUMN address2 TEXT;
        RAISE NOTICE 'Added address2 column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
        ALTER TABLE customers ADD COLUMN city VARCHAR(100);
        RAISE NOTICE 'Added city column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'state') THEN
        ALTER TABLE customers ADD COLUMN state VARCHAR(10);
        RAISE NOTICE 'Added state column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'zip') THEN
        ALTER TABLE customers ADD COLUMN zip VARCHAR(20);
        RAISE NOTICE 'Added zip column';
    END IF;
    
    -- Add billing fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'billing_contact') THEN
        ALTER TABLE customers ADD COLUMN billing_contact VARCHAR(255);
        RAISE NOTICE 'Added billing_contact column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'payment_terms') THEN
        ALTER TABLE customers ADD COLUMN payment_terms VARCHAR(20) DEFAULT 'NET_30';
        RAISE NOTICE 'Added payment_terms column';
    END IF;
    
    -- Add notes field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'notes') THEN
        ALTER TABLE customers ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;
    
    RAISE NOTICE 'Customer form fields added successfully!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error adding customer form fields: %', SQLERRM;
        RAISE;
END $$;

-- Add indexes for better performance on commonly searched fields
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_state ON customers(state);
CREATE INDEX IF NOT EXISTS idx_customers_zip ON customers(zip);

-- Add a comment explaining the new structure
COMMENT ON TABLE customers IS 'Customer information including contact details, address, billing info, and account management';

RAISE NOTICE 'Customer table enhancement complete! All form fields are now supported.';
