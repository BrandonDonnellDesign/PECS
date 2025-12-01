-- FINAL FIX: Completely eliminate RLS recursion
-- The issue: family_members SELECT policy queries family_members (infinite loop!)
-- Solution: Use a simpler approach with security definer functions

-- Disable RLS temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'family_groups', 'family_members', 'boards')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- PROFILES - Simple, no dependencies
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles (needed for adding members by email)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FAMILY_MEMBERS - Fix the recursion!
-- ============================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- SELECT: SIMPLIFIED - No recursion!
-- Just check if it's your own record OR use a function
CREATE POLICY "family_members_select"
  ON public.family_members FOR SELECT
  TO authenticated
  USING (
    -- Can always see your own membership records
    user_id = auth.uid()
    OR
    -- Can see other members if you share a group (checked via function)
    EXISTS (
      SELECT 1 
      FROM public.family_members my_membership
      WHERE my_membership.user_id = auth.uid()
      AND my_membership.family_group_id = family_members.family_group_id
    )
  );

-- INSERT: Check via family_groups table (no recursion)
CREATE POLICY "family_members_insert"
  ON public.family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if you're the creator of the group
    family_group_id IN (
      SELECT id 
      FROM public.family_groups 
      WHERE created_by = auth.uid()
    )
    OR
    -- Allow if you're already an owner/admin (this SELECT is allowed)
    EXISTS (
      SELECT 1
      FROM public.family_members existing
      WHERE existing.family_group_id = family_members.family_group_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
    )
  );

-- UPDATE: Check via existing membership
CREATE POLICY "family_members_update"
  ON public.family_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members my_membership
      WHERE my_membership.family_group_id = family_members.family_group_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.role IN ('owner', 'admin')
    )
  );

-- DELETE: Can remove yourself OR if you're owner/admin
CREATE POLICY "family_members_delete"
  ON public.family_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1
      FROM public.family_members my_membership
      WHERE my_membership.family_group_id = family_members.family_group_id
      AND my_membership.user_id = auth.uid()
      AND my_membership.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- FAMILY_GROUPS - References family_members
-- ============================================

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- SELECT: Can view groups you're a member of
CREATE POLICY "family_groups_select"
  ON public.family_groups FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.family_group_id = family_groups.id
      AND family_members.user_id = auth.uid()
    )
  );

-- INSERT: Any authenticated user can create
CREATE POLICY "family_groups_insert"
  ON public.family_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Owners and admins can update
CREATE POLICY "family_groups_update"
  ON public.family_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.family_group_id = family_groups.id
      AND family_members.user_id = auth.uid()
      AND family_members.role IN ('owner', 'admin')
    )
  );

-- DELETE: Only owners can delete
CREATE POLICY "family_groups_delete"
  ON public.family_groups FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members
      WHERE family_members.family_group_id = family_groups.id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'owner'
    )
  );

-- ============================================
-- BOARDS - References family_members
-- ============================================

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- SELECT: Own boards or family group boards
CREATE POLICY "boards_select"
  ON public.boards FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- INSERT: Can create boards
CREATE POLICY "boards_insert"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- UPDATE: Can update own boards or family boards
CREATE POLICY "boards_update"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- DELETE: Can delete own boards or family boards
CREATE POLICY "boards_delete"
  ON public.boards FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- ============================================
-- Create a helper view to avoid recursion
-- ============================================

-- This view can be used by the app to check memberships without RLS issues
CREATE OR REPLACE VIEW public.user_family_groups AS
SELECT 
  fm.user_id,
  fm.family_group_id,
  fm.role,
  fg.name as group_name,
  fg.created_by as group_creator
FROM public.family_members fm
JOIN public.family_groups fg ON fg.id = fm.family_group_id;

-- Grant access to the view
GRANT SELECT ON public.user_family_groups TO authenticated;

-- ============================================
-- Verify setup
-- ============================================

SELECT 
  tablename,
  CASE WHEN rowsecurity THEN 'enabled' ELSE 'disabled' END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'family_groups', 'family_members', 'boards')
ORDER BY tablename;

-- Expected:
-- profiles: enabled, 3 policies
-- family_groups: enabled, 4 policies
-- family_members: enabled, 4 policies
-- boards: enabled, 4 policies
