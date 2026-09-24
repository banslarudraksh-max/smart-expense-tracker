import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  Category,
  Transaction,
  Budget,
  NotificationItem,
  BudgetProgress,
  FinancialSummary,
  SmartInsight,
  TransactionType,
} from '../types/database';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
} from '../lib/services/categoryService';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  TransactionFilterOptions,
} from '../lib/services/transactionService';
import {
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  calculateBudgetProgressList,
  checkAndDispatchBudgetAlerts,
} from '../lib/services/budgetService';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../lib/services/notificationService';
import { generateSmartInsights } from '../lib/services/smartInsightsService';
import { getSupabaseClient } from '../lib/supabase/client';

interface FinanceContextType {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  notifications: NotificationItem[];
  budgetProgressList: BudgetProgress[];
  financialSummary: FinancialSummary;
  smartInsights: SmartInsight[];
  unreadNotificationsCount: number;
  loading: boolean;
  filterOptions: TransactionFilterOptions;
  setFilterOptions: (options: TransactionFilterOptions) => void;
  refreshAll: () => Promise<void>;
  // CRUD handlers
  handleAddTransaction: (tx: {
    type: TransactionType;
    amount: number;
    description: string;
    category_id: string | null;
    date: string;
    notes?: string | null;
  }) => Promise<Transaction>;
  handleEditTransaction: (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'category'>>
  ) => Promise<Transaction>;
  handleDeleteTransaction: (id: string) => Promise<void>;
  handleAddBudget: (b: {
    category_id: string;
    amount: number;
    month: string;
    threshold?: number;
  }) => Promise<Budget>;
  handleEditBudget: (
    id: string,
    updates: Partial<Pick<Budget, 'amount' | 'threshold' | 'category_id' | 'month'>>
  ) => Promise<Budget>;
  handleDeleteBudget: (id: string) => Promise<void>;
  handleAddCategory: (cat: { name: string; icon?: string; color?: string }) => Promise<Category>;
  handleEditCategory: (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ) => Promise<Category>;
  handleDeleteCategory: (id: string) => Promise<void>;
  handleMarkNotificationRead: (id: string) => Promise<void>;
  handleMarkAllNotificationsRead: () => Promise<void>;
  handleDeleteNotification: (id: string) => Promise<void>;
  clearAllUserData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode, supabaseConfigured } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState<TransactionFilterOptions>({
    type: 'all',
    categoryId: 'all',
    sortBy: 'date_desc',
  });

  // Fetch all financial data strictly from Supabase PostgreSQL
  const refreshAll = useCallback(async () => {
    if (!user || !supabaseConfigured) {
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch categories (or auto-seed defaults if brand new account)
      let fetchedCats = await fetchCategories(user.id);
      if (fetchedCats.length === 0) {
        fetchedCats = await seedDefaultCategories(user.id);
      }
      setCategories(fetchedCats);

      // 2. Fetch user transactions, budgets, and notifications
      const [fetchedTxs, fetchedBudgets, fetchedNotifs] = await Promise.all([
        fetchTransactions(user.id, filterOptions),
        fetchBudgets(user.id),
        fetchNotifications(user.id),
      ]);

      setTransactions(fetchedTxs);
      setBudgets(fetchedBudgets);
      setNotifications(fetchedNotifs);
    } catch (err) {
      console.error('Error querying Supabase database:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabaseConfigured, filterOptions]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Real-time Supabase postgres_changes subscriptions
  useEffect(() => {
    if (!user || !supabaseConfigured) return;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Listen to real-time database modifications on user's own rows
    const channel = supabase
      .channel(`user-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const txs = await fetchTransactions(user.id, filterOptions);
          setTransactions(txs);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const b = await fetchBudgets(user.id);
          setBudgets(b);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const c = await fetchCategories(user.id);
          setCategories(c);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const n = await fetchNotifications(user.id);
          setNotifications(n);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabaseConfigured, filterOptions]);

  // Financial summary calculations computed strictly from actual transactions & budgets
  const financialSummary: FinancialSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpenses += amt;
      }
    }

    const availableBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round((availableBalance / totalIncome) * 100) : 0;

    const totalAllocated = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
    const totalSpent = budgets.reduce((acc, b) => {
      const catSpent = transactions
        .filter((tx) => tx.type === 'expense' && tx.category_id === b.category_id)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      return acc + catSpent;
    }, 0);

    return {
      totalIncome,
      totalExpenses,
      availableBalance,
      savingsRate,
      activeBudgetsCount: budgets.length,
      budgetTotalAllocated: totalAllocated,
      budgetTotalSpent: totalSpent,
    };
  }, [transactions, budgets]);

  // Budget progress calculations
  const budgetProgressList: BudgetProgress[] = useMemo(() => {
    return calculateBudgetProgressList(budgets, categories, transactions);
  }, [budgets, categories, transactions]);

  // Evaluate budget thresholds and trigger warnings
  useEffect(() => {
    if (user && budgetProgressList.length > 0 && !isDemoMode) {
      checkAndDispatchBudgetAlerts(user.id, budgetProgressList);
    }
  }, [budgetProgressList, user, isDemoMode]);

  // Smart insights derived strictly from user ledger
  const smartInsights: SmartInsight[] = useMemo(() => {
    return generateSmartInsights(transactions, categories, budgets);
  }, [transactions, categories, budgets]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // CRUD Operations - Transactions
  const handleAddTransaction = async (tx: {
    type: TransactionType;
    amount: number;
    description: string;
    category_id: string | null;
    date: string;
    notes?: string | null;
  }) => {
    if (!user) throw new Error('Please log in before adding a transaction.');

    const newTx = await createTransaction(user.id, tx);
    await refreshAll();
    return newTx;
  };

  const handleEditTransaction = async (
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'category'>>
  ) => {
    const updated = await updateTransaction(id, updates);
    await refreshAll();
    return updated;
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransaction(id);
    await refreshAll();
  };

  // CRUD Operations - Budgets
  const handleAddBudget = async (b: {
    category_id: string;
    amount: number;
    month: string;
    threshold?: number;
  }) => {
    if (!user) throw new Error('You must be logged in to set a budget.');

    const newBudget = await createBudget(user.id, b);
    await refreshAll();
    return newBudget;
  };

  const handleEditBudget = async (
    id: string,
    updates: Partial<Pick<Budget, 'amount' | 'threshold' | 'category_id' | 'month'>>
  ) => {
    const updated = await updateBudget(id, updates);
    await refreshAll();
    return updated;
  };

  const handleDeleteBudget = async (id: string) => {
    await deleteBudget(id);
    await refreshAll();
  };

  // CRUD Operations - Categories
  const handleAddCategory = async (cat: { name: string; icon?: string; color?: string }) => {
    if (!user) throw new Error('You must be logged in to create a category.');

    const newCat = await createCategory(user.id, cat);
    await refreshAll();
    return newCat;
  };

  const handleEditCategory = async (
    id: string,
    updates: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ) => {
    const updated = await updateCategory(id, updates);
    await refreshAll();
    return updated;
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    await refreshAll();
  };

  // Notifications
  const handleMarkNotificationRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllNotificationsRead = async () => {
    if (user) {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Clear all ledger data for the user
  const clearAllUserData = async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', user.id),
      supabase.from('budgets').delete().eq('user_id', user.id),
      supabase.from('notifications').delete().eq('user_id', user.id),
    ]);

    await refreshAll();
  };

  return (
    <FinanceContext.Provider
      value={{
        categories,
        transactions,
        budgets,
        notifications,
        budgetProgressList,
        financialSummary,
        smartInsights,
        unreadNotificationsCount,
        loading,
        filterOptions,
        setFilterOptions,
        refreshAll,
        handleAddTransaction,
        handleEditTransaction,
        handleDeleteTransaction,
        handleAddBudget,
        handleEditBudget,
        handleDeleteBudget,
        handleAddCategory,
        handleEditCategory,
        handleDeleteCategory,
        handleMarkNotificationRead,
        handleMarkAllNotificationsRead,
        handleDeleteNotification,
        clearAllUserData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
