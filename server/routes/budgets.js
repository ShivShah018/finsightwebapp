const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.get('/', budgetController.listBudgets);
router.post('/', budgetController.setBudget);
router.get('/utilization', budgetController.getUtilization);
router.put('/:budget_id', budgetController.updateBudget);
router.delete('/:budget_id', budgetController.deleteBudget);

module.exports = router;
