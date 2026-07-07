const express = require('express');
const router = express.Router();
const { insightController } = require('../controllers/insightController');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.get('/predict', insightController.predictSpending);
router.get('/suggest-category', insightController.suggestCategory);
router.get('/cluster', insightController.getClusters);
router.get('/all', insightController.getAllInsights);

module.exports = router;
