const express = require('express');
const cors = require('cors');
const authMiddleware = require('./utils/authMiddleware');

// Import routers & controllers
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');
const goalsRouter = require('./routes/goals');
const budgetsRouter = require('./routes/budgets');
const analyticsRouter = require('./routes/analytics');
const insightsRouter = require('./routes/insights');

const transactionController = require('./controllers/transactionController');
const analyticsController = require('./controllers/analyticsController');
const currencyController = require('./controllers/currencyController');

const app = express();

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    version: '2.0.0'
  });
});

// Top-level unauthenticated routes
app.get('/currency/rates', currencyController.getRates);

// Mounted routes
app.use('/auth', authRouter);
app.use('/transactions', transactionsRouter);
app.use('/goals', goalsRouter);
app.use('/budgets', budgetsRouter);
app.use('/analytics', analyticsRouter);
app.use('/insights', insightsRouter);

// Top-level authenticated routes
app.get('/categories', authMiddleware, transactionController.listCategories);
app.get('/dashboard', authMiddleware, analyticsController.getDashboard);
app.post('/report/generate', authMiddleware, analyticsController.generateReport);

// Global Exception Handler
app.use((err, req, res, next) => {
  console.error('Global unhandled exception:', err);
  return res.status(500).json({
    detail: 'Internal server error'
  });
});

module.exports = app;
