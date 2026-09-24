import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar, NavigationRoute } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionModal } from './components/transactions/TransactionModal';
import { BudgetList } from './components/budgets/BudgetList';
import { BudgetModal } from './components/budgets/BudgetModal';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CategoryView } from './components/categories/CategoryView';
import { SettingsView } from './components/settings/SettingsView';
import { SupabaseSetupModal } from './components/layout/SupabaseSetupModal';
import { Transaction, Budget } from './types/database';

type AppView = 'landing' | 'login' | 'signup' | NavigationRoute;

const MainContent: React.FC = () => {
  const { user, isDemoMode, loading: authLoading, enterDemoMode } = useAuth();
  const { loading: financeLoading } = useFinance();

  // App routing state
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const isAuthenticated = Boolean(user) || isDemoMode;

  // Handle URL hash routing and transitions
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (['dashboard', 'transactions', 'budgets', 'analytics', 'categories', 'settings'].includes(hash)) {
        if (isAuthenticated) {
          setCurrentView(hash as NavigationRoute);
        } else {
          setCurrentView('login');
        }
      } else if (hash === 'signup') {
        setCurrentView('signup');
      } else if (hash === '' || hash === 'login') {
        setCurrentView('login');
      } else if (hash === 'landing') {
        setCurrentView('landing');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isAuthenticated]);

  // Synchronize hash with currentView
  const navigateTo = (view: AppView) => {
    setCurrentView(view);
    window.location.hash = `#/${view}`;
  };

  // If user logs in, immediately redirect to /dashboard
  useEffect(() => {
    if (isAuthenticated && (currentView === 'landing' || currentView === 'login' || currentView === 'signup')) {
      navigateTo('dashboard');
    }
  }, [isAuthenticated]);

  // If user logs out or unauthenticated, redirect to /login
  useEffect(() => {
    if (!isAuthenticated && !authLoading && currentView !== 'login' && currentView !== 'signup' && currentView !== 'landing') {
      navigateTo('login');
    }
  }, [isAuthenticated, authLoading, currentView]);

  // Handlers for transactions
  const handleOpenAddTransaction = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  // Handlers for budgets
  const handleOpenAddBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  };

  const handleEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setIsBudgetModalOpen(true);
  };

  // Loading indicator for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold animate-pulse">
            F
          </div>
          <span className="text-xs font-mono text-slate-400">Initializing Supabase Session...</span>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated Public Pages
  if (!isAuthenticated) {
    if (currentView === 'login') {
      return (
        <>
          <LoginPage
            onNavigateToSignup={() => navigateTo('signup')}
            onExploreDemo={() => {
              enterDemoMode();
              navigateTo('dashboard');
            }}
            onOpenSupabaseSetup={() => setIsSupabaseModalOpen(true)}
            onNavigateToLanding={() => navigateTo('landing')}
          />
          <SupabaseSetupModal
            isOpen={isSupabaseModalOpen}
            onClose={() => setIsSupabaseModalOpen(false)}
          />
        </>
      );
    }

    if (currentView === 'signup') {
      return (
        <>
          <SignupPage
            onNavigateToLogin={() => navigateTo('login')}
            onExploreDemo={() => {
              enterDemoMode();
              navigateTo('dashboard');
            }}
            onOpenSupabaseSetup={() => setIsSupabaseModalOpen(true)}
            onNavigateToLanding={() => navigateTo('landing')}
          />
          <SupabaseSetupModal
            isOpen={isSupabaseModalOpen}
            onClose={() => setIsSupabaseModalOpen(false)}
          />
        </>
      );
    }

    // Default: Landing Page
    return (
      <>
        <LandingPage
          onStartTracking={() => navigateTo('signup')}
          onExploreDemo={() => {
            enterDemoMode();
            navigateTo('dashboard');
          }}
          onOpenLogin={() => navigateTo('login')}
          onOpenSupabaseSetup={() => setIsSupabaseModalOpen(true)}
        />
        <SupabaseSetupModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
        />
      </>
    );
  }

  // 2. Authenticated App Layout (Protected routes)
  const currentRoute = (['dashboard', 'transactions', 'budgets', 'analytics', 'categories', 'settings'].includes(currentView)
    ? currentView
    : 'dashboard') as NavigationRoute;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-cyan-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={(route) => navigateTo(route)}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenSupabaseSetup={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          currentRoute={currentRoute}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAddTransaction={handleOpenAddTransaction}
          onOpenSupabaseSetup={() => setIsSupabaseModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {currentRoute === 'dashboard' && (
            <DashboardView
              onNavigateToTransactions={() => navigateTo('transactions')}
              onNavigateToBudgets={() => navigateTo('budgets')}
              onOpenAddTransaction={handleOpenAddTransaction}
              onEditTransaction={handleEditTransaction}
              onOpenSupabaseSetup={() => setIsSupabaseModalOpen(true)}
            />
          )}

          {currentRoute === 'transactions' && (
            <TransactionList
              onOpenAddModal={handleOpenAddTransaction}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {currentRoute === 'budgets' && (
            <BudgetList
              onOpenAddBudget={handleOpenAddBudget}
              onEditBudget={handleEditBudget}
            />
          )}

          {currentRoute === 'analytics' && <AnalyticsView />}

          {currentRoute === 'categories' && <CategoryView />}

          {currentRoute === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        transactionToEdit={editingTx}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        budgetToEdit={editingBudget}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <MainContent />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
