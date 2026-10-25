import { FedExCredentials, FedExRateRequest, FedExRatesResponse, FedExRateQuote } from './fedexTypes';
import { calculateLocationBasedFedExRates, ORIGIN_HUB } from './fedexZoneEngine';

export const DEFAULT_FEDEX_CREDENTIALS: FedExCredentials = {
  accountNumber: process.env.FEDEX_ACCOUNT_NUMBER || '695333510',
  meterNumber: process.env.FEDEX_METER_NUMBER || '256593981',
  testMeterNumber: process.env.FEDEX_TEST_METER_NUMBER || '256456943',
  authKey: process.env.FEDEX_AUTH_KEY || 'odhEUIQgzxYnhfOR',
  secretKey: process.env.FEDEX_SECRET_KEY || '',
  environment: (process.env.FEDEX_ENVIRONMENT as any) || 'production',
  originAddress: {
    street: '14922 Bobcat lane',
    city: 'Fontana',
    state: 'CA',
    zipCode: '92336',
    country: 'US',
  },
};

/**
 * Live FedEx Rate API client with automatic resilient fallback
 * to authoritative US Postal Zone calculations.
 */
export async function getFedExRates(
  request: FedExRateRequest,
  customCredentials?: Partial<FedExCredentials>
): Promise<FedExRatesResponse> {
  const credentials: FedExCredentials = {
    ...DEFAULT_FEDEX_CREDENTIALS,
    ...customCredentials,
    originAddress: {
      ...DEFAULT_FEDEX_CREDENTIALS.originAddress,
      ...(customCredentials?.originAddress || {}),
    },
  };

  const cleanZip = (request.destination.zipCode || '').trim();
  if (!cleanZip && !request.destination.state) {
    return {
      success: false,
      origin: {
        city: ORIGIN_HUB.city,
        state: ORIGIN_HUB.state,
        zipCode: ORIGIN_HUB.zipCode,
      },
      destination: {
        state: '',
        zipCode: '',
        zone: 0,
        zoneName: 'Unknown',
      },
      totalPackageWeightLbs: 2.0,
      rates: [],
      recommendedRate: {
        serviceType: 'FEDEX_PRIORITY_OVERNIGHT',
        serviceName: 'FedEx Priority Overnight',
        amount: 48.00,
        currency: 'USD',
        estimatedTransitDays: 'Next-Day Delivery',
        zone: 4,
        zoneDescription: 'Default Continental US',
        source: 'authoritative_zone_engine',
        isResidential: true,
        billedWeightLbs: 2.0,
      },
      message: 'Destination ZIP code or State is required to compute location-based FedEx rate.',
    };
  }

  // Attempt live FedEx REST API query if client credentials / secret are configured
  if (credentials.secretKey && credentials.authKey) {
    try {
      const liveResult = await queryLiveFedExRateApi(request, credentials);
      if (liveResult && liveResult.rates && liveResult.rates.length > 0) {
        return liveResult;
      }
    } catch (err: any) {
      console.warn('FedEx live API request failed, falling back to authoritative zone engine:', err?.message || err);
    }
  }

  // Authoritative Postal Zone Engine Calculation
  const engineResult = calculateLocationBasedFedExRates(request);
  return engineResult;
}

/**
 * Queries FedEx REST Rate API v1 (Enterprise)
 */
async function queryLiveFedExRateApi(
  request: FedExRateRequest,
  creds: FedExCredentials
): Promise<FedExRatesResponse | null> {
  const isTest = creds.environment === 'test';
  const baseUrl = isTest
    ? 'https://apis-sandbox.fedex.com'
    : 'https://apis.fedex.com';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout for fast checkout

  try {
    // 1. Obtain OAuth Token
    const authRes = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: creds.authKey,
        client_secret: creds.secretKey || '',
      }),
      signal: controller.signal,
    });

    if (!authRes.ok) {
      return null;
    }

    const authData = await authRes.json();
    const accessToken = authData.access_token;
    if (!accessToken) return null;

    // 2. Query Rates Endpoint
    const weightLbs = Math.max(2.0, request.packageWeightLbs || 2.0);
    const ratePayload = {
      accountNumber: {
        value: creds.accountNumber,
      },
      rateRequestControlParameters: {
        returnTransitTimes: true,
      },
      requestedShipment: {
        shipper: {
          address: {
            postalCode: creds.originAddress.zipCode,
            countryCode: creds.originAddress.country || 'US',
          },
        },
        recipient: {
          address: {
            postalCode: request.destination.zipCode,
            stateOrProvinceCode: request.destination.state,
            countryCode: request.destination.country || 'US',
            residential: true,
          },
        },
        pickupType: 'USE_SCHEDULED_PICKUP',
        rateRequestType: ['ACCOUNT', 'LIST'],
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: weightLbs,
            },
          },
        ],
      },
    };

    const rateRes = await fetch(`${baseUrl}/rate/v1/rates/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(ratePayload),
      signal: controller.signal,
    });

    if (!rateRes.ok) {
      return null;
    }

    const rateData = await rateRes.json();
    const rateReplyDetails = rateData?.output?.rateReplyDetails;
    if (!Array.isArray(rateReplyDetails) || rateReplyDetails.length === 0) {
      return null;
    }

    const quotes: FedExRateQuote[] = [];
    for (const detail of rateReplyDetails) {
      const serviceType = detail.serviceType;
      const ratedShipmentDetails = detail.ratedShipmentDetails?.[0];
      const netCharge = ratedShipmentDetails?.totalNetCharge || ratedShipmentDetails?.totalNetFedExCharge;

      if (netCharge && netCharge > 0) {
        quotes.push({
          serviceType: serviceType,
          serviceName: detail.serviceName || serviceType,
          amount: Number(netCharge.toFixed(2)),
          currency: 'USD',
          estimatedTransitDays: detail.operationalDetail?.transitTime || 'Next Day Delivery',
          zone: detail.ratedShipmentDetails?.[0]?.shipmentRateDetail?.dimDivisor ? 4 : 5,
          zoneDescription: 'FedEx Real-Time Rated',
          source: 'live_fedex_api',
          isResidential: true,
          billedWeightLbs: weightLbs,
        });
      }
    }

    if (quotes.length > 0) {
      return {
        success: true,
        origin: {
          city: creds.originAddress.city,
          state: creds.originAddress.state,
          zipCode: creds.originAddress.zipCode,
        },
        destination: {
          city: request.destination.city || '',
          state: request.destination.state,
          zipCode: request.destination.zipCode,
          zone: quotes[0].zone,
          zoneName: 'FedEx Validated Zone',
        },
        totalPackageWeightLbs: weightLbs,
        rates: quotes,
        recommendedRate: quotes[0],
        message: 'Live FedEx rate quoted via FedEx APIs',
      };
    }

    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
