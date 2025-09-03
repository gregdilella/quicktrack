-- =====================================================
-- SETUP DEFAULT SALESMAN AND ASSIGN TO CUSTOMERS
-- =====================================================

-- Create Rob Broderick as default salesman if he doesn't exist
INSERT INTO salesman (name, email, fin_cono)
SELECT 'Rob Broderick', 'rob@certusfreight.com', 'RB001'
WHERE NOT EXISTS (
    SELECT 1 FROM salesman WHERE name = 'Rob Broderick'
);

-- Create Netjets as default customer if it doesn't exist
INSERT INTO customers (name, contact_email, account_number)
SELECT 'Netjets', 'netjets@certusfreight.com', 'NJ001'
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE name = 'Netjets'
);

DO $$
DECLARE
    rob_salesman_id UUID;
    netjets_customer_id UUID;
BEGIN
    -- Get Rob Broderick's salesman ID
    SELECT id INTO rob_salesman_id 
    FROM salesman 
    WHERE name = 'Rob Broderick' 
    LIMIT 1;
    
    -- Get Netjets customer ID
    SELECT id INTO netjets_customer_id 
    FROM customers 
    WHERE name = 'Netjets' 
    LIMIT 1;
    
    -- Assign Rob Broderick to all customers who don't have a salesman assigned
    UPDATE customers 
    SET salesman_id = rob_salesman_id
    WHERE salesman_id IS NULL;
    
    -- Specifically ensure Netjets is assigned to Rob Broderick
    UPDATE customers 
    SET salesman_id = rob_salesman_id
    WHERE id = netjets_customer_id;
    
    RAISE NOTICE 'Rob Broderick assigned as default salesman to customers. Netjets customer created/updated.';
END $$;

-- Verification: Show customer-salesman assignments
SELECT 
    c.name as customer_name,
    c.account_number,
    s.name as salesman_name,
    s.fin_cono as salesman_code
FROM customers c
LEFT JOIN salesman s ON c.salesman_id = s.id
ORDER BY c.name;
