export interface IDeliveryMode {
  id: string;
  name: string;
  type: 'shipping' | 'pickup';
  price: number;
  description?: string;
  pickupLocation?: string;
  estimatedDays?: string;
  active: boolean;
  order: number;
}

export const DEFAULT_DELIVERY_MODES: IDeliveryMode[] = [
  {
    id: 'southwest-cargo',
    name: 'South West Airlines Priority Air Cargo',
    type: 'shipping',
    price: 55.0,
    description: 'Dewy fresh cold-chain priority air cargo to nearest Southwest Cargo airport facility.',
    estimatedDays: 'Same-Day / Next-Morning',
    active: true,
    order: 1,
  },
  {
    id: 'fedex-shipping',
    name: 'FedEx Priority Overnight',
    type: 'shipping',
    price: 48.0,
    description: 'Insulated thermal box with ice packs delivered directly to your doorstep.',
    estimatedDays: 'Next-Day Delivery',
    active: true,
    order: 2,
  },
  {
    id: 'pickup-houston',
    name: 'Local pickup (Houston)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Houston, TX',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 3,
  },
  {
    id: 'pickup-tampa',
    name: 'Local pickup (Tampa)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Tampa, FL',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 4,
  },
  {
    id: 'pickup-sacramento',
    name: 'Local pickup (Sacramento)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Sacramento, CA',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 5,
  },
  {
    id: 'pickup-reminderville',
    name: 'Local pickup (Reminderville)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Reminderville, OH',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 6,
  },
  {
    id: 'pickup-ohio',
    name: 'Local pickup (Ohio)',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Ohio Hub, OH',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 7,
  },
  {
    id: 'pickup-livermore',
    name: 'Local Pickup Livermore',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Livermore, CA',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 8,
  },
  {
    id: 'pickup-inver-grove',
    name: 'Local pickup- Inver Grove Heights, MN-55077',
    type: 'pickup',
    price: 0.0,
    description: 'A few dollars are applicable during local pickup.',
    pickupLocation: 'Inver Grove Heights, MN-55077',
    estimatedDays: 'Ready for Pickup',
    active: true,
    order: 9,
  },
];
