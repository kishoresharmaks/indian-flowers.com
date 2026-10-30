export interface IBlogSeoData {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface IBlogPostItem {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  imageAlt?: string;
  category: string;
  tags: string[];
  author: string;
  readTime: string;
  isPublished: boolean;
  featured: boolean;
  views: number;
  publishedAt: string;
  seo?: IBlogSeoData;
  createdAt?: string;
  updatedAt?: string;
}

export function calculateReadTime(content: string): string {
  if (!content) return '1 min read';
  const clean = content.replace(/<[^>]*>/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const BLOG_CATEGORIES = [
  'WEDDING GARLANDS',
  'STRINGS & LEAVES',
  'TEMPLE GARLANDS',
  'HOUSE WARMING GARLANDS',
  'FLORAL CARE & TIPS',
  'FESTIVALS & PUJA',
  'CULTURAL TRADITIONS',
];

export const DEFAULT_BLOGS: IBlogPostItem[] = [
  {
    title: 'The Ultimate Guide to Fresh Indian Wedding Garlands (Jai Mala & Varmala)',
    slug: 'guide-to-fresh-indian-wedding-garlands',
    category: 'WEDDING GARLANDS',
    excerpt:
      'From dewy red rose petals and delicate button roses to fragrant carnations, discover how to select the perfect matching garlands for your US wedding muhurtham.',
    image: '/images/banners/hero-wedding-tif-exch.jpg',
    imageAlt: 'Fresh Indian Wedding Varmala and Jai Mala Garlands',
    tags: ['Wedding Garlands', 'Jai Mala', 'Varmala', 'Bridal Guide', 'Vedic Muhurtham'],
    author: 'Priya Ramanathan, Master Florist',
    readTime: '6 min read',
    isPublished: true,
    featured: true,
    views: 482,
    publishedAt: new Date('2026-10-15T10:00:00Z').toISOString(),
    seo: {
      metaTitle: 'Fresh Indian Wedding Garlands (Jai Mala & Varmala) Guide | US Delivery',
      metaDescription:
        'Complete guide to choosing, preserving, and coordinating fresh Indian wedding garlands (Jai Mala) across the USA with overnight cold-chain delivery.',
      keywords: [
        'wedding garlands usa',
        'indian wedding jai mala',
        'fresh varmala flowers',
        'south indian wedding garland',
        'rose petal garland',
      ],
      canonicalUrl: '',
      ogImage: '/images/banners/hero-wedding-tif-exch.jpg',
      noIndex: false,
    },
    content: `
      <h2>The Sacred Symbolism of the Varmala</h2>
      <p>In Vedic matrimonial rituals, the exchange of the <strong>Jai Mala (or Varmala)</strong> marks the pivotal moment of mutual acceptance and unification between bride and groom. More than a celebratory adornment, the fresh floral garland represents life, fragrance, beauty, and mutual reverence in the Grihastha ashram.</p>
      
      <p>For couples celebrating their Hindu, Sikh, or South Indian weddings across the United States, obtaining fresh, unbroken, traditionally woven garlands used to be a logistical headache. Today, temperature-controlled cold-chain logistics ensure that farm-fresh jasmine, button roses, and carnations arrive with dewy petals right to your doorstep or venue.</p>

      <h2>Popular Floral Combinations for Contemporary Ceremonies</h2>
      <ul>
        <li><strong>Royal Red Rose Petal (Kalyana Malai):</strong> Densely packed layers of hand-curled Dutch red rose petals accented with baby's breath or gold tinsel borders. Ideal for traditional silk Kanjeevaram sarees and heavy sherwanis.</li>
        <li><strong>Fragrant Jasmine (Mallipoo) & Button Rose:</strong> Highly sought after in Tamil, Telugu, and Kannada weddings. The divine fragrance creates an authentic temple atmosphere.</li>
        <li><strong>Pastel Carnation & Lotus Bud:</strong> A modern North Indian and fusion wedding favorite that complements pastel lehengas in blush pink, mint green, and champagne ivory.</li>
        <li><strong>Marigold & Tuberose (Sampangi):</strong> Classic vibrant choice for Haldi ceremonies, Sangeet nights, and Arya Samaj rituals.</li>
      </ul>

      <h2>Weight & Comfort Considerations</h2>
      <p>One essential factor frequently overlooked by couples is the garland's weight. Traditional dense rose petal malas can weigh between 3 to 6 pounds each. If your ceremony involves standing for 45 minutes during the Saptapadi or Mangalasutra dharanam, we recommend requesting our balanced light-core weaving which retains full visual lushness while minimizing neck strain.</p>

      <h2>How to Care for Wedding Garlands Upon Arrival in the US</h2>
      <ol>
        <li><strong>Inspect Immediately:</strong> Upon receiving your insulated FedEx or Southwest Cargo cooler box, unbox gently and inspect the ice pack barrier.</li>
        <li><strong>Do Not Drench in Water:</strong> Never submerge delicate garlands in water buckets. A light misting with filtered water from a spray bottle is sufficient.</li>
        <li><strong>Refrigeration:</strong> Keep the garland inside its breathable cellulose liner in a clean refrigerator between 45°F and 52°F (avoid the freezer or direct contact with refrigeration fans).</li>
      </ol>
    `,
  },
  {
    title: 'How to Care for Fresh Madurai Mallipoo & Jasmine Strands Upon Arrival',
    slug: 'how-to-keep-madurai-mallipoo-fresh',
    category: 'STRINGS & LEAVES',
    excerpt:
      'Simple steps to store, mist, and refrigerate your imported South Indian jasmine strings so they remain fragrant and dewy for days.',
    image: '/images/products/prod-madurai-mallipoo.jpg',
    imageAlt: 'Fresh Madurai Mallipoo Jasmine Strands',
    tags: ['Mallipoo', 'Jasmine Strings', 'Floral Care', 'South Indian', 'Pooja Flowers'],
    author: 'Kavitha Sundaram, Botanical Specialist',
    readTime: '4 min read',
    isPublished: true,
    featured: false,
    views: 620,
    publishedAt: new Date('2026-10-18T14:30:00Z').toISOString(),
    seo: {
      metaTitle: 'How to Store & Keep Madurai Mallipoo Fresh | Jasmine Care Guide',
      metaDescription:
        'Learn the florist secret to maintaining fresh, unbloomed Madurai Mallipoo jasmine strands in US homes for maximum fragrance and longevity.',
      keywords: [
        'madurai mallipoo usa',
        'fresh jasmine strands care',
        'how to keep malli fresh',
        'indian jasmine delivery usa',
      ],
      canonicalUrl: '',
      ogImage: '/images/products/prod-madurai-mallipoo.jpg',
      noIndex: false,
    },
    content: `
      <h2>The Queen of Fragrance: Madurai Malligai</h2>
      <p>Geographically protected with a coveted GI tag, <strong>Madurai Mallipoo</strong> (Arabian Jasmine / Jasminum sambac) possesses thick petals, an intoxicating sweet fragrance, and a slow-opening bud structure renowned across the world. When ordered for festivals like Varalakshmi Vratam, Diwali, or bridal hairstyles, proper care ensures the buds open at the exact hour you desire.</p>

      <h2>Step-by-Step Care Guide Upon Unboxing</h2>
      <ul>
        <li><strong>Step 1: Check Thermal Coolant:</strong> Remove the thermal insulated wrapping and ensure the cold packs have kept the flower box chilled during transit.</li>
        <li><strong>Step 2: Breathe:</strong> Allow the strands to aerate for 5 minutes at room temperature to disperse condensation.</li>
        <li><strong>Step 3: Moisture Envelope:</strong> Line an airtight plastic container or sealed glass Pyrex with a damp (not soaking wet) paper towel. Gently coil the jasmine strands inside and place another slightly damp paper towel over top.</li>
        <li><strong>Step 4: Crisper Drawer Storage:</strong> Store the container in your refrigerator's vegetable crisper drawer, which provides optimal humidity and shields the buds from drying air currents.</li>
      </ul>

      <h2>Timing the Bloom for Hair Styling and Puja</h2>
      <p>If the buds arrive tightly closed and you wish them to open into full fragrant blossoms for an evening celebration, simply remove the required lengths 2 to 3 hours prior to the event and leave them at mild room temperature (around 72°F). The buds will bloom naturally, diffusing celestial fragrance.</p>
    `,
  },
  {
    title: 'Significance of Bilva (Vilvam), Mango & Betel Leaves in Vedic Worship',
    slug: 'sacred-leaves-for-puja-and-kalash',
    category: 'TEMPLE GARLANDS',
    excerpt:
      'Why sacred Bilva leaves please Lord Shiva, why mango leaves guard entryways during Grihapravesam, and the purity of auspicious betel leaves.',
    image: '/images/products/prod-durva-bilva-combo.jpg',
    imageAlt: 'Sacred Bilva, Vilvam and Betel Leaves for Puja',
    tags: ['Bilva Leaves', 'Vilvam', 'Puja Leaves', 'Temple Rituals', 'Shiva Puja'],
    author: 'Dr. S. Narayanan, Vedic Culture Scholar',
    readTime: '5 min read',
    isPublished: true,
    featured: false,
    views: 310,
    publishedAt: new Date('2026-10-20T09:15:00Z').toISOString(),
    seo: {
      metaTitle: 'Sacred Bilva, Mango & Betel Leaves Meaning in Puja | Indian Flowers',
      metaDescription:
        'Discover the spiritual power and scriptural significance of fresh Vilvam (Bilva), Mango leaves, and Betel leaves in Hindu ceremonies across the USA.',
      keywords: [
        'bilva leaves usa',
        'fresh vilvam leaves pooja',
        'mango leaves for kalash',
        'betel leaves paan pooja',
      ],
      canonicalUrl: '',
      ogImage: '/images/products/prod-durva-bilva-combo.jpg',
      noIndex: false,
    },
    content: `
      <h2>The Sacred Trifoliate: Bilva Patra and Lord Shiva</h2>
      <p>In the Shiva Purana and Bilvashtakam, it is stated that offering a single trifoliate leaf of the <strong>Bilva tree (Aegle marmelos)</strong> with sincere devotion washes away the karmas of three lifetimes. The three leaflets represent the Tridevas (Brahma, Vishnu, Maheshwara) and the three eyes of Mahadeva.</p>
      
      <p>For Pradosham, Maha Shivaratri, and Rudrabhishekam in American temples and home altars, we source authentic fresh Bilva leaves packaged in breathable herbal protective wraps to preserve their medicinal and spiritual potency.</p>

      <h2>Mango Leaves (Amra Pallava): Guardians of Auspiciousness</h2>
      <p>In Vedic Vastu Shastra, mango leaves symbolize eternal life, fertility, and divine abundance (Lakshmi). Strung across doorway lintels as a <em>Toranam</em>, mango leaves filter airborne dust and absorb negative vibrations. When placed around the brass or silver Kalash during Satyanarayan Puja or Grihapravesam, they channel positive cosmic energy into the sacred water.</p>

      <h2>Tamboolam & Betel Leaves (Nagavalli)</h2>
      <p>No Hindu puja or wedding is complete without offering Tamboolam—consisting of two fresh betel leaves, betel nut (supari), turmeric, and fruit. The heart-shaped leaf is said to house deities at every vertex: Indra at the tip, Saraswati in the center, and Mahalakshmi in the stem.</p>
    `,
  },
  {
    title: 'Grihapravesam Harmony: Traditional Doorway Torans & Blessing Strands',
    slug: 'house-warming-floral-decor-ideas',
    category: 'HOUSE WARMING GARLANDS',
    excerpt:
      'Transform your new American home with fragrant button rose entrance garlands, handcrafted coconut leaf thoranams, and positive Vedic energy.',
    image: '/images/banners/hero-wedding-tif-temple.jpg',
    imageAlt: 'Grihapravesam Housewarming Entrance Flower Garland',
    tags: ['House Warming', 'Grihapravesam', 'Thoranam', 'Home Decor', 'Vastu Puja'],
    author: 'Meera Venkat, Event Stylist',
    readTime: '5 min read',
    isPublished: true,
    featured: false,
    views: 395,
    publishedAt: new Date('2026-10-22T16:00:00Z').toISOString(),
    seo: {
      metaTitle: 'Grihapravesam Floral Decor & Entrance Torans | Housewarming Flowers USA',
      metaDescription:
        'Complete floral decoration checklist for US Grihapravesam ceremonies: doorway thoranam, brass urli decor, puja room garlands, and kitchen milk boiling flowers.',
      keywords: [
        'grihapravesam flowers usa',
        'house warming garland delivery',
        'doorway flower toran',
        'marigold garlands for new home',
      ],
      canonicalUrl: '',
      ogImage: '/images/banners/hero-wedding-tif-temple.jpg',
      noIndex: false,
    },
    content: `
      <h2>Invoking Divine Blessings in Your New Home</h2>
      <p>Entering a newly purchased house is one of the proudest milestones for Indian families living in the United States. A <strong>Grihapravesam (housewarming ceremony)</strong> purifies the space through Vastu Shanti, Navagraha Homa, and the traditional boiling over of auspicious milk.</p>

      <h2>Essential Floral Touchpoints for Your US Home</h2>
      <ul>
        <li><strong>Grand Entryway Toranam:</strong> A continuous strand of fragrant orange and yellow marigolds interspersed with green mango leaves creates a warm Vedic threshold welcoming guests and divine energies.</li>
        <li><strong>Living Room Brass Urli:</strong> Float fresh rose petals and single jasmine blooms in a water-filled brass or copper urli placed near the foyer for instant visual and olfactory warmth.</li>
        <li><strong>Puja Mandir Garlands:</strong> Miniature 1.5-foot to 2.5-foot button rose and thulasi garlands handcrafted specifically for wooden or marble home temples.</li>
        <li><strong>Kitchen Hearth Adornment:</strong> Traditional turmeric-smeared flower strand tied around the brand-new milk vessel before the ceremonial boil.</li>
      </ul>

      <h2>Delivery Timing Recommendation</h2>
      <p>Because Grihapravesam muhurthams often fall in the early morning hours (Brahma Muhurtha), we recommend scheduling your flower delivery 24 hours prior to the puja date. Our overnight insulated shipping keeps every strand pristine and ready for dawn ceremonies.</p>
    `,
  },
];
