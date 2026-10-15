/**
 * US Sales Tax Engine Types & Interfaces
 * Provider-independent architecture supporting:
 * - State, County, City, Special District breakdowns
 * - Nexus & registration status
 * - Explicit calculation statuses (distinguishing verified zero tax from errors)
 * - Safe monetary representations in integer cents
 */

export type TaxCalculationStatus =
  | 'VERIFIED_TAX'            // Confirmed positive tax calculated by provider/verified rules
  | 'VERIFIED_ZERO_TAX'       // Confirmed zero tax (e.g., no nexus, tax-exempt state/item, valid resale)
  | 'ESTIMATE'                // Estimated tax for informational preview (never charged as verified final)
  | 'UNSUPPORTED_JURISDICTION'// Destination cannot be verified (checkout total must not assume 0 tax silently)
  | 'PROVIDER_UNAVAILABLE';   // Tax service down or unconfigured

export type JurisdictionType = 'STATE' | 'COUNTY' | 'CITY' | 'SPECIAL' | 'COMBINED';

export interface TaxAddress {
  streetAddress: string;
  aptSuite?: string;
  city: string;
  state: string;     // 2-letter uppercase US state code, e.g. "CA", "TX", "NY"
  zipCode: string;   // 5-digit or 9-digit (ZIP+4) string, preserving leading zeroes
  country?: string;  // Defaults to "US"
}

export interface TaxLineItem {
  id?: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;       // Price in standard currency units ($)
  lineSubtotal: number;    // unitPrice * quantity
  isTaxable?: boolean;     // Product taxability flag (defaults to true for retail flowers)
  taxCode?: string;        // Optional tax categorization code (e.g. TPP, floral, packaging)
  discountAmount?: number; // Allocated discount for this line
}

export interface TaxCalculationRequest {
  shippingAddress: TaxAddress;
  items: TaxLineItem[];
  shippingFee?: number;
  discountAmount?: number;
  customerTaxExempt?: boolean;
  exemptionReason?: string;
}

export interface TaxJurisdictionDetail {
  jurisdictionType: JurisdictionType;
  jurisdictionName: string;
  rate: number;       // Decimal rate, e.g., 0.0625 for 6.25%
  taxAmount: number;  // Calculated tax in dollars
}

export interface TaxSnapshot {
  status: TaxCalculationStatus;
  provider: string;
  taxableSubtotal: number;
  exemptSubtotal: number;
  effectiveRate: number;
  taxAmount: number;
  shippingTaxAmount: number;
  jurisdictions: TaxJurisdictionDetail[];
  calculatedAt: string;
  note?: string;
}

export interface TaxCalculationResult extends TaxSnapshot {
  success: boolean;
  errorMessage?: string;
}

export interface NexusStateConfig {
  stateCode: string;
  hasNexus: boolean;
  sellerPermitId?: string;
  isShippingTaxable?: boolean;
}

export interface TaxEngineConfig {
  providerType: 'INTERNAL_TABLE' | 'STRIPE_TAX' | 'TAXJAR' | 'AVALARA' | 'MOCK';
  nexusStates: Record<string, NexusStateConfig>;
  requireExactCalculation: boolean; // If true, unsupported jurisdictions halt checkout instead of guessing
  fallbackBehavior: 'PREVENT_CHECKOUT' | 'WARN_AND_RECORD';
}

export interface ITaxProvider {
  readonly name: string;
  calculateTax(request: TaxCalculationRequest, config: TaxEngineConfig): Promise<TaxCalculationResult>;
}
