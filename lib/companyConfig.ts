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

export const getCompanyConfig = (): CompanyConfig => ({
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Indian Flowers',
    dba: process.env.NEXT_PUBLIC_COMPANY_DBA || '',
    owner: process.env.NEXT_PUBLIC_COMPANY_OWNER || '',
    address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '',
    city: process.env.NEXT_PUBLIC_COMPANY_CITY || '',
    state: process.env.NEXT_PUBLIC_COMPANY_STATE || 'CA',
    zipCode: process.env.NEXT_PUBLIC_COMPANY_ZIP || '',
    country: process.env.NEXT_PUBLIC_COMPANY_COUNTRY || 'United States',
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '',
    ein: process.env.NEXT_PUBLIC_COMPANY_EIN || '',
    stateTaxPermitId: process.env.NEXT_PUBLIC_STATE_TAX_PERMIT_ID || '',
    bankName: process.env.NEXT_PUBLIC_COMPANY_BANK_NAME || '',
    bankAccountNo: process.env.NEXT_PUBLIC_COMPANY_BANK_ACC || '',
    bankRoutingNo: process.env.NEXT_PUBLIC_COMPANY_BANK_ROUTING || '',
    bankHolder: process.env.NEXT_PUBLIC_COMPANY_BANK_HOLDER || '',
    upiId: process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || '',
    logoUrl: process.env.NEXT_PUBLIC_COMPANY_LOGO_URL || '/nexus-mark.svg',
    // Legacy fields default to empty if not configured; zero fabrication
    gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN || '',
    fssai: process.env.NEXT_PUBLIC_COMPANY_FSSAI || '',
    iec: process.env.NEXT_PUBLIC_COMPANY_IEC || '',
    manufacturing: process.env.NEXT_PUBLIC_COMPANY_MANUFACTURING || '',
    certifications: process.env.NEXT_PUBLIC_COMPANY_CERTIFICATIONS || '',
    bankIfsc: process.env.NEXT_PUBLIC_COMPANY_BANK_IFSC || '',
});

/**
 * Utility to convert numeric amounts to English currency words.
 * Example: 5927.5 -> "Five Thousand Nine Hundred Twenty Seven Dollars and Fifty Cents only"
 */
export function numberToWords(amount: number): string {
    return numberToWordsUsd(amount);
}
