import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CategoryService } from '../services';
import { Tags, AlertCircle, Info } from 'lucide-react';

export const Categories: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoryService.getAll(),
  });

  const filteredCategories = categories?.filter((cat) => {
    return filterType === 'all' || cat.type === filterType;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Categories</h1>
        <p className="text-sm text-slate-400">View and explore income and expense categories configured for your account.</p>
      </div>

      {/* Filter tabs */}
      <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-2xl shadow-xl flex justify-between items-center">
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase border transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5" />
          <span>Default categories are auto-generated on sign up.</span>
        </div>
      </div>

      {/* Categories Grid list */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span>Loading categories...</span>
        </div>
      ) : error ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <span>Failed to load categories.</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-20 text-center text-slate-500">No categories found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700/60 hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
            >
              {/* Icon / Color representation */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase text-slate-100 shadow-sm"
                style={{ 
                  backgroundColor: cat.color ? `${cat.color}15` : '#8b5cf615',
                  color: cat.color || '#c084fc',
                  border: `1px solid ${cat.color ? `${cat.color}30` : '#8b5cf630'}`
                }}
              >
                {cat.icon || <Tags className="w-5 h-5" />}
              </div>

              <div>
                <h3 className="font-semibold text-slate-200 text-sm">{cat.name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  cat.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {cat.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
