import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase, { setRuntimeMongoUri } from '@/lib/db';
import Installation from '@/models/Installation';
import { parseMongoUri, persistMongoUri, safeMongoError, verifyMongoConnection } from '@/lib/installer';

const attempts = new Map<string, { count: number; reset: number }>();

function allowed(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now(); const previous = attempts.get(key);
  if (!previous || previous.reset < now) { attempts.set(key, { count: 1, reset: now + 60_000 }); return true; }
  if (previous.count >= 5) return false;
  previous.count += 1; return true;
}

export async function POST(request: NextRequest) {
  if (!allowed(request)) return NextResponse.json({ success: false, message: 'Too many connection attempts. Try again in a minute.' }, { status: 429 });
  try {
    try {
      await connectToDatabase();
      const existing = await Installation.findOne({ key: 'primary' }).lean();
      if (existing?.state === 'COMPLETED') return NextResponse.json({ success: false, message: 'Installation is locked. Use an authenticated maintenance process to change infrastructure configuration.' }, { status: 403 });
    } catch { /* An unconfigured instance is expected at this point. */ }
    const body = await request.json();
    const { uri, database } = parseMongoUri(body?.uri, body?.databaseName);
    await verifyMongoConnection(uri, database);
    await persistMongoUri(uri);
    setRuntimeMongoUri(uri);
    await connectToDatabase();
    await Installation.findOneAndUpdate({ key: 'primary' }, { state: 'DATABASE_VERIFIED', databaseName: database }, { upsert: true, new: true });
    return NextResponse.json({ success: true, state: 'DATABASE_VERIFIED', message: 'MongoDB connection verified.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: safeMongoError(error) }, { status: 400 });
  }
}
