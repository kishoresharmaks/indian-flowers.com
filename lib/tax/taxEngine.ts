/**
 * US Sales Tax Engine Orchestrator
 * Authoritative server-side entry point for tax calculation.
 * 
 * Enforces:
 * - Full address validation prior to provider invocation
 * - Input sanity checks (no negative prices or invalid quantities)
 * - Safe handling of discounts and shipping fees
 * - Distinct calculation status handling (never converts errors to silent 0 tax)
 */

import {
  TaxCalculationRequest,
  TaxCalculationResult,
  TaxEngineConfig,
} from './types';
import { validateTaxAddress } from './jurisdiction';
import { getTaxEngineConfig } from './config';
import { getTaxProvider } from './taxProvider';

export async function calculateSalesTax(
  request: TaxCalculationRequest,
  customConfig?: Partial<TaxEngineConfig>
): Promise<TaxCalculationResult> {
  const calculatedAt = new Date().toISOString();
  const config: TaxEngineConfig = {
    ...getTaxEngineConfig(),
    ...customConfig,
  };

  // 1. Validate destination address
  const addressValidation = validateTaxAddress(request.shippingAddress || {});
  if (!addressValidation.isValid) {
    return {
      success: false,
      status: 'UNSUPPORTED_JURISDICTION',
      provider: config.providerType,
      taxableSubtotal: 0,
      exemptSubtotal: 0,
      effectiveRate: 0,
      taxAmount: 0,
      shippingTaxAmount: 0,
      jurisdictions: [],
      calculatedAt,
      errorMessage: `Invalid shipping address for tax calculation: ${addressValidation.errors.join(' ')}`,
    };
  }

  // 2. Validate line items
  if (!request.items || !Array.isArray(request.items) || request.items.length === 0) {
    return {
      success: true,
      status: 'VERIFIED_ZERO_TAX',
      provider: config.providerType,
      taxableSubtotal: 0,
      exemptSubtotal: 0,
      effectiveRate: 0,
      taxAmount: 0,
      shippingTaxAmount: 0,
      jurisdictions: [],
      calculatedAt,
      note: 'No taxable items in order',
    };
  }

  for (const item of request.items) {
    if (typeof item.unitPrice !== 'number' || isNaN(item.unitPrice) || item.unitPrice < 0) {
      return {
        success: false,
        status: 'PROVIDER_UNAVAILABLE',
        provider: config.providerType,
        taxableSubtotal: 0,
        exemptSubtotal: 0,
        effectiveRate: 0,
        taxAmount: 0,
        shippingTaxAmount: 0,
        jurisdictions: [],
        calculatedAt,
        errorMessage: `Invalid unit price for item "${item.name}". Monetary inputs must be non-negative numbers.`,
      };
    }
    if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) {
      return {
        success: false,
        status: 'PROVIDER_UNAVAILABLE',
        provider: config.providerType,
        taxableSubtotal: 0,
        exemptSubtotal: 0,
        effectiveRate: 0,
        taxAmount: 0,
        shippingTaxAmount: 0,
        jurisdictions: [],
        calculatedAt,
        errorMessage: `Invalid quantity for item "${item.name}". Quantity must be a positive integer.`,
      };
    }
  }

  // 3. Delegate to configured provider
  try {
    const provider = getTaxProvider(config.providerType);
    const result = await provider.calculateTax(request, config);
    return result;
  } catch (error: any) {
    return {
      success: false,
      status: 'PROVIDER_UNAVAILABLE',
      provider: config.providerType,
      taxableSubtotal: 0,
      exemptSubtotal: 0,
      effectiveRate: 0,
      taxAmount: 0,
      shippingTaxAmount: 0,
      jurisdictions: [],
      calculatedAt,
      errorMessage: `Tax calculation failed: ${error.message || 'Unknown tax provider error.'}`,
    };
  }
}
