import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionService, ReportService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Trash2, 
  RotateCcw, 
  Download, 
  FileText, 
  AlertCircle,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(new Date().getFullYear());
  const [showSoftDeleted, setShowSoftDeleted] = useState(false);

  // Queries
  const { data: txData, isLoading, error } = useQuery({
    queryKey: ['transactions', selectedMonth, selectedYear],
    queryFn: () => TransactionService.getAll(selectedMonth, selectedYear),
  });

  const { data: deletedTxs } = useQuery({
    queryKey: ['transactions', 'deleted'],
    queryFn: () => TransactionService.getDeletedRecent(),
    enabled: showSoftDeleted,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => TransactionService.delete(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction deleted (can be restored)');
    },
    onError: () => {
      toast.error('Failed to delete transaction.');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => TransactionService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction restored!');
    },
    onError: () => {
      toast.error('Failed to restore transaction.');
    }
  });

  const exportPdfMutation = useMutation({
    mutationFn: () => ReportService.generate(),
    onSuccess: (data) => {
      toast.success(`PDF report generated successfully! File saved: ${data.path}`);
    },
    onError: () => {
      toast.error('Failed to export PDF.');
    }
  });

  // Filters & Search
  const transactions = txData?.transactions || [];
  const filtered = transactions.filter((tx) => {
    const matchesSearch = 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Export CSV
  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.error('No transactions to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Currency'];
    const rows = filtered.map(tx => [
      tx.id,
      tx.transaction_date,
      tx.type,
      tx.category_name,
      tx.description || '',
      tx.amount,
      tx.currency
    ]);

    const escapeCsv = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
    const csvContent = [headers.join(','), ...rows.map(e => e.map(escapeCsv).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finSight_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV export completed.');
  };

  const fmt = (val: number) => {
    const symbol = user?.currency === 'USD' ? '$' : user?.currency === 'NPR' ? '₨' : '₹';
    return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Transactions</h1>
          <p className="text-sm text-slate-400">View, search, and manage all your cash inflow and outflow logs.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportPdfMutation.mutate()}
            disabled={exportPdfMutation.isPending}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm px-4 py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600/30 transition-all"
          />
        </div>

        {/* Type toggle buttons */}
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold uppercase border transition-all cursor-pointer ${
                typeFilter === t
                  ? 'bg-purple-600/20 text-purple-400 border-purple-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Date Filters and Undo Options */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => {
              const monthNum = i + 1;
              const isFuture = !!(selectedYear && selectedYear >= new Date().getFullYear() && monthNum > new Date().getMonth() + 1);
              return (
                <option key={monthNum} value={monthNum} disabled={isFuture}>
                  {new Date(0, i).toLocaleString('en', { month: 'short' })}
                </option>
              );
            })}
          </select>

          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="">All Years</option>
            {(() => {
              const currentYear = new Date().getFullYear();
              const years = [];
              for (let y = currentYear - 3; y <= currentYear; y++) years.push(y);
              return years;
            })().map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          <button
            onClick={() => setShowSoftDeleted(!showSoftDeleted)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              showSoftDeleted 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Delete</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {showSoftDeleted ? (
        /* Soft Deleted Transactions list */
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-400">Recently Deleted (Undo actions)</h3>
            <button 
              onClick={() => setShowSoftDeleted(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {!deletedTxs || deletedTxs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">No recently deleted transactions.</div>
            ) : (
              deletedTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-slate-200 font-semibold">{tx.description || tx.category_name}</p>
                    <p className="text-[10px] text-slate-500">{new Date(tx.transaction_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400 font-semibold">{fmt(tx.amount)}</span>
                    <button
                      onClick={() => restoreMutation.mutate(tx.id)}
                      className="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-all cursor-pointer"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Main Transactions Data Table */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <span>Fetching logs...</span>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <span>Failed to fetch transaction logs.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No transactions matching your criteria. Try adjusting filters or creating a new transaction.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6">Type</th>
                    <th className="py-4 px-6">Amount</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-all">
                      <td className="py-3.5 px-6 font-medium text-slate-400">
                        {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3.5 px-6 font-semibold">{tx.category_name}</td>
                      <td className="py-3.5 px-6 text-slate-300 max-w-xs truncate">{tx.description || '-'}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`py-3.5 px-6 font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {tx.type === 'expense' ? '-' : ''}{fmt(tx.amount)}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <button
                          onClick={() => deleteMutation.mutate(tx.id)}
                          className="p-2 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
