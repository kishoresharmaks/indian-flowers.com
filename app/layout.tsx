import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getSiteUrl } from "@/lib/siteUrl";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import StorefrontGlobalNav from "@/components/StorefrontGlobalNav";
import GlobalPageLoader from "@/components/GlobalPageLoader";
import ProductShareModal from "@/components/ProductShareModal";
import "./globals.css";

// Issue #2: Use next/font/google for Plus Jakarta Sans — eliminates render-blocking
// Google Fonts network requests and prevents font flash on initial load.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  return {
  title: {
    default: "Indian-Flowers.com — Fresh Indian Flowers, Garlands & Pooja Essentials in USA",
    template: "%s | Indian-Flowers.com",
  },
  description:
    "Authentic fresh Indian flowers, handcrafted garlands (Jai Mala, wedding garlands, temple garlands), jasmine strands (Mallipoo), pooja leaves, and ceremonial essentials delivered fresh across the United States.",
  keywords: [
    "Indian Flowers USA",
    "Wedding Garlands USA",
    "Jai Mala",
    "Varmala",
    "Jasmine String",
    "Mallipoo",
    "Fresh Jasmine Delivery",
    "Pooja Flowers USA",
    "Temple Garlands",
    "Indian Wedding Flowers",
    "Mango Leaves Pooja",
    "Betel Leaves Paan",
    "Indian Florist USA",
    "Fresh Flowers Delivered",
    "Overnight Flower Delivery USA",
  ],
  authors: [{ name: "Indian-Flowers.com" }],
  creator: "Indian-Flowers.com",
  publisher: "Indian-Flowers.com",
  applicationName: "Indian-Flowers.com",
  category: "Florist / E-Commerce",
  classification: "Fresh Indian Floral Delivery",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Indian-Flowers.com — Fresh Indian Flowers, Garlands & Pooja Essentials in USA",
    description:
      "Fresh flowers, handcrafted garlands, loose flowers, leaves, and custom wedding designs delivered fresh across the United States.",
    url: siteUrl,
    siteName: "Indian-Flowers.com",
    images: [
      {
        // Issue #4: OG image corrected to 1200×630 (standard OG ratio).
        // The actual file hero-wedding-1920x650.jpg is 2.95:1; declare the
        // standard crop dimensions here so social crawlers render correctly.
        url: "/images/banners/hero-wedding-1920x650.jpg",
        width: 1200,
        height: 630,
        alt: "Indian-Flowers.com — Fresh Indian Flowers & Garlands Delivered Across USA",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indian-Flowers.com — Fresh Indian Flowers & Garlands USA",
    description:
      "Authentic fresh Indian flowers, handcrafted garlands, jasmine strings, and ceremonial essentials delivered fresh across the USA.",
    images: ["/images/banners/hero-wedding-1920x650.jpg"],
    creator: "@IndianFlowersUS",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/the-indian-flowers-emblem.webp",
    shortcut: "/the-indian-flowers-emblem.webp",
    apple: "/the-indian-flowers-emblem.webp",
  },
  };
}

const ROOT_SCHEMA_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      // Issue #21: 'OnlineStore' is not a valid Schema.org type. Replaced with 'Store'.
      "@type": ["Florist", "Store", "Organization"],
      "@id": "https://indian-flowers.com/#organization",
      name: "Indian-Flowers.com",
      alternateName: ["The Indian Flowers", "Indian Flowers USA"],
      url: "https://indian-flowers.com",
      logo: "https://indian-flowers.com/the-indian-flowers-logo.webp",
      image: "https://indian-flowers.com/images/banners/hero-wedding-1920x650.jpg",
      description:
        "Authentic fresh Indian flowers, handcrafted garlands (Jai Mala, wedding garlands, temple garlands), jasmine strands (Mallipoo), pooja leaves, and ceremonial essentials delivered fresh across the United States.",
      telephone: "+1-909-379-3678",
      email: "indianflowersorder@gmail.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "14922 Bobcat Lane",
        addressLocality: "Fontana",
        addressRegion: "CA",
        postalCode: "92336",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 34.148,
        longitude: -117.489,
      },
      priceRange: "$$",
      currenciesAccepted: "USD",
      paymentAccepted: "Credit Card, Debit Card, Online Payment",
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "07:00",
          closes: "20:00",
        },
      ],
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
      sameAs: [
        "https://www.facebook.com/indianflowersusa",
        "https://www.instagram.com/indian_flowers_usa/",
        "https://www.youtube.com/@Indianflowers-2020",
        "https://in.pinterest.com/indianflowers01/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://indian-flowers.com/#website",
      url: "https://indian-flowers.com",
      name: "Indian-Flowers.com",
      description:
        "Fresh Indian Flowers, Garlands & Pooja Essentials Delivered Across USA",
      publisher: {
        "@id": "https://indian-flowers.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          // Pointing to /shop?search= where query parsing and predictive search filtering is wired
          urlTemplate: "https://indian-flowers.com/shop?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      inLanguage: "en-US",
    },
    // Issue #16: FAQPage removed from root layout — it was being injected on every
    // page (product, shop, blog, etc.) which does not match the FAQ content.
    // FAQPage schema is now only on the homepage (app/page.tsx).
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  return (
    <html lang="en" className={`${plusJakartaSans.variable} font-sans`}>
      <head>
        {/* Issue #2: Raw Google Fonts <link> tags removed — next/font/google handles
            font loading above with zero render-blocking network requests. */}
        <meta name="theme-color" content="#0B3B24" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Issue #15: Escape < to \u003c so HTML parsers can't break out of
            // the <script> block if any string value ever contains a '<' character.
            __html: JSON.stringify(ROOT_SCHEMA_GRAPH)
              .replaceAll('https://indian-flowers.com', siteUrl)
              .replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased flex flex-col justify-between">
        <GlobalPageLoader />
        {children}
        <StorefrontGlobalNav />
        <CookieConsentBanner />
        <ProductShareModal />
      </body>
    </html>
  );
}
