import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsService, InsightService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { Brain, AlertCircle } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { user } = useAuth();

  // Queries
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: () => AnalyticsService.getTrends(12),
  });

  const { data: clusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['insights', 'clusters'],
    queryFn: () => InsightService.getClusters(),
    retry: false,
  });

  const fmt = (val: number) => {
    const symbol = user?.currency === 'USD' ? '$' : user?.currency === 'NPR' ? 'रु' : '₹';
    return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
  };

  const isLoading = trendsLoading || clustersLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-slate-900 rounded-lg w-1/4"></div>
        <div className="h-96 bg-slate-900 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-900 rounded-2xl"></div>
          <div className="h-48 bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & AI Insights</h1>
        <p className="text-sm text-slate-400">Discover long-term cashflow patterns and ML-clustered spending behaviors.</p>
      </div>

      {/* Cashflow Trends double bar chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Annual Cash Flow (Income vs Expenses)</h3>
          <p className="text-xs text-slate-500">Comparing inflows vs outflows over the past 12 months.</p>
        </div>
        <div className="h-96 w-full">
          {!trends || trends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">No trend details available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => { const sym = user?.currency === 'USD' ? '$' : user?.currency === 'NPR' ? 'रु' : '₹'; return `${sym}${v}`; }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Spending Behavior Groups (K-Means Clustering) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-slate-200">Spending Behavior Groups</h3>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          K-Means clustering groups your monthly transactions into categories based on spending frequency and average transaction sizes.
        </p>

        {!clusters || clusters.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
            Not enough data to calculate spending clusters. Please add more transaction history across multiple dates.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clusters.map((cluster) => (
              <div 
                key={cluster.cluster_id} 
                className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700/60 transition-all duration-300 shadow-xl"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg">
                      Group #{cluster.cluster_id + 1}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {cluster.count} purchases
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-bold text-white mb-1">{cluster.name}</h4>
                  <p className="text-xs text-slate-500 mb-4 truncate">
                    Categories: {cluster.categories.join(', ')}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800/60">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Spent</span>
                    <span className="font-semibold text-slate-200">{fmt(cluster.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Average Transaction</span>
                    <span className="font-semibold text-slate-200">{fmt(cluster.avg_amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
