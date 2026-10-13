import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Indian-Flowers.com — Fresh Indian Flowers, Garlands & Pooja Essentials in USA",
  description:
    "Authentic fresh Indian flowers, handcrafted garlands, jasmine strings, and ceremonial pooja leaves delivered fresh across the United States.",
  keywords: [
    "Indian Flowers",
    "Wedding Garlands",
    "Jasmine String",
    "Mallipoo",
    "Pooja Flowers",
    "USA Flower Delivery",
  ],
  authors: [{ name: "Indian-Flowers.com" }],
  creator: "Indian-Flowers.com",
  publisher: "Indian-Flowers.com",
  openGraph: {
    title: "Indian-Flowers.com — Authentic Indian Flowers in the USA",
    description:
      "Fresh flowers, garlands, loose flowers, leaves, and custom wedding designs delivered fresh across the United States.",
    url: "https://indian-flowers.com",
    siteName: "Indian-Flowers.com",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Indian-Flowers.com",
    description: "Authentic Indian flowers, garlands and pooja essentials in the USA.",
  },
  metadataBase: new URL("https://indian-flowers.com"),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Indian-Flowers.com",
              "url": "https://indian-flowers.com"
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 antialiased flex flex-col justify-between">
        {children}
      </body>
    </html>
  );
}
