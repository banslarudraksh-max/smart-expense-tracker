import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertTriangle, ShieldCheck, Settings2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStoredSupabaseConfig, testSupabaseConnection } from '../../lib/supabase/client';

interface SupabaseStatusBadgeProps {
  onOpenSetup: () => void;
}

export const SupabaseStatusBadge: React.FC<SupabaseStatusBadgeProps> = ({ onOpenSetup }) => {
  const { isDemoMode, supabaseConfigured } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'unconfigured' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function checkStatus() {
      const config = getStoredSupabaseConfig();
      if (!config.url || !config.anonKey) {
        if (active) {
          setConnectionStatus('unconfigured');
          setStatusMessage('Supabase credentials not set');
        }
        return;
      }

      setConnectionStatus('checking');
      const res = await testSupabaseConnection();
      if (active) {
        if (res.success) {
          setConnectionStatus('connected');
          setStatusMessage('PostgreSQL + RLS Active');
        } else {
          setConnectionStatus('error');
          setStatusMessage(res.message);
        }
      }
    }

    checkStatus();

    return () => {
      active = false;
    };
  }, [supabaseConfigured]);

  if (isDemoMode) {
    return (
      <button
        onClick={onOpenSetup}
        title="Running in Demo Sandbox mode. Click to connect real Supabase PostgreSQL backend."
        className="flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span>Demo Sandbox</span>
        <span className="text-amber-500/70">·</span>
        <span className="underline underline-offset-2">Connect Supabase</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenSetup}
      className={`flex items-center gap-2 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
        connectionStatus === 'connected'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
          : connectionStatus === 'checking'
          ? 'bg-slate-800 text-slate-300 border-slate-700'
          : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
      }`}
      title="Click to inspect Supabase PostgreSQL connection & SQL Schema"
    >
      {connectionStatus === 'connected' ? (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
          <span className="font-mono">Supabase PostgreSQL</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </>
      ) : connectionStatus === 'checking' ? (
        <>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
          <span>Verifying Backend...</span>
        </>
      ) : (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Supabase Setup Required</span>
        </>
      )}
    </button>
  );
};
