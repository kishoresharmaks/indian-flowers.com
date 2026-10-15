/**
 * US Tax Jurisdiction & Address Validation Helpers
 * Strict validation for US 2-letter state codes and 5-digit / ZIP+4 formats.
 * Preserves leading zeroes for Northeast ZIP codes (e.g. 07001, 01234).
 */

import { TaxAddress } from './types';

export const US_STATES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

// States with NO state-level general sales tax ("NOMAD" states)
// NOTE: Alaska has NO state tax, but allows LOCAL borough/city sales taxes up to 7.85%!
// Delaware, Montana, New Hampshire, Oregon have 0% general sales tax.
export const STATES_WITHOUT_STATEWIDE_SALES_TAX = ['AK', 'DE', 'MT', 'NH', 'OR'];

/**
 * Validates a 2-letter US State Code (case-insensitive).
 */
export function isValidUSState(stateCode: string): boolean {
  if (!stateCode || typeof stateCode !== 'string') return false;
  const upper = stateCode.trim().toUpperCase();
  return Boolean(US_STATES[upper]);
}

/**
 * Normalizes input state to 2-letter uppercase state code.
 * Handles full names like "California" or codes like "ca".
 */
export function normalizeStateCode(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();

  if (US_STATES[upper]) return upper;

  // Search by full name
  const lower = trimmed.toLowerCase();
  for (const [code, name] of Object.entries(US_STATES)) {
    if (name.toLowerCase() === lower) {
      return code;
    }
  }

  return null;
}

/**
 * Validates US ZIP code formats:
 * - 5-digit: e.g. "94538" or "07001" (preserves leading zeroes)
 * - 9-digit ZIP+4: e.g. "94538-1234"
 */
export function isValidUSZip(zip: string): boolean {
  if (!zip || typeof zip !== 'string') return false;
  const trimmed = zip.trim();
  const fiveDigitRegex = /^\d{5}$/;
  const nineDigitRegex = /^\d{5}-\d{4}$/;
  return fiveDigitRegex.test(trimmed) || nineDigitRegex.test(trimmed);
}

/**
 * Formats or cleans a US ZIP code string, ensuring leading zeroes are preserved.
 */
export function formatUSZip(zip: string): string {
  if (!zip) return '';
  const trimmed = String(zip).trim();
  // If user entered 9 digits without dash, e.g. 945381234 -> 94538-1234
  if (/^\d{9}$/.test(trimmed)) {
    return `${trimmed.slice(0, 5)}-${trimmed.slice(5)}`;
  }
  return trimmed;
}

/**
 * Validates a complete US shipping address for checkout and tax calculation.
 */
export function validateTaxAddress(address: Partial<TaxAddress>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!address.streetAddress || address.streetAddress.trim().length < 3) {
    errors.push('Street address is required.');
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.push('City is required.');
  }

  const normalizedState = address.state ? normalizeStateCode(address.state) : null;
  if (!normalizedState) {
    errors.push('A valid 2-letter US State is required.');
  }

  if (!address.zipCode || !isValidUSZip(address.zipCode)) {
    errors.push('A valid 5-digit US ZIP Code (or ZIP+4) is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
