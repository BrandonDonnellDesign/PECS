-- Fix infinite recursion in family_members RLS policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.family_members;

-- Create a better policy that doesn't cause recursion
-- Allow insert if:
-- 1. User is the creator of the family group (for initial owner insert), OR
-- 2. User is already an owner/admin in that group
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
    -- Allow if user is already an owner/admin (for subsequent adds)
    EXISTS (
      SELECT 1 FROM public.family_members existing
      WHERE existing.family_group_id = family_members.family_group_id
      AND existing.user_id = auth.uid()
      AND existing.role IN ('owner', 'admin')
    )
  );

-- Also simplify the view policy to avoid recursion
DROP POLICY IF EXISTS "Users can view members of their family groups" ON public.family_members;

CREATE POLICY "Users can view members of their family groups"
  ON public.family_members FOR SELECT
  USING (
    -- Can view if you're a member of the same group
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_group_id = family_members.family_group_id
      AND fm.user_id = auth.uid()
    )
  );
