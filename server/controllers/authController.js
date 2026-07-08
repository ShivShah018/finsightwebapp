const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool, seedCategories } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'finsight-jwt-secret-change-in-production';
const JWT_EXPIRATION_MINUTES = parseInt(process.env.JWT_EXPIRATION_MINUTES || '1440', 10);
const RESET_TOKEN_EXPIRY_HOURS = 1;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function createAccessToken(userId, email) {
  const expires = Math.floor(Date.now() / 1000) + (JWT_EXPIRATION_MINUTES * 60);
  return jwt.sign({ sub: userId.toString(), email, exp: expires }, JWT_SECRET);
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
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

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ detail: 'Email is required' });
      }

      const trimmedEmail = email.trim().toLowerCase();

      const [rows] = await pool.execute(
        'SELECT id, full_name FROM users WHERE email = ?',
        [trimmedEmail]
      );

      if (rows.length > 0) {
        const user = rows[0];
        const token = generateResetToken();
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        await pool.execute(
          'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
          [user.id, token, expiresAt]
        );

        const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
        console.log(`Password reset link for ${trimmedEmail}: ${resetLink}`);

        return res.status(200).json({
          detail: 'If an account with that email exists, a reset link has been generated.',
          reset_link: resetLink,
          token: token
        });
      }

      return res.status(200).json({
        detail: 'If an account with that email exists, a reset link has been generated.'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ detail: 'Token and new password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ detail: 'Password must be at least 6 characters' });
      }

      const [rows] = await pool.execute(
        'SELECT id, user_id FROM password_resets WHERE token = ? AND expires_at > NOW()',
        [token]
      );

      if (rows.length === 0) {
        return res.status(400).json({ detail: 'Invalid or expired reset token.' });
      }

      const resetRecord = rows[0];
      const passwordHash = await bcrypt.hash(password, 10);

      await pool.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, resetRecord.user_id]
      );

      await pool.execute(
        'DELETE FROM password_resets WHERE id = ?',
        [resetRecord.id]
      );

      return res.status(200).json({ detail: 'Password has been reset successfully.' });
    } catch (error) {
      console.error('Reset password error:', error);
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
