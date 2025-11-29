
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { PecsBoard } from '../types';

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

const LOCAL_STORAGE_KEY = 'gemini_pecs_boards';

export const authService = {
  getUser: async (): Promise<User | null> => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    return supabase.auth.signInWithPassword({ email, password });
  },

  signUp: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase not configured");
    return supabase.auth.signUp({ email, password });
  },

  signOut: async () => {
    if (!supabase) return;
    return supabase.auth.signOut();
  }
};

export const storageService = {
  getBoards: async (userId?: string): Promise<PecsBoard[]> => {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .eq('user_id', userId) // Assuming RLS policies or user_id column
        .order('updatedAt', { ascending: false });
      
      // Fallback if table doesn't exist or error, try local
      if (!error && data) return data as unknown as PecsBoard[];
    }
    
    // Local Fallback
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  },

  saveBoard: async (board: PecsBoard, userId?: string): Promise<void> => {
    if (supabase && userId) {
      // Create a copy for DB that matches potential schema columns
      const dbBoard = {
        ...board,
        user_id: userId // Ensure ownership
      };
      
      const { error } = await supabase.from('boards').upsert(dbBoard);
      if (error) console.error("Supabase save error:", error);
    }
    
    // Always save local as backup/cache
    const boards = await storageService.getBoards(); // Note: this gets mixed boards if not carefully handled, but fine for fallback
    const existingIndex = boards.findIndex(b => b.id === board.id);
    if (existingIndex >= 0) {
      boards[existingIndex] = board;
    } else {
      boards.push(board);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(boards));
  },

  deleteBoard: async (id: string): Promise<void> => {
    if (supabase) {
      await supabase.from('boards').delete().match({ id });
    }
    const boards = await storageService.getBoards();
    const filtered = boards.filter(b => b.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
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
