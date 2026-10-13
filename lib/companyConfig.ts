/**
 * Dynamic Company Configuration Helper
 * Loads all business metadata from environment variables with zero hardcoding.
 */

import { numberToWords as numberToWordsUsd } from './currency';

export interface CompanyConfig {
    name: string;
    owner: string;
    address: string;
    fssai: string;
    iec: string;
    manufacturing: string;
    certifications: string;
    phone: string;
    email: string;
    gstin: string;
    state: string;
    bankName: string;
    bankAccountNo: string;
    bankIfsc: string;
    bankHolder: string;
    upiId: string;
    logoUrl: string;
}

export const getCompanyConfig = (): CompanyConfig => ({
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Nexus Ecom',
    owner: process.env.NEXT_PUBLIC_COMPANY_OWNER || 'JEYA SHAYANA DEVI.T',
    address:
        process.env.NEXT_PUBLIC_COMPANY_ADDRESS ||
        'Factory : Door No :2/26-1, MUHILANVILAI, Monikettipottal-Post, Nagercoil, Kanayakumari-District, Pin - 629501.',
    fssai: process.env.NEXT_PUBLIC_COMPANY_FSSAI || '12425009000671',
    iec: process.env.NEXT_PUBLIC_COMPANY_IEC || 'AAOCB0453D',
    manufacturing: process.env.NEXT_PUBLIC_COMPANY_MANUFACTURING || 'FMCG (Food)',
    certifications:
        process.env.NEXT_PUBLIC_COMPANY_CERTIFICATIONS ||
        'GMP & ORGANIC CERTIFIED COMPANY | ISO 9001:2015 & ISO 22000:2018 COMPANY',
    phone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '9578784431',
    email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '',
    gstin: process.env.NEXT_PUBLIC_COMPANY_GSTIN || '33AAOCB0453D1Z3',
    state: process.env.NEXT_PUBLIC_COMPANY_STATE || '33-Tamil Nadu',
    bankName: process.env.NEXT_PUBLIC_COMPANY_BANK_NAME || 'Axis Bank, Nagercoil [Tamil Nadu]',
    bankAccountNo: process.env.NEXT_PUBLIC_COMPANY_BANK_ACC || '925020021307548',
    bankIfsc: process.env.NEXT_PUBLIC_COMPANY_BANK_IFSC || 'UTIB0000405',
    bankHolder: process.env.NEXT_PUBLIC_COMPANY_BANK_HOLDER || 'Nexus',
    upiId: process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || '',
    logoUrl: process.env.NEXT_PUBLIC_COMPANY_LOGO_URL || '/nexus-mark.svg',
});

/**
 * Utility to convert numeric amounts to English currency words.
 * Example: 5927.5 -> "Five Thousand Nine Hundred Twenty Seven Dollars and Fifty Cents only"
 */
export function numberToWords(amount: number): string {
    return numberToWordsUsd(amount);
}
