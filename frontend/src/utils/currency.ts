export const SYMBOLS: Record<string, string> = {
  INR: '\u20B9',
  USD: '$',
  NPR: '\u0930\u0941',
};

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;
  const amountInINR = amount / fromRate;
  return toCurrency === 'INR' ? amountInINR : amountInINR * toRate;
}

export function fmt(
  amount: number,
  targetCurrency: string,
  rates: Record<string, number>,
  sourceCurrency?: string,
): string {
  const converted = convertAmount(amount, sourceCurrency || 'INR', targetCurrency, rates);
  const sym = SYMBOLS[targetCurrency] || targetCurrency;
  return `${sym}${converted.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
