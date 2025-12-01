-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create family_groups table
create table if not exists public.family_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create family_members table (junction table)
create table if not exists public.family_members (
  id uuid default gen_random_uuid() primary key,
  family_group_id uuid references public.family_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member')) default 'member' not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(family_group_id, user_id)
);

-- Update boards table to add family_group_id if group_id doesn't reference family_groups
-- First, check if group_id column exists and rename it
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'boards' 
    and column_name = 'group_id'
  ) then
    -- Rename group_id to family_group_id
    alter table public.boards rename column group_id to family_group_id;
    
    -- Add foreign key constraint if it doesn't exist
    if not exists (
      select 1 from information_schema.table_constraints 
      where constraint_name = 'boards_family_group_id_fkey'
    ) then
      alter table public.boards 
      add constraint boards_family_group_id_fkey 
      foreign key (family_group_id) 
      references public.family_groups(id) 
      on delete set null;
    end if;
  else
    -- Add family_group_id column if it doesn't exist
    if not exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'boards' 
      and column_name = 'family_group_id'
    ) then
      alter table public.boards add column family_group_id uuid references public.family_groups(id) on delete set null;
    end if;
  end if;
end $$;

-- Create indexes
create index if not exists boards_user_id_idx on public.boards(user_id);
create index if not exists boards_family_group_id_idx on public.boards(family_group_id);
create index if not exists family_members_user_id_idx on public.family_members(user_id);
create index if not exists family_members_family_group_id_idx on public.family_members(family_group_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.family_groups enable row level security;
alter table public.family_members enable row level security;
alter table public.boards enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can view family groups they belong to" on public.family_groups;
drop policy if exists "Users can create family groups" on public.family_groups;
drop policy if exists "Owners and admins can update family groups" on public.family_groups;
drop policy if exists "Owners can delete family groups" on public.family_groups;
drop policy if exists "Users can view members of their family groups" on public.family_members;
drop policy if exists "Owners and admins can add members" on public.family_members;
drop policy if exists "Owners and admins can update members" on public.family_members;
drop policy if exists "Owners and admins can remove members" on public.family_members;
drop policy if exists "Users can view their own boards" on public.boards;
drop policy if exists "Family members can view family boards" on public.boards;
drop policy if exists "Users can create their own boards" on public.boards;
drop policy if exists "Users can update their own boards" on public.boards;
drop policy if exists "Family members can update family boards" on public.boards;
drop policy if exists "Users can delete their own boards" on public.boards;
drop policy if exists "Family members can delete family boards" on public.boards;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Family groups policies
create policy "Users can view family groups they belong to"
  on public.family_groups for select
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_group_id = family_groups.id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can create family groups"
  on public.family_groups for insert
  with check (auth.uid() = created_by);

create policy "Owners and admins can update family groups"
  on public.family_groups for update
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_group_id = family_groups.id
      and family_members.user_id = auth.uid()
      and family_members.role in ('owner', 'admin')
    )
  );

create policy "Owners can delete family groups"
  on public.family_groups for delete
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_group_id = family_groups.id
      and family_members.user_id = auth.uid()
      and family_members.role = 'owner'
    )
  );

-- Family members policies
create policy "Users can view members of their family groups"
  on public.family_members for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.family_group_id = family_members.family_group_id
      and fm.user_id = auth.uid()
    )
  );

create policy "Owners and admins can add members"
  on public.family_members for insert
  with check (
    exists (
      select 1 from public.family_members
      where family_members.family_group_id = family_members.family_group_id
      and family_members.user_id = auth.uid()
      and family_members.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can update members"
  on public.family_members for update
  using (
    exists (
      select 1 from public.family_members fm
      where fm.family_group_id = family_members.family_group_id
      and fm.user_id = auth.uid()
      and fm.role in ('owner', 'admin')
    )
  );

create policy "Owners and admins can remove members"
  on public.family_members for delete
  using (
    exists (
      select 1 from public.family_members fm
      where fm.family_group_id = family_members.family_group_id
      and fm.user_id = auth.uid()
      and fm.role in ('owner', 'admin')
    )
  );

-- Boards policies
create policy "Users can view their own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Family members can view family boards"
  on public.boards for select
  using (
    family_group_id is not null
    and exists (
      select 1 from public.family_members
      where family_members.family_group_id = boards.family_group_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can create their own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Family members can update family boards"
  on public.boards for update
  using (
    family_group_id is not null
    and exists (
      select 1 from public.family_members
      where family_members.family_group_id = boards.family_group_id
      and family_members.user_id = auth.uid()
    )
  );

create policy "Users can delete their own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

create policy "Family members can delete family boards"
  on public.boards for delete
  using (
    family_group_id is not null
    and exists (
      select 1 from public.family_members
      where family_members.family_group_id = boards.family_group_id
      and family_members.user_id = auth.uid()
    )
  );

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
drop trigger if exists handle_profiles_updated_at on public.profiles;
create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_family_groups_updated_at on public.family_groups;
create trigger handle_family_groups_updated_at before update on public.family_groups
  for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_boards_updated_at on public.boards;
create trigger handle_boards_updated_at before update on public.boards
  for each row execute procedure public.handle_updated_at();

-- Backfill profiles for existing users
insert into public.profiles (id, email, display_name)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;
