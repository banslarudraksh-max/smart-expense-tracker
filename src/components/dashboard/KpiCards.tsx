import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export const KpiCards: React.FC = () => {
  const { financialSummary, budgetProgressList } = useFinance();
  const { formatCurrency } = useTheme();

  const totalIncome = financialSummary.totalIncome;
  const totalExpenses = financialSummary.totalExpenses;
  const availableBalance = financialSummary.availableBalance;

  // Calculate aggregate budget usage
  const totalBudgeted = financialSummary.budgetTotalAllocated;
  const totalBudgetSpent = financialSummary.budgetTotalSpent;
  const overallBudgetUsage = totalBudgeted > 0 ? Math.round((totalBudgetSpent / totalBudgeted) * 100) : 0;

  const cards = [
    {
      label: 'Available Balance',
      amount: availableBalance,
      formatted: formatCurrency(availableBalance),
      icon: Wallet,
      subtitle: `${financialSummary.savingsRate}% net savings rate`,
      accentClass: 'text-cyan-400',
      badgeClass: availableBalance >= 0 ? 'text-emerald-400' : 'text-rose-400',
      trendIcon: availableBalance >= 0 ? ArrowUpRight : ArrowDownRight,
    },
    {
      label: 'Total Income',
      amount: totalIncome,
      formatted: formatCurrency(totalIncome),
      icon: TrendingUp,
      subtitle: 'Recorded credits this period',
      accentClass: 'text-emerald-400',
      badgeClass: 'text-emerald-400',
      trendIcon: ArrowUpRight,
    },
    {
      label: 'Total Expenses',
      amount: totalExpenses,
      formatted: formatCurrency(totalExpenses),
      icon: TrendingDown,
      subtitle: 'Recorded debits this period',
      accentClass: 'text-rose-400',
      badgeClass: 'text-rose-400',
      trendIcon: ArrowDownRight,
    },
    {
      label: 'Budget Usage',
      amount: overallBudgetUsage,
      formatted: `${overallBudgetUsage}%`,
      icon: Target,
      subtitle: totalBudgeted > 0 ? `${formatCurrency(totalBudgetSpent)} of ${formatCurrency(totalBudgeted)}` : 'No active limits',
      accentClass: overallBudgetUsage > 100 ? 'text-rose-400' : overallBudgetUsage > 80 ? 'text-amber-400' : 'text-cyan-400',
      badgeClass: overallBudgetUsage > 100 ? 'text-rose-400' : 'text-slate-400',
      trendIcon: ArrowUpRight,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const Trend = card.trendIcon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <div className={`p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 ${card.accentClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
                {card.formatted}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>{card.subtitle}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
