const { getRates, SYMBOLS, CURRENCY_NAMES, getConversionNote } = require('../utils/currency');

const currencyController = {
  getRates: async (req, res) => {
    try {
      const fromCur = req.query.from_cur || 'INR';
      const amount = parseFloat(req.query.amount || '1.0');

      const rates = await getRates();
      const result = {};

      CURRENCY_NAMES.forEach(cur => {
        const r = rates[cur] !== undefined ? rates[cur] : 1.0;
        result[cur] = {
          rate: r,
          symbol: SYMBOLS[cur] || cur,
          name: cur
        };
      });

      const notes = {};
      CURRENCY_NAMES.forEach(cur => {
        if (cur !== fromCur) {
          notes[cur] = getConversionNote(fromCur, cur, rates);
        }
      });

      return res.status(200).json({
        base: fromCur,
        rates: result,
        notes
      });
    } catch (error) {
      console.error('Get currency rates error:', error);
      return res.status(500).json({ detail: 'Internal server error' });
    }
  }
};

module.exports = currencyController;
