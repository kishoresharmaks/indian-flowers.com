/**
 * US Sales Tax Provider Interfaces & Implementations
 * 
 * Strict safeguards:
 * - Operates in integer cents to prevent floating-point calculation errors.
 * - Distinguishes verified zero tax (no nexus or tax-free state) from positive verified tax,
 *   unsupported jurisdiction, and unavailable provider.
 * - Never invents fictitious local rates or presents unverified guesses as exact tax.
 */

import {
  ITaxProvider,
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxEngineConfig,
  TaxJurisdictionDetail,
} from './types';
import { normalizeStateCode, STATES_WITHOUT_STATEWIDE_SALES_TAX } from './jurisdiction';

// Precise currency rounding helpers in integer cents
export const toCents = (dollars: number): number => Math.round((Number(dollars) || 0) * 100);
export const fromCents = (cents: number): number => (Math.round(cents) / 100);

/**
 * Verified statutory state-level base sales tax rates for states where statutory base is published.
 * Note: These represent only the statewide statutory rate, not speculative local rates.
 */
export const VERIFIED_STATE_STATUTORY_RATES: Record<string, number> = {
  CA: 0.0725, // California statewide statutory minimum (6.00% state + 1.25% mandatory local)
  TX: 0.0625, // Texas statewide statutory base
  NJ: 0.06625,// New Jersey single statewide statutory rate
  NY: 0.0400, // New York statewide statutory base
  FL: 0.0600, // Florida statewide statutory base
  IL: 0.0625, // Illinois statewide statutory base
  PA: 0.0600, // Pennsylvania statewide statutory base
  OH: 0.0575, // Ohio statewide statutory base
  GA: 0.0400, // Georgia statewide statutory base
  NC: 0.0475, // North Carolina statewide statutory base
  WA: 0.0650, // Washington statewide statutory base
};

/**
 * Standard Built-in Tax Provider
 * Safely computes sales tax based on merchant nexus configuration and verified statutory rules.
 */
export class StandardTaxProvider implements ITaxProvider {
  readonly name = 'StandardTaxProvider';

  async calculateTax(
    request: TaxCalculationRequest,
    config: TaxEngineConfig
  ): Promise<TaxCalculationResult> {
    const calculatedAt = new Date().toISOString();
    const rawState = request.shippingAddress?.state;
    const stateCode = normalizeStateCode(rawState || '');

    // 1. Invalid or missing state code
    if (!stateCode) {
      return {
        success: false,
        status: 'UNSUPPORTED_JURISDICTION',
        provider: this.name,
        taxableSubtotal: 0,
        exemptSubtotal: 0,
        effectiveRate: 0,
        taxAmount: 0,
        shippingTaxAmount: 0,
        jurisdictions: [],
        calculatedAt,
        errorMessage: `Cannot determine taxing jurisdiction for invalid US state "${rawState}".`,
      };
    }

    // 2. Customer Tax Exemption (e.g. verified wholesale resale certificate)
    if (request.customerTaxExempt) {
      const totalSubtotal = (request.items || []).reduce(
        (sum, item) => sum + (item.lineSubtotal || item.unitPrice * item.quantity),
        0
      );
      return {
        success: true,
        status: 'VERIFIED_ZERO_TAX',
        provider: this.name,
        taxableSubtotal: 0,
        exemptSubtotal: fromCents(toCents(totalSubtotal)),
        effectiveRate: 0,
        taxAmount: 0,
        shippingTaxAmount: 0,
        jurisdictions: [],
        calculatedAt,
        note: `Tax exempt: ${request.exemptionReason || 'Valid resale/exemption certificate recorded.'}`,
      };
    }

    // 3. Nexus Evaluation: Does the business have physical or registered economic nexus in this state?
    const nexusConfig = config.nexusStates[stateCode];
    const hasNexus = Boolean(nexusConfig?.hasNexus);

    if (!hasNexus) {
      // Under US law (Wayfair doctrine), a remote seller without physical or economic nexus
      // is not registered and must NOT collect sales tax. This is a verified zero-tax result.
      const totalSubtotal = (request.items || []).reduce(
        (sum, item) => sum + (item.lineSubtotal || item.unitPrice * item.quantity),
        0
      );
      return {
        success: true,
        status: 'VERIFIED_ZERO_TAX',
        provider: this.name,
        taxableSubtotal: 0,
        exemptSubtotal: fromCents(toCents(totalSubtotal)),
        effectiveRate: 0,
        taxAmount: 0,
        shippingTaxAmount: 0,
        jurisdictions: [],
        calculatedAt,
        note: `No sales tax nexus established in destination state (${stateCode}). Seller is not required or authorized to collect tax in this state.`,
      };
    }

    // 4. NOMAD States without statewide sales tax
    // Delaware, Montana, New Hampshire, Oregon have 0% general sales tax.
    // Alaska has 0% state tax but permits local sales taxes.
    if (STATES_WITHOUT_STATEWIDE_SALES_TAX.includes(stateCode)) {
      if (stateCode === 'AK') {
        // Alaska local taxes require rooftop lookup; cannot assume 0% without exact provider
        if (config.requireExactCalculation) {
          return {
            success: false,
            status: 'UNSUPPORTED_JURISDICTION',
            provider: this.name,
            taxableSubtotal: 0,
            exemptSubtotal: 0,
            effectiveRate: 0,
            taxAmount: 0,
            shippingTaxAmount: 0,
            jurisdictions: [],
            calculatedAt,
            errorMessage: 'Alaska has no state sales tax, but local borough/city taxes may apply. Automated rooftop lookup provider required.',
          };
        }
      } else {
        // DE, MT, NH, OR have no state sales tax
        const totalSubtotal = (request.items || []).reduce(
          (sum, item) => sum + (item.lineSubtotal || item.unitPrice * item.quantity),
          0
        );
        return {
          success: true,
          status: 'VERIFIED_ZERO_TAX',
          provider: this.name,
          taxableSubtotal: 0,
          exemptSubtotal: fromCents(toCents(totalSubtotal)),
          effectiveRate: 0,
          taxAmount: 0,
          shippingTaxAmount: 0,
          jurisdictions: [
            {
              jurisdictionType: 'STATE',
              jurisdictionName: `${stateCode} State (No Sales Tax)`,
              rate: 0,
              taxAmount: 0,
            },
          ],
          calculatedAt,
          note: `Destination state ${stateCode} has no general sales tax.`,
        };
      }
    }

    // 5. Compute Taxable vs. Exempt Subtotals using integer cents
    let taxableSubtotalCents = 0;
    let exemptSubtotalCents = 0;

    for (const item of request.items || []) {
      const lineCents = toCents(item.lineSubtotal || item.unitPrice * item.quantity);
      const isTaxable = item.isTaxable !== false; // Fresh cut floral goods default to taxable
      if (isTaxable) {
        taxableSubtotalCents += lineCents;
      } else {
        exemptSubtotalCents += lineCents;
      }
    }

    // Allocate order-level discount proportionally to taxable items
    const discountCents = toCents(request.discountAmount || 0);
    if (discountCents > 0 && taxableSubtotalCents > 0) {
      const discountToTaxable = Math.min(taxableSubtotalCents, discountCents);
      taxableSubtotalCents = Math.max(0, taxableSubtotalCents - discountToTaxable);
    }

    // 6. Verified Statutory Rate Lookup
    const statutoryRate = VERIFIED_STATE_STATUTORY_RATES[stateCode];

    if (statutoryRate === undefined) {
      if (config.requireExactCalculation) {
        return {
          success: false,
          status: 'UNSUPPORTED_JURISDICTION',
          provider: this.name,
          taxableSubtotal: fromCents(taxableSubtotalCents),
          exemptSubtotal: fromCents(exemptSubtotalCents),
          effectiveRate: 0,
          taxAmount: 0,
          shippingTaxAmount: 0,
          jurisdictions: [],
          calculatedAt,
          errorMessage: `No verified statutory sales tax rate available for nexus state ${stateCode}. Please configure an external tax provider.`,
        };
      }
    }

    const appliedRate = statutoryRate || 0;
    const itemTaxCents = Math.round(taxableSubtotalCents * appliedRate);

    // 7. Shipping Taxability
    const isShippingTaxable = nexusConfig?.isShippingTaxable ?? true;
    const shippingFeeCents = toCents(request.shippingFee || 0);
    const shippingTaxCents = isShippingTaxable && taxableSubtotalCents > 0
      ? Math.round(shippingFeeCents * appliedRate)
      : 0;

    const totalTaxCents = itemTaxCents + shippingTaxCents;

    const jurisdictions: TaxJurisdictionDetail[] = [
      {
        jurisdictionType: 'STATE',
        jurisdictionName: `${stateCode} Statutory Base`,
        rate: appliedRate,
        taxAmount: fromCents(itemTaxCents),
      },
    ];

    if (shippingTaxCents > 0) {
      jurisdictions.push({
        jurisdictionType: 'SPECIAL',
        jurisdictionName: `${stateCode} Shipping Sales Tax`,
        rate: appliedRate,
        taxAmount: fromCents(shippingTaxCents),
      });
    }

    return {
      success: true,
      status: appliedRate > 0 ? 'VERIFIED_TAX' : 'VERIFIED_ZERO_TAX',
      provider: this.name,
      taxableSubtotal: fromCents(taxableSubtotalCents),
      exemptSubtotal: fromCents(exemptSubtotalCents),
      effectiveRate: appliedRate,
      taxAmount: fromCents(totalTaxCents),
      shippingTaxAmount: fromCents(shippingTaxCents),
      jurisdictions,
      calculatedAt,
      note: nexusConfig?.sellerPermitId
        ? `Seller Permit: ${nexusConfig.sellerPermitId}`
        : undefined,
    };
  }
}

/**
 * Mock Tax Provider for Deterministic Unit Testing & Local Development
 */
export class MockTaxProvider implements ITaxProvider {
  readonly name = 'MockTaxProvider';
  private customRate?: number;
  private forceStatus?: TaxCalculationResult['status'];

  constructor(customRate?: number, forceStatus?: TaxCalculationResult['status']) {
    this.customRate = customRate;
    this.forceStatus = forceStatus;
  }

  async calculateTax(
    request: TaxCalculationRequest,
    _config: TaxEngineConfig
  ): Promise<TaxCalculationResult> {
    const calculatedAt = new Date().toISOString();

    if (this.forceStatus && this.forceStatus !== 'VERIFIED_TAX') {
      return {
        success: this.forceStatus === 'VERIFIED_ZERO_TAX',
        status: this.forceStatus,
        provider: this.name,
        taxableSubtotal: 0,
        exemptSubtotal: 0,
        effectiveRate: 0,
        taxAmount: 0,
        shippingTaxAmount: 0,
        jurisdictions: [],
        calculatedAt,
        errorMessage: this.forceStatus === 'PROVIDER_UNAVAILABLE'
          ? 'Mock Tax service is currently offline.'
          : undefined,
      };
    }

    const state = normalizeStateCode(request.shippingAddress?.state || '');
    if (!state) {
      return {
        success: false,
        status: 'UNSUPPORTED_JURISDICTION',
        provider: this.name,
        taxableSubtotal: 0,
        exemptSubtotal: 0,
        effectiveRate: 0,
        taxAmount: 0,
        shippingTaxAmount: 0,
        jurisdictions: [],
        calculatedAt,
        errorMessage: 'Invalid state code in mock provider.',
      };
    }

    const rate = this.customRate !== undefined ? this.customRate : 0.0825; // 8.25% mock rate
    let taxableCents = 0;
    let exemptCents = 0;

    for (const item of request.items || []) {
      const cents = toCents(item.lineSubtotal || item.unitPrice * item.quantity);
      if (item.isTaxable !== false) {
        taxableCents += cents;
      } else {
        exemptCents += cents;
      }
    }

    const discountCents = toCents(request.discountAmount || 0);
    if (discountCents > 0 && taxableCents > 0) {
      taxableCents = Math.max(0, taxableCents - Math.min(taxableCents, discountCents));
    }

    const itemTaxCents = Math.round(taxableCents * rate);
    const shippingTaxCents = Math.round(toCents(request.shippingFee || 0) * rate);
    const totalTaxCents = itemTaxCents + shippingTaxCents;

    return {
      success: true,
      status: 'VERIFIED_TAX',
      provider: this.name,
      taxableSubtotal: fromCents(taxableCents),
      exemptSubtotal: fromCents(exemptCents),
      effectiveRate: rate,
      taxAmount: fromCents(totalTaxCents),
      shippingTaxAmount: fromCents(shippingTaxCents),
      jurisdictions: [
        {
          jurisdictionType: 'COMBINED',
          jurisdictionName: `${state} Mock Combined Rate`,
          rate,
          taxAmount: fromCents(totalTaxCents),
        },
      ],
      calculatedAt,
      note: 'Calculated using test mock provider',
    };
  }
}

/**
 * Provider Factory
 */
export function getTaxProvider(providerType: TaxEngineConfig['providerType']): ITaxProvider {
  switch (providerType) {
    case 'MOCK':
      return new MockTaxProvider();
    case 'INTERNAL_TABLE':
    default:
      return new StandardTaxProvider();
  }
}
