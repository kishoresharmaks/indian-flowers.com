import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Installation from '@/models/Installation';
import Settings from '@/models/Settings';
import LicenseSetting from '@/models/LicenseSetting';
import AdminUser from '@/models/AdminUser';
import { STORE_CURRENCY, STORE_LOCALE } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const installation = await Installation.findOne({ key: 'primary' }).lean();
    const isComplete = installation?.state === 'COMPLETED';

    let databaseDetails = null;
    let licenseDetails = null;
    let configDetails = null;

    if (installation) {
      databaseDetails = {
        databaseName: installation.databaseName || '',
      };

      const lic = await LicenseSetting.findOne({ key: 'current_license' }).lean();
      if (lic) {
        licenseDetails = {
          businessName: lic.businessName || '',
          domain: lic.domain || '',
          status: lic.status || '',
        };
      }

      const settings = await Settings.findOne({ key: 'global' }).lean();
      const admin = await AdminUser.findOne({}).lean();

      if (settings || admin) {
        configDetails = {
          siteName: settings?.siteName || '',
          businessName: settings?.businessName || '',
          tagline: settings?.tagline || '',
          domain: settings?.domain || '',
          contactEmail: settings?.contactEmail || '',
          contactPhone: settings?.contactPhone || '',
          currency: STORE_CURRENCY,
          locale: STORE_LOCALE,
          timezone: settings?.timezone || process.env.STORE_TIMEZONE || 'America/Los_Angeles',
          logoDataUrl: settings?.logoDataUrl || '',
          faviconDataUrl: settings?.faviconDataUrl || '',
          adminEmail: admin?.email || '',
        };
      }
    }

    return NextResponse.json({
      success: true,
      state: installation?.state || 'DATABASE_NOT_CONFIGURED',
      complete: isComplete,
      database: databaseDetails,
      license: licenseDetails,
      config: configDetails,
    });
  } catch {
    return NextResponse.json({
      success: true,
      state: 'DATABASE_NOT_CONFIGURED',
      complete: false,
    });
  }
}
