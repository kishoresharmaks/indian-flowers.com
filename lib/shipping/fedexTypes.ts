export interface FedExCredentials {
  accountNumber: string;
  meterNumber: string;
  testMeterNumber?: string;
  authKey: string;
  secretKey?: string;
  environment: 'production' | 'test';
  originAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface FedExRateRequest {
  destination: {
    streetAddress?: string;
    city?: string;
    state: string;
    zipCode: string;
    country?: string;
    isResidential?: boolean;
  };
  packageWeightLbs?: number;
  items?: Array<{
    productId?: string;
    name?: string;
    quantity: number;
    weightLbs?: number;
    price?: number;
  }>;
}

export type FedExServiceType =
  | 'FEDEX_PRIORITY_OVERNIGHT'
  | 'FEDEX_STANDARD_OVERNIGHT'
  | 'FEDEX_2_DAY'
  | 'FEDEX_GROUND'
  | 'FEDEX_HOME_DELIVERY';

export interface FedExRateQuote {
  serviceType: FedExServiceType;
  serviceName: string;
  amount: number;
  currency: 'USD';
  estimatedDeliveryDate?: string;
  estimatedTransitDays: string;
  zone: number;
  zoneDescription: string;
  source: 'live_fedex_api' | 'authoritative_zone_engine';
  isResidential: boolean;
  billedWeightLbs: number;
}

export interface FedExRatesResponse {
  success: boolean;
  origin: {
    city: string;
    state: string;
    zipCode: string;
  };
  destination: {
    city?: string;
    state: string;
    zipCode: string;
    zone: number;
    zoneName: string;
  };
  totalPackageWeightLbs: number;
  rates: FedExRateQuote[];
  recommendedRate: FedExRateQuote;
  message?: string;
}
