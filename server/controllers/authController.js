const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, seedCategories } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'finsight-jwt-secret-change-in-production';
const JWT_EXPIRATION_MINUTES = parseInt(process.env.JWT_EXPIRATION_MINUTES || '1440', 10);

function createAccessToken(userId, email) {
  const expires = Math.floor(Date.now() / 1000) + (JWT_EXPIRATION_MINUTES * 60);
  return jwt.sign({ sub: userId.toString(), email, exp: expires }, JWT_SECRET);
}

const authController = {
  register: async (req, res) => {
    let connection;
    try {
      const { full_name, email, password } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ detail: 'Missing required fields' });
      }

      const trimmedName = full_name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Check if user already exists
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [trimmedEmail]
      );

      if (existingUsers.length > 0) {
        connection.release();
        return res.status(409).json({ detail: 'Email already registered.' });
      }

      // Hash password and insert
      const passwordHash = await bcrypt.hash(password, 10);
      const [result] = await connection.execute(
        'INSERT INTO users (full_name, email, password_hash, currency, preferred_currency) VALUES (?, ?, ?, ?, ?)',
        [trimmedName, trimmedEmail, passwordHash, 'USD', 'INR']
      );

      const userId = result.insertId;

      // Seed categories
      await seedCategories(connection, userId);

      await connection.commit();
      connection.release();

      const token = createAccessToken(userId, trimmedEmail);

      return res.status(200).json({
        access_token: token,
        user_id: userId,
        name: trimmedName,
        email: trimmedEmail
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      console.error('Register error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ detail: 'Missing email or password' });
      }

      const trimmedEmail = email.trim().toLowerCase();

      const [rows] = await pool.execute(
        'SELECT id, full_name, email, password_hash FROM users WHERE email = ?',
        [trimmedEmail]
      );

      if (rows.length === 0) {
        return res.status(401).json({ detail: 'Invalid email or password.' });
      }

      const user = rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ detail: 'Invalid email or password.' });
      }

      const token = createAccessToken(user.id, user.email);

      return res.status(200).json({
        access_token: token,
        user_id: user.id,
        name: user.full_name,
        email: user.email
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = req.user;
      return res.status(200).json({
        user_id: user.id,
        name: user.full_name,
        email: user.email,
        currency: user.preferred_currency
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  }
};

module.exports = authController;
