export type ClientLicenseStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'INVALID' | 'UNLICENSED' | 'GRACE_PERIOD';

export interface IClientFeatureMap {
  posEnabled: boolean;
  invoicingEnabled: boolean;
}

export interface IClientLicenseState {
  isActivated: boolean;
  isValid: boolean;
  isLocked: boolean;
  isGracePeriod?: boolean;
  serverOnline?: boolean;
  status: ClientLicenseStatus;
  licenseKey: string;
  businessName: string;
  domain: string;
  planName: string;
  billingCycle: string;
  features?: IClientFeatureMap;
  validUntil?: string;
  issuedAt?: string;
  daysRemaining: number;
  lastPingAt?: string;
  token?: string;
  message?: string;
  supportPhone?: string;
  supportEmail?: string;
  licensingServerUrl?: string;
}
