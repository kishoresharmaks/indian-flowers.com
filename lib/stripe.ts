import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

/**
 * Singleton Stripe SDK Client Instance
 * Configured with environment-isolated credentials and explicit API versioning.
 */
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'Indian-Flowers Storefront',
    version: '1.0.0',
    url: 'https://indian-flowers.com',
  },
});

/**
 * Helper to check whether Stripe secret key is configured in environment variables.
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    (process.env.STRIPE_SECRET_KEY.startsWith('sk_') || process.env.STRIPE_SECRET_KEY.startsWith('rk_'))
  );
}

/**
 * Helper to check whether Stripe webhook signing secret is configured.
 */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_WEBHOOK_SECRET &&
    process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')
  );
}
