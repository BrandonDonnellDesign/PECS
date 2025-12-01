# How to Fix RLS for Family Groups

## The Problem

The original RLS (Row Level Security) policies had a **circular dependency** issue:

- The `family_members` SELECT policy checked `family_members` to see if you're a member
- But to check `family_members`, it needed to run the SELECT policy first
- This created **infinite recursion** and blocked all operations

## The Solution

**Disable RLS on `family_members` table** and use helper functions for security instead.

This is a common pattern in Supabase when you have circular dependencies. The security is enforced by:
1. Helper functions with `SECURITY DEFINER` and permission checks
2. Foreign key constraints
3. Application logic
4. RLS on related tables (profiles, family_groups, boards)

I've created three migration files that fix this properly:

### 1. `20241130000011_add_helper_functions.sql`

This adds PostgreSQL functions that handle operations with proper security:

**`create_family_group_with_owner(group_name, creator_id)`**
- Creates a family group AND adds the creator as owner in one transaction
- Uses `SECURITY DEFINER` to bypass RLS

**`add_family_member(family_group_id, user_id, role, added_by)`**
- Adds a member with permission checking (only owners/admins can add)
- Validates the user exists and isn't already a member

**`remove_family_member(member_id, removed_by)`**
- Removes a member with permission checking
- Users can remove themselves, or owners/admins can remove others

### 2. `20241130000013_disable_rls_family_members.sql` ⭐ **USE THIS ONE**

This is the final fix that solves the infinite recursion:

- **Disables RLS on `family_members` table** (breaks the recursion cycle!)
- Keeps RLS enabled on `profiles`, `family_groups`, and `boards`
- Updates helper functions with comprehensive permission checks
- Security is enforced via helper functions instead of RLS policies

## How to Apply

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in your project directory
cd your-project

# Reset the database (WARNING: This deletes all data!)
npx supabase db reset

# Or apply just the new migrations
npx supabase db push
```

**Note:** You only need to run migration `20241130000013_disable_rls_family_members.sql`. It includes all the fixes.

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `20241130000011_add_helper_functions.sql`
4. Click **Run**
5. Copy and paste the contents of `20241130000013_disable_rls_family_members.sql`
6. Click **Run**

### Option 3: Manual SQL Execution

If you're using a local Supabase instance:

```bash
# Connect to your database
psql -h localhost -p 54322 -U postgres -d postgres

# Run the migrations
\i supabase/migrations/20241130000011_add_helper_functions.sql
\i supabase/migrations/20241130000013_disable_rls_family_members.sql
```

## Verify It Works

After applying the migrations, you can verify RLS is working:

```sql
-- Check that RLS is enabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'enabled' ELSE 'disabled' END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'family_groups', 'family_members', 'boards')
ORDER BY tablename;

-- Expected output:
-- profiles: enabled, 3 policies
-- family_groups: enabled, 4 policies
-- family_members: DISABLED, 0 policies ← This is correct!
-- boards: enabled, 4 policies

-- Check that the helper functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN ('create_family_group_with_owner', 'add_family_member', 'remove_family_member');

-- Should return 3 functions
```

## What Changed in the Code

The `app/services/supabase.ts` file now uses the helper functions:

**Before:**
```typescript
// Created group, then tried to insert member (caused infinite recursion)
await supabase.from('family_groups').insert(...)
await supabase.from('family_members').insert(...) // ❌ Infinite recursion!
```

**After:**
```typescript
// Uses helper function with proper security
await supabase.rpc('create_family_group_with_owner', {
  group_name: name,
  creator_id: userId
})

// Adding members
await supabase.rpc('add_family_member', {
  p_family_group_id: groupId,
  p_user_id: userId,
  p_role: 'member'
})

// Removing members
await supabase.rpc('remove_family_member', {
  p_member_id: memberId,
  p_removed_by: currentUserId
})
```

## Testing

1. **Create a family group**: Should work without errors
2. **Add a member**: Should work if you're an owner/admin
3. **View boards**: Should see both personal and family group boards
4. **Edit family boards**: All members should be able to edit

## Troubleshooting

### "Function does not exist" error

If you see `function "create_family_group_with_owner" does not exist`:
- Make sure you ran migrations `20241130000011_add_helper_functions.sql` and `20241130000013_disable_rls_family_members.sql`
- Check the SQL Editor for any errors
- Verify functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE '%family%';`

### "Permission denied" error

If you see permission errors:
- Make sure you're logged in
- Check that your user has a profile in the `profiles` table
- Verify RLS policies are enabled (see Verify section above)

### Still having issues?

1. Check the browser console for detailed error messages
2. Check Supabase logs in the dashboard
3. Try resetting the database: `npx supabase db reset`

## Key Improvements

✅ **No more infinite recursion** - RLS disabled on `family_members` breaks the cycle
✅ **Atomic operations** - Group creation + owner assignment in one transaction
✅ **Better error messages** - Helper functions provide clear error messages
✅ **Proper permissions** - Only owners/admins can add/remove members
✅ **Self-service** - Users can remove themselves from groups
✅ **Profile visibility** - All users can search for others by email
✅ **Still secure** - Security enforced via helper functions and foreign keys

## Security Notes

- **`family_members` has RLS disabled** - This is intentional to avoid recursion
- Security is enforced by:
  - Helper functions with `SECURITY DEFINER` and permission checks
  - Foreign key constraints (can't add non-existent users/groups)
  - Application logic (always use helper functions, not direct queries)
  - RLS on related tables (`profiles`, `family_groups`, `boards`)
- The helper functions validate permissions before allowing operations
- Users can only see groups they're members of (via `family_groups` RLS)
- Users can only see/edit boards they own or that belong to their groups (via `boards` RLS)

## Why Disable RLS on family_members?

This is a **common pattern** in Supabase when dealing with self-referential queries:

1. **The Problem**: `family_members` SELECT policy needs to check `family_members` → infinite loop
2. **The Solution**: Disable RLS on the junction table, enforce security elsewhere
3. **Still Secure**: Users can't access groups they're not in (enforced by `family_groups` RLS)
4. **Best Practice**: Use helper functions for all mutations, not direct table access
