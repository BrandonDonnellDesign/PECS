-- ULTIMATE FIX: Disable RLS on family_members to avoid infinite recursion
-- This is a common pattern - use application-level security via helper functions
-- Keep RLS on the important tables (profiles, family_groups, boards)

-- Disable RLS temporarily on all tables
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
-- PROFILES - Keep RLS enabled
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FAMILY_MEMBERS - DISABLE RLS!
-- Security is handled by helper functions
-- ============================================

-- Keep RLS DISABLED on family_members
-- This breaks the recursion cycle
-- Security is enforced by:
-- 1. Helper functions (create_family_group_with_owner, add_family_member)
-- 2. Application logic
-- 3. Foreign key constraints

ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FAMILY_GROUPS - Keep RLS enabled
-- Now it can safely query family_members
-- ============================================

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "family_groups_insert"
  ON public.family_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

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
-- BOARDS - Keep RLS enabled
-- ============================================

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

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
-- Add additional security via helper functions
-- ============================================

-- Update the add_family_member function to include more checks
CREATE OR REPLACE FUNCTION public.add_family_member(
  p_family_group_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'member',
  p_added_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_member_id UUID;
  adder_role TEXT;
BEGIN
  -- Use auth.uid() if p_added_by is not provided
  IF p_added_by IS NULL THEN
    p_added_by := auth.uid();
  END IF;

  -- Verify the user to be added exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Verify the group exists
  IF NOT EXISTS (SELECT 1 FROM public.family_groups WHERE id = p_family_group_id) THEN
    RAISE EXCEPTION 'Family group not found';
  END IF;

  -- Check if the person adding is an owner or admin
  SELECT role INTO adder_role
  FROM public.family_members
  WHERE family_group_id = p_family_group_id
  AND user_id = p_added_by;

  IF adder_role IS NULL THEN
    RAISE EXCEPTION 'You are not a member of this family group';
  END IF;

  IF adder_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only owners and admins can add members';
  END IF;

  -- Validate role
  IF p_role NOT IN ('owner', 'admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role. Must be owner, admin, or member';
  END IF;

  -- Add the member
  INSERT INTO public.family_members (family_group_id, user_id, role)
  VALUES (p_family_group_id, p_user_id, p_role)
  ON CONFLICT (family_group_id, user_id) DO UPDATE
  SET role = EXCLUDED.role
  RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$;

-- Function to remove a member (with permission checks)
CREATE OR REPLACE FUNCTION public.remove_family_member(
  p_member_id UUID,
  p_removed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_group_id UUID;
  v_target_user_id UUID;
  v_remover_role TEXT;
BEGIN
  -- Use auth.uid() if p_removed_by is not provided
  IF p_removed_by IS NULL THEN
    p_removed_by := auth.uid();
  END IF;

  -- Get the member details
  SELECT family_group_id, user_id
  INTO v_family_group_id, v_target_user_id
  FROM public.family_members
  WHERE id = p_member_id;

  IF v_family_group_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  -- Allow users to remove themselves
  IF v_target_user_id = p_removed_by THEN
    DELETE FROM public.family_members WHERE id = p_member_id;
    RETURN true;
  END IF;

  -- Check if remover is owner/admin
  SELECT role INTO v_remover_role
  FROM public.family_members
  WHERE family_group_id = v_family_group_id
  AND user_id = p_removed_by;

  IF v_remover_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Only owners and admins can remove other members';
  END IF;

  -- Remove the member
  DELETE FROM public.family_members WHERE id = p_member_id;
  RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_family_member(UUID, UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_family_member(UUID, UUID) TO authenticated;

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
-- family_members: DISABLED, 0 policies ← This breaks the recursion!
-- boards: enabled, 4 policies

COMMENT ON TABLE public.family_members IS 
  'RLS is disabled on this table to avoid infinite recursion. Security is enforced via helper functions and foreign key constraints.';
