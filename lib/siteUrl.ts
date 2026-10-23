import { headers } from 'next/headers';

const DEFAULT_SITE_URL = 'https://indian-flowers.com';

function configuredSiteUrl() {
  return (process.env.CANONICAL_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/$/, '');
}

function allowedSeoHosts(canonicalUrl: string) {
  const configuredHosts = process.env.SEO_ALLOWED_HOSTS?.split(',').map((host) => host.trim()).filter(Boolean) || [];
  return new Set([new URL(canonicalUrl).host, ...configuredHosts]);
}

export function resolveSiteUrl(host?: string | null) {
  const canonicalUrl = configuredSiteUrl();
  if (process.env.SEO_USE_REQUEST_HOST !== 'true' || !host || /[\\/@]/.test(host)) {
    return canonicalUrl;
  }

  try {
    const requestHost = new URL(`https://${host.split(',')[0].trim()}`).host;
    return allowedSeoHosts(canonicalUrl).has(requestHost)
      ? `${new URL(canonicalUrl).protocol}//${requestHost}`
      : canonicalUrl;
  } catch {
    return canonicalUrl;
  }
}

/** Builds absolute SEO URLs from the configured canonical domain or an allowed public host. */
export function getSiteUrl() {
  const requestHeaders = headers();
  return resolveSiteUrl(requestHeaders.get('x-forwarded-host') || requestHeaders.get('host'));
}
