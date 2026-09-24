export type TransactionType = 'income' | 'expense';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string | null;
  date: string; // YYYY-MM-DD
  notes?: string | null;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string; // YYYY-MM-01
  threshold: number; // default 80
  created_at: string;
  category?: Category;
}

export type NotificationType = 'Budget Alert' | 'Transaction' | 'Monthly Summary' | 'System';

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType | string;
  read: boolean;
  created_at: string;
}

export interface BudgetProgress {
  budget: Budget;
  category: Category;
  spent: number;
  remaining: number;
  percentage: number;
  isApproaching: boolean;
  isExceeded: boolean;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  availableBalance: number;
  savingsRate: number;
  activeBudgetsCount: number;
  budgetTotalAllocated: number;
  budgetTotalSpent: number;
}

export interface SmartInsight {
  id: string;
  type: 'info' | 'warning' | 'positive' | 'tip';
  title: string;
  message: string;
  metric?: string;
  actionable?: string;
}
