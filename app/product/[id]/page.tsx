import type { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Product from '@/models/Product';
import ProductClientRedirect from './ProductClientRedirect';
import { formatCurrency } from '@/lib/currency';

interface Props {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    await connectToDatabase();
    const product = await Product.findById(params.id).lean();
    if (!product) {
      return {
        title: 'Product Not Found — Nexus Ecom',
      };
    }

    const priceText = product.price ? formatCurrency(product.price) : '';
    const mrpText = product.mrp && product.mrp > product.price ? ` (MRP: ${formatCurrency(product.mrp)})` : '';

    const title = `${product.name} — Indian-Flowers.com`;
    const description = `Order fresh ${product.name} online for ${priceText}${mrpText}. Authentic Indian flowers and garlands delivered across the United States.`;

    return {
      title,
      description,
      openGraph: {
        title: `${product.name} | Indian-Flowers.com`,
        description,
        url: `/product/${params.id}`,
        siteName: 'Indian-Flowers.com',
        images: product.image
          ? [
              {
                url: product.image,
                width: 800,
                height: 800,
                alt: product.name,
              },
            ]
          : [{ url: '/nexus-mark.svg' }],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} — Nexus Ecom`,
        description,
        images: product.image ? [product.image] : ['/nexus-mark.svg'],
      },
    };
  } catch (error) {
    return {
      title: 'Nexus Ecom',
    };
  }
}

export default function ProductPage({ params }: Props) {
  return <ProductClientRedirect id={params.id} />;
}
