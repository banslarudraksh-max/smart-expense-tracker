import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Target,
  Sparkles,
  Database,
  Lock,
  Zap,
  CheckCircle2,
  ChevronRight,
  Wallet,
} from 'lucide-react';

interface LandingPageProps {
  onStartTracking: () => void;
  onExploreDemo: () => void;
  onOpenLogin: () => void;
  onOpenSupabaseSetup: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartTracking,
  onExploreDemo,
  onOpenLogin,
  onOpenSupabaseSetup,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-6 lg:px-12 h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm tracking-tight">
            S
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Smart Expense <span className="text-cyan-400 font-mono text-xs">Tracker</span>
          </span>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Architecture</a>
          <a href="#analytics" className="hover:text-white transition-colors">Analytics</a>
          <a href="#security" className="hover:text-white transition-colors">Security &amp; RLS</a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={onStartTracking}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-sm shadow-cyan-500/20 whitespace-nowrap"
          >
            Start Tracking
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-6 lg:px-12 pt-16 pb-20 max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Subtle kicker text (zero-pill) */}
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-4 tracking-wider uppercase">
            <span>Smart Personal Finance</span>
            <span aria-hidden="true">·</span>
            <span>Real Supabase PostgreSQL Backend</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.1] text-balance">
            Take Control of <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Your Money.
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl text-balance leading-relaxed">
            Track expenses. Manage budgets. Understand your spending. Built on real Supabase authentication, PostgreSQL schemas, and Row Level Security.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartTracking}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20"
            >
              <span>Start Tracking</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onExploreDemo}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-xs sm:text-sm transition-colors"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Explore Demo Sandbox</span>
            </button>

            <button
              onClick={onOpenSupabaseSetup}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-slate-400 hover:text-cyan-400 text-xs font-medium transition-colors"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Supabase Setup</span>
            </button>
          </div>

          {/* Interactive Live Dashboard Preview Frame */}
          <div className="mt-14 w-full rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-4 sm:p-6 text-left relative overflow-hidden backdrop-blur-xl">
            {/* Top window dots */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="text-xs text-slate-500 font-mono ml-2">smart-expense-tracker.vault/dashboard</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                PostgreSQL RLS Active
              </span>
            </div>

            {/* Dashboard Mock Preview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Total Income</span>
                <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-1">₹52,000.00</p>
                <span className="text-[10px] text-slate-500">Calculated from Supabase credits</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Total Expenses</span>
                <p className="text-xl font-bold font-mono text-rose-400 tabular-nums mt-1">₹28,500.00</p>
                <span className="text-[10px] text-slate-500">Calculated from Supabase debits</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Available Balance</span>
                <p className="text-xl font-bold font-mono text-white tabular-nums mt-1">₹23,500.00</p>
                <span className="text-[10px] text-slate-500">45% Net savings rate</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[11px] text-slate-400">Budget Usage</span>
                <p className="text-xl font-bold font-mono text-cyan-400 tabular-nums mt-1">68%</p>
                <span className="text-[10px] text-slate-500">Threshold alerts active</span>
              </div>
            </div>

            {/* Mini preview rows */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-white">Recent Transactions</span>
                  <span className="text-slate-500 font-mono">Live Sync</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-300">Engineering Salary Retainer</span>
                    <span className="text-emerald-400 font-mono font-semibold">+₹45,000.00</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-300">Residential Lease &amp; Utilities</span>
                    <span className="text-slate-200 font-mono font-semibold">-₹12,000.00</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-300">Culinary Essentials &amp; Groceries</span>
                    <span className="text-slate-200 font-mono font-semibold">-₹4,500.00</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-white">Smart Insights</span>
                    <span className="text-cyan-400 font-mono text-[10px]">Rule-Based</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Food represents 27% of your monthly expenditure. Savings margin remains healthy at 45%.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                  Autonomous threshold monitoring
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 lg:px-12 border-t border-slate-900 bg-slate-950/40">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Features</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
                Engineered for Modern Financial Clarity
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Every calculation is executed live from Supabase PostgreSQL records with zero synthetic illusions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Real Supabase PostgreSQL</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Persistent PostgreSQL storage with strict foreign keys, timestamps, indexes, and full transactional integrity.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Row Level Security (RLS)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every SELECT, INSERT, UPDATE, and DELETE statement is checked by PostgreSQL policies matching <code className="text-cyan-300">auth.uid() = user_id</code>.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Threshold Budget Alerts</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Calculates actual sum of expenses per category and issues automated warnings at 80% and 100% consumption.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Architecture */}
        <section id="how-it-works" className="py-20 px-6 lg:px-12 border-t border-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Architecture</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
                Full-Stack Data Flow
              </h2>
            </div>

            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 block mb-1">01. React Client</span>
                  <p className="text-slate-400 font-sans">
                    Form input validated with strict types and positive number verification.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 block mb-1">02. Supabase Client</span>
                  <p className="text-slate-400 font-sans">
                    Authenticated session passes bearer JWT securely to API gateway.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 block mb-1">03. PostgreSQL RLS</span>
                  <p className="text-slate-400 font-sans">
                    PostgreSQL verifies auth.uid() = user_id before executing operations.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-cyan-400 block mb-1">04. Reactive Dashboard</span>
                  <p className="text-slate-400 font-sans">
                    KPIs, budgets, insights, and Recharts graphs recalculate dynamically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 lg:px-12 border-t border-slate-900 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to Upgrade Your Personal Ledger?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Create your account with Supabase Authentication or try the interactive sandbox instantly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onStartTracking}
                className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20"
              >
                Create Account
              </button>
              <button
                onClick={onExploreDemo}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-colors"
              >
                Launch Demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 lg:px-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">Smart Expense Tracker</span>
          <span>·</span>
          <span>Full-Stack Supabase Application</span>
        </div>
        <div>
          <span>B.Tech CSE/AI-ML Capstone Grade Financial Infrastructure</span>
        </div>
      </footer>
    </div>
  );
};
