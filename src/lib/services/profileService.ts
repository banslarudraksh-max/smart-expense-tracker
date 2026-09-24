import { getSupabaseClient } from '../supabase/client';
import { Profile } from '../../types/database';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile | null;
}

export async function ensureProfile(user: { id: string; email?: string; user_metadata?: any }): Promise<Profile> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const fullName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User');
  const avatarUrl = user.user_metadata?.avatar_url || '';

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: fullName,
      email: user.email || '',
      avatar_url: avatarUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error ensuring profile exists:', error);
    throw error;
  }

  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
): Promise<Profile> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
