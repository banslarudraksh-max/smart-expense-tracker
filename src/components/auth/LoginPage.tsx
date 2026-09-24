import React, { useState } from 'react';
import { Database, Lock, Mail, AlertCircle, ArrowRight, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigateToSignup: () => void;
  onExploreDemo: () => void;
  onOpenSupabaseSetup: () => void;
  onNavigateToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToSignup,
  onExploreDemo,
  onOpenSupabaseSetup,
  onNavigateToLanding,
}) => {
  const { signIn, enterDemoMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setForgotPasswordNotice(false);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'Failed to authenticate. Check credentials or Supabase URL.');
    }
  };

  const handleForgotPassword = () => {
    setForgotPasswordNotice(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-xl mb-4 shadow-sm shadow-cyan-500/20">
          S
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Sign In to Smart Expense Tracker</h2>
        <p className="text-xs text-slate-400 mt-1">
          Supabase PostgreSQL authentication with Row Level Security
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {forgotPasswordNotice && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reset Password</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Password reset emails can be dispatched via Supabase Auth when SMTP email delivery is configured in your Supabase project settings.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-400">
                Remember session
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors shadow-sm shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with Supabase'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Alternative Demo Sandbox Option */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-2 text-slate-500">or instant preview</span>
            </div>
          </div>

          <button
            type="button"
            onClick={enterDemoMode}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Launch Demo Sandbox (No login needed)</span>
          </button>

          {/* Bottom helper */}
          <div className="pt-2 text-center text-xs text-slate-400 flex flex-col gap-2">
            <div>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="text-cyan-400 font-medium hover:underline"
              >
                Sign up
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={onOpenSupabaseSetup}
                className="text-slate-500 hover:text-slate-300 underline inline-flex items-center gap-1 text-[11px]"
              >
                <Database className="w-3 h-3" />
                <span>Configure Supabase Project Credentials</span>
              </button>
            </div>
            {onNavigateToLanding && (
              <div>
                <button
                  type="button"
                  onClick={onNavigateToLanding}
                  className="text-slate-500 hover:text-slate-400 text-[11px]"
                >
                  &larr; Back to Product Overview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
