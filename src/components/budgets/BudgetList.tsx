import React, { useState } from 'react';
import { Plus, Target, AlertTriangle, CheckCircle2, Calendar, Edit2, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { renderCategoryIcon } from '../../lib/utils/iconMap';
import { Budget } from '../../types/database';

interface BudgetListProps {
  onOpenAddBudget: () => void;
  onEditBudget: (b: Budget) => void;
}

export const BudgetList: React.FC<BudgetListProps> = ({ onOpenAddBudget, onEditBudget }) => {
  const { budgetProgressList, handleDeleteBudget } = useFinance();
  const { formatCurrency } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Budgets & Limits</h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic threshold monitoring calculated against actual Supabase expense transactions
          </p>
        </div>

        <button
          onClick={onOpenAddBudget}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm shadow-cyan-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create Budget</span>
        </button>
      </div>

      {/* Grid of Budget Cards */}
      {budgetProgressList.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Category Budgets Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Set target monthly spending allowances for food, transport, bills, and lifestyle categories to receive automated threshold warnings.
          </p>
          <button
            onClick={onOpenAddBudget}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors inline-block"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetProgressList.map((item) => {
            const isExceeded = item.isExceeded;
            const isApproaching = item.isApproaching;

            const statusClass = isExceeded
              ? 'border-rose-500/40 bg-rose-500/5'
              : isApproaching
              ? 'border-amber-500/40 bg-amber-500/5'
              : 'border-slate-800 bg-slate-900/70';

            const barColor = isExceeded
              ? 'bg-rose-500'
              : isApproaching
              ? 'bg-amber-500'
              : 'bg-cyan-500';

            return (
              <div
                key={item.budget.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${statusClass}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: item.category.color || '#3b82f6' }}
                      >
                        {renderCategoryIcon(item.category.icon, { className: 'w-4 h-4' })}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{item.category.name}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Month: {item.budget.month.slice(0, 7)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditBudget(item.budget)}
                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                        title="Edit budget"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(item.budget.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {isExceeded ? (
                    <div className="mb-3 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Exceeded by {formatCurrency(item.spent - Number(item.budget.amount))}</span>
                    </div>
                  ) : isApproaching ? (
                    <div className="mb-3 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Approaching limit ({item.percentage}%)</span>
                    </div>
                  ) : (
                    <div className="mb-3 px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-400 text-[11px] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Healthy pacing (Threshold {item.budget.threshold}%)</span>
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center font-mono">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-sans">Budget</p>
                      <p className="text-xs font-semibold text-white tabular-nums">
                        {formatCurrency(Number(item.budget.amount))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-sans">Spent</p>
                      <p className="text-xs font-semibold text-rose-400 tabular-nums">
                        {formatCurrency(item.spent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-sans">Remaining</p>
                      <p className="text-xs font-semibold text-emerald-400 tabular-nums">
                        {formatCurrency(item.remaining)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Usage</span>
                    <span className="font-semibold text-white tabular-nums">{item.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
