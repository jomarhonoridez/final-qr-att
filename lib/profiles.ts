import { supabase } from './supabase';

export type Role = 'student' | 'teacher';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url?: string | null; 
  // ADDED: Tracks whether a teacher has approved this student's account
  is_verified?: boolean; 
  created_at?: string;
  updated_at?: string;
}

/* ---------------- FETCH SINGLE PROFILE ---------------- */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile record:', error);
    throw error;
  }
  return data as Profile | null;
}

/* ---------------- UPDATE PROFILE DATA ---------------- */
export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<{ data: Profile | null; error: any }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error executing profile modification matrix:', error);
  }
  return { data: data as Profile | null, error };
}
