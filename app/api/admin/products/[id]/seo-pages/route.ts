import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import { isAuthenticatedAdmin, unauthenticatedResponse } from '@/lib/authCheck';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const US_STATES_MAP: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
};

const STATE_NAMES = Object.values(US_STATES_MAP);

function extractLocation(name: string, slug: string, tags: string[] = []): { city: string; state: string } {
  let state = '';
  let city = '';

  const allText = `${name} ${(tags || []).join(' ')} ${slug.replace(/-/g, ' ')}`;

  // 1. Detect full state name
  for (const s of STATE_NAMES) {
    const reg = new RegExp(`\\b${s}\\b`, 'i');
    if (reg.test(allText)) {
      state = s;
      break;
    }
  }

  // 2. Detect state abbreviation (e.g. "Detroit-MI", "Dallas-TX")
  if (!state) {
    for (const [abbr, fullName] of Object.entries(US_STATES_MAP)) {
      const reg = new RegExp(`[\\b-_]${abbr}[\\b-_]`, 'i');
      if (reg.test(slug) || reg.test(name)) {
        state = fullName;
        break;
      }
    }
  }

  // 3. Detect city from title: "in [City] [State] USA"
  const inCityMatch = name.match(
    /\bin\s+([A-Za-z\s]+?)(?:\s+(?:California|Texas|Florida|New York|Illinois|Ohio|Georgia|North Carolina|Michigan|New Jersey|Virginia|Washington|Arizona|Tennessee|Massachusetts|Indiana|Missouri|Maryland|Wisconsin|Colorado|Minnesota|South Carolina|Alabama|Louisiana|Kentucky|Oregon|Oklahoma|Connecticut|Utah|Iowa|Nevada|Arkansas|Mississippi|Kansas|New Mexico|Nebraska|Idaho|West Virginia|Hawaii|New Hampshire|Maine|Montana|Rhode Island|Delaware|South Dakota|North Dakota|Alaska|Vermont|Wyoming|USA|Canada)|\s*$)/i
  );

  if (inCityMatch && inCityMatch[1].trim()) {
    city = inCityMatch[1].trim();
  } else if (tags && tags.length > 0) {
    for (const t of tags) {
      const tagMatch = t.match(/\bin\s+([A-Za-z\s]+?)(?:\s+USA|\s*$)/i);
      if (tagMatch && tagMatch[1].trim()) {
        city = tagMatch[1].trim();
        break;
      }
    }
  }

  // 4. Fallback: extract from slug ending (e.g. "rose-petal-garland-san-antonio" -> "San Antonio")
  if (!city) {
    const parts = slug.split('-');
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];
      if (last.toLowerCase() === 'usa' && secondLast) {
        city = secondLast.charAt(0).toUpperCase() + secondLast.slice(1);
      } else if (last) {
        city = last.charAt(0).toUpperCase() + last.slice(1);
      }
    }
  }

  return {
    city: city || 'United States',
    state: state || 'USA'
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (process.env.NODE_ENV === 'production' && !isAuthenticatedAdmin(request)) {
      return unauthenticatedResponse();
    }

    await connectToDatabase();
    const { id } = params;

    // Lookup core product by ID or slug
    let coreProduct: any = null;
    if (mongoose.isValidObjectId(id)) {
      coreProduct = await Product.findById(id).lean();
    }
    if (!coreProduct) {
      coreProduct = await Product.findOne({ slug: id.toLowerCase().trim() }).lean();
    }

    if (!coreProduct) {
      return NextResponse.json(
        { success: false, message: 'Core product not found' },
        { status: 404 }
      );
    }

    const cleanImg = (coreProduct.image || '').trim();
    if (!cleanImg) {
      return NextResponse.json({
        success: true,
        coreProduct: {
          _id: coreProduct._id,
          name: coreProduct.name,
          slug: coreProduct.slug,
          image: coreProduct.image,
          price: coreProduct.price
        },
        total: 0,
        data: []
      });
    }

    // Query connected SEO landing pages matching this image path
    const seoProducts = await Product.find({
      $or: [{ isSeoLanding: true }, { hideFromHome: true }],
      image: new RegExp(`^${cleanImg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    })
      .sort({ name: 1 })
      .lean();

    const baseUrl = getSiteUrl();

    const formattedPages = seoProducts.map((p: any) => {
      const loc = extractLocation(p.name || '', p.slug || '', p.tags || []);
      const storefrontUrl = `${baseUrl}/product/${p.slug || p._id}`;
      const relativeUrl = `/product/${p.slug || p._id}`;

      return {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price || 0),
        mrp: Number(p.mrp || p.price || 0),
        city: loc.city,
        state: loc.state,
        tags: p.tags || [],
        relativeUrl,
        storefrontUrl,
        isActive: p.isActive !== false,
        image: p.image
      };
    });

    return NextResponse.json({
      success: true,
      coreProduct: {
        _id: coreProduct._id,
        name: coreProduct.name,
        slug: coreProduct.slug,
        image: coreProduct.image,
        price: coreProduct.price,
        category: coreProduct.category,
        subcategory: coreProduct.subcategory
      },
      total: formattedPages.length,
      data: formattedPages
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch SEO pages' },
      { status: 500 }
    );
  }
}
