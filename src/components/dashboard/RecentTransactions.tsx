import React from 'react';
import { ArrowRight, PlusCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { renderCategoryIcon } from '../../lib/utils/iconMap';
import { Transaction } from '../../types/database';

interface RecentTransactionsProps {
  onNavigateToTransactions: () => void;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  onNavigateToTransactions,
  onOpenAddModal,
  onEditTransaction,
}) => {
  const { transactions } = useFinance();
  const { formatCurrency, formatDate } = useTheme();

  const recentList = transactions.slice(0, 6);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
          <p className="text-xs text-slate-400">Latest activity from Supabase PostgreSQL</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <span className="text-slate-700">·</span>
          <button
            onClick={onNavigateToTransactions}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {recentList.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <p>No transactions recorded in your Supabase database yet.</p>
          <button
            onClick={onOpenAddModal}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors inline-block"
          >
            Record First Transaction
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {recentList.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                onClick={() => onEditTransaction(tx)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-800/40 px-2 -mx-2 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: tx.category?.color ? `${tx.category.color}15` : isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderColor: tx.category?.color ? `${tx.category.color}40` : isIncome ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                      color: tx.category?.color || (isIncome ? '#10b981' : '#ef4444'),
                    }}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    ) : (
                      renderCategoryIcon(tx.category?.icon, { className: 'w-4 h-4' })
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{tx.category?.name || (isIncome ? 'Income' : 'General')}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{formatDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-semibold text-xs tabular-nums ${
                      isIncome ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
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
