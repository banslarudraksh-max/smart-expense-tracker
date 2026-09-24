import { Transaction, Category, Budget, SmartInsight } from '../../types/database';
import { calculateBudgetProgressList } from './budgetService';

export function generateSmartInsights(
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[]
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  if (!transactions || transactions.length === 0) {
    insights.push({
      id: 'insight-empty',
      type: 'info',
      title: 'Awaiting Financial Activity',
      message: 'Add your first income or expense transaction to unlock real-time spending insights and budget forecasting.',
      actionable: 'Log First Entry',
    });
    return insights;
  }

  const expenseTxs = transactions.filter((t) => t.type === 'expense');
  const incomeTxs = transactions.filter((t) => t.type === 'income');

  const totalExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount), 0);

  // 1. Category concentration insight
  const catTotals = new Map<string, number>();
  for (const t of expenseTxs) {
    const id = t.category_id || 'other';
    catTotals.set(id, (catTotals.get(id) || 0) + Number(t.amount));
  }

  let topCatId = '';
  let topCatAmount = 0;
  catTotals.forEach((amt, id) => {
    if (amt > topCatAmount) {
      topCatAmount = amt;
      topCatId = id;
    }
  });

  if (topCatAmount > 0 && totalExpense > 0) {
    const topCat = categories.find((c) => c.id === topCatId);
    const catName = topCat ? topCat.name : 'Uncategorized';
    const pct = Math.round((topCatAmount / totalExpense) * 100);

    if (pct >= 20) {
      insights.push({
        id: 'insight-top-cat',
        type: pct > 45 ? 'warning' : 'info',
        title: `${catName} is your primary cost center`,
        message: `${catName} represents ${pct}% of your total recorded expenses (₹${topCatAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).`,
        metric: `${pct}% of spend`,
      });
    }
  }

  // 2. Budget proximity insight
  const currentMonth = new Date().toISOString().slice(0, 7);
  const budgetProgress = calculateBudgetProgressList(budgets, categories, transactions, currentMonth);

  const exceeded = budgetProgress.filter((b) => b.isExceeded);
  const approaching = budgetProgress.filter((b) => b.isApproaching);

  if (exceeded.length > 0) {
    const b = exceeded[0];
    insights.push({
      id: `insight-budget-exceeded-${b.budget.id}`,
      type: 'warning',
      title: `${b.category.name} budget exceeded`,
      message: `You have spent ₹${b.spent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} against your monthly allowance of ₹${Number(b.budget.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${b.percentage}% utilized).`,
      metric: `${b.percentage}% limit`,
    });
  } else if (approaching.length > 0) {
    const b = approaching[0];
    insights.push({
      id: `insight-budget-approaching-${b.budget.id}`,
      type: 'warning',
      title: `${b.category.name} near threshold`,
      message: `You have consumed ${b.percentage}% of your ${b.category.name} budget (₹${b.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining).`,
      metric: `₹${b.remaining.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left`,
    });
  }

  // 3. Savings Rate & Cashflow health
  if (totalIncome > 0) {
    const netSavings = totalIncome - totalExpense;
    const savingsRate = Math.round((netSavings / totalIncome) * 100);

    if (savingsRate >= 30) {
      insights.push({
        id: 'insight-savings-healthy',
        type: 'positive',
        title: 'Strong Capital Retention',
        message: `Your current net savings rate is ${savingsRate}%. You are retaining ₹${netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} after all recorded expenses.`,
        metric: `${savingsRate}% saved`,
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        id: 'insight-savings-tight',
        type: 'warning',
        title: 'Narrow Operating Margin',
        message: `Your savings rate is currently ${savingsRate}%. Total outflows are closely matching incoming revenue.`,
        metric: `${savingsRate}% margin`,
      });
    } else if (savingsRate < 0) {
      insights.push({
        id: 'insight-savings-negative',
        type: 'warning',
        title: 'Negative Cash Flow Alert',
        message: `Expenses exceed income by ₹${Math.abs(netSavings).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Review non-essential bills.`,
        metric: `-₹${Math.abs(netSavings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      });
    }
  }

  // 4. Spending Velocity / Recurring check
  const descriptions = new Map<string, { count: number; total: number }>();
  for (const t of expenseTxs) {
    const key = t.description.toLowerCase().trim();
    const curr = descriptions.get(key) || { count: 0, total: 0 };
    curr.count += 1;
    curr.total += Number(t.amount);
    descriptions.set(key, curr);
  }

  descriptions.forEach((val, desc) => {
    if (val.count >= 2 && insights.length < 4) {
      insights.push({
        id: `insight-recurring-${desc}`,
        type: 'tip',
        title: `Recurring pattern: "${desc}"`,
        message: `Logged ${val.count} times for a combined total of ₹${val.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        metric: `${val.count} entries`,
      });
    }
  });

  return insights;
}
