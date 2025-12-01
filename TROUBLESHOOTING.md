# Troubleshooting: Boards Not Showing

## Quick Checks

### 1. Check Browser Console
Open your browser's developer console (F12) and look for:
- Any error messages
- The output of `console.log("Loaded boards:", data)` when the page loads

### 2. Check Local Storage
In your browser console, run:
```javascript
localStorage.getItem('pecs_creator_boards')
```

This will show you if boards are saved locally.

### 3. Verify Supabase Connection

Run this SQL query in your Supabase SQL Editor:

```sql
-- Check if boards table exists and see its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'boards'
ORDER BY ordinal_position;

-- Check if you have any boards
SELECT id, user_id, title, created_at, updated_at 
FROM boards 
ORDER BY updated_at DESC 
LIMIT 10;

-- Check your user ID
SELECT id, email FROM auth.users;
```

### 4. Check RLS Policies

Your boards might be hidden by Row Level Security. Run this to temporarily check:

```sql
-- See all boards (bypassing RLS for testing)
SELECT * FROM boards;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'boards';
```

## Common Issues & Solutions

### Issue 1: Migration Not Applied

**Symptom**: Error about missing columns or tables

**Solution**: 
1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `supabase/migrations/20241130000001_add_family_groups.sql`
3. Check for any errors in the output

### Issue 2: Column Name Mismatch

**Symptom**: Boards save but don't load

**Solution**: Your existing table might have different column names. Check with:

```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'boards' AND table_schema = 'public';
```

If your columns are named differently (e.g., `gridColumns` instead of `grid_columns`), you need to either:
- Update the migration to match your schema, OR
- Update the service code to match your column names

### Issue 3: RLS Blocking Access

**Symptom**: Boards save but user can't see them

**Solution**: Check if RLS is blocking you:

```sql
-- Temporarily disable RLS for testing (DON'T DO THIS IN PRODUCTION!)
ALTER TABLE boards DISABLE ROW LEVEL SECURITY;

-- Try loading boards again, then re-enable:
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
```

If this fixes it, the RLS policies need adjustment.

### Issue 4: User ID Mismatch

**Symptom**: Boards exist but don't show for logged-in user

**Solution**: Check if the `user_id` in boards matches your auth user:

```sql
-- Compare user IDs
SELECT 
  b.id as board_id,
  b.user_id as board_user_id,
  b.title,
  u.id as auth_user_id,
  u.email
FROM boards b
FULL OUTER JOIN auth.users u ON b.user_id = u.id;
```

## Debug Component

Add this to your page temporarily to see what's happening:

```typescript
import BoardDebug from './components/BoardDebug';

// In your component
<BoardDebug />
```

## Manual Board Creation Test

Try creating a board directly in Supabase:

```sql
-- Get your user ID first
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Insert a test board (replace USER_ID with your actual ID)
INSERT INTO boards (
  id,
  user_id,
  title,
  grid_columns,
  grid_gap,
  background_color,
  cards,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'USER_ID',
  'Test Board',
  4,
  16,
  '#ffffff',
  '[]'::jsonb,
  now(),
  now()
);
```

Then refresh your app and see if it appears.

## Check Environment Variables

Make sure your `.env.local` file has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Restart your dev server after changing these.

## Still Not Working?

1. Check the browser Network tab to see if API calls to Supabase are succeeding
2. Look for CORS errors
3. Verify your Supabase project is not paused
4. Check if you're hitting any rate limits

## Contact Info

If you're still stuck, provide:
1. Browser console errors
2. Output of the SQL queries above
3. Your table schema
4. Whether boards appear in local storage
