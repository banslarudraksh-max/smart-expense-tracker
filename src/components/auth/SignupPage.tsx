import React, { useState } from 'react';
import { Database, Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SignupPageProps {
  onNavigateToLogin: () => void;
  onExploreDemo: () => void;
  onOpenSupabaseSetup: () => void;
  onNavigateToLanding?: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onNavigateToLogin,
  onExploreDemo,
  onOpenSupabaseSetup,
  onNavigateToLanding,
}) => {
  const { signUp, enterDemoMode } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!email || !password) {
      setErrorMsg('Please enter your email and choose a password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await signUp(email, password, fullName.trim());
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error.message || 'Failed to create account. Check Supabase connection or permissions.');
    } else {
      setSuccessMsg(
        'Account created successfully! If email verification is enabled on your Supabase project, check your inbox. Otherwise you can log in immediately.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black text-xl mb-4 shadow-sm shadow-cyan-500/20">
          S
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Create Smart Expense Tracker Account</h2>
        <p className="text-xs text-slate-400 mt-1">
          Provisions your profile and default expense categories in Supabase PostgreSQL
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

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Registration Completed</p>
                <p className="text-[11px] text-slate-300 mt-1">{successMsg}</p>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="mt-2 text-cyan-400 font-medium hover:underline block text-xs"
                >
                  Proceed to Sign In &rarr;
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Rudraksh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="rudraksh@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors shadow-sm shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Creating Account...' : 'Sign Up with Supabase'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick links */}
          <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-cyan-400 font-medium hover:underline"
              >
                Sign in
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
