-- Ensure all existing auth users have profiles
-- Run this after applying the family groups migration

-- Insert profiles for any users that don't have them yet
INSERT INTO public.profiles (id, email, display_name)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    split_part(au.email, '@', 1)
  ) as display_name
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Verify profiles were created
SELECT 
  COUNT(*) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles
FROM auth.users;
