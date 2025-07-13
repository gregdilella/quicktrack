-- Check Row Level Security status for all public tables
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED' 
        ELSE '❌ RLS DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 