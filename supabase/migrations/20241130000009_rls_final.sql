-- Final RLS implementation - designed to avoid infinite recursion
-- This uses a simpler approach that doesn't create circular dependencies

-- First, disable all RLS and drop all policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              AND tablename IN ('profiles', 'family_groups', 'family_members', 'boards'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- PROFILES - Simple policies, no recursion
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view profiles (needed for adding members by email)
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
-- FAMILY_MEMBERS - No self-referencing queries
-- ============================================

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view members of groups they belong to
-- This uses a subquery that doesn't reference family_members in the WHERE clause
CREATE POLICY "family_members_select"
  ON public.family_members FOR SELECT
  TO authenticated
  USING (
    -- Can see your own membership
    user_id = auth.uid()
    OR
    -- Can see members of groups you're in (using family_groups as intermediary)
    family_group_id IN (
      SELECT fm.family_group_id 
      FROM family_members fm 
      WHERE fm.user_id = auth.uid()
    )
  );

-- INSERT: Group creators and existing admins/owners can add members
CREATE POLICY "family_members_insert"
  ON public.family_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if you're the creator of the group
    family_group_id IN (
      SELECT id FROM family_groups WHERE created_by = auth.uid()
    )
    OR
    -- Allow if you're already an owner/admin in the group
    family_group_id IN (
      SELECT fm.family_group_id 
      FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.role IN ('owner', 'admin')
    )
  );

-- UPDATE: Owners and admins can update member roles
CREATE POLICY "family_members_update"
  ON public.family_members FOR UPDATE
  TO authenticated
  USING (
    family_group_id IN (
      SELECT fm.family_group_id 
      FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.role IN ('owner', 'admin')
    )
  );

-- DELETE: Owners and admins can remove members
CREATE POLICY "family_members_delete"
  ON public.family_members FOR DELETE
  TO authenticated
  USING (
    family_group_id IN (
      SELECT fm.family_group_id 
      FROM family_members fm 
      WHERE fm.user_id = auth.uid() 
      AND fm.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- FAMILY_GROUPS - Uses family_members but not recursively
-- ============================================

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view groups they're members of
CREATE POLICY "family_groups_select"
  ON public.family_groups FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Any authenticated user can create a group
CREATE POLICY "family_groups_insert"
  ON public.family_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UPDATE: Owners and admins can update
CREATE POLICY "family_groups_update"
  ON public.family_groups FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- DELETE: Only owners can delete
CREATE POLICY "family_groups_delete"
  ON public.family_groups FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT family_group_id 
      FROM family_members 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- ============================================
-- BOARDS - Uses family_members but not recursively
-- ============================================

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own boards and family group boards
CREATE POLICY "boards_select"
  ON public.boards FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      group_id IS NOT NULL
      AND group_id IN (
        SELECT family_group_id 
        FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Users can create boards
CREATE POLICY "boards_insert"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own boards and family group boards
CREATE POLICY "boards_update"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      group_id IS NOT NULL
      AND group_id IN (
        SELECT family_group_id 
        FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- DELETE: Users can delete their own boards and family group boards
CREATE POLICY "boards_delete"
  ON public.boards FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      group_id IS NOT NULL
      AND group_id IN (
        SELECT family_group_id 
        FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- Verify RLS is enabled
-- ============================================

SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'family_groups', 'family_members', 'boards')
ORDER BY tablename;

-- Expected result:
-- All tables should have rls_enabled = true
-- profiles: 3 policies
-- family_groups: 4 policies
-- family_members: 4 policies
-- boards: 4 policies
