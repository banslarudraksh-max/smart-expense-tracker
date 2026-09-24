import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Calendar, Tag, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/database';
import { renderCategoryIcon } from '../../lib/utils/iconMap';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
}) => {
  const { user, isDemoMode } = useAuth();
  const { categories, handleAddTransaction, handleEditTransaction, handleDeleteTransaction } = useFinance();

  const isEditing = Boolean(transactionToEdit);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setDescription(transactionToEdit.description);
      setCategoryId(transactionToEdit.category_id || '');
      setDate(transactionToEdit.date);
      setNotes(transactionToEdit.notes || '');
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
    setErrorMsg(null);
  }, [transactionToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Verify that a logged-in Supabase user exists before inserting
    if (!user) {
      setErrorMsg('Please log in before adding a transaction.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid positive number for amount.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please provide a description or merchant name.');
      return;
    }

    if (!date) {
      setErrorMsg('Please select a date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && transactionToEdit) {
        await handleEditTransaction(transactionToEdit.id, {
          type,
          amount: numericAmount,
          description: description.trim(),
          category_id: type === 'expense' ? categoryId || null : null,
          date,
          notes: notes.trim() || null,
        });
      } else {
        await handleAddTransaction({
          type,
          amount: numericAmount,
          description: description.trim(),
          category_id: type === 'expense' ? categoryId || null : null,
          date,
          notes: notes.trim() || null,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionToEdit) return;
    if (window.confirm('Are you sure you want to delete this transaction from Supabase?')) {
      setIsSubmitting(true);
      try {
        await handleDeleteTransaction(transactionToEdit.id);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete transaction');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <h3 className="text-base font-semibold text-white">
              {isEditing ? 'Edit Transaction' : 'Record New Transaction'}
            </h3>
            <p className="text-xs text-slate-400">Directly syncs to Supabase PostgreSQL</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Segmented Control */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Debit / Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Credit / Income
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Amount (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono text-base focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description / Merchant
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Whole Foods Groceries, Client Retainer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Category selection (shown for expenses) */}
          {type === 'expense' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date picker */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Date</label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Notes <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Receipt details, invoice reference or tags..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Entry' : 'Save to Supabase'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
