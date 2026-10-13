import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Banner from '@/models/Banner';
import Review from '@/models/Review';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

const SEED_CATEGORIES = [
  {
    name: 'Loose Flowers',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80',
    order: 1,
  },
  {
    name: 'Flower Strings',
    image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=400&q=80',
    order: 2,
  },
  {
    name: 'Wedding Garlands',
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80',
    order: 3,
  },
  {
    name: 'Temple Garlands',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80',
    order: 4,
  },
  {
    name: 'Special Leaves',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80',
    order: 5,
  },
  {
    name: 'Pooja Items',
    image: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=400&q=80',
    order: 6,
  },
  {
    name: 'Combos & Gifts',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    order: 7,
  },
  {
    name: 'Custom Orders',
    image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=400&q=80',
    order: 8,
  },
];

const SEED_BANNERS = [
  {
    eyebrow: 'AUTHENTIC INDIAN FLOWERS IN THE USA',
    title: 'Bring Tradition Home',
    description:
      'Fresh Indian flowers, garlands, loose flowers, leaves and custom designs for your special moments. Delivered fresh across the United States.',
    ctaText: 'Shop Fresh Flowers',
    image:
      'https://images.unsplash.com/photo-1596041333385-d867c29e1f57?auto=format&fit=crop&w=1920&q=85',
    badgeText: 'Fresh Flowers for Weddings, Festivals & Every Occasion',
    link: '#products-section',
    order: 1,
    active: true,
  },
  {
    eyebrow: 'WEDDING & CEREMONIAL GARLANDS',
    title: 'Pure Craftsmanship, Vibrant Blooms',
    description:
      'Handcrafted rose petal garlands, jasmine strands, and bespoke floral arrangements designed for unforgettable celebrations.',
    ctaText: 'Explore Wedding Garlands',
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85',
    badgeText: 'Custom Designed for Your Special Day',
    link: '#products-section',
    order: 2,
    active: true,
  },
  {
    eyebrow: 'FESTIVAL & POOJA ESSENTIALS',
    title: 'Sacred Flowers For Daily Pooja',
    description:
      'Fresh marigold, lotus, jasmine, and mango leaves delivered directly to your doorstep in pristine condition.',
    ctaText: 'Shop Pooja Items',
    image:
      'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1920&q=85',
    badgeText: 'Freshness Guaranteed on Arrival',
    link: '#products-section',
    order: 3,
    active: true,
  },
];

const SEED_REVIEWS = [
  {
    customerName: 'Priya R.',
    location: 'California, USA',
    comment:
      'The jasmine strings were so fresh and fragrant. Delivery was on time and the quality was excellent. Highly recommend!',
    rating: 5,
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    productName: 'Jasmine String (Mallipoo)',
    order: 1,
    featured: true,
  },
  {
    customerName: 'Suresh K.',
    location: 'Texas, USA',
    comment:
      'Beautiful garlands for our wedding. Exactly as shown on the website. Great quality and amazing customer service.',
    rating: 5,
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    productName: 'Wedding Garland (Red & White)',
    order: 2,
    featured: true,
  },
  {
    customerName: 'Anita M.',
    location: 'New Jersey, USA',
    comment:
      'I always order flowers for our pooja from Indian-Flowers.com. Very fresh and neatly packed. Will continue to order!',
    rating: 5,
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    productName: 'Lotus & Marigold Pooja Box',
    order: 3,
    featured: true,
  },
  {
    customerName: 'Karthik V.',
    location: 'Washington, USA',
    comment:
      'Pristine betel leaves and fresh lotus blooms arrived right before Diwali. Impeccable temperature-controlled packaging!',
    rating: 5,
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    productName: 'Betel Leaves & Lotus Flowers',
    order: 4,
    featured: true,
  },
];

const SEED_PRODUCTS = [
  {
    name: 'Jasmine String (Mallipoo)',
    description:
      'Fresh and fragrant Madurai-grade Jasmine flower string hand-woven for daily pooja, veni, and ceremonial hair adornment. Delivered fresh across the USA.',
    image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
    mrp: 15.0,
    price: 13.0,
    discount: 13,
    quantity: 50,
    gst: 0,
    category: 'Flower Strings',
    rating: 4.8,
    reviewsCount: 120,
    variants: [
      { name: '1 Yard', mrp: 15.0, price: 13.0, quantity: 25 },
      { name: '2 Yards', mrp: 28.0, price: 24.0, quantity: 20 },
      { name: '5 Yards (Ceremonial)', mrp: 65.0, price: 55.0, quantity: 10 },
    ],
  },
  {
    name: 'Red Rose Bouquet',
    description:
      'Vibrant, handpicked fresh red roses tied in an elegant bouquet. Ideal for festive offerings, anniversaries, and special gifting moments.',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    mrp: 40.0,
    price: 34.0,
    discount: 15,
    quantity: 35,
    gst: 0,
    category: 'Combos & Gifts',
    rating: 4.7,
    reviewsCount: 98,
    variants: [
      { name: '12 Stems Bouquet', mrp: 40.0, price: 34.0, quantity: 20 },
      { name: '24 Stems Grand Bouquet', mrp: 75.0, price: 62.0, quantity: 15 },
    ],
  },
  {
    name: 'Marigold Flowers (Samanthi)',
    description:
      'Golden yellow and bright orange marigold loose blossoms for pooja thalis, temple rituals, and housewarming decoration.',
    image: 'https://images.unsplash.com/photo-1590779033100-9f60a05a9d28?auto=format&fit=crop&w=600&q=80',
    mrp: 14.0,
    price: 12.0,
    discount: 14,
    quantity: 60,
    gst: 0,
    category: 'Loose Flowers',
    rating: 4.8,
    reviewsCount: 76,
    variants: [
      { name: '250g (Half Pound)', mrp: 14.0, price: 12.0, quantity: 30 },
      { name: '500g (1 Pound)', mrp: 25.0, price: 21.0, quantity: 20 },
      { name: '1kg (2.2 Pounds)', mrp: 45.0, price: 38.0, quantity: 10 },
    ],
  },
  {
    name: 'Lotus Flowers (Thamarai)',
    description:
      'Sacred fresh pink lotus blooms hand-picked for Goddess Lakshmi rituals, Diwali pooja, and temple sanctums.',
    image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=600&q=80',
    mrp: 22.0,
    price: 18.0,
    discount: 14,
    quantity: 25,
    gst: 0,
    category: 'Pooja Items',
    rating: 4.6,
    reviewsCount: 54,
    variants: [
      { name: 'Pair of 2 Blooms', mrp: 22.0, price: 18.0, quantity: 15 },
      { name: 'Set of 5 Blooms', mrp: 50.0, price: 40.0, quantity: 10 },
    ],
  },
  {
    name: 'Wedding Garland (Red & White)',
    description:
      'Royal wedding jai mala handcrafted with premium red roses and fragrant white petals. Custom lengths available on request.',
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
    mrp: 120.0,
    price: 100.0,
    discount: 17,
    quantity: 15,
    gst: 0,
    category: 'Wedding Garlands',
    rating: 4.9,
    reviewsCount: 110,
    variants: [
      { name: 'Standard (4 ft)', mrp: 120.0, price: 100.0, quantity: 10 },
      { name: 'Long (5 ft)', mrp: 150.0, price: 125.0, quantity: 5 },
    ],
  },
  {
    name: 'Mango Leaves (Thoranam)',
    description:
      'Fresh, auspicious mango leaves for entrance doorway thoranam, Kalasam rituals, and house warming ceremonies.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    mrp: 10.0,
    price: 8.0,
    discount: 20,
    quantity: 40,
    gst: 0,
    category: 'Special Leaves',
    rating: 4.7,
    reviewsCount: 65,
    variants: [
      { name: 'Bunch of 21 Leaves', mrp: 10.0, price: 8.0, quantity: 25 },
      { name: 'Bunch of 51 Leaves', mrp: 20.0, price: 15.0, quantity: 15 },
    ],
  },
  {
    name: 'Temple Rose & Tulsi Garland',
    description:
      'Traditional South Indian temple garland intricately woven with fresh red rose petals, fragrant tulsi leaves, and golden marigold knots.',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    mrp: 55.0,
    price: 45.0,
    discount: 18,
    quantity: 20,
    gst: 0,
    category: 'Temple Garlands',
    rating: 4.9,
    reviewsCount: 42,
    variants: [
      { name: '3.5 ft Garland', mrp: 55.0, price: 45.0, quantity: 12 },
      { name: '4.5 ft Garland', mrp: 70.0, price: 58.0, quantity: 8 },
    ],
  },
  {
    name: 'Fresh Betel Leaves (Vethalai)',
    description:
      'Glossy, fresh betel leaves hand-sorted for traditional Tamboolam, Satyanarayan pooja, and auspicious ceremonial thalis.',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    mrp: 12.0,
    price: 9.0,
    discount: 25,
    quantity: 50,
    gst: 0,
    category: 'Special Leaves',
    rating: 4.8,
    reviewsCount: 58,
    variants: [
      { name: 'Pack of 25 Leaves', mrp: 12.0, price: 9.0, quantity: 30 },
      { name: 'Pack of 50 Leaves', mrp: 22.0, price: 16.0, quantity: 20 },
    ],
  },
  {
    name: 'Sampangi (Tuberose) Loose Flowers',
    description:
      'Intensely fragrant white tuberose blossoms sourced fresh. Essential for daily home fragrance, prayer altars, and floral decorations.',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
    mrp: 18.0,
    price: 14.0,
    discount: 22,
    quantity: 30,
    gst: 0,
    category: 'Loose Flowers',
    rating: 4.8,
    reviewsCount: 39,
    variants: [
      { name: '250g Box', mrp: 18.0, price: 14.0, quantity: 18 },
      { name: '500g Box', mrp: 32.0, price: 26.0, quantity: 12 },
    ],
  },
  {
    name: 'Royal Wedding Jai Mala Pair',
    description:
      'Luxurious pair of matching wedding garlands woven with premium fragrant petals, custom velvet ribbons, and gold tissue accents.',
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=600&q=80',
    mrp: 220.0,
    price: 180.0,
    discount: 18,
    quantity: 10,
    gst: 0,
    category: 'Wedding Garlands',
    rating: 5.0,
    reviewsCount: 48,
    variants: [
      { name: 'Standard Pair (4 ft each)', mrp: 220.0, price: 180.0, quantity: 6 },
      { name: 'Royal Grand Pair (5 ft each)', mrp: 270.0, price: 220.0, quantity: 4 },
    ],
  },
  {
    name: 'Jasmine & Rose Hair Veni / Gajra',
    description:
      'Elegantly crafted traditional flower hair ornament with fragrant jasmine weave crowned with miniature red rose buds.',
    image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=600&q=80',
    mrp: 20.0,
    price: 16.0,
    discount: 20,
    quantity: 35,
    gst: 0,
    category: 'Flower Strings',
    rating: 4.9,
    reviewsCount: 62,
    variants: [
      { name: 'Single Veni', mrp: 20.0, price: 16.0, quantity: 20 },
      { name: 'Set of 2 Venis', mrp: 36.0, price: 29.0, quantity: 15 },
    ],
  },
  {
    name: 'Daily Archana & Pooja Combo Box',
    description:
      'All-in-one divine box containing fresh marigolds, jasmine string, betel leaves, and mango leaves for your complete daily ritual.',
    image: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?auto=format&fit=crop&w=600&q=80',
    mrp: 30.0,
    price: 24.0,
    discount: 20,
    quantity: 40,
    gst: 0,
    category: 'Pooja Items',
    rating: 4.8,
    reviewsCount: 88,
    variants: [
      { name: 'Standard Box', mrp: 30.0, price: 24.0, quantity: 25 },
      { name: 'Festival Deluxe Box', mrp: 48.0, price: 39.0, quantity: 15 },
    ],
  },
];

async function runSeed() {
  await connectToDatabase();

  // 1. Seed or Update Store Settings
  const settings = await Settings.findOneAndUpdate(
    { key: 'global' },
    {
      siteName: 'Indian-Flowers.com',
      tagline: 'Fresh Indian Flowers Delivered Across USA',
      businessName: 'Indian-Flowers.com',
      domain: 'indian-flowers.com',
      contactEmail: 'support@indian-flowers.com',
      contactPhone: '+1 (510) 579-5199',
      currency: 'USD',
      locale: 'en-US',
      timezone: 'America/New_York',
      enableCOD: true,
      enableUPI: false,
    },
    { upsert: true, new: true }
  );

  // 2. Seed Categories
  const categoryResults = [];
  for (const catData of SEED_CATEGORIES) {
    const cat = await Category.findOneAndUpdate(
      { name: catData.name },
      { $set: catData },
      { upsert: true, new: true }
    );
    categoryResults.push(cat);
  }

  // 3. Seed Banners
  await Banner.deleteMany({});
  const bannerResults = await Banner.insertMany(SEED_BANNERS);

  // 4. Seed Reviews
  await Review.deleteMany({});
  const reviewResults = await Review.insertMany(SEED_REVIEWS);

  // 5. Seed Products
  const productResults = [];
  for (const prodData of SEED_PRODUCTS) {
    const existing = await Product.findOne({ name: prodData.name });
    if (existing) {
      Object.assign(existing, prodData);
      await existing.save();
      productResults.push(existing);
    } else {
      const created = await Product.create(prodData);
      productResults.push(created);
    }
  }

  return {
    success: true,
    message: 'Database seeded successfully with authentic Indian-Flowers.com data!',
    counts: {
      categories: categoryResults.length,
      banners: bannerResults.length,
      reviews: reviewResults.length,
      products: productResults.length,
    },
    settings: {
      siteName: settings.siteName,
      currency: settings.currency,
      phone: settings.contactPhone,
    },
  };
}

export async function POST() {
  try {
    const result = await runSeed();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await runSeed();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Seeding failed' },
      { status: 500 }
    );
  }
}
