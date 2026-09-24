import React, { useState } from 'react';
import { Plus, Tags, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { renderCategoryIcon } from '../../lib/utils/iconMap';
import { Category } from '../../types/database';
import { CategoryModal } from './CategoryModal';

export const CategoryView: React.FC = () => {
  const { categories, transactions, handleDeleteCategory } = useFinance();
  const { formatCurrency } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate total spending per category
  const categorySpendingMap = React.useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.category_id) {
        const curr = map.get(tx.category_id) || { total: 0, count: 0 };
        curr.total += Number(tx.amount);
        curr.count += 1;
        map.set(tx.category_id, curr);
      }
    }
    return map;
  }, [transactions]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const onDelete = async (cat: Category) => {
    setErrorMessage(null);
    const usage = categorySpendingMap.get(cat.id);
    if (usage && usage.count > 0) {
      setErrorMessage(
        `Cannot delete "${cat.name}": it is currently assigned to ${usage.count} transaction(s). Reassign or delete those transactions first.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      try {
        await handleDeleteCategory(cat.id);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to delete category');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Categories</h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize transactions and budgets with custom taxonomy and spending aggregates
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm shadow-cyan-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Category</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Safety Guard Triggered</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const spendingData = categorySpendingMap.get(cat.id) || { total: 0, count: 0 };
          return (
            <div
              key={cat.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  >
                    {renderCategoryIcon(cat.icon, { className: 'w-5 h-5' })}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Edit category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(cat)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1">{cat.name}</h3>
                <p className="text-[11px] text-slate-500">
                  {spendingData.count} transaction{spendingData.count === 1 ? '' : 's'} logged
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Spent</span>
                <span className="font-mono text-xs font-semibold text-white tabular-nums">
                  {formatCurrency(spendingData.total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryToEdit={editingCategory}
      />
    </div>
  );
};
