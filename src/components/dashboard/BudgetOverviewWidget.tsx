import React from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { renderCategoryIcon } from '../../lib/utils/iconMap';

interface BudgetOverviewWidgetProps {
  onNavigateToBudgets: () => void;
}

export const BudgetOverviewWidget: React.FC<BudgetOverviewWidgetProps> = ({ onNavigateToBudgets }) => {
  const { budgetProgressList } = useFinance();
  const { formatCurrency } = useTheme();

  return (
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Monthly Budgets</h3>
          <p className="text-xs text-slate-400">Current spending thresholds</p>
        </div>
        <button
          onClick={onNavigateToBudgets}
          className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <span>Manage</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {budgetProgressList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <p className="text-xs text-slate-400 mb-3">No active budget allocations for this month.</p>
          <button
            onClick={onNavigateToBudgets}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Create First Budget
          </button>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {budgetProgressList.slice(0, 4).map((item) => {
            const isExceeded = item.isExceeded;
            const isApproaching = item.isApproaching;

            const barColor = isExceeded
              ? 'bg-rose-500'
              : isApproaching
              ? 'bg-amber-500'
              : 'bg-cyan-500';

            return (
              <div key={item.budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="p-1.5 rounded-lg text-white"
                      style={{ backgroundColor: item.category.color || '#3b82f6' }}
                    >
                      {renderCategoryIcon(item.category.icon, { className: 'w-3 h-3' })}
                    </div>
                    <span className="font-medium text-slate-200">{item.category.name}</span>
                    {isExceeded && (
                      <span className="text-[10px] text-rose-400 font-medium flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        Exceeded
                      </span>
                    )}
                    {isApproaching && (
                      <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        &gt;{item.budget.threshold}%
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 font-mono tabular-nums text-[11px]">
                    <span className="text-white font-medium">{formatCurrency(item.spent)}</span>
                    <span className="text-slate-600"> / </span>
                    <span>{formatCurrency(Number(item.budget.amount))}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{item.percentage}% used</span>
                  <span>
                    {isExceeded
                      ? `${formatCurrency(item.spent - Number(item.budget.amount))} over`
                      : `${formatCurrency(item.remaining)} remaining`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
