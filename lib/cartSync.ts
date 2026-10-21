/**
 * Unified Cart Storage & Synchronization Helper for Indian-Flowers.com
 * Keeps 'cart' and 'if_cart' localStorage keys in 100% sync and triggers 'cart-updated'
 */

export interface CartProduct {
  _id: string;
  name: string;
  image: string;
  price?: number;
  gst?: number;
}

export interface CartVariant {
  name: string;
  price: number;
}

export interface CartItem {
  product: CartProduct;
  selectedVariant?: CartVariant;
  quantity: number;
}

/**
 * Retrieve items from localStorage, checking both 'cart' and 'if_cart' keys
 */
export function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('cart') || localStorage.getItem('if_cart');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse cart storage:', err);
  }
  return [];
}

/**
 * Persist cart items to both 'cart' and 'if_cart' keys, and broadcast 'cart-updated'
 */
export function saveStoredCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    if (items && items.length > 0) {
      const json = JSON.stringify(items);
      localStorage.setItem('cart', json);
      localStorage.setItem('if_cart', json);
    } else {
      localStorage.removeItem('cart');
      localStorage.removeItem('if_cart');
    }
    window.dispatchEvent(new Event('cart-updated'));
  } catch (err) {
    console.error('Failed to save cart to storage:', err);
  }
}

/**
 * Clear cart from all storage keys and broadcast 'cart-updated'
 */
export function clearStoredCart(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('cart');
    localStorage.removeItem('if_cart');
    window.dispatchEvent(new Event('cart-updated'));
  } catch (err) {
    console.error('Failed to clear cart storage:', err);
  }
}
