import React, { useState, useEffect } from 'react';
import { X, IndianRupee, Calendar, Target, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { Budget } from '../../types/database';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose, budgetToEdit }) => {
  const { user } = useAuth();
  const { categories, handleAddBudget, handleEditBudget, handleDeleteBudget } = useFinance();

  const isEditing = Boolean(budgetToEdit);

  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [threshold, setThreshold] = useState<number>(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.category_id);
      setAmount(String(budgetToEdit.amount));
      setMonth(budgetToEdit.month.slice(0, 7));
      setThreshold(budgetToEdit.threshold || 80);
    } else {
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setAmount('');
      setMonth(new Date().toISOString().slice(0, 7));
      setThreshold(80);
    }
    setErrorMsg(null);
  }, [budgetToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!user) {
      setErrorMsg('Please log in before managing budgets.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please specify a positive budget limit amount.');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Please select a category for this budget.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && budgetToEdit) {
        await handleEditBudget(budgetToEdit.id, {
          category_id: categoryId,
          amount: numericAmount,
          month: `${month}-01`,
          threshold,
        });
      } else {
        await handleAddBudget({
          category_id: categoryId,
          amount: numericAmount,
          month: `${month}-01`,
          threshold,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!budgetToEdit) return;
    if (window.confirm('Delete this budget limit?')) {
      setIsSubmitting(true);
      try {
        await handleDeleteBudget(budgetToEdit.id);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete budget');
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
              {isEditing ? 'Edit Category Budget' : 'Create Monthly Budget'}
            </h3>
            <p className="text-xs text-slate-400">Enforce spending caps with threshold notifications</p>
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

          {/* Category selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Monthly Cap Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Monthly Cap (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="1"
                min="1"
                required
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Target Month */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Budget Month</label>
            <input
              type="month"
              required
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Threshold slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-300">Warning Alert Threshold</span>
              <span className="font-mono text-cyan-400 font-semibold">{threshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              A notification will trigger once your spending crosses {threshold}% of this budget.
            </p>
          </div>

          {/* Footer buttons */}
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
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Budget' : 'Save Budget'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
