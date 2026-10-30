import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import {
  Flower2,
  Heart,
  Truck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  Layers,
  Award,
  Globe2,
  Users2,
  Compass,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSiteUrl } from '@/lib/siteUrl';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
    title: 'About Us – The Indian Flowers | Bringing the Beauty of Indian Flowers to the USA',
    description:
      'Welcome to The Indian Flowers. We bring the authentic beauty and fragrance of fresh Indian wedding garlands (Maalai), fragrant jasmine strings (Malli Poo), and sacred pooja flowers to Indian families across the USA with temperature-controlled shipping.',
    keywords: [
      'The Indian Flowers',
      'About The Indian Flowers',
      'Indian flowers USA',
      'Indian wedding garlands USA',
      'fresh jasmine strings',
      'Malli Poo USA',
      'Mullai strings',
      'pooja flowers USA',
      'Jai Mala garlands',
      'fresh Indian floral delivery',
    ],
    alternates: {
      canonical: `${siteUrl}/about`,
    },
    openGraph: {
      title: 'About Us – The Indian Flowers | Bringing the Beauty of Indian Flowers to the USA',
      description:
        'Authentic Indian wedding garlands, fresh jasmine strands (Malli Poo), and sacred pooja floral collections delivered fresh across the United States.',
      url: `${siteUrl}/about`,
      siteName: 'The Indian Flowers',
      images: [
        {
          url: '/images/banners/hero-wedding-1920x650.jpg',
          width: 1200,
          height: 630,
          alt: 'The Indian Flowers - Bringing the Beauty of Indian Flowers to the USA',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'About Us – The Indian Flowers | Bringing the Beauty of Indian Flowers to the USA',
      description:
        'Authentic fresh Indian wedding garlands, jasmine strings, and sacred pooja flora delivered nationwide across the USA.',
      images: ['/images/banners/hero-wedding-1920x650.jpg'],
    },
  };
}

function getAboutJsonLd(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${siteUrl}/about#webpage`,
        url: `${siteUrl}/about`,
        name: 'About Us – The Indian Flowers | Bringing the Beauty of Indian Flowers to the USA',
        description:
          'Welcome to The Indian Flowers. We bring the authentic beauty and fragrance of fresh Indian flowers to customers across the United States.',
        publisher: {
          '@type': 'Florist',
          '@id': `${siteUrl}/#organization`,
          name: 'The Indian Flowers',
          url: siteUrl,
          telephone: '+1-909-379-3678',
          email: 'indianflowersorder@gmail.com',
          priceRange: '$',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '14922 Bobcat Lane',
            addressLocality: 'Fontana',
            addressRegion: 'CA',
            postalCode: '92336',
            addressCountry: 'US',
          },
          areaServed: {
            '@type': 'Country',
            name: 'United States',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'About Us',
            item: `${siteUrl}/about`,
          },
        ],
      },
    ],
  };
}

// 5 Core Offerings
const OFFERINGS = [
  {
    number: '01',
    title: 'Indian Wedding Garlands (Maalai)',
    subtitle: 'Jai Mala, Bride & Groom Garlands',
    description:
      'Make your wedding ceremony memorable with our traditional Indian wedding garlands. Explore beautifully designed garlands for bride and groom, including rose petal garlands, lily garlands, carnation garlands, and other elegant floral combinations.',
    href: '/product-category/wedding-garlands',
    cta: 'Explore Wedding Garlands',
    tag: 'Ceremonial Elegance',
  },
  {
    number: '02',
    title: 'Fresh Jasmine and Mullai Strings',
    subtitle: 'Malli Poo, Mullai & Fragrant Strands',
    description:
      'Enjoy the natural fragrance of traditional Indian flowers with our fresh jasmine (Malli Poo) and Mullai strings. Perfect for religious ceremonies, daily pooja, festive occasions, and traditional celebrations.',
    href: '/product-category/jasmine-strings',
    cta: 'Explore Jasmine Strings',
    tag: 'Divine Fragrance',
  },
  {
    number: '03',
    title: 'Pooja Garlands and Flowers',
    subtitle: 'Temple Malas & Sacred Pooja Offerings',
    description:
      'Bring devotion and positivity to your spiritual celebrations with our traditional pooja garlands and fresh floral collections. Our products are suitable for temple offerings, home pooja, festivals, and special religious occasions.',
    href: '/product-category/pooja-garlands',
    cta: 'Explore Pooja Garlands',
    tag: 'Sacred Devotion',
  },
  {
    number: '04',
    title: 'Festival Flower Collections',
    subtitle: 'Diwali, Navaratri & Special Celebrations',
    description:
      'Celebrate Indian festivals with beautiful seasonal flowers and traditional floral decorations. From Diwali and Navaratri to other special celebrations, we help you bring festive beauty into your home.',
    href: '/shop',
    cta: 'View Festival Flowers',
    tag: 'Festive Joy',
  },
  {
    number: '05',
    title: 'Special Occasion Garlands',
    subtitle: 'Engagements, Housewarmings & Milestones',
    description:
      'Make birthdays, anniversaries, engagements, housewarming ceremonies, and family celebrations extra special with our exclusive floral arrangements.',
    href: '/shop',
    cta: 'View Special Occasions',
    tag: 'Family Milestones',
  },
];

// 6 Commitment Checkpoints
const COMMITMENTS = [
  {
    icon: Flower2,
    title: 'Fresh & Carefully Selected Flowers',
    description: 'Sourced rigorously for bloom longevity, pristine petals, and natural morning fragrance.',
  },
  {
    icon: Sparkles,
    title: 'Beautifully Handcrafted Traditional Garlands',
    description: 'Each garland is hand-strung by master artisans following authentic regional Indian knotting styles.',
  },
  {
    icon: Package,
    title: 'Quality-Focused Packaging',
    description: 'Protective casing engineered specifically to avoid crushing and preserve petal moisture during handling.',
  },
  {
    icon: Truck,
    title: 'Ice-Box Packaging for Flower Shipments',
    description: 'Insulated thermal boxes with food-grade gel refrigerant packs to maintain cold-chain freshness.',
  },
  {
    icon: Compass,
    title: 'Careful Handling During Transportation',
    description: 'Handled with precision to maintain maximum freshness throughout transit to your doorstep.',
  },
  {
    icon: Users2,
    title: 'Customer-Focused Service and Support',
    description: 'Attentive customer care ready to assist you with order customization, muhurtham timing, and care tips.',
  },
];

// 6 Why Choose USPs
const WHY_CHOOSE_US = [
  {
    icon: Award,
    title: 'Authentic Indian Floral Designs',
    description: 'Traditional garlands and flower collections inspired by rich Indian culture, customs, and heritage.',
  },
  {
    icon: Flower2,
    title: 'Fresh Flower Selection',
    description: 'Carefully selected flowers sourced to ensure vibrant color, dewy texture, and lasting freshness.',
  },
  {
    icon: Layers,
    title: 'Wide Product Collection',
    description: 'From elaborate wedding garlands to daily jasmine strings, Mullai, pooja garlands, and festive flora.',
  },
  {
    icon: Package,
    title: 'Careful Packaging',
    description: 'Special attention to flower preservation with custom insulated boxes and temperature-controlled materials.',
  },
  {
    icon: Globe2,
    title: 'USA-Wide Service',
    description: 'Reliable cold-chain courier delivery to homes, temples, and wedding venues across the United States.',
  },
  {
    icon: Phone,
    title: 'Personalized Customer Support',
    description: 'We are happy to help you find suitable flowers and schedule delivery for your auspicious dates.',
  },
];

export default function AboutPage() {
  const siteUrl = getSiteUrl();

  return (
    <div className="min-h-screen bg-[#FAF6F0]/60 text-[#111827] flex flex-col justify-between">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getAboutJsonLd(siteUrl)),
        }}
      />

      {/* Global Header */}
      <Header />

      <main className="flex-1">
        {/* 1. HERO SECTION & WELCOME */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#F4F8F4] to-[#FAF6F0] border-b border-[#E5E7EB] pt-8 pb-16 sm:pt-14 sm:pb-20">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-emerald-100/40 via-rose-100/30 to-transparent blur-3xl pointer-events-none -z-10" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Link href="/" className="hover:text-[#0B3B24] transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-[#0B3B24] font-semibold">About Us</span>
            </nav>

            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] text-[#0B3B24]">
              <Flower2 className="w-3.5 h-3.5 text-[#2F6B4F]" />
              <span>Authentic Indian Floral Traditions in the USA</span>
            </div>

            {/* Main Page Title */}
            <div className="space-y-4 max-w-4xl">
              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-bold text-[#0B3B24] tracking-[-0.035em] leading-[1.15]">
                About Us – <span className="text-[#C85A78]">The Indian Flowers</span>
              </h1>
              <p className="text-lg sm:text-2xl font-semibold text-[#134633] tracking-[-0.02em]">
                Bringing the Beauty of Indian Flowers to the USA
              </p>
            </div>

            {/* Welcome Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E7EB] shadow-[0_12px_36px_-15px_rgba(11,59,36,0.08)] relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#0B3B24]" />

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#C85A78]">
                <Heart className="w-4 h-4 fill-[#C85A78]" />
                <span>Welcome to The Indian Flowers</span>
              </div>

              <div className="space-y-4 text-sm sm:text-base text-stone-700 leading-relaxed">
                <p className="text-base sm:text-lg font-medium text-stone-900 leading-snug">
                  At <strong>The Indian Flowers</strong>, we believe that flowers are more than just decorations – they represent love, tradition, happiness, devotion, and celebration.
                </p>
                <p>
                  We are passionate about bringing the beauty and fragrance of fresh Indian flowers to customers across the United States. Whether you are celebrating a traditional Indian wedding, performing a special pooja, celebrating a festival, or decorating your home, we help make every occasion more beautiful with our fresh and beautifully handcrafted floral collections.
                </p>
                <p className="font-medium text-[#0B3B24]">
                  Our goal is to bring the authentic Indian floral experience closer to Indian families and flower lovers living in the USA.
                </p>
              </div>

              {/* 4 Trust Highlights Strip */}
              <div className="pt-6 border-t border-stone-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-stone-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B3B24] shrink-0" />
                  <span>50 US States Covered</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B3B24] shrink-0" />
                  <span>100% Handcrafted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B3B24] shrink-0" />
                  <span>Ice-Box Cold-Chain</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0B3B24] shrink-0" />
                  <span>Freshness Guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. OUR STORY SECTION */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Story Text */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold uppercase tracking-[0.14em] text-[#C85A78]">
                  <Sparkles className="w-3.5 h-3.5 text-[#C85A78]" />
                  <span>Traditions &amp; Heritage</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-bold text-[#0B3B24] tracking-[-0.03em] leading-tight">
                  Our Story
                </h2>

                <div className="space-y-4 text-sm sm:text-base text-[#6B7280] leading-relaxed">
                  <p className="text-stone-900 font-medium text-base sm:text-lg">
                    Indian traditions and celebrations are incomplete without flowers. From beautiful wedding garlands to fragrant jasmine strings and sacred pooja flowers, every flower has a special meaning in Indian culture.
                  </p>
                  <p>
                    At The Indian Flowers, we understand how important these traditions are. That is why we focus on providing fresh, high-quality Indian flowers and traditional floral products to customers throughout the USA.
                  </p>
                  <p>
                    We bring carefully selected flowers and traditional floral designs together to help you celebrate your special moments with authenticity and elegance.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-xs sm:text-sm font-semibold tracking-[0.02em] transition-all shadow-sm"
                  >
                    <span>Browse Our Catalog</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="tel:+19093793678"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAF6F0] hover:bg-stone-200/70 border border-[#E5E7EB] text-stone-800 text-xs sm:text-sm font-semibold tracking-[0.02em] transition-all"
                  >
                    <Phone className="w-4 h-4 text-[#0B3B24]" />
                    <span>(909) 379-3678</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Decorative Heritage Card */}
              <div className="lg:col-span-5">
                <div className="rounded-3xl bg-gradient-to-br from-[#0B3B24] via-[#134633] to-[#1C563F] p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                      <Flower2 className="w-6 h-6 text-[#FAF6F0]" />
                    </div>

                    <blockquote className="text-base sm:text-lg font-medium leading-relaxed italic text-emerald-50">
                      &ldquo;Every flower tells a story, and every celebration deserves something special. We help Indian families in the USA stay connected to their sacred roots through every fragrant petal.&rdquo;
                    </blockquote>

                    <div className="pt-4 border-t border-white/15 space-y-1">
                      <p className="font-bold text-sm tracking-wide text-white">The Indian Flowers</p>
                      <p className="text-xs text-emerald-200">Delivering Across All 50 United States</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. WHAT WE OFFER (5 CATEGORIES) */}
        <section className="py-14 sm:py-20 bg-[#FAF6F0]/50 border-b border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-[0.14em] font-bold text-[#C85A78]">
                Handcrafted Collections
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#0B3B24] tracking-[-0.03em]">
                What We Offer
              </h2>
              <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
                We offer a beautiful collection of fresh Indian flowers and handcrafted floral products for different occasions.
              </p>
            </div>

            {/* 5 Offerings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {OFFERINGS.map((item, idx) => (
                <div
                  key={idx}
                  className={`bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] hover:border-[#0B3B24]/40 hover:shadow-lg transition-all flex flex-col justify-between space-y-5 group ${
                    idx === 3 || idx === 4 ? 'md:col-span-1 lg:col-span-1' : ''
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-stone-400 group-hover:text-[#0B3B24] transition-colors">
                        {item.number}
                      </span>
                      <span className="text-[10.5px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[#0B3B24]">
                        {item.tag}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#0B3B24] transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#C85A78]">
                        {item.subtitle}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B3B24] hover:text-[#1C563F] group-hover:translate-x-1 transition-all"
                    >
                      <span>{item.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. OUR COMMITMENT TO QUALITY AND FRESHNESS */}
        <section className="py-16 sm:py-24 bg-[#0B3B24] text-white border-b border-[#1C563F] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="text-xs uppercase tracking-[0.16em] font-bold text-emerald-300">
                Uncompromising Standards
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-[-0.03em] leading-tight">
                Our Commitment to Quality and Freshness
              </h2>
              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
                We understand that freshness matters when it comes to flowers. That is why we focus on sourcing quality flowers and carefully preparing our floral products.
              </p>
            </div>

            {/* 6 Commitments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {COMMITMENTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-200">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="text-center max-w-2xl mx-auto pt-4">
              <p className="text-sm sm:text-base font-medium text-emerald-200 italic">
                &ldquo;We aim to deliver flowers that bring happiness, fragrance, and a touch of Indian tradition to your doorstep.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* 5. SERVING INDIAN COMMUNITIES ACROSS THE USA */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs uppercase tracking-[0.14em] font-bold text-[#C85A78]">
                  Nationwide Logistics
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold text-[#0B3B24] tracking-[-0.03em] leading-tight">
                  Serving Indian Communities Across the USA
                </h2>
                <div className="space-y-4 text-sm sm:text-base text-[#6B7280] leading-relaxed">
                  <p className="text-stone-900 font-medium">
                    Living far from India does not mean you have to miss the flowers and traditions you love.
                  </p>
                  <p>
                    <strong>The Indian Flowers</strong> serves customers across the United States, helping families celebrate weddings, festivals, poojas, and important occasions with authentic Indian floral products.
                  </p>
                  <p>
                    We offer local pickup options in selected locations and shipping services to eligible destinations across the USA. Our goal is to make ordering traditional Indian flowers convenient and reliable.
                  </p>
                </div>
              </div>

              {/* Delivery Features Summary Card */}
              <div className="lg:col-span-5 bg-[#FAF6F0] rounded-3xl p-6 sm:p-8 border border-[#E5E7EB] space-y-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0B3B24]">
                  <Truck className="w-4 h-4 text-[#0B3B24]" />
                  <span>Delivery &amp; Pickup Highlights</span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm text-stone-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#C85A78] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">Headquarters (West Coast)</p>
                      <p className="text-stone-500 text-xs">14922 Bobcat Lane, Fontana, CA 92336</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#C85A78] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">Midwest Distribution Hub</p>
                      <p className="text-stone-500 text-xs">Inver Grove Heights, MN 55077</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe2 className="w-4 h-4 text-[#0B3B24] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">Nationwide Cold-Chain Shipping</p>
                      <p className="text-stone-500 text-xs">Overnight delivery across eligible US zip codes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#0B3B24] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-stone-900">Auspicious Timing Support</p>
                      <p className="text-stone-500 text-xs">Priority morning delivery planned for your Muhurtham</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. WHY CHOOSE INDIAN FLOWERS? (6 USPs) */}
        <section className="py-14 sm:py-20 bg-[#FAF6F0]/60 border-b border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs uppercase tracking-[0.14em] font-bold text-[#C85A78]">
                The Indian Flowers Advantage
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#0B3B24] tracking-[-0.03em]">
                Why Choose Indian Flowers?
              </h2>
              <p className="text-sm sm:text-base text-[#6B7280]">
                Experience authentic heritage, dewy freshness, and dedicated care with every order.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY_CHOOSE_US.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E7EB] hover:border-[#0B3B24]/40 hover:shadow-md transition-all space-y-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0B3B24]">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 7. BRINGING INDIAN TRADITIONS CLOSER TO YOUR HOME */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#E5E7EB]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B3B24]">
              <Flower2 className="w-3.5 h-3.5 text-[#2F6B4F]" />
              <span>Devotion &amp; Connection</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-bold text-[#0B3B24] tracking-[-0.03em] leading-tight">
              Bringing Indian Traditions Closer to Your Home
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-stone-700 leading-relaxed">
              <p className="text-base sm:text-lg font-medium text-stone-900 leading-normal">
                Every flower tells a story, and every celebration deserves something special. Whether you are planning a grand Indian wedding, preparing for a festival, or looking for fresh jasmine flowers for your daily pooja, The Indian Flowers is here to make your moments more meaningful.
              </p>
              <p>
                We are proud to help Indian families in the USA stay connected to their traditions through beautiful flowers and traditional floral products.
              </p>
            </div>
          </div>
        </section>

        {/* 8. ORDER FRESH INDIAN FLOWERS TODAY! (HIGH-CONVERSION CTA) */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-[#FAF6F0] via-white to-[#F4F8F4] relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.16em] font-bold text-[#C85A78]">
                Start Your Order
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold text-[#0B3B24] tracking-[-0.035em] leading-tight">
                Order Fresh Indian Flowers Today!
              </h2>
              <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
                Make your celebrations more colourful, traditional, and memorable with The Indian Flowers. Explore our collection of Indian wedding garlands, jasmine strings, Mullai flowers, pooja garlands, and festive floral collections.
              </p>
            </div>

            {/* Direct Contact & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/shop"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#0B3B24] hover:bg-[#1C563F] text-white text-sm font-semibold tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Full Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="tel:+19093793678"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-[#0B3B24]/30 text-[#0B3B24] text-sm font-bold tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#0B3B24]" />
                <span>Call Us: +1 (909) 379-3678</span>
              </a>
            </div>

            {/* Brand Signature Tagline */}
            <div className="pt-8 border-t border-stone-200/80 max-w-xl mx-auto">
              <p className="text-sm font-bold text-[#0B3B24] tracking-tight">
                The Indian Flowers – Bringing Indian Floral Traditions to Your Doorstep in the USA!
              </p>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-stone-500">
                <span className="font-mono">https://indian-flowers.com</span>
                <span>&bull;</span>
                <span>Fontana, CA</span>
                <span>&bull;</span>
                <span>Inver Grove Heights, MN</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Storefront Footer */}
      <Footer />
    </div>
  );
}
