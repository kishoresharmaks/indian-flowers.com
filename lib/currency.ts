export const STORE_CURRENCY = 'USD' as const;
export const STORE_LOCALE = 'en-US' as const;

const currencyFormatter = new Intl.NumberFormat(STORE_LOCALE, {
  style: 'currency',
  currency: STORE_CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const teens = [
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowThousandToWords(value: number): string {
  let remaining = value;
  let result = '';

  if (remaining >= 100) {
    result += `${ones[Math.floor(remaining / 100)]} Hundred`;
    remaining %= 100;
    if (remaining > 0) result += ' ';
  }

  if (remaining >= 10 && remaining < 20) {
    result += teens[remaining - 10];
    return result;
  }

  if (remaining >= 20) {
    result += tens[Math.floor(remaining / 10)];
    remaining %= 10;
    if (remaining > 0) result += ` ${ones[remaining]}`;
    return result;
  }

  if (remaining > 0) {
    result += ones[remaining];
  }

  return result;
}

function integerToWords(value: number): string {
  if (value === 0) return 'Zero';

  let remaining = value;
  const parts: string[] = [];
  const scales = [
    { size: 1_000_000_000, label: 'Billion' },
    { size: 1_000_000, label: 'Million' },
    { size: 1_000, label: 'Thousand' },
    { size: 1, label: '' },
  ];

  for (const scale of scales) {
    const chunk = Math.floor(remaining / scale.size);
    if (chunk > 0) {
      const words = belowThousandToWords(chunk);
      parts.push(scale.label ? `${words} ${scale.label}` : words);
      remaining %= scale.size;
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return currencyFormatter.format(0);
  }

  return currencyFormatter.format(numericAmount);
}

export function numberToWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'Zero Dollars only';

  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  const dollarWords = integerToWords(dollars);
  const dollarLabel = dollars === 1 ? 'Dollar' : 'Dollars';

  if (cents > 0) {
    const centWords = integerToWords(cents);
    const centLabel = cents === 1 ? 'Cent' : 'Cents';
    return `${dollarWords} ${dollarLabel} and ${centWords} ${centLabel} only`;
  }

  return `${dollarWords} ${dollarLabel} only`;
}