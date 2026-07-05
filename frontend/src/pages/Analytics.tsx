import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsService, InsightService } from '../services';
import { useAuth } from '../contexts/AuthContext';
import { fmt } from '../utils/currency';
import { useRates } from '../hooks/useRates';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';
import { Brain, AlertCircle } from 'lucide-react';
import { tooltipStyle, tooltipLabelStyle } from '../utils/theme';

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { rates } = useRates();
  const cur = user?.currency || 'INR';

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

  const allMonths: { month: string; income: number; expense: number; net: number }[] = [];
  const trendMap = new Map((trends || []).map((m: any) => [m.month, m]));
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = trendMap.get(key);
    allMonths.push({
      month: key,
      income: existing?.income ?? 0,
      expense: existing?.expense ?? 0,
      net: (existing?.income ?? 0) - (existing?.expense ?? 0),
    });
  }
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
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Insights</h1>
        <p className="text-sm text-slate-400">Discover long-term cashflow patterns and spending behaviors.</p>
      </div>

      {/* Cashflow monthly difference chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Monthly Cashflow Difference</h3>
          <p className="text-xs text-slate-500">Net savings (income − expenses) each month. Green means surplus, red means deficit.</p>
        </div>
        <div className="h-96 w-full">
          {allMonths.every(m => m.income === 0 && m.expense === 0) ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">No trend details available.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allMonths}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v, cur, rates, 'INR')} />
                <Tooltip 
                  contentStyle={tooltipStyle()}
                  labelStyle={tooltipLabelStyle()}
                  itemStyle={{ color: 'inherit' }}
                  formatter={(value) => fmt(Number(value) || 0, cur, rates, 'INR')}
                />
                <Bar dataKey="net" radius={[4, 4, 0, 0]} name="Net Savings">
                  {allMonths.map((d, i) => (
                    <Cell key={i} fill={d.net >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Spending Behavior Groups */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-slate-200">Spending Behavior Groups</h3>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Groups your monthly spending into behavioral categories based on frequency and average transaction sizes.
        </p>

        {!clusters || clusters.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse" />
            Not enough data to identify spending groups. Add more transaction history across multiple months.
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
                    <span className="font-semibold text-slate-200">{fmt(cluster.total_amount, cur, rates)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Average Transaction</span>
                    <span className="font-semibold text-slate-200">{fmt(cluster.avg_amount, cur, rates)}</span>
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
