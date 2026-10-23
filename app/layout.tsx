import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import StorefrontGlobalNav from "@/components/StorefrontGlobalNav";
import GlobalPageLoader from "@/components/GlobalPageLoader";
import "./globals.css";

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
      "@type": ["Florist", "OnlineStore", "Organization"],
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
          urlTemplate: "https://indian-flowers.com/?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      inLanguage: "en-US",
    },
    {
      "@type": "FAQPage",
      "@id": "https://indian-flowers.com/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "How are fresh Indian flowers shipped across the USA?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "All fresh flowers and wedding garlands are packed with insulated thermal cold-chain packaging and food-grade ice gel packs. Orders are dispatched via FedEx / UPS priority overnight delivery to ensure they arrive dewy and fresh for your auspicious muhurtham or pooja ceremony.",
          },
        },
        {
          "@type": "Question",
          name: "Can I pre-order custom wedding garlands (Jai Mala / Varmala)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! We specialize in custom Indian wedding garlands, including fragrant rose petal Varmalas, lotus malas, jasmine strings, and gold-trimmed garlands. You can select your required delivery date during checkout or contact our floral specialists for bespoke designs.",
          },
        },
        {
          "@type": "Question",
          name: "Where does Indian-Flowers.com deliver in the United States?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We deliver fresh flowers, garlands, and pooja essentials across all 50 states in the USA, including California, Texas, New York, New Jersey, Florida, Illinois, Washington, and Ohio. Local pickup is also available in select metropolitan hubs including Fontana, Houston, Tampa, Sacramento, and Denver.",
          },
        },
        {
          "@type": "Question",
          name: "Are fresh pooja leaves like Mango and Betel leaves available year-round?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we provide fresh sacred pooja leaves including fresh Mango leaves (Mavilai), Betel leaves (Paan), Banana leaves, and fresh Tulsi sprigs for homams, Satyanarayan poojas, and festive rituals.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  return (
    <html lang="en" className="font-sans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0B3B24" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ROOT_SCHEMA_GRAPH).replaceAll('https://indian-flowers.com', siteUrl),
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased flex flex-col justify-between">
        <GlobalPageLoader />
        {children}
        <StorefrontGlobalNav />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
