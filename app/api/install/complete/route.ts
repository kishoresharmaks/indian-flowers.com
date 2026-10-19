import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import AdminUser from '@/models/AdminUser';
import Installation from '@/models/Installation';
import Settings from '@/models/Settings';
import { buildEnvironmentDownload, validImageDataUrl } from '@/lib/installer';
import { STORE_CURRENCY, STORE_LOCALE } from '@/lib/currency';

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const installation = await Installation.findOne({ key: 'primary' });
    if (!installation || installation.state !== 'LICENSE_ACTIVATED') return NextResponse.json({ success: false, message: 'Verify MongoDB and activate a license before completing setup.' }, { status: 409 });
    const body = await request.json();
    const siteName = text(body.siteName, 100), businessName = text(body.businessName, 100), email = text(body.adminEmail, 254).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    if (!siteName || !businessName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 12) return NextResponse.json({ success: false, message: 'Provide site and business names, a valid administrator email, and a password with at least 12 characters.' }, { status: 400 });
    const logoDataUrl = validImageDataUrl(body.logoDataUrl) ? body.logoDataUrl : '';
    const faviconDataUrl = validImageDataUrl(body.faviconDataUrl) ? body.faviconDataUrl : '';
    if ((body.logoDataUrl && !logoDataUrl) || (body.faviconDataUrl && !faviconDataUrl)) return NextResponse.json({ success: false, message: 'Logos must be PNG, JPEG, or WebP images smaller than 500 KB.' }, { status: 400 });
    const tagline = text(body.tagline, 180), domain = text(body.domain, 253), contactEmail = text(body.contactEmail, 254), contactPhone = text(body.contactPhone, 40);
    const timezone = text(body.timezone, 64) || process.env.STORE_TIMEZONE || 'America/Los_Angeles';
    await Settings.findOneAndUpdate({ key: 'global' }, { $set: { siteName, businessName, tagline, domain, contactEmail, contactPhone, currency: STORE_CURRENCY, locale: STORE_LOCALE, timezone, logoDataUrl, faviconDataUrl, theme: 'Botanical Modern' } }, { upsert: true, new: true });
    const existing = await AdminUser.findOne({ email });
    if (existing) return NextResponse.json({ success: false, message: 'That administrator email already exists.' }, { status: 409 });
    await AdminUser.create({ email, passwordHash: await bcrypt.hash(password, 12) });
    const environment = await buildEnvironmentDownload({ STORE_NAME: siteName, BUSINESS_NAME: businessName, STORE_DOMAIN: domain, STORE_CONTACT_EMAIL: contactEmail, STORE_CONTACT_PHONE: contactPhone, STORE_CURRENCY: STORE_CURRENCY, STORE_LOCALE: STORE_LOCALE, STORE_TIMEZONE: timezone });
    installation.state = 'COMPLETED'; installation.completedAt = new Date(); installation.environmentDownloadedAt = new Date(); await installation.save();
    return NextResponse.json({ success: true, message: 'The Indian Flowers CMS is ready.', environment });
  } catch {
    return NextResponse.json({ success: false, message: 'Setup could not be completed. Review the details and try again.' }, { status: 500 });
  }
}
