export interface ReviewItem {
  _id?: string;
  customerName: string;
  location: string;
  comment: string;
  rating: number;
  avatar?: string;
  productName?: string;
  order?: number;
  featured?: boolean;
  createdAt?: string | Date;
}

export const DEFAULT_CUSTOMER_REVIEWS: ReviewItem[] = [
  {
    _id: 'rev-1',
    customerName: 'Priya & Anand Sharma',
    location: 'Dallas, TX',
    comment:
      'Ordered our wedding Jai Malas (Rose & Jasmine) for our ceremony in Texas. They arrived packed in temperature-controlled boxes with ice packs, dewy fresh as if picked that morning from Madurai! Everyone asked where we got them.',
    rating: 5,
    productName: 'Traditional Rose Petal & Jasmine Jai Mala',
    featured: true,
    order: 1,
  },
  {
    _id: 'rev-2',
    customerName: 'Karthik Venkatesh',
    location: 'San Jose, CA',
    comment:
      'The fresh Mallipoo strings for our housewarming puja were breathtakingly fragrant. Super fast overnight delivery to the Bay Area and flawless insulated packaging. The Indian Flowers is our trusted go-to for all family celebrations.',
    rating: 5,
    productName: 'Fresh Madurai Jasmine Strings (Mallipoo)',
    featured: true,
    order: 2,
  },
  {
    _id: 'rev-3',
    customerName: 'Meera Patel',
    location: 'Edison, NJ',
    comment:
      'Finding fresh mango leaves, betel leaves, and fresh lotus blooms in New Jersey for Diwali puja used to be a challenge. The Indian Flowers delivered everything in pristine sacred condition. Highly recommended!',
    rating: 5,
    productName: 'Sacred Pooja Leaves & Floral Box',
    featured: true,
    order: 3,
  },
  {
    _id: 'rev-4',
    customerName: 'Deepak & Sunita Rao',
    location: 'Chicago, IL',
    comment:
      'We picked up our custom wedding garlands directly from the Midwest pickup hub. The craftsmanship, vibrant fresh colors, and delicate weight of the garlands were perfection. Outstanding customer service!',
    rating: 5,
    productName: 'Custom Carnation & Tube Rose Wedding Garland',
    featured: true,
    order: 4,
  },
];
