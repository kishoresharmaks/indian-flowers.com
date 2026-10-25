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
  PR: 'Puerto Rico',
  VI: 'Virgin Islands',
  GU: 'Guam',
};

export interface StateZipRange {
  ranges: [number, number][];
  label: string;
}

export const US_STATE_ZIP_PREFIXES: Record<string, StateZipRange> = {
  AL: { ranges: [[350, 369]], label: '350–369' },
  AK: { ranges: [[995, 999]], label: '995–999' },
  AZ: { ranges: [[850, 865]], label: '850–865' },
  AR: { ranges: [[716, 729], [755, 755]], label: '716–729' },
  CA: { ranges: [[900, 961]], label: '900–961' },
  CO: { ranges: [[800, 816]], label: '800–816' },
  CT: { ranges: [[60, 69]], label: '060–069' },
  DE: { ranges: [[197, 199]], label: '197–199' },
  DC: { ranges: [[200, 205], [569, 569]], label: '200–205' },
  FL: { ranges: [[320, 349]], label: '320–349' },
  GA: { ranges: [[300, 319], [398, 399]], label: '300–319, 398–399' },
  HI: { ranges: [[967, 968]], label: '967–968' },
  ID: { ranges: [[832, 838]], label: '832–838' },
  IL: { ranges: [[600, 629]], label: '600–629' },
  IN: { ranges: [[460, 479]], label: '460–479' },
  IA: { ranges: [[500, 528]], label: '500–528' },
  KS: { ranges: [[660, 679]], label: '660–679' },
  KY: { ranges: [[400, 427]], label: '400–427' },
  LA: { ranges: [[700, 714]], label: '700–714' },
  ME: { ranges: [[39, 49]], label: '039–049' },
  MD: { ranges: [[206, 219]], label: '206–219' },
  MA: { ranges: [[10, 27], [55, 55]], label: '010–027' },
  MI: { ranges: [[480, 499]], label: '480–499' },
  MN: { ranges: [[550, 567]], label: '550–567' },
  MS: { ranges: [[386, 397]], label: '386–397' },
  MO: { ranges: [[630, 658]], label: '630–658' },
  MT: { ranges: [[590, 599]], label: '590–599' },
  NE: { ranges: [[680, 693]], label: '680–693' },
  NV: { ranges: [[889, 898]], label: '889–898' },
  NH: { ranges: [[30, 38]], label: '030–038' },
  NJ: { ranges: [[70, 89]], label: '070–089' },
  NM: { ranges: [[870, 884]], label: '870–884' },
  NY: { ranges: [[5, 5], [63, 63], [100, 149]], label: '100–149' },
  NC: { ranges: [[270, 289]], label: '270–289' },
  ND: { ranges: [[580, 588]], label: '580–588' },
  OH: { ranges: [[430, 459]], label: '430–459' },
  OK: { ranges: [[730, 749]], label: '730–749' },
  OR: { ranges: [[970, 979]], label: '970–979' },
  PA: { ranges: [[150, 196]], label: '150–196' },
  RI: { ranges: [[28, 29]], label: '028–029' },
  SC: { ranges: [[290, 299]], label: '290–299' },
  SD: { ranges: [[570, 577]], label: '570–577' },
  TN: { ranges: [[370, 385]], label: '370–385' },
  TX: { ranges: [[750, 799], [885, 885]], label: '750–799' },
  UT: { ranges: [[840, 847]], label: '840–847' },
  VT: { ranges: [[50, 59]], label: '050–059' },
  VA: { ranges: [[201, 201], [220, 246]], label: '201, 220–246' },
  WA: { ranges: [[980, 994]], label: '980–994' },
  WV: { ranges: [[247, 268]], label: '247–268' },
  WI: { ranges: [[530, 549]], label: '530–549' },
  WY: { ranges: [[820, 831]], label: '820–831' },
  PR: { ranges: [[6, 7], [9, 9]], label: '006, 007, 009' },
  VI: { ranges: [[8, 8]], label: '008' },
  GU: { ranges: [[969, 969]], label: '969' },
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

export interface ZipValidationResult {
  isValid: boolean;
  error?: string;
  detectedStateCode?: string;
  detectedStateName?: string;
  suggestedState?: string;
  isIndianPinCode?: boolean;
}

/**
 * Finds all US states matching a 3-digit prefix or 5-digit ZIP code.
 */
export function findStatesForZipPrefix(prefixStr: string): string[] {
  const num = parseInt(prefixStr.slice(0, 3), 10);
  if (isNaN(num)) return [];
  const matches: string[] = [];
  for (const [stateCode, info] of Object.entries(US_STATE_ZIP_PREFIXES)) {
    for (const [min, max] of info.ranges) {
      if (num >= min && num <= max) {
        matches.push(stateCode);
        break;
      }
    }
  }
  return matches;
}

/**
 * Comprehensive validation for US ZIP codes against format, valid postal prefixes,
 * and matching with the user-selected US state.
 *
 * Provides instant, user-friendly error messages specifically highlighting:
 * - When an Indian 6-digit PIN code is entered (e.g. 636102 or other 6-digit codes)
 * - When a specific Indian PIN prefix like 63610 is entered
 * - When a ZIP code belongs to another US state than the one selected
 * - When an invalid or unassigned postal prefix is entered
 */
export function validateZipForState(
  zip?: string | null,
  stateCode?: string | null
): ZipValidationResult {
  if (!zip || typeof zip !== 'string') {
    return { isValid: false, error: 'ZIP code is required.' };
  }

  const raw = zip.trim();
  if (!raw) {
    return { isValid: false, error: 'ZIP code is required.' };
  }

  const digits = raw.replace(/\D/g, '');

  // 1. Detect 6-digit PIN codes (Indian postal PIN codes, e.g. 636101, 600001, 560001)
  if (digits.length === 6) {
    return {
      isValid: false,
      isIndianPinCode: true,
      error: 'Please enter a 5-digit US ZIP code. 6-digit Indian PIN codes cannot be used for US delivery.',
    };
  }

  // 2. Reject non-digits or incomplete lengths
  if (!/^\d{5}(-\d{4})?$/.test(raw)) {
    if (digits.length < 5) {
      return {
        isValid: false,
        error: `Please enter a complete 5-digit US ZIP code (e.g., 94538). Entered ${digits.length} digit${digits.length === 1 ? '' : 's'}.`,
      };
    }
    if (digits.length > 5 && digits.length !== 9) {
      return {
        isValid: false,
        error: 'Please enter a valid 5-digit US ZIP code (e.g., 94538) or 9-digit ZIP+4 (e.g., 94538-1234).',
      };
    }
    return {
      isValid: false,
      error: 'ZIP code must contain 5 digits only (e.g., 94538).',
    };
  }

  const fiveDigit = digits.slice(0, 5);

  // 3. Reject all zeroes
  if (fiveDigit === '00000') {
    return { isValid: false, error: '00000 is not a valid US postal ZIP code.' };
  }

  // 4. Special friendly handling for 63610 (Salem/Attur TN pincode pattern or MO unassigned)
  const is63610Pattern = fiveDigit === '63610';

  // 5. Check if prefix belongs to any valid US state
  const matchingStates = findStatesForZipPrefix(fiveDigit);

  if (matchingStates.length === 0) {
    return {
      isValid: false,
      error: `${fiveDigit} is not a recognized US postal ZIP code. Please enter a valid 5-digit US ZIP code.`,
    };
  }

  const primaryDetectedState = matchingStates[0];
  const detectedName = US_STATES[primaryDetectedState] || primaryDetectedState;

  // 6. Check state alignment if stateCode is provided
  if (stateCode) {
    const normalizedSelected = normalizeStateCode(stateCode);
    if (normalizedSelected) {
      if (!matchingStates.includes(normalizedSelected)) {
        const selectedStateName = US_STATES[normalizedSelected] || normalizedSelected;
        const expectedPrefixes = US_STATE_ZIP_PREFIXES[normalizedSelected]?.label || '';

        let errorMsg = `ZIP code ${fiveDigit} belongs to ${detectedName} (${primaryDetectedState}), not ${selectedStateName} (${normalizedSelected}). Valid ${selectedStateName} ZIP codes start with ${expectedPrefixes}.`;

        if (is63610Pattern) {
          errorMsg = `ZIP code ${fiveDigit} does not match ${selectedStateName} (${normalizedSelected}). Valid ${selectedStateName} ZIP codes start with ${expectedPrefixes}. (Note: Indian PIN codes like Salem 63610x cannot be used for US delivery).`;
        }

        return {
          isValid: false,
          error: errorMsg,
          detectedStateCode: primaryDetectedState,
          detectedStateName: detectedName,
          suggestedState: primaryDetectedState,
        };
      }
    }
  }

  // 7. If state was MO and 63610 was entered: 63610 is an unassigned USPS code in MO
  if (is63610Pattern && stateCode && normalizeStateCode(stateCode) === 'MO') {
    return {
      isValid: false,
      error: '63610 is not an active US ZIP code. If you are entering an Indian PIN code (such as Salem 63610x), please note that Indian-Flowers.com only delivers within the United States.',
    };
  }

  return {
    isValid: true,
    detectedStateCode: primaryDetectedState,
    detectedStateName: detectedName,
  };
}

/**
 * Validates US ZIP code formats (5-digit or 9-digit ZIP+4) and optional state alignment.
 */
export function isValidUSZip(zip: string, stateCode?: string): boolean {
  if (!zip || typeof zip !== 'string') return false;
  return validateZipForState(zip, stateCode).isValid;
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

  const zipCheck = validateZipForState(address.zipCode, normalizedState || address.state);
  if (!zipCheck.isValid) {
    errors.push(zipCheck.error || 'A valid 5-digit US ZIP Code (or ZIP+4) is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
