const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function getDbConfig() {
  const mysqlUrl = process.env.MYSQL_URL;
  if (mysqlUrl) {
    const parsed = new URL(mysqlUrl);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port, 10) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    };
  }

  return {
    host: process.env.MYSQL_HOST || process.env.FINSIGHT_DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.FINSIGHT_DB_PORT || '3306', 10),
    user: process.env.MYSQL_USER || process.env.FINSIGHT_DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.FINSIGHT_DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.FINSIGHT_DB_NAME || 'finsight',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true
  };
}

const pool = mysql.createPool(getDbConfig());

async function initializeSchema() {
  let conn;
  try {
    conn = await mysql.createConnection({ ...getDbConfig(), multipleStatements: true });
    const schemaPath = path.join(__dirname, 'database', 'schema_railway.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await conn.query(sql);
      console.log('Database schema initialized successfully');
    }
  } catch (err) {
    console.error('Schema initialization error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

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
  seedCategories,
  initializeSchema
};
