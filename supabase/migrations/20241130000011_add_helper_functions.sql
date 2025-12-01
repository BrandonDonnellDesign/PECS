-- Helper function to create a family group with the creator as owner
-- This avoids RLS issues when creating the initial member record

CREATE OR REPLACE FUNCTION public.create_family_group_with_owner(
  group_name TEXT,
  creator_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public
AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Verify the creator exists in profiles
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = creator_id) THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Create the family group
  INSERT INTO public.family_groups (name, created_by)
  VALUES (group_name, creator_id)
  RETURNING id INTO new_group_id;

  -- Add the creator as owner
  INSERT INTO public.family_members (family_group_id, user_id, role)
  VALUES (new_group_id, creator_id, 'owner');

  RETURN new_group_id;
END;
$$;

-- Helper function to add a member to a family group
-- This checks permissions and adds the member

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

  -- Add the member
  INSERT INTO public.family_members (family_group_id, user_id, role)
  VALUES (p_family_group_id, p_user_id, p_role)
  ON CONFLICT (family_group_id, user_id) DO UPDATE
  SET role = EXCLUDED.role
  RETURNING id INTO new_member_id;

  RETURN new_member_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_family_group_with_owner(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_family_member(UUID, UUID, TEXT, UUID) TO authenticated;

-- Comment the functions
COMMENT ON FUNCTION public.create_family_group_with_owner IS 
  'Creates a family group and automatically adds the creator as owner. Bypasses RLS for initial setup.';

COMMENT ON FUNCTION public.add_family_member IS 
  'Adds a member to a family group with permission checking. Bypasses RLS for member addition.';
