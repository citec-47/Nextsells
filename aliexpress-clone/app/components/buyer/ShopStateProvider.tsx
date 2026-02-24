'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface ApiProduct {
  id: number | string;
  title: string;
  price: number;
  discountPercentage: number;
  rating: number;
  thumbnail: string;
  images: string[];
  category: string;
  tags?: string[];
  brand?: string;
  video?: string;
}

interface CartItem {
  product: ApiProduct;
  quantity: number;
}

interface ShopStateContextValue {
  cartItems: CartItem[];
  wishlistItems: ApiProduct[];
  cartCount: number;
  wishlistCount: number;
  addToCart: (product: ApiProduct) => void;
  toggleWishlist: (product: ApiProduct) => void;
  updateCartItemQuantity: (productId: number | string, quantity: number) => void;
  removeFromCart: (productId: number | string) => void;
}

const ShopStateContext = createContext<ShopStateContextValue | undefined>(undefined);

export function useShopState() {
  const context = useContext(ShopStateContext);
  if (!context) {
    throw new Error('useShopState must be used within ShopStateProvider');
  }
  return context;
}

export default function ShopStateProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<ApiProduct[]>([]);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('nextsells_cart');
      const storedWishlist = localStorage.getItem('nextsells_wishlist');
      if (storedCart) {
        setCartItems(JSON.parse(storedCart) as CartItem[]);
      }
      if (storedWishlist) {
        setWishlistItems(JSON.parse(storedWishlist) as ApiProduct[]);
      }
    } catch (error) {
      console.warn('Failed to load saved cart or wishlist', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nextsells_cart', JSON.stringify(cartItems));
      localStorage.setItem('nextsells_wishlist', JSON.stringify(wishlistItems));
    } catch (error) {
      console.warn('Failed to persist cart or wishlist', error);
    }
  }, [cartItems, wishlistItems]);

  const addToCart = (product: ApiProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartItemQuantity = (productId: number | string, quantity: number) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeFromCart = (productId: number | string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const toggleWishlist = (product: ApiProduct) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      
      // If item exists, remove it (toggle off)
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      
      // If adding would exceed 4 items, remove the oldest (last item)
      if (prev.length >= 4) {
        return [product, ...prev.slice(0, 3)]; // Add new item at start, keep only first 3 old items
      }
      
      // Add new item at the start
      return [product, ...prev];
    });
  };

  const value = useMemo(() => {
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return {
      cartItems,
      wishlistItems,
      cartCount,
      wishlistCount: wishlistItems.length,
      addToCart,
      toggleWishlist,
      updateCartItemQuantity,
      removeFromCart,
    };
  }, [cartItems, wishlistItems]);

  return (
    <ShopStateContext.Provider value={value}>
      {children}
    </ShopStateContext.Provider>
  );
}
