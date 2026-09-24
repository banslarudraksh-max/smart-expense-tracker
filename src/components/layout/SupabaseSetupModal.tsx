import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_SNIPPET = `-- ==============================================================================
-- SMART EXPENSE TRACKER - SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY
-- Paste this script into your Supabase project's SQL Editor and click "Run".
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  month DATE NOT NULL,
  threshold INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_category_month UNIQUE (user_id, category_id, month)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_unique ON public.budgets(user_id, category_id, month);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
`;

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const { isDemoMode, enterDemoMode, exitDemoMode } = useAuth();
  const { refreshAll } = useFinance();

  const [url, setUrl] = useState(() => getStoredSupabaseConfig().url);
  const [anonKey, setAnonKey] = useState(() => getStoredSupabaseConfig().anonKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'credentials' | 'sql'>('credentials');

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);
    saveStoredSupabaseConfig(url, anonKey);

    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setTesting(false);

    if (result.success) {
      exitDemoMode();
      await refreshAll();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Supabase Full-Stack Architecture</h2>
              <p className="text-xs text-slate-400">PostgreSQL · Authentication · Row Level Security (RLS)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/20">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Connection Keys
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            PostgreSQL SQL Migration & RLS
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'credentials' ? (
            <>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Configuration Status
                  </span>
                  {isDemoMode ? (
                    <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Demo Sandbox Mode Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      Live Supabase Mode Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your Supabase project credentials from{' '}
                  <span className="font-mono text-cyan-300">Project Settings &gt; API</span>. The app securely calls Supabase through the official client with RLS active.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://xyzcompany.supabase.co"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Supabase Anon Public Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Never use the secret service-role key. The public anon key is safe for client applications.
                  </p>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.success ? 'Connection Verified' : 'Check Failed'}</p>
                    <p className="text-slate-300 leading-relaxed">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAndTest}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Testing Endpoint...' : 'Save & Verify Connection'}
                </button>

                <div className="flex items-center gap-2">
                  {isDemoMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        exitDemoMode();
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      Exit Demo Mode
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        enterDemoMode();
                        onClose();
                      }}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                    >
                      Use Demo Sandbox
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-white">Full Supabase PostgreSQL Migration Script</h3>
                  <p className="text-xs text-slate-400">Creates tables, foreign keys, triggers, and Row Level Security policies.</p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 text-xs font-medium transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copied to Clipboard' : 'Copy Complete SQL'}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-80 leading-relaxed selection:bg-cyan-500/30">
                  {SQL_SCHEMA_SNIPPET}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-cyan-300">Quick Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                  <li>Open your Supabase Dashboard &gt; SQL Editor.</li>
                  <li>Click &quot;New Query&quot;, paste the SQL snippet, and click &quot;Run&quot;.</li>
                  <li>Return to the &quot;Connection Keys&quot; tab to verify the connection.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
