import { FedExRateRequest, FedExRatesResponse, FedExRateQuote } from './fedexTypes';

export interface OriginHub {
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const ORIGIN_HUB: OriginHub = {
  city: 'Fontana',
  state: 'CA',
  zipCode: '92336',
  country: 'US',
};

export interface ZoneInfo {
  zone: number;
  name: string;
  region: string;
  approxDistanceMiles: number;
  transitDaysOvernight: string;
  transitDaysGround: string;
}

const ZONE_DESCRIPTIONS: Record<number, ZoneInfo> = {
  2: {
    zone: 2,
    name: 'Zone 2 (Intra-Southern California & Inland Empire)',
    region: 'Southern California Local Region',
    approxDistanceMiles: 80,
    transitDaysOvernight: 'Next Morning (by 10:30 AM)',
    transitDaysGround: '1 Business Day',
  },
  3: {
    zone: 3,
    name: 'Zone 3 (Northern California, Las Vegas & Phoenix)',
    region: 'Southwest / Pacific Coast Region',
    approxDistanceMiles: 280,
    transitDaysOvernight: 'Next Day (by 12:00 PM)',
    transitDaysGround: '1-2 Business Days',
  },
  4: {
    zone: 4,
    name: 'Zone 4 (Mountain West, Utah & New Mexico)',
    region: 'Mountain West Region',
    approxDistanceMiles: 520,
    transitDaysOvernight: 'Next Day (by 12:00 PM)',
    transitDaysGround: '2 Business Days',
  },
  5: {
    zone: 5,
    name: 'Zone 5 (Pacific Northwest, Rocky Mountains & Colorado)',
    region: 'Northwest & Western Plains Region',
    approxDistanceMiles: 850,
    transitDaysOvernight: 'Next Day Delivery',
    transitDaysGround: '2-3 Business Days',
  },
  6: {
    zone: 6,
    name: 'Zone 6 (Texas, Central Plains & Upper Midwest)',
    region: 'Mid-Continent & Texas Region',
    approxDistanceMiles: 1250,
    transitDaysOvernight: 'Next Day Delivery',
    transitDaysGround: '3 Business Days',
  },
  7: {
    zone: 7,
    name: 'Zone 7 (Great Lakes, Southeast & Florida)',
    region: 'Midwest & Southeast Region',
    approxDistanceMiles: 1680,
    transitDaysOvernight: 'Next Day Delivery',
    transitDaysGround: '3-4 Business Days',
  },
  8: {
    zone: 8,
    name: 'Zone 8 (Northeast, New York, New Jersey & Mid-Atlantic)',
    region: 'East Coast & Mid-Atlantic Region',
    approxDistanceMiles: 2450,
    transitDaysOvernight: 'Next Day Delivery',
    transitDaysGround: '4-5 Business Days',
  },
  9: {
    zone: 9,
    name: 'Zone 9 (Alaska, Hawaii & US Island Territories)',
    region: 'Non-Contiguous US',
    approxDistanceMiles: 3100,
    transitDaysOvernight: 'Next Day / 2-Day Air',
    transitDaysGround: '5-7 Business Days',
  },
};

/**
 * Resolves the US Postal / FedEx Zone from origin Fontana, CA (92336)
 * using the destination 3-digit ZIP prefix and state code.
 */
export function determineFedExZone(zipCode: string, stateCode?: string): ZoneInfo {
  const cleanZip = (zipCode || '').trim().replace(/\D/g, '');
  const cleanState = (stateCode || '').trim().toUpperCase();

  // If Alaska or Hawaii
  if (cleanState === 'AK' || cleanZip.startsWith('995') || cleanZip.startsWith('996') || cleanZip.startsWith('997') || cleanZip.startsWith('998') || cleanZip.startsWith('999')) {
    return ZONE_DESCRIPTIONS[9];
  }
  if (cleanState === 'HI' || cleanZip.startsWith('967') || cleanZip.startsWith('968') || cleanZip.startsWith('006') || cleanZip.startsWith('007') || cleanZip.startsWith('008') || cleanZip.startsWith('009')) {
    return ZONE_DESCRIPTIONS[9];
  }

  const prefix = cleanZip.length >= 3 ? parseInt(cleanZip.substring(0, 3), 10) : NaN;

  if (!isNaN(prefix)) {
    // Southern California (Los Angeles, Orange County, Inland Empire, San Diego, Ventura, Santa Barbara, Bakersfield)
    if (prefix >= 900 && prefix <= 935) {
      return ZONE_DESCRIPTIONS[2];
    }

    // Northern California & Bay Area (San Jose, SF, Sacramento, Fresno, Stockton, Santa Rosa, Redding)
    if (prefix >= 936 && prefix <= 961) {
      return ZONE_DESCRIPTIONS[3];
    }

    // Nevada (Las Vegas 890-891: Zone 3, Reno/North NV 893-898: Zone 4)
    if (prefix === 890 || prefix === 891) {
      return ZONE_DESCRIPTIONS[3];
    }
    if (prefix >= 893 && prefix <= 898) {
      return ZONE_DESCRIPTIONS[4];
    }

    // Arizona (Phoenix 850-853: Zone 3, Tucson/Flagstaff 855-865: Zone 4)
    if (prefix >= 850 && prefix <= 853) {
      return ZONE_DESCRIPTIONS[3];
    }
    if (prefix >= 855 && prefix <= 865) {
      return ZONE_DESCRIPTIONS[4];
    }

    // Utah & New Mexico (Zone 4)
    if ((prefix >= 840 && prefix <= 847) || (prefix >= 870 && prefix <= 884)) {
      return ZONE_DESCRIPTIONS[4];
    }

    // Pacific Northwest & Mountain (Oregon, Washington, Idaho, Colorado, Wyoming, Montana)
    if (
      (prefix >= 970 && prefix <= 979) || // OR
      (prefix >= 980 && prefix <= 994) || // WA
      (prefix >= 832 && prefix <= 838) || // ID
      (prefix >= 800 && prefix <= 816) || // CO
      (prefix >= 820 && prefix <= 831) || // WY
      (prefix >= 590 && prefix <= 599)    // MT
    ) {
      return ZONE_DESCRIPTIONS[5];
    }

    // Mid-Continent & Texas (Texas, Oklahoma, Kansas, Nebraska, Missouri, Minnesota, Iowa, Dakotas, Arkansas, Louisiana)
    if (
      (prefix >= 750 && prefix <= 799) || // TX
      (prefix >= 730 && prefix <= 749) || // OK
      (prefix >= 660 && prefix <= 679) || // KS
      (prefix >= 680 && prefix <= 693) || // NE
      (prefix >= 630 && prefix <= 658) || // MO
      (prefix >= 550 && prefix <= 567) || // MN
      (prefix >= 500 && prefix <= 528) || // IA
      (prefix >= 570 && prefix <= 588) || // ND & SD
      (prefix >= 716 && prefix <= 729) || // AR
      (prefix >= 700 && prefix <= 714)    // LA
    ) {
      return ZONE_DESCRIPTIONS[6];
    }

    // Midwest & Southeast (Illinois, Wisconsin, Indiana, Michigan, Ohio, Kentucky, Tennessee, Alabama, Mississippi, Georgia, Florida, Carolinas)
    if (
      (prefix >= 600 && prefix <= 629) || // IL (Chicago)
      (prefix >= 530 && prefix <= 549) || // WI
      (prefix >= 460 && prefix <= 479) || // IN
      (prefix >= 480 && prefix <= 499) || // MI
      (prefix >= 430 && prefix <= 459) || // OH
      (prefix >= 400 && prefix <= 427) || // KY
      (prefix >= 370 && prefix <= 385) || // TN
      (prefix >= 350 && prefix <= 369) || // AL
      (prefix >= 386 && prefix <= 397) || // MS
      (prefix >= 300 && prefix <= 319) || // GA (Atlanta)
      (prefix >= 320 && prefix <= 349) || // FL (Miami, Tampa, Orlando)
      (prefix >= 290 && prefix <= 299) || // SC
      (prefix >= 270 && prefix <= 289)    // NC
    ) {
      return ZONE_DESCRIPTIONS[7];
    }

    // Northeast & Mid-Atlantic (NY, NJ, PA, CT, MA, RI, NH, ME, VT, DE, MD, DC, VA, WV)
    if (
      (prefix >= 100 && prefix <= 149) || // NY
      (prefix >= 70 && prefix <= 89) ||   // NJ (070-089)
      (prefix >= 150 && prefix <= 196) || // PA
      (prefix >= 60 && prefix <= 69) ||   // CT (060-069)
      (prefix >= 10 && prefix <= 27) ||   // MA (010-027)
      (prefix >= 28 && prefix <= 29) ||   // RI (028-029)
      (prefix >= 30 && prefix <= 38) ||   // NH (030-038)
      (prefix >= 39 && prefix <= 49) ||   // ME (039-049)
      (prefix >= 50 && prefix <= 59) ||   // VT (050-059)
      (prefix >= 197 && prefix <= 199) || // DE
      (prefix >= 206 && prefix <= 219) || // MD
      (prefix >= 200 && prefix <= 205) || // DC
      (prefix >= 220 && prefix <= 246) || // VA
      (prefix >= 247 && prefix <= 268)    // WV
    ) {
      return ZONE_DESCRIPTIONS[8];
    }
  }

  // Fallback by State if ZIP was incomplete or unrecognized
  switch (cleanState) {
    case 'CA':
      return ZONE_DESCRIPTIONS[2];
    case 'NV':
    case 'AZ':
      return ZONE_DESCRIPTIONS[3];
    case 'UT':
    case 'NM':
      return ZONE_DESCRIPTIONS[4];
    case 'OR':
    case 'WA':
    case 'ID':
    case 'CO':
    case 'WY':
    case 'MT':
      return ZONE_DESCRIPTIONS[5];
    case 'TX':
    case 'OK':
    case 'KS':
    case 'NE':
    case 'MO':
    case 'MN':
    case 'IA':
    case 'ND':
    case 'SD':
    case 'AR':
    case 'LA':
      return ZONE_DESCRIPTIONS[6];
    case 'IL':
    case 'WI':
    case 'IN':
    case 'MI':
    case 'OH':
    case 'KY':
    case 'TN':
    case 'AL':
    case 'MS':
    case 'GA':
    case 'FL':
    case 'SC':
    case 'NC':
      return ZONE_DESCRIPTIONS[7];
    case 'NY':
    case 'NJ':
    case 'PA':
    case 'CT':
    case 'MA':
    case 'RI':
    case 'NH':
    case 'ME':
    case 'VT':
    case 'DE':
    case 'MD':
    case 'DC':
    case 'VA':
    case 'WV':
      return ZONE_DESCRIPTIONS[8];
    default:
      // Default conservative US continental zone for unknown state
      return ZONE_DESCRIPTIONS[6];
  }
}

/**
 * Calculates total billable package weight in pounds from order items.
 * Fresh florals require an insulated box, ice packs, and moisture wraps (2.0 lbs tare).
 */
export function calculateFlowerPackageWeight(items?: FedExRateRequest['items'], requestedWeight?: number): number {
  if (requestedWeight && requestedWeight > 0) {
    return Math.max(2.0, Math.round(requestedWeight * 10) / 10);
  }

  let totalItemWeight = 0;
  if (items && Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const name = (item.name || '').toLowerCase();

      // Weight estimate based on item category
      let unitWeight = 1.0;
      if (name.includes('garland') || name.includes('mala') || name.includes('wedding')) {
        unitWeight = 1.5;
      } else if (name.includes('loose') || name.includes('mallipoo') || name.includes('jasmine')) {
        unitWeight = 0.8;
      } else if (name.includes('leaves') || name.includes('betel') || name.includes('mango')) {
        unitWeight = 0.5;
      }

      totalItemWeight += unitWeight * qty;
    }
  } else {
    totalItemWeight = 1.5;
  }

  // Base packaging (insulated thermal styrofoam box + frozen ice packs)
  const packagingWeight = 2.0;
  const billableWeight = Math.max(2.0, Math.ceil((packagingWeight + totalItemWeight) * 10) / 10);
  return billableWeight;
}

/**
 * Computes location-based FedEx rate quotes from Fontana, CA 92336.
 */
export function calculateLocationBasedFedExRates(request: FedExRateRequest): FedExRatesResponse {
  const destZip = request.destination.zipCode || '';
  const destState = request.destination.state || '';
  const zoneInfo = determineFedExZone(destZip, destState);
  const billedWeightLbs = calculateFlowerPackageWeight(request.items, request.packageWeightLbs);
  const extraWeightLbs = Math.max(0, billedWeightLbs - 2.0);

  // Rate Matrix by Zone:
  // Base rates calibrated for 2 lbs insulated floral shipment from Fontana, CA
  const rateSchedule: Record<number, { priorityBase: number; priorityPerLb: number; groundBase: number; groundPerLb: number }> = {
    2: { priorityBase: 28.00, priorityPerLb: 2.50, groundBase: 16.00, groundPerLb: 1.50 },
    3: { priorityBase: 38.00, priorityPerLb: 3.00, groundBase: 19.00, groundPerLb: 1.80 },
    4: { priorityBase: 44.00, priorityPerLb: 3.50, groundBase: 22.00, groundPerLb: 2.00 },
    5: { priorityBase: 52.00, priorityPerLb: 4.00, groundBase: 26.00, groundPerLb: 2.40 },
    6: { priorityBase: 58.00, priorityPerLb: 4.50, groundBase: 30.00, groundPerLb: 2.80 },
    7: { priorityBase: 68.00, priorityPerLb: 5.00, groundBase: 34.00, groundPerLb: 3.20 },
    8: { priorityBase: 76.00, priorityPerLb: 5.50, groundBase: 38.00, groundPerLb: 3.60 },
    9: { priorityBase: 95.00, priorityPerLb: 7.50, groundBase: 65.00, groundPerLb: 5.50 },
  };

  const currentRateTier = rateSchedule[zoneInfo.zone] || rateSchedule[6];

  // Calculate Priority Overnight (The gold standard for perishable Indian flowers)
  const priorityAmount = Number(
    (currentRateTier.priorityBase + extraWeightLbs * currentRateTier.priorityPerLb).toFixed(2)
  );

  // Standard Overnight (Afternoon delivery, ~$6 less)
  const standardAmount = Number(
    Math.max(22.00, priorityAmount - 6.00).toFixed(2)
  );

  // FedEx 2Day (Express 2-Day)
  const twoDayAmount = Number(
    Math.max(18.00, priorityAmount * 0.68).toFixed(2)
  );

  // FedEx Ground / Home Delivery
  const groundAmount = Number(
    (currentRateTier.groundBase + extraWeightLbs * currentRateTier.groundPerLb).toFixed(2)
  );

  const quotes: FedExRateQuote[] = [
    {
      serviceType: 'FEDEX_PRIORITY_OVERNIGHT',
      serviceName: 'FedEx Priority Overnight (Fresh Blooms Guaranteed)',
      amount: priorityAmount,
      currency: 'USD',
      estimatedTransitDays: zoneInfo.transitDaysOvernight,
      zone: zoneInfo.zone,
      zoneDescription: zoneInfo.name,
      source: 'authoritative_zone_engine',
      isResidential: true,
      billedWeightLbs,
    },
    {
      serviceType: 'FEDEX_STANDARD_OVERNIGHT',
      serviceName: 'FedEx Standard Overnight (Next-Day Afternoon)',
      amount: standardAmount,
      currency: 'USD',
      estimatedTransitDays: 'Next Business Day (by 4:30 PM)',
      zone: zoneInfo.zone,
      zoneDescription: zoneInfo.name,
      source: 'authoritative_zone_engine',
      isResidential: true,
      billedWeightLbs,
    },
    {
      serviceType: 'FEDEX_2_DAY',
      serviceName: 'FedEx 2Day Express',
      amount: twoDayAmount,
      currency: 'USD',
      estimatedTransitDays: '2 Business Days',
      zone: zoneInfo.zone,
      zoneDescription: zoneInfo.name,
      source: 'authoritative_zone_engine',
      isResidential: true,
      billedWeightLbs,
    },
    {
      serviceType: 'FEDEX_HOME_DELIVERY',
      serviceName: 'FedEx Home Delivery / Ground',
      amount: groundAmount,
      currency: 'USD',
      estimatedTransitDays: zoneInfo.transitDaysGround,
      zone: zoneInfo.zone,
      zoneDescription: zoneInfo.name,
      source: 'authoritative_zone_engine',
      isResidential: true,
      billedWeightLbs,
    },
  ];

  return {
    success: true,
    origin: {
      city: ORIGIN_HUB.city,
      state: ORIGIN_HUB.state,
      zipCode: ORIGIN_HUB.zipCode,
    },
    destination: {
      city: request.destination.city || '',
      state: zoneInfo.region,
      zipCode: destZip,
      zone: zoneInfo.zone,
      zoneName: zoneInfo.name,
    },
    totalPackageWeightLbs: billedWeightLbs,
    rates: quotes,
    recommendedRate: quotes[0], // Priority Overnight is recommended for flowers
    message: `Dynamic FedEx rate calculated from Fontana, CA hub to ${zoneInfo.name}`,
  };
}
