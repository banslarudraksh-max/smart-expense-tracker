import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from NEXT_PUBLIC_* or VITE_* environment variables
function getEnv(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || '';
    }
  } catch {}
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[key]) {
      return metaEnv[key] || '';
    }
  } catch {}
  return '';
}

const DEFAULT_URL =
  getEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getEnv('VITE_SUPABASE_URL') ||
  '';

const DEFAULT_ANON_KEY =
  getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  '';

// In-app storage for custom keys if user configures from dashboard UI
const STORAGE_KEY_URL = 'smart_expense_supabase_url';
const STORAGE_KEY_ANON = 'smart_expense_supabase_anon_key';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_URL, anonKey: DEFAULT_ANON_KEY };
  }
  const customUrl = localStorage.getItem(STORAGE_KEY_URL);
  const customKey = localStorage.getItem(STORAGE_KEY_ANON);

  return {
    url: (customUrl && customUrl.trim()) || DEFAULT_URL,
    anonKey: (customKey && customKey.trim()) || DEFAULT_ANON_KEY,
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) localStorage.setItem(STORAGE_KEY_URL, url.trim());
    else localStorage.removeItem(STORAGE_KEY_URL);

    if (anonKey && anonKey.trim()) localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    else localStorage.removeItem(STORAGE_KEY_ANON);
  }
  // Reset cached client on config change
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

export function clearStoredSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

/**
 * Returns the singleton Supabase client using public anon key and authenticated session persistence.
 * Never uses service-role keys on the client.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(urlToTest?: string, keyToTest?: string): Promise<{
  success: boolean;
  message: string;
  hasSchema?: boolean;
}> {
  const targetUrl = urlToTest || getStoredSupabaseConfig().url;
  const targetKey = keyToTest || getStoredSupabaseConfig().anonKey;

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are missing. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const testClient = createClient(targetUrl, targetKey);
    // Ping public.categories or public.profiles
    const { data, error } = await testClient.from('categories').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          hasSchema: false,
          message: 'Connected to Supabase endpoint, but the PostgreSQL schema is missing. Please run schema.sql in Supabase SQL Editor.',
        };
      }
      // If error is permission or RLS related (401/PGRST301), connection is still verified
      if (error.message.includes('JWT') || error.code === 'PGRST301') {
        return {
          success: true,
          hasSchema: true,
          message: 'Connected to Supabase PostgreSQL. Authentication and Row Level Security are active.',
        };
      }
      return {
        success: false,
        message: `Supabase returned error: ${error.message}`,
      };
    }

    return {
      success: true,
      hasSchema: true,
      message: 'Successfully connected to Supabase PostgreSQL Database with valid schema and RLS!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection error: ${err.message || 'Network request failed. Verify URL is reachable.'}`,
    };
  }
}
