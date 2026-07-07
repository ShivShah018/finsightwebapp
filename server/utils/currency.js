let ratesCache = {};
let lastFetch = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

const HARDCODED_RATES = {
  INR: 1.0,
  USD: 0.012,
  NPR: 1.60
};

const SYMBOLS = {
  INR: '₹',
  USD: '$',
  NPR: 'रु'
};

const CURRENCY_NAMES = ['INR', 'USD', 'NPR'];

async function getRates() {
  const now = Date.now();
  if (lastFetch && (now - lastFetch < CACHE_DURATION) && Object.keys(ratesCache).length > 0) {
    return ratesCache;
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/INR');
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    const data = await response.json();
    
    const rates = { INR: 1.0 };
    for (const cur of CURRENCY_NAMES) {
      if (cur !== 'INR' && data.rates && data.rates[cur]) {
        rates[cur] = data.rates[cur];
      }
    }
    ratesCache = rates;
    lastFetch = now;
  } catch (error) {
    console.warn('Failed to fetch live rates, using hardcoded fallback:', error.message);
    ratesCache = { ...HARDCODED_RATES };
    lastFetch = now;
  }

  return ratesCache;
}

function getConversionNote(fromCur, toCur, rates) {
  const toRate = rates[toCur] || 1.0;
  const fromRate = rates[fromCur] || 1.0;
  const rate = toRate / fromRate;
  return `1 ${fromCur} ≈ ${rate.toFixed(4)} ${toCur}`;
}

module.exports = {
  getRates,
  getConversionNote,
  SYMBOLS,
  CURRENCY_NAMES
};
