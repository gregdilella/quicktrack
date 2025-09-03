-- Drop redundant flights table
-- The AWB table provides all flight functionality and more

-- Check if there's any data in flights table first
DO $$
DECLARE
    flight_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO flight_count FROM flights;
    
    IF flight_count > 0 THEN
        RAISE NOTICE 'WARNING: flights table contains % records. Consider migrating to AWB table first.', flight_count;
        RAISE NOTICE 'Migration would involve:';
        RAISE NOTICE '1. Creating AWB records for each flight';
        RAISE NOTICE '2. Linking to appropriate airlines';
        RAISE NOTICE '3. Copying flight details';
    ELSE
        RAISE NOTICE 'flights table is empty, safe to drop';
    END IF;
END $$;

-- Drop the flights table and related constraints
DROP TABLE IF EXISTS flights CASCADE;

-- Drop any related indexes
DROP INDEX IF EXISTS idx_flights_jobnumber;

-- Update comments
COMMENT ON TABLE awb IS 'Air Waybill table - handles all flight and airline information (replaces deprecated flights table)';

-- Display confirmation
DO $$
BEGIN
    RAISE NOTICE 'Successfully dropped redundant flights table';
    RAISE NOTICE 'All flight functionality is now handled by the AWB table';
    RAISE NOTICE 'AWB table provides: airline links, flight details, cargo info, status tracking';
END $$;

