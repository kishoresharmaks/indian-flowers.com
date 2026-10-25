import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Settings from '@/models/Settings';
import { getFedExRates } from '@/lib/shipping/fedexClient';
import { FedExRateRequest } from '@/lib/shipping/fedexTypes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destination, items, packageWeightLbs } = body;

    if (!destination || (!destination.zipCode && !destination.state)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Destination zipCode or state is required to calculate FedEx shipping rates.',
        },
        { status: 400 }
      );
    }

    // Attempt to load store FedEx credentials from Settings
    let customCreds: any = {};
    try {
      await connectToDatabase();
      const settings = await Settings.findOne({ key: 'global' }).lean();
      if (settings) {
        customCreds = {
          accountNumber: settings.fedexAccountNumber || undefined,
          meterNumber: settings.fedexProductionMeterNumber || undefined,
          testMeterNumber: settings.fedexTestMeterNumber || undefined,
          authKey: settings.fedexAuthKey || undefined,
          secretKey: settings.fedexSecretKey || undefined,
          environment: settings.fedexEnvironment || 'production',
          originAddress: {
            street: settings.companyAddress || '14922 Bobcat lane',
            city: settings.companyCity || 'Fontana',
            state: settings.companyState || 'CA',
            zipCode: settings.fedexOriginZip || settings.companyZip || '92336',
            country: settings.companyCountry || 'US',
          },
        };
      }
    } catch {
      // Proceed with defaults if DB query fails
    }

    const rateRequest: FedExRateRequest = {
      destination: {
        streetAddress: destination.streetAddress || '',
        city: destination.city || '',
        state: destination.state || '',
        zipCode: destination.zipCode || '',
        country: destination.country || 'US',
        isResidential: destination.isResidential !== false,
      },
      items: Array.isArray(items) ? items : [],
      packageWeightLbs: typeof packageWeightLbs === 'number' ? packageWeightLbs : undefined,
    };

    const rateResponse = await getFedExRates(rateRequest, customCreds);

    return NextResponse.json(rateResponse, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to calculate FedEx rates',
      },
      { status: 500 }
    );
  }
}
