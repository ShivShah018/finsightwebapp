const fs = require('fs');
const { pool } = require('../db');
const { generatePdfReport } = require('../utils/reportGenerator');

const analyticsController = {
  getDashboard: async (req, res) => {
    try {
      const userId = req.user.id;
      const today = new Date();
      if (req.query.month && (isNaN(parseInt(req.query.month, 10)) || parseInt(req.query.month, 10) < 1 || parseInt(req.query.month, 10) > 12)) {
        return res.status(400).json({ detail: 'Invalid month parameter' });
      }
      if (req.query.year && (isNaN(parseInt(req.query.year, 10)) || parseInt(req.query.year, 10) < 1970)) {
        return res.status(400).json({ detail: 'Invalid year parameter' });
      }
      const month = req.query.month ? parseInt(req.query.month, 10) : today.getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year, 10) : today.getFullYear();

      // 1. Get transaction summary (income, expense)
      const [summaryRows] = await pool.execute(`
        SELECT type, COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE user_id = ? AND deleted_at IS NULL
          AND YEAR(transaction_date) = ? AND MONTH(transaction_date) = ?
        GROUP BY type
      `, [userId, year, month]);

      let income = 0;
      let expense = 0;
      summaryRows.forEach(r => {
        if (r.type === 'income') income = parseFloat(r.total);
        if (r.type === 'expense') expense = parseFloat(r.total);
      });

      const netSavings = income - expense;
      const savingsRate = income > 0 ? Math.round((netSavings / income) * 100 * 100) / 100 : 0;

      // Get total days in month
      const totalDays = new Date(year, month, 0).getDate();
      const avgDailySpending = totalDays > 0 ? Math.round((expense / totalDays) * 100) / 100 : 0;

      // 2. Get spending by category
      const [spendingRows] = await pool.execute(`
        SELECT c.name, c.color, c.icon, COALESCE(SUM(t.amount), 0) AS total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'expense' AND t.deleted_at IS NULL
          AND YEAR(t.transaction_date) = ? AND MONTH(t.transaction_date) = ?
        GROUP BY c.id
        ORDER BY total DESC
      `, [userId, year, month]);

      const topCategories = spendingRows.map(c => ({
        name: c.name,
        color: c.color,
        icon: c.icon,
        total: parseFloat(c.total),
        percentage: expense > 0 ? Math.round((parseFloat(c.total) / expense) * 100 * 100) / 100 : 0
      }));

      // 3. Get monthly trends (last 12 months)
      const [trendRows] = await pool.execute(`
        SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
               COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) AS income,
               COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expense
        FROM transactions
        WHERE user_id = ? AND deleted_at IS NULL
          AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
        ORDER BY month
      `, [userId]);

      const monthlyTrends = trendRows.map(t => ({
        month: t.month,
        income: parseFloat(t.income),
        expense: parseFloat(t.expense),
        net: parseFloat(t.income) - parseFloat(t.expense)
      }));

      // 4. Get budget utilization
      const [budgetRows] = await pool.execute(`
        SELECT b.id, b.category_id, b.monthly_limit, c.name AS category_name,
               COALESCE(SUM(t.amount), 0) AS spent
        FROM budget_limits b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t ON t.category_id = c.id
          AND t.user_id = ? AND t.type = 'expense' AND t.deleted_at IS NULL
          AND YEAR(t.transaction_date) = ? AND MONTH(t.transaction_date) = ?
        WHERE b.user_id = ?
        GROUP BY b.id, b.category_id, b.monthly_limit, c.name
      `, [userId, year, month, userId]);

      const budgetUtilization = {};
      budgetRows.forEach(r => {
        const limit = parseFloat(r.monthly_limit);
        const spent = parseFloat(r.spent);
        const percentage = limit > 0 ? Math.round((spent / limit) * 100 * 10) / 10 : 0;

        budgetUtilization[r.category_name] = {
          id: r.id,
          category_id: r.category_id,
          category_name: r.category_name,
          limit,
          spent,
          percentage
        };
      });

      // 5. Get largest expenses (top 5)
      const [largestRows] = await pool.execute(`
        SELECT t.id, t.amount, t.description, t.transaction_date, c.name AS category_name
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'expense' AND t.deleted_at IS NULL
        ORDER BY t.amount DESC LIMIT 5
      `, [userId]);

      const largestExpenses = largestRows.map(r => ({
        id: r.id,
        amount: parseFloat(r.amount),
        description: r.description,
        transaction_date: r.transaction_date,
        category_name: r.category_name
      }));

      const incomeExpenseRatio = expense > 0 ? Math.round((income / expense) * 100) / 100 : null;

      return res.status(200).json({
        total_income: income,
        total_expense: expense,
        net_savings: netSavings,
        savings_rate: savingsRate,
        avg_daily_spending: avgDailySpending,
        top_categories: topCategories,
        monthly_trends: monthlyTrends,
        budget_utilization: budgetUtilization,
        largest_expenses: largestExpenses,
        income_expense_ratio: incomeExpenseRatio
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  },

  getTrends: async (req, res) => {
    try {
      const userId = req.user.id;
      if (req.query.months && (isNaN(parseInt(req.query.months, 10)) || parseInt(req.query.months, 10) < 1)) {
        return res.status(400).json({ detail: 'Invalid months parameter' });
      }
      const months = parseInt(req.query.months || '12', 10);

      const [rows] = await pool.execute(`
        SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
               COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) AS income,
               COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS expense
        FROM transactions
        WHERE user_id = ? AND deleted_at IS NULL
          AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
        ORDER BY month
      `, [userId, months]);

      const trends = rows.map(t => ({
        month: t.month,
        income: parseFloat(t.income),
        expense: parseFloat(t.expense)
      }));

      return res.status(200).json(trends);
    } catch (error) {
      console.error('Get trends error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  },

  generateReport: async (req, res) => {
    try {
      const user = req.user;

      // Fetch export data: transactions, goals, budgets
      const [txRows] = await pool.execute(`
        SELECT t.id, t.category_id, c.name AS category_name, 
               t.amount, t.type, t.currency, t.description, t.transaction_date
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.deleted_at IS NULL
        ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT 5000
      `, [user.id]);

      const transactions = txRows.map(r => ({
        ...r,
        amount: parseFloat(r.amount)
      }));

      const [goalRows] = await pool.execute(`
        SELECT id, name, target_amount, current_amount, deadline, status
        FROM savings_goals
        WHERE user_id = ? AND status != 'cancelled'
        ORDER BY created_at DESC
      `, [user.id]);

      const goals = goalRows.map(r => {
        const target = parseFloat(r.target_amount);
        const current = parseFloat(r.current_amount);
        const pct = target > 0 ? (current / target) * 100 : 0;
        return {
          ...r,
          target_amount: target,
          current_amount: current,
          progress_pct: Math.round(Math.min(pct, 100) * 10) / 10
        };
      });

      const [budgetRows] = await pool.execute(`
        SELECT b.id, b.category_id, c.name AS category_name, b.monthly_limit
        FROM budget_limits b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ?
      `, [user.id]);

      const budgets = budgetRows.map(r => ({
        ...r,
        monthly_limit: parseFloat(r.monthly_limit)
      }));

      const path = await generatePdfReport(user, transactions, goals, budgets);

      if (req.query.download === 'true') {
        const filename = `finsight_statement_${new Date().toISOString().slice(0, 10)}.pdf`;
        return res.download(path, filename, (err) => {
          if (err) {
            console.error('Download error:', err);
          }
          fs.unlink(path, (err) => {
            if (err) console.error('Failed to delete temp PDF file:', err);
          });
        });
      }

      return res.status(200).json({
        path,
        message: `Report generated at ${path}`
      });
    } catch (error) {
      console.error('Generate report error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  }
};

module.exports = analyticsController;
