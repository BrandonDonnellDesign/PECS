# Quick Start Guide

## Your Current Situation

Your database uses **camelCase** column names (like `gridColumns`, `updatedAt`, `group_id`) instead of snake_case. I've updated everything to work with your existing schema.

## Step 1: Apply the Migration

Use the **NEW** migration file that matches your schema:

**File:** `supabase/migrations/20241130000002_family_groups_camelcase.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of the file above
3. Paste and run it
4. Verify no errors

## Step 2: Test Board Loading

1. Refresh your app
2. Open browser console (F12)
3. Look for: `"Loaded boards from Supabase:"` with your boards data
4. Your existing boards should now appear!

## Step 3: Verify Everything Works

Test these actions:
- ✅ View existing boards
- ✅ Create a new board
- ✅ Edit a board
- ✅ Delete a board

## Step 4: Test Family Groups

1. Create a family group
2. Add another user by email (they must have an account)
3. Create a board and set its `group_id` to the family group ID
4. Verify the other user can see and edit it

## What Was Fixed

### Service Layer (`app/services/supabase.ts`)
- ✅ Updated to use `gridColumns` instead of `grid_columns`
- ✅ Updated to use `updatedAt` instead of `updated_at`
- ✅ Updated to use `group_id` instead of `family_group_id`
- ✅ Added better error logging
- ✅ Fixed local storage fallback

### Migration
- ✅ Created new migration that works with camelCase schema
- ✅ Keeps your existing `group_id` column
- ✅ Adds foreign key constraint to `family_groups` table
- ✅ Sets up all RLS policies correctly

## Console Logs to Watch For

When you load the app, you should see:
```
Loaded boards from Supabase: [array of boards]
```

When you save a board:
```
Board saved successfully: [board-id]
```

If there are errors, they'll show as:
```
Supabase getBoards error: [error details]
```

## Quick Test SQL

Run this in Supabase SQL Editor to see your boards:

```sql
-- See all your boards
SELECT id, user_id, title, "gridColumns", "updatedAt" 
FROM boards 
ORDER BY "updatedAt" DESC;

-- See your user info
SELECT id, email FROM auth.users;
```

## Troubleshooting

### Boards still not showing?

1. Check browser console for errors
2. Run this SQL to verify data exists:
   ```sql
   SELECT COUNT(*) FROM boards;
   ```
3. Check if RLS is blocking you:
   ```sql
   SELECT * FROM boards WHERE user_id = 'YOUR_USER_ID';
   ```

### Can't create family groups?

Make sure the migration ran successfully. Check for the tables:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'family_groups', 'family_members');
```

## Next Steps

Once boards are loading:
1. Add the FamilyGroups component to your UI
2. Test creating and managing family groups
3. Test sharing boards with family members

## Files to Use

- ✅ Use: `supabase/migrations/20241130000002_family_groups_camelcase.sql`
- ❌ Ignore: `supabase/migrations/20241130000001_add_family_groups.sql` (this was for snake_case)

The service layer (`app/services/supabase.ts`) is already updated and ready to go!
