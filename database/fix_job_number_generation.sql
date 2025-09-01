-- Fix job number generation to use 7-digit format starting with 3000000
-- and ensure customer_id is properly set in customerService

-- 1) Update the generate_job_number function to return proper 7-digit format
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    job_number TEXT;
BEGIN
    -- Get the highest existing job number that starts with '3'
    SELECT COALESCE(
        MAX(CAST(jobnumber AS INTEGER)), 
        2999999
    ) INTO next_number
    FROM jobsfile 
    WHERE jobnumber ~ '^3[0-9]{6}$'
    AND jobnumber IS NOT NULL;
    
    -- Increment by 1
    next_number := next_number + 1;
    
    -- Ensure it starts with 3 and is 7 digits
    IF next_number < 3000000 THEN
        next_number := 3000000;
    END IF;
    
    job_number := LPAD(next_number::TEXT, 7, '0');
    
    RETURN job_number;
END;
$$ LANGUAGE plpgsql;

-- 2) Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION generate_job_number() TO authenticated;

-- 3) Test the function (optional - uncomment to test)
-- SELECT generate_job_number() as test_job_number;
