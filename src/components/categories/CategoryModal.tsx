import React, { useState, useEffect } from 'react';
import { X, Tag, AlertCircle, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Category } from '../../types/database';
import { CATEGORY_ICON_LIST } from '../../lib/utils/iconMap';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
}

const COLOR_PRESETS = [
  '#f97316', // Orange (Food)
  '#3b82f6', // Blue (Transport)
  '#ec4899', // Pink (Shopping)
  '#eab308', // Amber (Bills)
  '#8b5cf6', // Purple (Entertainment)
  '#10b981', // Emerald (Education)
  '#ef4444', // Red (Health)
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#6366f1', // Indigo
  '#64748b', // Slate
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
}) => {
  const { handleAddCategory, handleEditCategory, handleDeleteCategory } = useFinance();

  const isEditing = Boolean(categoryToEdit);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setIcon(categoryToEdit.icon || 'HelpCircle');
      setColor(categoryToEdit.color || '#3b82f6');
    } else {
      setName('');
      setIcon('Utensils');
      setColor('#3b82f6');
    }
    setErrorMsg(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please specify a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && categoryToEdit) {
        await handleEditCategory(categoryToEdit.id, {
          name: name.trim(),
          icon,
          color,
        });
      } else {
        await handleAddCategory({
          name: name.trim(),
          icon,
          color,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToEdit) return;
    if (window.confirm(`Delete category "${categoryToEdit.name}"?`)) {
      setIsSubmitting(true);
      try {
        await handleDeleteCategory(categoryToEdit.id);
        onClose();
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete category');
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
              {isEditing ? 'Edit Category' : 'Create Custom Category'}
            </h3>
            <p className="text-xs text-slate-400">Organize expenses and budgets in Supabase</p>
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

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Subscriptions, Fitness, Travel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Category Icon</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
              {CATEGORY_ICON_LIST.map((item) => {
                const IconComponent = item.component;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    title={item.label}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Theme Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
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
                {isSubmitting ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
