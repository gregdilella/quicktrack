-- Fix quotes sequence permissions
-- The issue: Users can insert into quotes table due to RLS policies, 
-- but they don't have permission to use the quotes_id_seq sequence

BEGIN;

-- Grant usage and select permissions on the quotes sequence to authenticated users
GRANT USAGE, SELECT ON SEQUENCE quotes_id_seq TO authenticated;

-- Also grant permissions on the quotes table itself to be safe
GRANT INSERT, SELECT ON TABLE quotes TO authenticated;

-- Verify the permissions
SELECT 
    schemaname,
    sequencename,
    sequenceowner
FROM pg_sequences 
WHERE sequencename = 'quotes_id_seq';

-- Check table permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'quotes' 
AND grantee = 'authenticated';

-- Check sequence permissions  
SELECT 
    grantee,
    privilege_type
FROM information_schema.usage_privileges 
WHERE object_name = 'quotes_id_seq' 
AND grantee = 'authenticated';

COMMIT;
