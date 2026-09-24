import React, { useState, useEffect } from 'react';
import {
  User,
  Sliders,
  Trash2,
  Download,
  Check,
  RefreshCw,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useTheme, CURRENCY_CONFIGS, CurrencyCode } from '../../context/ThemeContext';
import { updateProfile } from '../../lib/services/profileService';

export const SettingsView: React.FC = () => {
  const { user, profile, isDemoMode, refreshProfile } = useAuth();
  const { transactions, refreshAll, clearAllUserData } = useFinance();
  const {
    theme,
    setTheme,
    currency,
    setCurrency,
    dateFormat,
    setDateFormat,
  } = useTheme();

  // Profile Form state
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Notification Preferences state (persisted locally)
  const [budgetAlerts, setBudgetAlerts] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_budget_alerts');
    return saved !== null ? saved === 'true' : true;
  });
  const [weeklyDigest, setWeeklyDigest] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_weekly_digest');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('pref_budget_alerts', String(budgetAlerts));
  }, [budgetAlerts]);

  useEffect(() => {
    localStorage.setItem('pref_weekly_digest', String(weeklyDigest));
  }, [weeklyDigest]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileSuccess(false);

    try {
      if (!isDemoMode) {
        await updateProfile(user.id, {
          full_name: fullName.trim(),
        });
        await refreshProfile();
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Type', 'Amount', 'Description', 'Category', 'Date', 'Notes'];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.type,
      tx.amount,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${(tx.category?.name || '').replace(/"/g, '""')}"`,
      tx.date,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart_expense_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearData = async () => {
    if (
      window.confirm(
        'WARNING: This will permanently erase all transaction entries and budget allocations for your account. Continue?'
      )
    ) {
      await clearAllUserData();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Profile credentials, localization preferences, notifications, and ledger controls
        </p>
      </div>

      {/* 1. Profile Section */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <User className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Profile Credentials</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || 'user@fintech.vault'}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs font-mono cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-500 mt-1">Primary email associated with your account.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
            {profileSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                Profile updated successfully
              </span>
            )}
          </div>
        </form>
      </div>

      {/* 2. Preferences */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Localization & Theme</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Currency */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {Object.entries(CURRENCY_CONFIGS).map(([code, cfg]) => (
                <option key={code} value={code}>
                  {cfg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="dark">Dark Theme (Default)</option>
              <option value="light">Light Theme</option>
              <option value="system">System Preference</option>
            </select>
          </div>

          {/* Date format */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Date Format</label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Notification Preferences */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Notifications</h2>
        </div>

        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-medium text-white">Budget Threshold Alerts</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Notify when category spending exceeds 80% or reaches 100% of limits
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBudgetAlerts((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                budgetAlerts ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  budgetAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-medium text-white">Periodic Spending Summaries</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Receive recap summaries on monthly totals and recurring expenses
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWeeklyDigest((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                weeklyDigest ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  weeklyDigest ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Data Management */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm font-semibold text-white">Data Management</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export */}
          <button
            onClick={handleExportCsv}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors group"
          >
            <Download className="w-4 h-4 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-semibold text-white">Export to CSV</h3>
            <p className="text-[11px] text-slate-400 mt-1">Download complete transaction history</p>
          </button>

          {/* Re-sync ledger */}
          <button
            onClick={refreshAll}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left transition-colors group"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400 mb-2 group-hover:rotate-180 transition-transform duration-500" />
            <h3 className="text-xs font-semibold text-white">Re-sync Data</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Refetches transactions, categories, and budgets
            </p>
          </button>

          {/* Clear data */}
          <button
            onClick={handleClearData}
            className="p-4 rounded-xl bg-slate-950 border border-rose-500/20 hover:border-rose-500/40 text-left transition-colors group"
          >
            <Trash2 className="w-4 h-4 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-xs font-semibold text-rose-300">Clear Ledger Data</h3>
            <p className="text-[11px] text-slate-400 mt-1">Permanently remove transactions &amp; budgets</p>
          </button>
        </div>
      </div>
    </div>
  );
};
