import { IClientLicenseState, ClientLicenseStatus, IClientFeatureMap } from './licenseTypes';

/**
 * Standalone Licensing Server Base URL (Dynamically read from ENV)
 */
export function getLicensingServerUrl(): string {
  const url =
    process.env.LICENSING_SERVER_URL ||
    process.env.NEXT_PUBLIC_LICENSING_SERVER_URL ||
    '';
  return url.replace(/\/$/, '');
}

/**
 * Helper to get configured license key (returns empty string if unlicensed)
 */
export function getConfiguredLicenseKey(): string {
  return (process.env.LICENSE_KEY || process.env.NEXT_PUBLIC_LICENSE_KEY || '').trim().toUpperCase();
}

/**
 * Evaluates license state from saved DB record or live response
 */
export function computeClientLicenseState(data: {
  licenseKey?: string;
  businessName?: string;
  domain?: string;
  planName?: string;
  billingCycle?: string;
  features?: IClientFeatureMap;
  status?: ClientLicenseStatus;
  validUntil?: string | Date;
  issuedAt?: string | Date;
  lastPingAt?: string | Date;
  token?: string;
  message?: string;
  serverOnline?: boolean;
}): IClientLicenseState {
  const licenseKey = (data.licenseKey || getConfiguredLicenseKey()).trim().toUpperCase();
  const serverOnline = data.serverOnline !== undefined ? data.serverOnline : true;

  const defaultFeatures: IClientFeatureMap = data.features || {
    posEnabled: true,
    invoicingEnabled: true,
  };

  // If server is offline or no key is provided/saved, the instance is locked
  if (!licenseKey || !serverOnline) {
    return {
      isActivated: false,
      isValid: false,
      isLocked: true,
      isGracePeriod: false,
      serverOnline,
      status: !serverOnline ? 'INVALID' : 'UNLICENSED',
      licenseKey: licenseKey || '',
      businessName: data.businessName || '',
      domain: data.domain || '',
      planName: '',
      billingCycle: '',
      features: { posEnabled: false, invoicingEnabled: false },
      daysRemaining: 0,
      message: !serverOnline
        ? 'NEXUS Licensing Authority Server is currently OFFLINE. Cannot verify store license.'
        : 'No license key activated. Please enter your license key to activate this store.',
    };
  }

  const validUntilStr = data.validUntil ? new Date(data.validUntil).toISOString() : undefined;
  const nowMs = Date.now();
  const expiryMs = validUntilStr ? new Date(validUntilStr).getTime() : 0;
  const daysRemaining = expiryMs ? Math.ceil((expiryMs - nowMs) / (1000 * 60 * 60 * 24)) : 0;

  let status: ClientLicenseStatus = data.status || 'ACTIVE';
  let isValid = false;
  let isLocked = true;
  let isGracePeriod = false;

  if (status === 'SUSPENDED' || status === 'INVALID') {
    isValid = false;
    isLocked = true;
  } else if (status === 'INACTIVE') {
    isValid = false;
    isLocked = true;
  } else if (expiryMs && nowMs > expiryMs) {
    status = 'EXPIRED';
    isValid = false;
    isLocked = true;
  } else if (status === 'GRACE_PERIOD') {
    isValid = true;
    isLocked = false;
    isGracePeriod = true;
  } else if (status === 'ACTIVE') {
    isValid = true;
    isLocked = false;
  }

  const isActivated = status !== 'UNLICENSED' && status !== 'INVALID';

  return {
    isActivated,
    isValid,
    isLocked,
    isGracePeriod,
    serverOnline,
    status,
    licenseKey,
    businessName: data.businessName || '',
    domain: data.domain || '',
    planName: data.planName || 'Pro Subscription',
    billingCycle: data.billingCycle || 'MONTHLY',
    features: defaultFeatures,
    validUntil: validUntilStr,
    issuedAt: data.issuedAt ? new Date(data.issuedAt).toISOString() : undefined,
    daysRemaining,
    lastPingAt: data.lastPingAt ? new Date(data.lastPingAt).toISOString() : new Date().toISOString(),
    token: data.token,
    message: data.message,
    licensingServerUrl: getLicensingServerUrl(),
  };
}
