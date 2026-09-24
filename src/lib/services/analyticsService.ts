import { Transaction, Category } from '../../types/database';

export interface MonthlyTrendData {
  month: string; // e.g. "Jan 2026"
  income: number;
  expenses: number;
  net: number;
}

export interface CategorySpendingData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon?: string;
}

export interface DailySpendingData {
  date: string;
  amount: number;
}

export interface BalanceTrendPoint {
  id: string;
  index: number;
  date: string;
  time?: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  balance: number;
}

export interface AnalyticsSummary {
  highestExpense: {
    description: string;
    amount: number;
    date: string;
    categoryName: string;
  } | null;
  highestCategory: {
    name: string;
    amount: number;
    percentage: number;
  } | null;
  averageDailySpending: number;
  monthlyTrend: MonthlyTrendData[];
  categoryDistribution: CategorySpendingData[];
  balanceTrend: BalanceTrendPoint[];
  incomeExpenseComparison: { name: string; income: number; expense: number }[];
}

export function computeAnalytics(
  transactions: Transaction[],
  categories: Category[],
  selectedMonthFilter?: string // YYYY-MM
): AnalyticsSummary {
  if (!transactions || transactions.length === 0) {
    return {
      highestExpense: null,
      highestCategory: null,
      averageDailySpending: 0,
      monthlyTrend: [],
      categoryDistribution: [],
      balanceTrend: [],
      incomeExpenseComparison: [],
    };
  }

  // 1. Highest Expense (across all or filtered)
  const expenseTxs = transactions.filter((t) => t.type === 'expense');
  let highestExpense: AnalyticsSummary['highestExpense'] = null;

  if (expenseTxs.length > 0) {
    const sorted = [...expenseTxs].sort((a, b) => Number(b.amount) - Number(a.amount));
    const top = sorted[0];
    const cat = categories.find((c) => c.id === top.category_id);
    highestExpense = {
      description: top.description,
      amount: Number(top.amount),
      date: top.date,
      categoryName: cat?.name || 'General',
    };
  }

  // 2. Category Distribution
  const categoryMap = new Map<string, number>();
  let totalExpenseAmount = 0;

  for (const tx of expenseTxs) {
    const amt = Number(tx.amount);
    totalExpenseAmount += amt;
    const catId = tx.category_id || 'unknown';
    categoryMap.set(catId, (categoryMap.get(catId) || 0) + amt);
  }

  const defaultColors = ['#0ea5e9', '#3b82f6', '#f97316', '#ec4899', '#8b5cf6', '#10b981', '#eab308', '#64748b'];

  const categoryDistribution: CategorySpendingData[] = [];
  let colorIdx = 0;

  categoryMap.forEach((amt, catId) => {
    const cat = categories.find((c) => c.id === catId);
    const catName = cat?.name || 'Other';
    const color = cat?.color || defaultColors[colorIdx % defaultColors.length];
    const percentage = totalExpenseAmount > 0 ? Math.round((amt / totalExpenseAmount) * 100) : 0;

    categoryDistribution.push({
      name: catName,
      amount: amt,
      percentage,
      color,
      icon: cat?.icon || 'HelpCircle',
    });
    colorIdx++;
  });

  categoryDistribution.sort((a, b) => b.amount - a.amount);

  const highestCategory =
    categoryDistribution.length > 0
      ? {
          name: categoryDistribution[0].name,
          amount: categoryDistribution[0].amount,
          percentage: categoryDistribution[0].percentage,
        }
      : null;

  // 3. Average daily spending
  const uniqueDates = new Set(expenseTxs.map((t) => t.date));
  const daysCount = Math.max(1, uniqueDates.size);
  const averageDailySpending = totalExpenseAmount / daysCount;

  // 4. Monthly Trend (group by YYYY-MM)
  const monthMap = new Map<string, { income: number; expenses: number }>();

  for (const tx of transactions) {
    const monthKey = tx.date.slice(0, 7); // e.g. "2026-09"
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { income: 0, expenses: 0 });
    }
    const current = monthMap.get(monthKey)!;
    const amt = Number(tx.amount);
    if (tx.type === 'income') {
      current.income += amt;
    } else {
      current.expenses += amt;
    }
  }

  // Sort months chronologically
  const sortedMonths = Array.from(monthMap.keys()).sort();
  const monthlyTrend: MonthlyTrendData[] = sortedMonths.map((m) => {
    const data = monthMap.get(m)!;
    const dateObj = new Date(m + '-01');
    const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return {
      month: monthLabel,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
    };
  });

  // 5. Balance Trend (one data point per transaction, sorted chronologically by date and creation time)
  const chronoTxs = [...transactions].sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeA - timeB;
  });

  let runningBalance = 0;
  const balanceTrend: BalanceTrendPoint[] = [];

  for (let i = 0; i < chronoTxs.length; i++) {
    const tx = chronoTxs[i];
    const amt = Number(tx.amount);
    if (tx.type === 'income') {
      runningBalance += amt;
    } else {
      runningBalance -= amt;
    }

    balanceTrend.push({
      id: tx.id,
      index: i + 1,
      date: tx.date,
      time: tx.created_at
        ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined,
      description: tx.description || (tx.type === 'income' ? 'Income' : 'Expense'),
      amount: amt,
      type: tx.type,
      balance: runningBalance,
    });
  }

  // 6. Income vs Expense Comparison by month
  const incomeExpenseComparison = monthlyTrend.map((m) => ({
    name: m.month,
    income: m.income,
    expense: m.expenses,
  }));

  return {
    highestExpense,
    highestCategory,
    averageDailySpending,
    monthlyTrend,
    categoryDistribution,
    balanceTrend,
    incomeExpenseComparison,
  };
}
