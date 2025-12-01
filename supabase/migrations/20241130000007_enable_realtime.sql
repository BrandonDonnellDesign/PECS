-- Enable real-time for boards table
-- This allows Supabase to send real-time updates when boards change

-- Enable replication for the boards table
ALTER TABLE public.boards REPLICA IDENTITY FULL;

-- Verify replication is enabled
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN relreplident = 'd' THEN 'default'
    WHEN relreplident = 'n' THEN 'nothing'
    WHEN relreplident = 'f' THEN 'full'
    WHEN relreplident = 'i' THEN 'index'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.schemaname = 'public' 
AND t.tablename = 'boards';

-- Note: You also need to enable Realtime in Supabase Dashboard:
-- 1. Go to Database → Replication
-- 2. Enable replication for the 'boards' table
-- 3. Click "Save"
