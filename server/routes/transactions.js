const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../utils/authMiddleware');

// Mount auth middleware globally for transactions
router.use(authMiddleware);

router.get('/', transactionController.listTransactions);
router.post('/', transactionController.createTransaction);
router.get('/deleted/recent', transactionController.getDeleted);
router.get('/:tx_id', transactionController.getTransaction);
router.put('/:tx_id', transactionController.updateTransaction);
router.delete('/:tx_id', transactionController.deleteTransaction);
router.post('/:tx_id/restore', transactionController.restoreTransaction);

module.exports = router;
