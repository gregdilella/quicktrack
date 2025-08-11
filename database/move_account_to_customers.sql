-- Move customer_account from jobsfile to customers table
-- This normalizes the database structure properly

DO $$
BEGIN
    -- Step 1: Add account_number field to customers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'account_number') THEN
        ALTER TABLE customers ADD COLUMN account_number VARCHAR(100) UNIQUE;
        RAISE NOTICE 'Added account_number column to customers table';
    END IF;

    -- Step 2: Add additional customer fields to customers table that make more sense there
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'phone') THEN
        ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column to customers table';
    END IF;

    -- Step 3: Migrate existing customer_account data from jobsfile to customers
    -- First, create customers for any unique customer_account values that don't exist
    INSERT INTO customers (name, account_number, contact_email, phone)
    SELECT DISTINCT 
        COALESCE(j.customer_name, 'Customer ' || j.customer_account) as name,
        j.customer_account as account_number,
        j.customer_email as contact_email,
        j.customer_phone as phone
    FROM jobsfile j
    WHERE j.customer_account IS NOT NULL 
    AND j.customer_account != ''
    AND NOT EXISTS (
        SELECT 1 FROM customers c WHERE c.account_number = j.customer_account
    );

    -- Step 4: Update jobsfile to properly link to customers via customer_id
    UPDATE jobsfile 
    SET customer_id = c.id
    FROM customers c
    WHERE jobsfile.customer_account = c.account_number
    AND jobsfile.customer_id IS NULL;

    RAISE NOTICE 'Customer data migration completed successfully!';
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error during customer migration: %', SQLERRM;
        RAISE;
END $$;

-- Step 5: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_account_number ON customers(account_number);

-- Step 6: Add a comment explaining the new structure
COMMENT ON COLUMN customers.account_number IS 'Unique customer account identifier - moved from jobsfile for proper normalization';

-- Optional: After verifying the migration worked, you can remove the redundant fields from jobsfile
-- Uncomment these lines ONLY after verifying the migration worked correctly:

-- ALTER TABLE jobsfile DROP COLUMN IF EXISTS customer_account;
-- ALTER TABLE jobsfile DROP COLUMN IF EXISTS customer_name;
-- ALTER TABLE jobsfile DROP COLUMN IF EXISTS customer_contact;
-- ALTER TABLE jobsfile DROP COLUMN IF EXISTS customer_phone;
-- ALTER TABLE jobsfile DROP COLUMN IF EXISTS customer_email;

RAISE NOTICE 'Database normalization complete! Customer account numbers are now properly stored in customers table.';
