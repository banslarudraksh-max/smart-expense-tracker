import { getSupabaseClient } from '../supabase/client';
import { Transaction, TransactionType } from '../../types/database';

export interface TransactionFilterOptions {
  type?: TransactionType | 'all';
  categoryId?: string | 'all';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function fetchTransactions(
  userId: string,
  options?: TransactionFilterOptions
): Promise<Transaction[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  // Ensure current session/user is authenticated
  const { data: authData } = await supabase.auth.getUser();
  const effectiveUserId = authData?.user?.id || userId;

  if (!effectiveUserId) {
    return [];
  }

  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('user_id', effectiveUserId);

  if (options?.type && options.type !== 'all') {
    query = query.eq('type', options.type);
  }

  if (options?.categoryId && options.categoryId !== 'all') {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.startDate) {
    query = query.gte('date', options.startDate);
  }

  if (options?.endDate) {
    query = query.lte('date', options.endDate);
  }

  // Sorting
  if (options?.sortBy === 'date_asc') {
    query = query.order('date', { ascending: true });
  } else if (options?.sortBy === 'amount_desc') {
    query = query.order('amount', { ascending: false });
  } else if (options?.sortBy === 'amount_asc') {
    query = query.order('amount', { ascending: true });
  } else {
    // Default to date_desc then created_at desc
    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching transactions from Supabase:', error);
    throw error;
  }

  let result = (data || []) as unknown as Transaction[];

  // Client-side text search if provided
  if (options?.searchQuery && options.searchQuery.trim() !== '') {
    const q = options.searchQuery.toLowerCase().trim();
    result = result.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        (tx.notes && tx.notes.toLowerCase().includes(q)) ||
        (tx.category && tx.category.name.toLowerCase().includes(q))
    );
  }

  return result;
}

/**
 * Inserts a new transaction into Supabase PostgreSQL.
 * Strictly verifies authenticated user from session/user API to satisfy RLS (auth.uid() = user_id).
 */
export async function createTransaction(
  _userId: string | undefined | null,
  tx: {
    type: TransactionType;
    amount: number;
    description: string;
    category_id: string | null;
    date: string;
    notes?: string | null;
  }
): Promise<Transaction> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please verify your Supabase configuration.');
  }

  // 1 & 2. Verify that a logged-in Supabase user exists before inserting
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    throw new Error('Please log in before adding a transaction.');
  }

  const authenticatedUser = authData.user;

  // 3, 4, 5. Ensure user_id is never null/undefined and strictly matches authenticatedUser.id (auth.uid())
  const effectiveUserId = authenticatedUser.id;
  if (!effectiveUserId) {
    throw new Error('Please log in before adding a transaction.');
  }

  // Sanitize category_id (must be valid UUID or null to prevent foreign key errors)
  let cleanCategoryId: string | null = tx.category_id || null;
  if (cleanCategoryId && !UUID_REGEX.test(cleanCategoryId)) {
    cleanCategoryId = null;
  }

  const payload = {
    user_id: effectiveUserId, // Strictly authenticatedUser.id matching auth.uid()
    type: tx.type,
    amount: Math.abs(Number(tx.amount)),
    description: tx.description.trim(),
    category_id: cleanCategoryId,
    date: tx.date,
    notes: tx.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('transactions')
    .insert([payload])
    .select(`
      *,
      category:categories (
        id,
        name,
        icon,
        color
      )
    `)
    .single();

  if (error) {
    console.error('Error creating transaction in Supabase:', error);
    if (error.message.includes('row-level security') || error.code === '42501') {
      throw new Error('Security policy violation: You are not authorized to insert transactions for this user session.');
    }
    throw error;
  }

  return data as unknown as Transaction;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'category'>>
): Promise<Transaction> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before editing a transaction.');
  }

  const payload: any = { ...updates };
  if (payload.amount !== undefined) {
    payload.amount = Math.abs(Number(payload.amount));
  }

  if (payload.category_id && !UUID_REGEX.test(payload.category_id)) {
    payload.category_id = null;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .eq('user_id', authData.user.id) // Enforce user isolation
    .select(`
      *,
      category:categories (
        id,
        name,
        icon,
        color
      )
    `)
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }

  return data as unknown as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before deleting a transaction.');
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', authData.user.id); // Enforce user isolation

  if (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}
