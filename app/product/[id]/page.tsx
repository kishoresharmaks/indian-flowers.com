import type { Metadata } from 'next';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import ProductClientRedirect from './ProductClientRedirect';
import { formatCurrency } from '@/lib/currency';
import { getSiteUrl } from '@/lib/siteUrl';

interface Props {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const fallbackImage = `${siteUrl}/images/banners/hero-wedding-1920x650.jpg`;
  try {
    await connectToDatabase();
    let product: any = null;
    if (mongoose.isValidObjectId(params.id)) {
      product = await Product.findById(params.id).lean();
    }
    if (!product) {
      product = await Product.findOne({
        $or: [
          { slug: params.id },
          { name: new RegExp(`^${params.id.replace(/-/g, ' ')}$`, 'i') },
        ],
      }).lean();
    }
    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested Indian flower product is unavailable or moved.',
        robots: { index: false, follow: true },
      };
    }

    const priceText = product.price ? formatCurrency(product.price) : '';
    const mrpText =
      product.mrp && product.mrp > product.price
        ? ` (MRP: ${formatCurrency(product.mrp)})`
        : '';

    const title = `${product.name} — Indian-Flowers.com USA`;
    const description = `Order fresh ${product.name} online for ${priceText}${mrpText}. Authentic Indian flowers and handcrafted garlands delivered fresh across the United States.`;
    const productImageUrl = product.image
      ? product.image.startsWith('http')
        ? product.image
        : `${siteUrl}${product.image.startsWith('/') ? '' : '/'}${product.image}`
      : fallbackImage;

    return {
      title,
      description,
      keywords: [
        product.name,
        product.category || 'Fresh Indian Flowers',
        'Indian Flowers USA',
        'Handcrafted Garlands',
        'Fresh Jasmine Delivery USA',
        'Temple Flowers',
        'Pooja Essentials',
      ],
      alternates: {
        canonical: `${siteUrl}/product/${params.id}`,
      },
      openGraph: {
        title: `${product.name} | Indian-Flowers.com`,
        description,
        url: `${siteUrl}/product/${params.id}`,
        siteName: 'Indian-Flowers.com',
        images: [
          {
            url: productImageUrl,
            width: 800,
            height: 800,
            alt: product.name,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} — Indian-Flowers.com`,
        description,
        images: [productImageUrl],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    return {
      title: 'Indian Flowers & Garlands — Indian-Flowers.com',
    };
  }
}

export default async function ProductPage({ params }: Props) {
  const siteUrl = getSiteUrl();
  const fallbackImage = `${siteUrl}/images/banners/hero-wedding-1920x650.jpg`;
  let productJsonLd: any = null;
  let breadcrumbJsonLd: any = null;
  let serverProduct: any = null;
  let serverRelatedProducts: any[] = [];

  try {
    await connectToDatabase();
    let product: any = null;
    if (mongoose.isValidObjectId(params.id)) {
      product = await Product.findById(params.id).lean();
    }
    if (!product) {
      product = await Product.findOne({
        $or: [
          { slug: params.id },
          { name: new RegExp(`^${params.id.replace(/-/g, ' ')}$`, 'i') },
        ],
      }).lean();
    }

    if (product) {
      serverProduct = JSON.parse(JSON.stringify(product));

      try {
        const relatedQuery: any = {
          _id: { $ne: product._id },
        };
        if (product.category) {
          relatedQuery.category = product.category;
        }
        let related = await Product.find(relatedQuery).limit(4).lean();
        if (related.length < 4) {
          const excludeIds = [product._id, ...related.map((r: any) => r._id)];
          const additional = await Product.find({
            _id: { $nin: excludeIds },
          })
            .limit(4 - related.length)
            .lean();
          related = [...related, ...additional];
        }
        serverRelatedProducts = JSON.parse(JSON.stringify(related));
      } catch (relErr) {
        console.warn('Could not query related products:', relErr);
      }

      const productImageUrl = product.image
        ? product.image.startsWith('http')
          ? product.image
          : `${siteUrl}${product.image.startsWith('/') ? '' : '/'}${product.image}`
        : fallbackImage;

      const isOutOfStock = product.quantity !== undefined && product.quantity <= 0;

      productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: [productImageUrl],
        description:
          product.description ||
          `Fresh handcrafted ${product.name} delivered across the United States.`,
        sku: String(product._id),
        mpn: String(product._id),
        brand: {
          '@type': 'Brand',
          name: 'Indian-Flowers.com',
        },
        category: product.category || 'Fresh Indian Flowers',
        offers: {
          '@type': 'Offer',
          url: `${siteUrl}/product/${product._id}`,
          priceCurrency: 'USD',
          price: Number(product.price || 0).toFixed(2),
          priceValidUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          itemCondition: 'https://schema.org/NewCondition',
          availability: isOutOfStock
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
          seller: {
            '@type': 'Organization',
            name: 'Indian-Flowers.com',
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: {
              '@type': 'MonetaryAmount',
              value: '0.00',
              currency: 'USD',
            },
            shippingDestination: {
              '@type': 'DefinedRegion',
              addressCountry: 'US',
            },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'd',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 2,
                unitCode: 'd',
              },
            },
          },
        },
      };

      breadcrumbJsonLd = {
        '@context': 'https://schema.org',
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
            name: product.category || 'Catalog',
            item: `${siteUrl}/#products-section`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: `${siteUrl}/product/${product._id}`,
          },
        ],
      };
    }
  } catch (err) {
    console.warn('Could not generate server schema for product:', err);
  }

  return (
    <>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ProductClientRedirect
        id={params.id}
        initialProduct={serverProduct}
        initialRelatedProducts={serverRelatedProducts}
      />
    </>
  );
}
