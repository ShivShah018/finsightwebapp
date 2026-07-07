const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../utils/authMiddleware');

router.use(authMiddleware);

router.get('/', goalController.listGoals);
router.post('/', goalController.createGoal);
router.put('/:goal_id', goalController.updateGoal);
router.post('/:goal_id/fund', goalController.fundGoal);
router.post('/:goal_id/complete', goalController.completeGoal);
router.post('/:goal_id/cancel', goalController.cancelGoal);
router.delete('/:goal_id', goalController.deleteGoal);

module.exports = router;
