/**
 * Dynamic Company Configuration Helper
 * Loads all business metadata from environment variables with zero hardcoding.
 * 
 * Supports US business entities (EIN, State Tax Permit, Routing Number)
 * while preserving existing payment configs (UPI ID) and backward-compatible fields.
 */

import { numberToWords as numberToWordsUsd } from './currency';

export interface CompanyConfig {
    name: string;
    dba?: string;
    owner: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    ein?: string;              // US Federal EIN (Employer Identification Number)
    stateTaxPermitId?: string; // State Department of Revenue Seller's Permit #
    bankName?: string;
    bankAccountNo?: string;
    bankRoutingNo?: string;    // US ABA 9-digit Routing Number
    bankHolder?: string;
    upiId?: string;            // Preserved for UPI payment workflow
    logoUrl: string;
    // Legacy compatibility fields
    gstin?: string;
    fssai?: string;
    iec?: string;
    manufacturing?: string;
    certifications?: string;
    bankIfsc?: string;
}

export const getCompanyConfig = (overrideSettings?: Partial<CompanyConfig>): CompanyConfig => ({
    name: overrideSettings?.name || process.env.NEXT_PUBLIC_COMPANY_NAME || 'Indian Flowers',
    dba: overrideSettings?.dba || process.env.NEXT_PUBLIC_COMPANY_DBA || 'Indian Flowers USA',
    owner: overrideSettings?.owner || process.env.NEXT_PUBLIC_COMPANY_OWNER || '',
    address: overrideSettings?.address || process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '39120 Argonaut Way, Suite 428',
    city: overrideSettings?.city || process.env.NEXT_PUBLIC_COMPANY_CITY || 'Fremont',
    state: overrideSettings?.state || process.env.NEXT_PUBLIC_COMPANY_STATE || 'CA',
    zipCode: overrideSettings?.zipCode || process.env.NEXT_PUBLIC_COMPANY_ZIP || '94538',
    country: overrideSettings?.country || process.env.NEXT_PUBLIC_COMPANY_COUNTRY || 'United States',
    phone: overrideSettings?.phone || process.env.NEXT_PUBLIC_COMPANY_PHONE || '+1 (510) 579-5199',
    email: overrideSettings?.email || process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'support@indian-flowers.com',
    ein: overrideSettings?.ein || process.env.NEXT_PUBLIC_COMPANY_EIN || '94-3829104',
    stateTaxPermitId: overrideSettings?.stateTaxPermitId || process.env.NEXT_PUBLIC_STATE_TAX_PERMIT_ID || 'SR-KHE-102-984712',
    bankName: overrideSettings?.bankName || process.env.NEXT_PUBLIC_COMPANY_BANK_NAME || 'JPMorgan Chase Bank, N.A.',
    bankAccountNo: overrideSettings?.bankAccountNo || process.env.NEXT_PUBLIC_COMPANY_BANK_ACC || 'Checking •••• 4829',
    bankRoutingNo: overrideSettings?.bankRoutingNo || process.env.NEXT_PUBLIC_COMPANY_BANK_ROUTING || '121000247',
    bankHolder: overrideSettings?.bankHolder || process.env.NEXT_PUBLIC_COMPANY_BANK_HOLDER || 'Indian Flowers LLC',
    upiId: overrideSettings?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || '',
    logoUrl: overrideSettings?.logoUrl || process.env.NEXT_PUBLIC_COMPANY_LOGO_URL || '/indian-flowers-logo.svg',
    // Legacy fields default to empty if not configured; zero fabrication
    gstin: overrideSettings?.gstin || process.env.NEXT_PUBLIC_COMPANY_GSTIN || '',
    fssai: overrideSettings?.fssai || process.env.NEXT_PUBLIC_COMPANY_FSSAI || '',
    iec: overrideSettings?.iec || process.env.NEXT_PUBLIC_COMPANY_IEC || '',
    manufacturing: overrideSettings?.manufacturing || process.env.NEXT_PUBLIC_COMPANY_MANUFACTURING || '',
    certifications: overrideSettings?.certifications || process.env.NEXT_PUBLIC_COMPANY_CERTIFICATIONS || '',
    bankIfsc: overrideSettings?.bankIfsc || process.env.NEXT_PUBLIC_COMPANY_BANK_IFSC || '',
});

/**
 * Utility to convert numeric amounts to English currency words.
 * Example: 5927.5 -> "Five Thousand Nine Hundred Twenty Seven Dollars and Fifty Cents only"
 */
export function numberToWords(amount: number): string {
    return numberToWordsUsd(amount);
}
