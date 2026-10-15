/**
 * US Sales Tax Engine Configuration
 * Loads settings from environment variables with safe defaults.
 * 
 * Non-negotiable safeguards:
 * - Does NOT assume company has nexus or registration in any state.
 * - Does NOT invent fake tax rates or credentials.
 * - Explicitly distinguishes verified zero tax from errors or missing nexus.
 */

import { TaxEngineConfig, NexusStateConfig } from './types';
import { normalizeStateCode } from './jurisdiction';

/**
 * Parses comma-separated nexus states from environment variable TAX_NEXUS_STATES.
 * Format example: "CA,TX:0012345,NJ"
 * Optional permit ID can follow a colon: "STATE:PERMIT_ID"
 */
export function parseNexusStates(envString?: string): Record<string, NexusStateConfig> {
  const result: Record<string, NexusStateConfig> = {};
  if (!envString || typeof envString !== 'string') {
    return result;
  }

  const parts = envString.split(',').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const [rawState, permitId] = part.split(':').map((s) => s.trim());
    const stateCode = normalizeStateCode(rawState);
    if (stateCode) {
      result[stateCode] = {
        stateCode,
        hasNexus: true,
        sellerPermitId: permitId || undefined,
        // By default, many states treat shipping as taxable if the underlying item is taxable
        isShippingTaxable: true,
      };
    }
  }

  return result;
}

export function getTaxEngineConfig(): TaxEngineConfig {
  const envProvider = (process.env.TAX_PROVIDER_TYPE || 'INTERNAL_TABLE').toUpperCase();
  const validProviders: TaxEngineConfig['providerType'][] = [
    'INTERNAL_TABLE',
    'STRIPE_TAX',
    'TAXJAR',
    'AVALARA',
    'MOCK',
  ];

  const providerType = validProviders.includes(envProvider as any)
    ? (envProvider as TaxEngineConfig['providerType'])
    : 'INTERNAL_TABLE';

  const nexusStates = parseNexusStates(process.env.TAX_NEXUS_STATES);
  const requireExact = process.env.TAX_REQUIRE_EXACT !== 'false'; // default true for safety

  return {
    providerType,
    nexusStates,
    requireExactCalculation: requireExact,
    fallbackBehavior: 'PREVENT_CHECKOUT',
  };
}
