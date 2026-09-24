import React from 'react';
import { Plus, ArrowUpRight, TrendingUp, RefreshCw, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { KpiCards } from './KpiCards';
import { BudgetOverviewWidget } from './BudgetOverviewWidget';
import { SmartInsightsWidget } from './SmartInsightsWidget';
import { RecentTransactions } from './RecentTransactions';
import { Transaction } from '../../types/database';

interface DashboardViewProps {
  onNavigateToTransactions: () => void;
  onNavigateToBudgets: () => void;
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenSupabaseSetup: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTransactions,
  onNavigateToBudgets,
  onOpenAddTransaction,
  onEditTransaction,
  onOpenSupabaseSetup,
}) => {
  const { user, profile, isDemoMode } = useAuth();
  const { transactions, refreshAll, loading } = useFinance();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Rudraksh');

  return (
    <div className="space-y-6">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {getGreeting()}, <span className="text-cyan-400">{displayName}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Here&apos;s your financial overview for this month.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAll()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
            title="Refresh latest data from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm shadow-cyan-500/20 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Income, Expenses, Balance, Budget Usage) */}
      <KpiCards />

      {/* Grid: Budget Overview & Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetOverviewWidget onNavigateToBudgets={onNavigateToBudgets} />
        <SmartInsightsWidget onNavigateToTransactions={onNavigateToTransactions} />
      </div>

      {/* Recent Transactions Section */}
      <RecentTransactions
        onNavigateToTransactions={onNavigateToTransactions}
        onOpenAddModal={onOpenAddTransaction}
        onEditTransaction={onEditTransaction}
      />
    </div>
  );
};
