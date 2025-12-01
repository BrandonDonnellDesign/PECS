-- Fix boards RLS policies to work properly

-- First, let's see what policies exist
-- Run this to check: SELECT * FROM pg_policies WHERE tablename = 'boards';

-- Drop all existing board policies
DROP POLICY IF EXISTS "Users can view their own boards" ON public.boards;
DROP POLICY IF EXISTS "Family members can view family boards" ON public.boards;
DROP POLICY IF EXISTS "Users can create their own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update their own boards" ON public.boards;
DROP POLICY IF EXISTS "Family members can update family boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete their own boards" ON public.boards;
DROP POLICY IF EXISTS "Family members can delete family boards" ON public.boards;

-- Create simpler, working policies

-- SELECT: Users can view their own boards OR boards in their family groups
CREATE POLICY "Users can view boards"
  ON public.boards FOR SELECT
  USING (
    -- Own boards
    auth.uid() = user_id
    OR
    -- Family group boards (if group_id is set and user is a member)
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

-- UPDATE: Users can update their own boards OR family group boards they're members of
CREATE POLICY "Users can update boards"
  ON public.boards FOR UPDATE
  USING (
    -- Own boards
    auth.uid() = user_id
    OR
    -- Family group boards
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );

-- DELETE: Users can delete their own boards OR family group boards they're members of
CREATE POLICY "Users can delete boards"
  ON public.boards FOR DELETE
  USING (
    -- Own boards
    auth.uid() = user_id
    OR
    -- Family group boards
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.family_members
        WHERE family_members.family_group_id = boards.group_id
        AND family_members.user_id = auth.uid()
      )
    )
  );
