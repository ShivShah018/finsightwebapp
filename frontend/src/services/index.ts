import { apiClient } from '../api/apiClient';
import type { 
  Transaction, 
  Category, 
  Goal, 
  Budget, 
  BudgetUtilization, 
  DashboardSummary, 
  SpendingPrediction, 
  SpendingCluster 
} from '../types';

export const TransactionService = {
  getAll: async (month?: number, year?: number, limit = 500) => {
    const params: any = { limit };
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await apiClient.get<{ transactions: Transaction[]; total: number }>('/transactions', { params });
    return res.data;
  },

  getById: async (id: number) => {
    const res = await apiClient.get<Transaction>(`/transactions/${id}`);
    return res.data;
  },

  create: async (data: {
    category_id: number;
    amount: number;
    type: 'income' | 'expense';
    description?: string;
    currency?: string;
    transaction_date: string;
    is_bill?: boolean;
  }) => {
    const res = await apiClient.post('/transactions', data);
    return res.data;
  },

  update: async (id: number, data: Partial<Omit<Transaction, 'id' | 'category_name'>>) => {
    const res = await apiClient.put(`/transactions/${id}`, data);
    return res.data;
  },

  delete: async (id: number, soft = true) => {
    const res = await apiClient.delete(`/transactions/${id}`, { params: { soft } });
    return res.data;
  },

  restore: async (id: number) => {
    const res = await apiClient.post(`/transactions/${id}/restore`);
    return res.data;
  },

  getDeletedRecent: async () => {
    const res = await apiClient.get<Transaction[]>('/transactions/deleted/recent');
    return res.data;
  },
};

export const CategoryService = {
  getAll: async (type?: 'income' | 'expense') => {
    const params: any = {};
    if (type) params.type = type;
    const res = await apiClient.get<Category[]>('/categories', { params });
    return res.data;
  },
};

export const GoalService = {
  getAll: async () => {
    const res = await apiClient.get<Goal[]>('/goals');
    return res.data;
  },

  create: async (data: {
    name: string;
    target_amount: number;
    deadline?: string;
    auto_fund_amount?: number;
    auto_fund_category_id?: number;
  }) => {
    const res = await apiClient.post('/goals', data);
    return res.data;
  },

  fund: async (id: number, amount: number) => {
    const res = await apiClient.post(`/goals/${id}/fund`, { amount });
    return res.data;
  },

  complete: async (id: number) => {
    const res = await apiClient.post(`/goals/${id}/complete`);
    return res.data;
  },

  cancel: async (id: number) => {
    const res = await apiClient.post(`/goals/${id}/cancel`);
    return res.data;
  },
};

export const BudgetService = {
  getAll: async () => {
    const res = await apiClient.get<Budget[]>('/budgets');
    return res.data;
  },

  setLimit: async (data: { category_id: number; monthly_limit: number }) => {
    const res = await apiClient.post('/budgets', data);
    return res.data;
  },

  updateLimit: async (id: number, monthly_limit: number) => {
    const res = await apiClient.put(`/budgets/${id}`, { monthly_limit });
    return res.data;
  },

  delete: async (id: number) => {
    const res = await apiClient.delete(`/budgets/${id}`);
    return res.data;
  },

  getUtilization: async (month?: number, year?: number) => {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await apiClient.get<BudgetUtilization[]>('/budgets/utilization', { params });
    return res.data;
  },

  getSpendingByCategory: async (month?: number, year?: number) => {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await apiClient.get<{ category_name: string; amount: number }[]>('/budgets/spending', { params });
    return res.data;
  },
};

export const AnalyticsService = {
  getDashboard: async (month?: number, year?: number) => {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await apiClient.get<DashboardSummary>('/dashboard', { params });
    return res.data;
  },

  getTrends: async (months = 12) => {
    const res = await apiClient.get<{ month: string; income: number; expense: number }[]>('/analytics/trends', {
      params: { months },
    });
    return res.data;
  },

  getSummary: async (month?: number, year?: number) => {
    const params: any = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const res = await apiClient.get<{ total_income: number; total_expense: number; net_savings: number }>('/analytics/summary', { params });
    return res.data;
  },
};

export const InsightService = {
  predict: async () => {
    const res = await apiClient.get<SpendingPrediction>('/insights/predict');
    return res.data;
  },

  suggestCategory: async (description: string) => {
    const res = await apiClient.get<{ category: string | null; category_id: number | null; score: number }>('/insights/suggest-category', {
      params: { description },
    });
    return res.data;
  },

  getClusters: async () => {
    const res = await apiClient.get<SpendingCluster[]>('/insights/cluster');
    return res.data;
  },

  getAll: async () => {
    const res = await apiClient.get<{
      transactions: Transaction[];
      goals: Goal[];
      budgets: Budget[];
      prediction: SpendingPrediction;
      clusters: SpendingCluster[];
    }>('/insights/all');
    return res.data;
  },
};

export const ReportService = {
  generate: async (emailTo?: string) => {
    const params: any = {};
    if (emailTo) params.email_to = emailTo;
    const res = await apiClient.post<{ path: string; message: string }>('/report/generate', {}, { params });
    return res.data;
  },
};
