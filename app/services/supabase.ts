
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { PecsBoard, FamilyGroup, FamilyMember, FamilyGroupWithMembers, Profile } from '../types';

// NOTE: This setup assumes the user provides these environment variables.
// If they are missing, the app falls back to LocalStorage to ensure functionality.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.warn("Failed to initialize Supabase client", e);
  }
}

const LOCAL_STORAGE_KEY = 'pecs_creator_boards';

export const authService = {
  getUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    
    // Ensure profile exists
    if (user) {
      await authService.ensureProfile(user.id);
    }
    
    return user;
  },

  ensureProfile: async (userId: string): Promise<void> => {
    if (!supabase) return;
    
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user.email,
              display_name: userData.user.user_metadata?.display_name || userData.user.email?.split('@')[0]
            });
        }
      }
    } catch (error) {
      console.error("Error ensuring profile:", error);
    }
  },

  getProfile: async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  updateProfile: async (userId: string, displayName: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase not configured");
    await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId);
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    const result = await supabase.auth.signInWithPassword({ email, password });
    
    // Ensure profile exists after sign in
    if (result.data.user) {
      await authService.ensureProfile(result.data.user.id);
    }
    
    return result;
  },

  signUp: async (email: string, password: string, displayName?: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { display_name: displayName }
      }
    });
  },

  signOut: async () => {
    if (!supabase) return;
    return supabase.auth.signOut();
  }
};

export const storageService = {
  getBoards: async (userId?: string, includeFamily: boolean = true): Promise<PecsBoard[]> => {
    if (supabase && userId) {
      try {
        // Get user's own boards
        const { data: ownBoards, error: ownError } = await supabase
          .from('boards')
          .select('*')
          .eq('user_id', userId)
          .order('updatedAt', { ascending: false });

        if (ownError) {
          console.error("Supabase getBoards error - Message:", ownError.message);
          console.error("Supabase getBoards error - Code:", ownError.code);
          console.error("Supabase getBoards error - Full:", JSON.stringify(ownError));
          // Fall through to local storage
        }

        let allBoards = ownBoards || [];

        // If including family boards, get those too
        if (includeFamily) {
          try {
            // Get family groups the user belongs to
            const { data: memberGroups } = await supabase
              .from('family_members')
              .select('family_group_id')
              .eq('user_id', userId);

            if (memberGroups && memberGroups.length > 0) {
              const groupIds = memberGroups.map(m => m.family_group_id);
              
              // Get boards for those family groups
              const { data: familyBoards } = await supabase
                .from('boards')
                .select('*')
                .in('group_id', groupIds)
                .order('updatedAt', { ascending: false });

              if (familyBoards && familyBoards.length > 0) {
                // Merge family boards with own boards (avoid duplicates)
                const ownBoardIds = new Set(allBoards.map(b => b.id));
                const uniqueFamilyBoards = familyBoards.filter(b => !ownBoardIds.has(b.id));
                allBoards = [...allBoards, ...uniqueFamilyBoards];
              }
            }
          } catch (familyError) {
            console.error("Error loading family boards:", familyError);
            // Continue with just own boards
          }
        }

        if (allBoards.length > 0) {
          const boards = allBoards.map(board => ({
            id: board.id,
            userId: board.user_id,
            familyGroupId: board.group_id,
            title: board.title,
            gridColumns: board.gridColumns || 4,
            gridGap: board.gridGap || 16,
            backgroundColor: board.backgroundColor || '#ffffff',
            cards: board.cards || [],
            updatedAt: board.updatedAt || Date.now()
          }));
          
          // Also sync to local storage as cache
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(boards));
          return boards;
        }
      } catch (err) {
        console.error("Error fetching boards:", err);
      }
    }

    // Local Fallback
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      return local ? JSON.parse(local) : [];
    }
    return [];
  },

  saveBoard: async (board: PecsBoard, userId?: string): Promise<void> => {
    // Always save local first as backup/cache
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      const boards = local ? JSON.parse(local) : [];
      const existingIndex = boards.findIndex((b: PecsBoard) => b.id === board.id);
      if (existingIndex >= 0) {
        boards[existingIndex] = board;
      } else {
        boards.push(board);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(boards));
    }

    // Then try to save to Supabase
    if (supabase && userId) {
      try {
        const dbBoard = {
          id: board.id,
          user_id: userId,
          group_id: board.familyGroupId || null,
          title: board.title,
          gridColumns: board.gridColumns,
          gridGap: board.gridGap,
          backgroundColor: board.backgroundColor,
          cards: board.cards,
          updatedAt: Date.now()
        };

        const { error } = await supabase.from('boards').upsert(dbBoard);
        if (error) {
          console.error("Supabase save error:", error);
        }
      } catch (err) {
        console.error("Error saving board to Supabase:", err);
      }
    }
  },

  deleteBoard: async (id: string): Promise<void> => {
    // Delete from local storage first
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      const boards = local ? JSON.parse(local) : [];
      const filtered = boards.filter((b: PecsBoard) => b.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }

    // Then try to delete from Supabase
    if (supabase) {
      try {
        const { error } = await supabase.from('boards').delete().match({ id });
        if (error) {
          console.error("Supabase delete error:", error);
        }
      } catch (err) {
        console.error("Error deleting board from Supabase:", err);
      }
    }
  },

  uploadImage: async (file: File, userId?: string): Promise<string> => {
    if (supabase && userId) {
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('pecs-images').upload(fileName, file);
      if (data && !error) {
        const { data: { publicUrl } } = supabase.storage.from('pecs-images').getPublicUrl(fileName);
        return publicUrl;
      }
    }
    // Local fallback: convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};

export const familyService = {
  createFamilyGroup: async (name: string, userId: string): Promise<FamilyGroup | null> => {
    if (!supabase) {
      throw new Error("Supabase not configured");
    }
    
    try {
      // First, check if tables exist
      const { data: tablesCheck, error: tablesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (tablesError) {
        console.error("Tables don't exist or RLS is blocking:", tablesError);
        alert("Database tables not found. Please apply the migration first. See CHECK_DATABASE.sql");
        return null;
      }

      // Check if the user has a profile
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile && profileCheckError?.code !== 'PGRST116') {
        console.error("Error checking profile:", profileCheckError);
      }

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: newProfile, error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userData.user.email,
              display_name: userData.user.user_metadata?.display_name || userData.user.email?.split('@')[0]
            })
            .select()
            .single();

          if (createProfileError) {
            console.error("Error creating profile:", createProfileError);
            alert(`Failed to create profile: ${createProfileError.message}. Check console for details.`);
            return null;
          }
        }
      }

      // Create the family group
      const { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .insert({ name, created_by: userId })
        .select()
        .single();

      if (groupError) {
        console.error("Error creating family group:", groupError);
        console.error("Error JSON:", JSON.stringify(groupError, null, 2));
        alert(`Failed to create family group: ${groupError.message}. Check console for details.`);
        return null;
      }

      if (!groupData) {
        console.error("No data returned from family group creation");
        return null;
      }

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_group_id: groupData.id,
          user_id: userId,
          role: 'owner'
        });

      if (memberError) {
        console.error("Error adding creator as owner:", memberError);
        // Try to clean up the group
        await supabase.from('family_groups').delete().eq('id', groupData.id);
        alert(`Failed to add you as owner: ${memberError.message}`);
        return null;
      }

      return {
        id: groupData.id,
        name: groupData.name,
        createdBy: groupData.created_by,
        createdAt: groupData.created_at,
        updatedAt: groupData.updated_at
      };
    } catch (error) {
      console.error("Exception creating family group:", error);
      alert(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  },

  getFamilyGroups: async (userId: string): Promise<FamilyGroupWithMembers[]> => {
    if (!supabase) return [];

    try {
      // First get the groups the user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('family_members')
        .select('family_group_id')
        .eq('user_id', userId);

      if (memberError || !memberData || memberData.length === 0) {
        return [];
      }

      const groupIds = memberData.map(m => m.family_group_id);

      // Get the groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('family_groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError || !groupsData) {
        console.error("Error fetching groups:", groupsError);
        return [];
      }

      // Get ALL members for these groups (not filtered by user_id)
      const { data: allMembers, error: membersError } = await supabase
        .from('family_members')
        .select('id, family_group_id, user_id, role, joined_at')
        .in('family_group_id', groupIds);

      if (membersError) {
        console.error("Error fetching members:", membersError);
      }

      // Get profiles for all members
      const memberUserIds = (allMembers || []).map((m: any) => m.user_id);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', memberUserIds);

      // Create a map of profiles
      const profileMap = new Map();
      (profiles || []).forEach((p: any) => {
        profileMap.set(p.id, p);
      });

      // Combine the data
      const result = groupsData.map(group => ({
        id: group.id,
        name: group.name,
        createdBy: group.created_by,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
        members: (allMembers || [])
          .filter((m: any) => m.family_group_id === group.id)
          .map((member: any) => {
            const profile = profileMap.get(member.user_id);
            return {
              id: member.id,
              familyGroupId: member.family_group_id,
              userId: member.user_id,
              role: member.role,
              joinedAt: member.joined_at,
              profile: profile ? {
                id: profile.id,
                email: profile.email,
                displayName: profile.display_name,
                createdAt: '',
                updatedAt: ''
              } : undefined
            };
          })
      }));

      return result;
    } catch (error) {
      console.error("Exception in getFamilyGroups:", error);
      return [];
    }
  },

  getFamilyGroupMembers: async (familyGroupId: string): Promise<FamilyMember[]> => {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('family_members')
      .select(`
        *,
        profiles (
          id,
          email,
          display_name,
          created_at,
          updated_at
        )
      `)
      .eq('family_group_id', familyGroupId);

    if (error || !data) return [];

    return data.map(member => ({
      id: member.id,
      familyGroupId: member.family_group_id,
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
      profile: member.profiles ? {
        id: member.profiles.id,
        email: member.profiles.email,
        displayName: member.profiles.display_name,
        createdAt: member.profiles.created_at,
        updatedAt: member.profiles.updated_at
      } : undefined
    }));
  },

  addFamilyMember: async (familyGroupId: string, email: string, role: 'admin' | 'member' = 'member'): Promise<boolean> => {
    if (!supabase) throw new Error("Supabase not configured");

    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // Use RPC or direct auth.users query to find user (bypassing RLS)
      // Since we can't query auth.users directly, we'll try to add them and let the database handle it
      
      // First, try to find the user in profiles without RLS restrictions
      // We'll use the service to create a temporary admin client
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        alert('You must be logged in to add members.');
        return false;
      }

      // Create a function call that uses security definer to bypass RLS
      const { data: userData, error: userError } = await supabase.rpc('get_user_id_by_email', {
        user_email: cleanEmail
      });

      // If RPC doesn't exist, fall back to direct insert attempt
      if (userError && userError.code === '42883') {
        // Function doesn't exist, try direct approach
        // Get all profiles to find the user (this works if RLS is disabled on profiles)
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, email');
        
        const targetProfile = allProfiles?.find(p => p.email?.toLowerCase() === cleanEmail);
        
        if (!targetProfile) {
          alert(`User with email "${email}" not found. They need to create an account first.`);
          return false;
        }

        // Check if already a member
        const { data: existingMember } = await supabase
          .from('family_members')
          .select('id')
          .eq('family_group_id', familyGroupId)
          .eq('user_id', targetProfile.id)
          .single();

        if (existingMember) {
          alert(`${email} is already a member of this group.`);
          return false;
        }

        // Add as member
        const { error } = await supabase
          .from('family_members')
          .insert({
            family_group_id: familyGroupId,
            user_id: targetProfile.id,
            role
          });

        if (error) {
          console.error("Error adding family member:", error);
          alert(`Failed to add member: ${error.message}`);
          return false;
        }

        return true;
      }

      if (userError || !userData) {
        console.error("User not found:", cleanEmail, userError);
        alert(`User with email "${email}" not found. They need to create an account first.`);
        return false;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_group_id', familyGroupId)
        .eq('user_id', userData)
        .single();

      if (existingMember) {
        alert(`${email} is already a member of this group.`);
        return false;
      }

      // Add as member
      const { error } = await supabase
        .from('family_members')
        .insert({
          family_group_id: familyGroupId,
          user_id: userData,
          role
        });

      if (error) {
        console.error("Error adding family member:", error);
        alert(`Failed to add member: ${error.message}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception adding family member:", error);
      alert('An unexpected error occurred. Check console for details.');
      return false;
    }
  },

  removeFamilyMember: async (memberId: string): Promise<boolean> => {
    if (!supabase) throw new Error("Supabase not configured");

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error("Error removing family member:", error);
      return false;
    }

    return true;
  },

  updateMemberRole: async (memberId: string, role: 'admin' | 'member'): Promise<boolean> => {
    if (!supabase) throw new Error("Supabase not configured");

    const { error } = await supabase
      .from('family_members')
      .update({ role })
      .eq('id', memberId);

    if (error) {
      console.error("Error updating member role:", error);
      return false;
    }

    return true;
  },

  deleteFamilyGroup: async (familyGroupId: string): Promise<boolean> => {
    if (!supabase) throw new Error("Supabase not configured");

    const { error } = await supabase
      .from('family_groups')
      .delete()
      .eq('id', familyGroupId);

    if (error) {
      console.error("Error deleting family group:", error);
      return false;
    }

    return true;
  }
};
