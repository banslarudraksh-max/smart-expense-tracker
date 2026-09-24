import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  BarChart3,
  Tags,
  Settings,
  LogOut,
  Database,
  Shield,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavigationRoute =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'analytics'
  | 'categories'
  | 'settings';

interface SidebarProps {
  currentRoute: NavigationRoute;
  onNavigate: (route: NavigationRoute) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenSupabaseSetup: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onOpenSupabaseSetup,
}) => {
  const { user, profile, signOut, isDemoMode } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleItemClick = (id: NavigationRoute) => {
    onNavigate(id);
    onCloseMobile();
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Rudraksh Sharma';
  const displayEmail = user?.email || 'rudraksh@fintech.vault';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800 text-slate-300">
      {/* Brand Zone: Single text element wordmark */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm tracking-tight shadow-sm shadow-cyan-500/20">
            S
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block">
              Smart Expense <span className="text-cyan-400 font-mono text-xs">Tracker</span>
            </span>
          </div>
        </div>

        <button
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 rounded-lg md:hidden hover:text-white hover:bg-slate-800"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Supabase backend summary card */}
      <div className="px-4 py-3 border-t border-slate-800/80 bg-slate-950/40">
        <button
          onClick={onOpenSupabaseSetup}
          className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono font-medium text-slate-400 group-hover:text-cyan-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Supabase RLS
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            auth.uid() scoped queries · PostgreSQL tables
          </p>
        </button>
      </div>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xs font-semibold text-cyan-400 shrink-0 select-none">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{displayName}</p>
            <p className="text-[10px] text-slate-500 truncate font-mono">{displayEmail}</p>
          </div>
        </div>

        <button
          onClick={signOut}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors shrink-0"
          title="Sign out of Supabase"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (fixed 250px) */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-xs h-full bg-slate-950 shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
