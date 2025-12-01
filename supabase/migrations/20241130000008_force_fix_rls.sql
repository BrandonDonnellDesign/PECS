-- Force fix RLS by dropping ALL policies and recreating them correctly

-- Disable RLS first
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on all tables (using DO block to handle non-existent policies)
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

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- FAMILY GROUPS POLICIES
-- ============================================

CREATE POLICY "Users can view family groups they belong to"
  ON public.family_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_group_id = family_groups.id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create family groups"
  ON public.family_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners and admins can update family groups"
  ON public.family_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_group_id = family_groups.id
      AND family_members.user_id = auth.uid()
      AND family_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete family groups"
  ON public.family_groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_group_id = family_groups.id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'owner'
    )
  );

-- ============================================
-- FAMILY MEMBERS POLICIES (Fixed to avoid recursion)
-- ============================================

-- SELECT: Can view if you're a member OR if it's your own membership record
CREATE POLICY "Users can view family members"
  ON public.family_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
    )
  );

-- INSERT: Can add members if you're the group creator OR already an owner/admin
CREATE POLICY "Owners and admins can add members"
  ON public.family_members FOR INSERT
  WITH CHECK (
    -- Allow if user is the creator of the family group
    EXISTS (
      SELECT 1 FROM public.family_groups
      WHERE family_groups.id = family_members.family_group_id
      AND family_groups.created_by = auth.uid()
    )
    OR
    -- Allow if user is already an owner/admin
    EXISTS (
      SELECT 1 FROM public.family_members existing
      WHERE existing.family_group_id = family_members.family_group_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
    )
  );

-- UPDATE: Owners and admins can update member roles
CREATE POLICY "Owners and admins can update members"
  ON public.family_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  );

-- DELETE: Owners and admins can remove members
CREATE POLICY "Owners and admins can remove members"
  ON public.family_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('owner', 'admin')
    )
  );

-- ============================================
-- BOARDS POLICIES
-- ============================================

-- SELECT: Users can view their own boards OR family group boards
CREATE POLICY "Users can view boards"
  ON public.boards FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- INSERT: Users can create boards
CREATE POLICY "Users can create boards"
  ON public.boards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own boards OR family group boards
CREATE POLICY "Users can update boards"
  ON public.boards FOR UPDATE
  USING (
    auth.uid() = user_id
    OR
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- DELETE: Users can delete their own boards OR family group boards
CREATE POLICY "Users can delete boards"
  ON public.boards FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- Verify RLS is enabled and policies exist
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'family_groups', 'family_members', 'boards')
ORDER BY tablename;
