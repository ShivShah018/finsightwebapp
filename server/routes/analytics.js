const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.get('/trends', analyticsController.getTrends);

module.exports = router;
