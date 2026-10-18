'use client';

import { useEffect, useState } from 'react';
import ProductDetail from '@/components/ProductDetail';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ProductVariant {
  _id?: string;
  name: string;
  mrp: number;
  price: number;
  quantity: number;
  discount?: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  mrp: number;
  price: number;
  discount: number;
  quantity: number;
  gst: number;
  category: string;
  variants?: ProductVariant[];
  createdAt?: string;
}

export default function ProductClientRedirect({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        setProduct(data.data || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4 p-4 text-text">
        <RefreshCw className="w-8 h-8 text-brand-700 animate-spin" />
        <p className="text-sm font-bold text-text-muted">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4 p-4 text-text">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">Product Not Found</h1>
        <p className="text-text-muted">{error || 'This product is no longer available'}</p>
        <a
          href="/"
          className="mt-4 px-6 py-3 rounded-lg bg-brand-700 text-white font-bold hover:bg-brand-800 transition-colors"
        >
          Back to Store
        </a>
      </div>
    );
  }

  const handleAddToCart = (variant?: ProductVariant, quantity: number = 1) => {
    // This would typically add to cart in a real implementation
    // For now, we'll show a confirmation
    const variantText = variant ? ` (${variant.name})` : '';
    const qtyText = quantity > 1 ? ` x ${quantity}` : '';
    alert(`Added "${product?.name}${variantText}${qtyText}" to cart!`);
  };

  const handleShare = () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${id}`;
    const shareText = `Check out ${product?.name} - ${product?.description}`;
    
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: shareText,
        url: shareUrl,
      });
    } else {
      // Fallback: copy to clipboard and open WhatsApp
      const waText = `${shareText}\n\n🛒 Shop now: ${shareUrl}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <ProductDetail
      product={product}
      onAddToCart={handleAddToCart}
      onShare={handleShare}
      loading={loading}
    />
  );
}
