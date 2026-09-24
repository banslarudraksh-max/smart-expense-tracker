import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase/client';
import { Profile } from '../types/database';
import { fetchProfile, ensureProfile } from '../lib/services/profileService';
import { seedDefaultCategories } from '../lib/services/categoryService';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isDemoMode: boolean;
  supabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  refreshProfile: () => Promise<void>;
}

const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { full_name: 'Rudraksh Sharma' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'rudraksh.finance@demo.fintech',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const DEMO_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Rudraksh Sharma',
  email: 'rudraksh.finance@demo.fintech',
  avatar_url: '',
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('smart_expense_demo_mode') === 'true';
  });

  const supabase = getSupabaseClient();
  const supabaseConfigured = Boolean(supabase);

  // Initialize Auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setLoading(true);

      if (isDemoMode) {
        setUser(DEMO_USER);
        setProfile(DEMO_PROFILE);
        setLoading(false);
        return;
      }

      if (!supabase) {
        // No supabase configured yet; leave unauthenticated so user sees landing page or config modal
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // Validate authenticated user with Supabase Auth server
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (mounted) {
          if (!userError && userData?.user) {
            setUser(userData.user);
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            const userProfile = await fetchProfile(userData.user.id);
            setProfile(userProfile);
          } else {
            setUser(null);
            setSession(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Error fetching Supabase session:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase auth events
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted || isDemoMode) return;

        setSession(newSession);
        if (newSession?.user) {
          setUser(newSession.user);
          const p = await fetchProfile(newSession.user.id);
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isDemoMode]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please enter your Supabase URL & Anon Key.') };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { error };

      if (data.user) {
        setIsDemoMode(false);
        localStorage.removeItem('smart_expense_demo_mode');
        setUser(data.user);
        setSession(data.session);
        // Ensure profile exists
        const prof = await ensureProfile(data.user);
        setProfile(prof);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured. Please enter your Supabase URL & Anon Key.'), user: null };
    }

    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength || !hasUppercase || !hasNumber || !hasSpecialChar) {
      return {
        error: new Error(
          'Password does not meet requirements (must be at least 8 characters long, contain at least 1 uppercase letter, 1 number, and 1 special character).'
        ),
        user: null,
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) return { error, user: null };

      if (data.user) {
        setIsDemoMode(false);
        localStorage.removeItem('smart_expense_demo_mode');
        setUser(data.user);
        setSession(data.session);

        // Ensure profile record in public.profiles table
        const prof = await ensureProfile({
          id: data.user.id,
          email: data.user.email,
          user_metadata: { full_name: fullName.trim() },
        });
        setProfile(prof);

        // Seed initial categories
        await seedDefaultCategories(data.user.id);
      }

      return { error: null, user: data.user };
    } catch (err: any) {
      return { error: err, user: null };
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      localStorage.removeItem('smart_expense_demo_mode');
      setUser(null);
      setProfile(null);
      return;
    }

    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const enterDemoMode = () => {
    setIsDemoMode(true);
    localStorage.setItem('smart_expense_demo_mode', 'true');
    setUser(DEMO_USER);
    setProfile(DEMO_PROFILE);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem('smart_expense_demo_mode');
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user && supabase) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isDemoMode,
        supabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        enterDemoMode,
        exitDemoMode,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
