import { OAuth2Client } from 'google-auth-library';

let cachedClient: OAuth2Client | null = null;

export function getGoogleOAuthClient(): { client: OAuth2Client; clientId: string } {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured in server environment.');
  }

  if (!cachedClient) {
    cachedClient = new OAuth2Client(clientId, clientSecret);
  }

  return { client: cachedClient, clientId };
}

export interface VerifiedGoogleUser {
  sub: string;
  email: string;
  name: string;
  avatar: string;
}

/**
 * Cryptographically verifies a Google ID token using google-auth-library.
 * Validates token signature, expiration, issuer, audience, and email_verified.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleUser> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('A valid Google ID token credential is required.');
  }

  const { client, clientId } = getGoogleOAuthClient();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Google token payload could not be retrieved.');
  }

  if (!payload.sub) {
    throw new Error('Google identity subject (sub) is missing from token.');
  }

  if (!payload.email) {
    throw new Error('Email address is missing from Google profile.');
  }

  if (!payload.email_verified) {
    throw new Error('Google email address has not been verified by Google.');
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: (payload.name || payload.given_name || payload.email.split('@')[0] || 'Customer').trim(),
    avatar: payload.picture || '',
  };
}
