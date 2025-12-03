-- Add invite code system for family groups

-- Create invite codes table
CREATE TABLE IF NOT EXISTS public.family_group_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_group_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member' NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  use_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS family_group_invites_code_idx ON public.family_group_invites(invite_code);
CREATE INDEX IF NOT EXISTS family_group_invites_group_idx ON public.family_group_invites(family_group_id);
CREATE INDEX IF NOT EXISTS family_group_invites_expires_idx ON public.family_group_invites(expires_at);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-character alphanumeric code
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.family_group_invites 
      WHERE invite_code = code 
      AND expires_at > NOW()
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to join group with invite code
CREATE OR REPLACE FUNCTION join_group_with_code(
  p_invite_code TEXT,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_group_name TEXT;
  v_existing_member UUID;
BEGIN
  -- Find valid invite code
  SELECT * INTO v_invite
  FROM family_group_invites
  WHERE invite_code = UPPER(p_invite_code)
    AND expires_at > NOW()
    AND (max_uses IS NULL OR use_count < max_uses)
  LIMIT 1;

  -- Check if invite exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invite code'
    );
  END IF;

  -- Get group name
  SELECT name INTO v_group_name
  FROM family_groups
  WHERE id = v_invite.family_group_id;

  -- Check if user is already a member
  SELECT id INTO v_existing_member
  FROM family_members
  WHERE family_group_id = v_invite.family_group_id
    AND user_id = p_user_id;

  IF v_existing_member IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You are already a member of this group'
    );
  END IF;

  -- Add user to group
  INSERT INTO family_members (family_group_id, user_id, role)
  VALUES (v_invite.family_group_id, p_user_id, v_invite.role);

  -- Increment use count
  UPDATE family_group_invites
  SET use_count = use_count + 1
  WHERE id = v_invite.id;

  RETURN json_build_object(
    'success', true,
    'group_name', v_group_name
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_invite_code() TO authenticated;
GRANT EXECUTE ON FUNCTION join_group_with_code(TEXT, UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.family_group_invites IS 'Shareable invite codes for joining family groups';
COMMENT ON FUNCTION generate_invite_code IS 'Generate a unique 6-character invite code';
COMMENT ON FUNCTION join_group_with_code IS 'Join a family group using an invite code';
