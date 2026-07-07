require('dotenv').config();
const app = require('./app');

const PORT = process.env.API_PORT || 8000;
const HOST = process.env.API_HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`FinSight Express API running on http://${HOST}:${PORT}`);
  console.log(`Health Check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
