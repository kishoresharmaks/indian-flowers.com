'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductDetail from '@/components/ProductDetail';
import { dispatchItemAdded } from '@/components/ItemAddedNotification';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

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

export default function ProductClientRedirect({
  id,
  initialProduct,
}: {
  id: string;
  initialProduct?: Product | null;
}) {
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState<boolean>(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setProduct(initialProduct);
      setLoading(false);
      return;
    }

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
  }, [id, initialProduct]);

  const handleAddToCart = (variant?: ProductVariant, quantity: number = 1) => {
    if (!product) return;
    try {
      const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
      const currentCart = raw ? JSON.parse(raw) : [];
      const itemPrice = variant ? variant.price : product.price;

      const existingIndex = currentCart.findIndex(
        (i: any) =>
          i.product._id === product._id &&
          (variant ? i.selectedVariant?.name === variant.name : !i.selectedVariant)
      );

      let nextCart;
      if (existingIndex > -1) {
        nextCart = currentCart.map((item: any, idx: number) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        nextCart = [
          ...currentCart,
          {
            product: {
              _id: product._id,
              name: product.name,
              image: product.image,
              price: itemPrice,
              gst: product.gst || 0,
            },
            selectedVariant: variant ? { name: variant.name, price: variant.price } : undefined,
            quantity,
          },
        ];
      }
      const json = JSON.stringify(nextCart);
      localStorage.setItem('cart', json);
      localStorage.setItem('if_cart', json);
      window.dispatchEvent(new Event('cart-updated'));
      dispatchItemAdded({
        product: {
          _id: product._id,
          name: product.name,
          image: product.image,
          price: itemPrice,
        },
        variant: variant ? { name: variant.name, price: variant.price } : undefined,
        quantity,
      });
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleShare = () => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${id}`;
    const shareText = `Check out ${product?.name} - ${product?.description}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: product?.name,
        text: shareText,
        url: shareUrl,
      });
    } else {
      const waText = `${shareText}\n\n🛒 Shop now: ${shareUrl}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
      window.open(waUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Header />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Product Not Found</h1>
          <p className="text-sm text-stone-500">{error || 'This floral product is currently unavailable or moved.'}</p>
          <Link
            href="/#products-section"
            className="mt-2 px-6 py-2.5 rounded-full bg-[#0B3B24] text-white text-xs font-semibold hover:bg-[#134633] transition-colors"
          >
            Browse Fresh Flowers
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-white text-gray-900 pb-16 md:pb-0">
      <Header />
      <main className="flex-1">
        <ProductDetail
          product={product}
          onAddToCart={handleAddToCart}
          onShare={handleShare}
          loading={loading}
        />
      </main>
      <Footer />
    </div>
  );
}
