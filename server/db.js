const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.FINSIGHT_DB_HOST || 'localhost',
  port: parseInt(process.env.FINSIGHT_DB_PORT || '3306', 10),
  user: process.env.FINSIGHT_DB_USER || 'root',
  password: process.env.FINSIGHT_DB_PASSWORD || '',
  database: process.env.FINSIGHT_DB_NAME || 'finsight',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

// Seed default categories
const DEFAULT_INCOME_CATEGORIES = [
  ['Salary', '💵', '#22c55e'],
  ['Freelance', '💻', '#3b82f6'],
  ['Investments', '📈', '#a855f7'],
  ['Other Income', '💵', '#06b6d4'],
];

const DEFAULT_EXPENSE_CATEGORIES = [
  ['Food & Dining', '🍲', '#ef4444'],
  ['Rent', '🏠', '#f97316'],
  ['Transport', '🚗', '#eab308'],
  ['Utilities', '💡', '#64748b'],
  ['Entertainment', '🎬', '#ec4899'],
  ['Healthcare', '🏥', '#14b8a6'],
  ['Shopping', '🛍️', '#8b5cf6'],
  ['Education', '📚', '#6366f1'],
  ['Other', '📁', '#78716c'],
];

async function seedCategories(connection, userId) {
  for (const [name, icon, color] of DEFAULT_INCOME_CATEGORIES) {
    await connection.execute(
      'INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      [userId, name, 'income', icon, color]
    );
  }
  for (const [name, icon, color] of DEFAULT_EXPENSE_CATEGORIES) {
    await connection.execute(
      'INSERT INTO categories (user_id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      [userId, name, 'expense', icon, color]
    );
  }
}

module.exports = {
  pool,
  seedCategories
};
