export interface User {
  user_id: number;
  name: string;
  email: string;
  currency: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: number;
  category_id: number;
  category_name: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  transaction_date: string;
  currency: 'INR' | 'USD' | 'NPR';
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  status: 'active' | 'completed' | 'cancelled';
  progress_pct: number;
}

export interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  monthly_limit: number;
}

export interface BudgetUtilization {
  id: number;
  category_id: number;
  category_name: string;
  monthly_limit: number;
  spent: number;
  pct: number;
}

export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  savings_rate: number;
  recent_transactions: Transaction[];
  upcoming_bills: Transaction[];
  top_categories: { category_name: string; amount: number; pct: number }[];
  budget_utilization: BudgetUtilization[];
  monthly_trends: { month: string; income: number; expense: number }[];
}

export interface SpendingPrediction {
  next_month_prediction: number;
  confidence_score: number;
  trend: 'up' | 'down' | 'stable';
  message: string;
}

export interface SpendingCluster {
  cluster_id: number;
  name: string;
  count: number;
  total_amount: number;
  avg_amount: number;
  categories: string[];
}
