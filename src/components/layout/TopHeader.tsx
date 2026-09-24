import React from 'react';
import { Menu, Plus, Sun, Moon, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SupabaseStatusBadge } from './SupabaseStatusBadge';
import { NotificationDropdown } from '../notifications/NotificationDropdown';

interface TopHeaderProps {
  currentRoute: string;
  onOpenMobileMenu: () => void;
  onOpenAddTransaction: () => void;
  onOpenSupabaseSetup: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentRoute,
  onOpenMobileMenu,
  onOpenAddTransaction,
  onOpenSupabaseSetup,
}) => {
  const { user, profile } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  // Greeting by hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Rudraksh';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      {/* Zone 1: Mobile toggle & Breadcrumb / Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-1 text-slate-400 rounded-lg md:hidden hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-500"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-white capitalize">{currentRoute}</span>
          <span aria-hidden="true" className="text-slate-600">·</span>
          <span className="hidden sm:inline text-slate-300">
            {getGreeting()}, <span className="text-cyan-400 font-medium">{displayName}</span>
          </span>
        </div>
      </div>

      {/* Zone 2: Supabase connection indicator */}
      <div className="hidden lg:flex items-center">
        <SupabaseStatusBadge onOpenSetup={onOpenSupabaseSetup} />
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Transaction */}
        <button
          onClick={onOpenAddTransaction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm shadow-cyan-500/20 whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User avatar initial */}
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-cyan-400 shrink-0 select-none">
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
