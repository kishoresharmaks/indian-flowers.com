import Razorpay from 'razorpay';
import crypto from 'crypto';
import connectToDatabase from '@/lib/db';
import Settings from '@/models/Settings';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  isMock: boolean;
}

/**
 * Retrieve active Razorpay credentials from DB Settings or Environment Variables
 */
export async function getRazorpayConfig(): Promise<RazorpayConfig> {
  let keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
  let keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  try {
    await connectToDatabase();
    const settings = await Settings.findOne({ key: 'global' }).lean();
    if (settings) {
      if ((settings as any).razorpayKeyId) keyId = (settings as any).razorpayKeyId;
      if ((settings as any).razorpayKeySecret) keySecret = (settings as any).razorpayKeySecret;
    }
  } catch (err) {
    console.warn('Failed to load Razorpay settings from DB, falling back to process.env', err);
  }

  // Sandbox / simulated mock orders when credentials are not yet set or are placeholders
  const hasPlaceholderCredentials = !keyId || !keySecret || keyId.includes('placeholder') || keySecret.includes('placeholder');
  const isMock = hasPlaceholderCredentials;

  return { keyId, keySecret, isMock };
}

/**
 * Create a Razorpay Order in USD (cents)
 */
export async function createRazorpayOrder({
  amountCents,
  currency = 'USD',
  receipt,
  notes = {},
}: {
  amountCents: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}) {
  const config = await getRazorpayConfig();

  // If in mock / test sandbox mode without active credentials, return simulated order for testing
  if (config.isMock) {
    const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      id: mockOrderId,
      amount: amountCents,
      currency,
      receipt: receipt || `rec_${Date.now()}`,
      status: 'created',
      keyId: config.keyId || 'rzp_test_placeholder',
      isMock: true,
    };
  }

  if (!config.keyId || !config.keySecret || config.keyId.includes('placeholder') || config.keySecret.includes('placeholder')) {
    throw new Error('Razorpay is not configured for live payments.');
  }

  // Real Razorpay API call
  const instance = new Razorpay({
    key_id: config.keyId,
    key_secret: config.keySecret,
  });

  const order = await instance.orders.create({
    amount: amountCents,
    currency,
    receipt: receipt || `rec_${Date.now()}`,
    notes,
  });

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    status: order.status,
    keyId: config.keyId,
    isMock: false,
  };
}

/**
 * Cryptographically verify Razorpay payment signature
 */
export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
  secret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  // Allow sandbox simulated signature when in test/mock mode or using placeholder keys
  if (process.env.NODE_ENV !== 'production' && (!secret || secret.includes('placeholder')) && signature.startsWith('mock_sig_')) {
    return true;
  }

  if (!secret) {
    return false;
  }

  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');

    const genBuf = Buffer.from(generatedSignature, 'utf-8');
    const sigBuf = Buffer.from(signature, 'utf-8');

    if (genBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (err) {
    console.error('Razorpay signature verification error:', err);
    return false;
  }
}
