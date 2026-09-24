import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
};

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (t: Theme) => void;
  currency: CurrencyCode;
  currencySymbol: string;
  setCurrency: (c: CurrencyCode) => void;
  formatCurrency: (amount: number) => string;
  dateFormat: string;
  setDateFormat: (f: string) => void;
  formatDate: (dateStr: string) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('smart_expense_theme') as Theme) || 'dark';
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem('smart_expense_currency') as CurrencyCode;
    // Default to INR if not set or previously set to USD
    if (!stored || stored === 'USD') return 'INR';
    return stored;
  });

  const [dateFormat, setDateFormatState] = useState<string>(() => {
    return localStorage.getItem('smart_expense_date_format') || 'DD/MM/YYYY';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (target: 'dark' | 'light') => {
      setResolvedTheme(target);
      if (target === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(systemDark ? 'dark' : 'light');

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('smart_expense_theme', t);
  };

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem('smart_expense_currency', c);
  };

  const setDateFormat = (f: string) => {
    setDateFormatState(f);
    localStorage.setItem('smart_expense_date_format', f);
  };

  const currencySymbol = CURRENCY_CONFIGS[currency]?.symbol || '₹';

  const formatCurrency = (amount: number): string => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const locale = currency === 'INR' ? 'en-IN' : undefined;
    const formatted = Math.abs(safeAmount).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${safeAmount < 0 ? '-' : ''}${currencySymbol}${formatted}`;
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.slice(0, 10).split('-');
      if (!year || !month || !day) return dateStr;

      if (dateFormat === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
      } else if (dateFormat === 'MM/DD/YYYY') {
        return `${month}/${day}/${year}`;
      }
      return `${year}-${month}-${day}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        currency,
        currencySymbol,
        setCurrency,
        formatCurrency,
        dateFormat,
        setDateFormat,
        formatDate,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
