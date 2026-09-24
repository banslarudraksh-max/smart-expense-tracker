import { getSupabaseClient } from '../supabase/client';
import { Category } from '../../types/database';

export const DEFAULT_CATEGORY_TEMPLATES = [
  { name: 'Food', icon: 'Utensils', color: '#f97316' },
  { name: 'Transport', icon: 'Car', color: '#3b82f6' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
  { name: 'Bills', icon: 'Receipt', color: '#eab308' },
  { name: 'Entertainment', icon: 'Film', color: '#8b5cf6' },
  { name: 'Education', icon: 'GraduationCap', color: '#10b981' },
  { name: 'Health', icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Other', icon: 'HelpCircle', color: '#64748b' },
];

export async function fetchCategories(userId: string): Promise<Category[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories from Supabase:', error);
    throw error;
  }

  // If new user has 0 categories, seed default categories
  if (!data || data.length === 0) {
    return await seedDefaultCategories(userId);
  }

  return data as Category[];
}

export async function seedDefaultCategories(userId: string): Promise<Category[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const recordsToInsert = DEFAULT_CATEGORY_TEMPLATES.map((cat) => ({
    user_id: userId,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
  }));

  const { data, error } = await supabase
    .from('categories')
    .insert(recordsToInsert)
    .select();

  if (error) {
    console.error('Error seeding default categories:', error);
    return [];
  }

  return (data || []) as Category[];
}

export async function createCategory(
  _userId: string | undefined | null,
  category: { name: string; icon?: string; color?: string }
): Promise<Category> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before creating categories.');
  }

  const { data, error } = await supabase
    .from('categories')
    .insert([
      {
        user_id: authData.user.id,
        name: category.name.trim(),
        icon: category.icon || 'HelpCircle',
        color: category.color || '#3b82f6',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
): Promise<Category> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before updating categories.');
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .eq('user_id', authData.user.id)
    .select()
    .single();

  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before deleting categories.');
  }

  // Check if any transaction is using this category
  const { count, error: countErr } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('user_id', authData.user.id);

  if (countErr) throw countErr;

  if (count && count > 0) {
    throw new Error(
      `Cannot delete category because it is currently assigned to ${count} transaction(s). Please reassign or delete them first.`
    );
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', authData.user.id);

  if (error) throw error;
}
