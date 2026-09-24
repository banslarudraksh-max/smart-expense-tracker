import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { renderCategoryIcon } from '../../lib/utils/iconMap';
import { Transaction, TransactionType } from '../../types/database';

interface TransactionListProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onOpenAddModal,
  onEditTransaction,
}) => {
  const { transactions, categories, handleDeleteTransaction } = useFinance();
  const { formatCurrency, formatDate } = useTheme();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Client-side filtering & sorting
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // Category match
      if (selectedCategory !== 'all' && tx.category_id !== selectedCategory) return false;

      // Date range match
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesCat = tx.category?.name.toLowerCase().includes(q) || false;
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
        if (!matchesDesc && !matchesCat && !matchesNotes) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount);
      return b.date.localeCompare(a.date); // date_desc
    });
  }, [transactions, selectedType, selectedCategory, startDate, endDate, searchQuery, sortBy]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['ID', 'Type', 'Amount', 'Description', 'Category', 'Date', 'Notes'];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.type,
      tx.amount,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${(tx.category?.name || 'Uncategorized').replace(/"/g, '""')}"`,
      tx.date,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smart_expense_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Transactions</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ledger synced with Supabase PostgreSQL and Row Level Security
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search description, category, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Type filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            Date Span:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
          />
          {(startDate || endDate || selectedType !== 'all' || selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedType('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-cyan-400 hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Transaction Records Table / Cards */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 space-y-2">
            <p>No transaction records match the current filter criteria.</p>
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors inline-block"
            >
              Record Transaction
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400">
                    <th className="py-3 px-4 font-medium">Transaction</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium">Notes</th>
                    <th className="py-3 px-4 font-medium text-right">Amount</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === 'income';
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => onEditTransaction(tx)}
                      >
                        <td className="py-3.5 px-4 font-medium text-white">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: tx.category?.color ? `${tx.category.color}15` : isIncome ? '#10b98115' : '#ef444415',
                                borderColor: tx.category?.color ? `${tx.category.color}40` : isIncome ? '#10b98140' : '#ef444440',
                                color: tx.category?.color || (isIncome ? '#10b981' : '#ef4444'),
                              }}
                            >
                              {isIncome ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                              ) : (
                                renderCategoryIcon(tx.category?.icon, { className: 'w-4 h-4' })
                              )}
                            </div>
                            <span className="truncate group-hover:text-cyan-400 transition-colors">
                              {tx.description}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {tx.category ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: tx.category.color || '#3b82f6' }}
                              />
                              {tx.category.name}
                            </span>
                          ) : (
                            <span className="text-slate-500">{isIncome ? 'Income Source' : 'General'}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {formatDate(tx.date)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 truncate max-w-xs text-[11px]">
                          {tx.notes || '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums">
                          <span className={isIncome ? 'text-emerald-400' : 'text-slate-100'}>
                            {isIncome ? '+' : '-'}
                            {formatCurrency(Number(tx.amount))}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Cards stack, zero horizontal scroll) */}
            <div className="md:hidden divide-y divide-slate-800/60">
              {filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    onClick={() => onEditTransaction(tx)}
                    className="p-4 flex flex-col gap-2 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: tx.category?.color ? `${tx.category.color}15` : isIncome ? '#10b98115' : '#ef444415',
                            borderColor: tx.category?.color ? `${tx.category.color}40` : isIncome ? '#10b98140' : '#ef444440',
                            color: tx.category?.color || (isIncome ? '#10b981' : '#ef4444'),
                          }}
                        >
                          {isIncome ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                          ) : (
                            renderCategoryIcon(tx.category?.icon, { className: 'w-4 h-4' })
                          )}
                        </div>
                        <span className="font-medium text-white text-xs truncate">
                          {tx.description}
                        </span>
                      </div>

                      <span
                        className={`font-mono font-semibold text-xs tabular-nums shrink-0 ${
                          isIncome ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(Number(tx.amount))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.category?.name || (isIncome ? 'Income' : 'General')}</span>
                        <span>·</span>
                        <span className="font-mono">{formatDate(tx.date)}</span>
                      </div>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="text-cyan-400 text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <span>·</span>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-rose-400 text-xs hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
