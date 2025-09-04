-- Add estimated flight timing fields to timetable table and flight metadata to AWB table
-- These fields will store the estimated times calculated from the flight selection algorithm
-- Note: timetable table uses jobno field, not jobnumber (as per project convention)

-- Add estimated flight timing columns to timetable (timing data only)
ALTER TABLE timetable 
ADD COLUMN IF NOT EXISTS estimated_flight_departure TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_flight_arrival TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_airport_pickup TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_cargo_ready TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;

-- Add flight metadata columns to AWB table (flight details)
ALTER TABLE awb
ADD COLUMN IF NOT EXISTS flight_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS selected_flight_id TEXT,
ADD COLUMN IF NOT EXISTS origin_airport_code TEXT,
ADD COLUMN IF NOT EXISTS destination_airport_code TEXT,
ADD COLUMN IF NOT EXISTS is_direct_flight BOOLEAN DEFAULT FALSE;

-- Add comments to document the new fields
COMMENT ON COLUMN timetable.estimated_flight_departure IS 'Estimated departure time of selected flight';
COMMENT ON COLUMN timetable.estimated_flight_arrival IS 'Estimated arrival time of selected flight at destination airport';
COMMENT ON COLUMN timetable.estimated_airport_pickup IS 'Estimated time cargo is ready to leave destination airport (arrival + 90 min processing)';
COMMENT ON COLUMN timetable.estimated_cargo_ready IS 'Same as estimated_airport_pickup - when cargo is ready for final delivery';
COMMENT ON COLUMN timetable.estimated_delivery IS 'Final estimated delivery time at consignee (includes drive time from airport)';
COMMENT ON COLUMN awb.flight_duration_minutes IS 'Total flight duration in minutes';
COMMENT ON COLUMN awb.selected_flight_id IS 'ID of the selected flight from flight search API';
COMMENT ON COLUMN awb.origin_airport_code IS 'IATA code of origin airport (e.g., LAX)';
COMMENT ON COLUMN awb.destination_airport_code IS 'IATA code of destination airport (e.g., JFK)';
COMMENT ON COLUMN awb.is_direct_flight IS 'Whether the selected flight is direct (true) or connecting (false)';

-- Update the database types file generation trigger if it exists
-- This ensures the TypeScript types are updated with the new fields
-- Note: You may need to run `npx supabase gen types typescript --local` after running this migration
