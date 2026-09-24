import { getSupabaseClient } from '../supabase/client';
import { Budget, BudgetProgress, Category, Transaction } from '../../types/database';
import { createNotification, fetchNotifications } from './notificationService';

export async function fetchBudgets(userId: string, monthDate?: string): Promise<Budget[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  let query = supabase
    .from('budgets')
    .select(`
      *,
      category:categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('user_id', userId);

  if (monthDate) {
    // Standardize to YYYY-MM-01
    const normalizedMonth = monthDate.slice(0, 7) + '-01';
    query = query.eq('month', normalizedMonth);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }

  return (data || []) as unknown as Budget[];
}

export async function createBudget(
  _userId: string | undefined | null,
  budget: {
    category_id: string;
    amount: number;
    month: string; // YYYY-MM-01
    threshold?: number;
  }
): Promise<Budget> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before managing budgets.');
  }

  const effectiveUserId = authData.user.id;
  const normalizedMonth = budget.month.slice(0, 7) + '-01';
  const numericAmount = Math.abs(Number(budget.amount));
  const numericThreshold = budget.threshold ?? 80;

  // 1. Check if a budget record already exists for this user, category, and month
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', effectiveUserId)
    .eq('category_id', budget.category_id)
    .eq('month', normalizedMonth)
    .maybeSingle();

  if (existing?.id) {
    // Update existing budget
    const { data, error } = await supabase
      .from('budgets')
      .update({
        amount: numericAmount,
        threshold: numericThreshold,
      })
      .eq('id', existing.id)
      .eq('user_id', effectiveUserId)
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
      console.error('Error updating existing budget:', error);
      throw error;
    }
    return data as unknown as Budget;
  }

  // 2. Otherwise insert a new budget record
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: effectiveUserId,
      category_id: budget.category_id,
      amount: numericAmount,
      month: normalizedMonth,
      threshold: numericThreshold,
    })
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
    // If a unique constraint was violated due to race condition, fallback to update
    if (error.code === '23505') {
      const { data: retryData, error: retryErr } = await supabase
        .from('budgets')
        .update({
          amount: numericAmount,
          threshold: numericThreshold,
        })
        .eq('user_id', effectiveUserId)
        .eq('category_id', budget.category_id)
        .eq('month', normalizedMonth)
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

      if (!retryErr && retryData) {
        return retryData as unknown as Budget;
      }
    }
    console.error('Error creating budget:', error);
    throw error;
  }

  return data as unknown as Budget;
}

export async function updateBudget(
  id: string,
  updates: Partial<Pick<Budget, 'amount' | 'threshold' | 'category_id' | 'month'>>
): Promise<Budget> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before updating budgets.');
  }

  const payload: any = { ...updates };
  if (payload.amount !== undefined) {
    payload.amount = Math.abs(Number(payload.amount));
  }
  if (payload.month) {
    payload.month = payload.month.slice(0, 7) + '-01';
  }

  const { data, error } = await supabase
    .from('budgets')
    .update(payload)
    .eq('id', id)
    .eq('user_id', authData.user.id)
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
    console.error('Error updating budget:', error);
    throw error;
  }

  return data as unknown as Budget;
}

export async function deleteBudget(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    throw new Error('Please log in before deleting budgets.');
  }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', authData.user.id);

  if (error) throw error;
}

/**
 * Calculates budget progress based on actual transactions in that month
 */
export function calculateBudgetProgressList(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  targetMonthStr?: string // e.g. "2026-09"
): BudgetProgress[] {
  const currentMonthPrefix = targetMonthStr || new Date().toISOString().slice(0, 7);

  return budgets.map((b) => {
    const category =
      b.category ||
      categories.find((c) => c.id === b.category_id) || {
        id: b.category_id,
        user_id: b.user_id,
        name: 'Uncategorized',
        icon: 'HelpCircle',
        color: '#64748b',
        created_at: '',
      };

    // Filter transactions for this category and month
    const matchingExpenses = transactions.filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.category_id === b.category_id &&
        tx.date.startsWith(currentMonthPrefix)
    );

    const spent = matchingExpenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const budgetAmount = Number(b.amount) || 1;
    const remaining = Math.max(0, budgetAmount - spent);
    const percentage = Math.round((spent / budgetAmount) * 100);
    const threshold = b.threshold || 80;

    return {
      budget: b,
      category,
      spent,
      remaining,
      percentage,
      isApproaching: percentage >= threshold && percentage < 100,
      isExceeded: percentage >= 100,
    };
  });
}

/**
 * Checks budget thresholds and creates notifications when crossed (preventing duplicates within current day)
 */
export async function checkAndDispatchBudgetAlerts(
  userId: string,
  progressList: BudgetProgress[]
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const recentNotifications = await fetchNotifications(userId);
    const todayStr = new Date().toISOString().slice(0, 10);

    for (const item of progressList) {
      const catName = item.category.name;

      if (item.isExceeded) {
        const title = `Budget Exceeded: ${catName}`;
        const hasRecentNotice = recentNotifications.some(
          (n) => n.title === title && n.created_at.startsWith(todayStr)
        );

        if (!hasRecentNotice) {
          await createNotification(userId, {
            title,
            message: `Your ${catName} budget of ₹${Number(item.budget.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been exceeded (spent ₹${item.spent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`,
            type: 'Budget Alert',
          });
        }
      } else if (item.isApproaching) {
        const title = `Budget Alert: ${catName}`;
        const hasRecentNotice = recentNotifications.some(
          (n) => n.title === title && n.created_at.startsWith(todayStr)
        );

        if (!hasRecentNotice) {
          await createNotification(userId, {
            title,
            message: `You're approaching your ${catName} budget limit (${item.percentage}% used).`,
            type: 'Budget Alert',
          });
        }
      }
    }
  } catch (err) {
    console.error('Error in checkAndDispatchBudgetAlerts:', err);
  }
}
