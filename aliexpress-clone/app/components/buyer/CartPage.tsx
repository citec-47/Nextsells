'use client';

import { useShopState } from './ShopStateProvider';
import Link from 'next/link';
import Header from '../common/Header';
import ModernHeader from '../common/ModernHeader';
import { Home, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function CartPage() {
  const { cartItems, updateCartItemQuantity, removeFromCart } = useShopState();
  const router = useRouter();

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  const handleIncreaseQuantity = (id: number | string, currentQuantity: number) => {
    updateCartItemQuantity(id, currentQuantity + 1);
  };

  const handleDecreaseQuantity = (id: number | string, currentQuantity: number) => {
    if (currentQuantity > 1) {
      updateCartItemQuantity(id, currentQuantity - 1);
    }
  };

  const handleRemoveItem = (id: number | string) => {
    removeFromCart(id);
  };

  const handleProceedToCheckout = () => {
    router.push('/buyer/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 md:gap-2 bg-gray-100 text-gray-700 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-gray-200"
              aria-label="Back to home"
            >
              <Home size={14} className="md:w-4 md:h-4" aria-hidden="true" />
              Home
            </Link>
            <ShoppingBag size={20} className="md:w-6 md:h-6 text-indigo-600" aria-hidden="true" />
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">My Cart</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg md:rounded-2xl border border-gray-100 p-8 md:p-12 text-center">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Add some products to get started!
            </p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm md:text-base"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 md:space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white rounded-lg md:rounded-xl border border-gray-100 shadow-sm p-3 md:p-4 flex gap-3 md:gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.thumbnail || item.product.images?.[0] || '/placeholder.jpg'}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                          {item.product.title}
                        </h3>
                        {item.product.brand && (
                          <p className="text-xs text-gray-500">{item.product.brand}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="flex-shrink-0 p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} className="md:w-5 md:h-5" />
                      </button>
                    </div>

                    {/* Price and Quantity Controls */}
                    <div className="flex items-end justify-between gap-2 mt-auto">
                      <div>
                        <p className="text-lg md:text-xl font-bold text-indigo-600">
                          {currencyFormatter.format(item.product.price * item.quantity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currencyFormatter.format(item.product.price)} each
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 md:gap-3 bg-gray-100 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
                        <button
                          onClick={() => handleDecreaseQuantity(item.product.id, item.quantity)}
                          disabled={item.quantity <= 1}
                          className="p-0.5 md:p-1 text-gray-700 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} className="md:w-4 md:h-4" />
                        </button>
                        <span className="text-sm md:text-base font-semibold text-gray-900 min-w-[24px] md:min-w-[32px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleIncreaseQuantity(item.product.id, item.quantity)}
                          className="p-0.5 md:p-1 text-gray-700 hover:text-indigo-600 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} className="md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg md:rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 sticky top-20">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 md:space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                    <span className="font-semibold text-gray-900">
                      {currencyFormatter.format(subtotal)}
                    </span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-semibold text-gray-900">
                      {currencyFormatter.format(tax)}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">
                      {shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        currencyFormatter.format(shipping)
                      )}
                    </span>
                  </div>

                  <div className="border-t pt-3 md:pt-4">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <span className="text-base md:text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl md:text-2xl font-bold text-indigo-600">
                        {currencyFormatter.format(total)}
                      </span>
                    </div>

                    {/* Proceed to Checkout Button */}
                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full bg-indigo-600 text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm md:text-base shadow-md hover:shadow-lg"
                    >
                      Proceed to Checkout
                    </button>

                    <Link
                      href="/"
                      className="block w-full text-center text-indigo-600 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors mt-2 text-sm md:text-base"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  {/* Free Shipping Notice */}
                  {subtotal > 0 && subtotal < 50 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs md:text-sm text-orange-800 mt-4">
                      <p className="font-semibold mb-1">Almost there!</p>
                      <p>
                        Add {currencyFormatter.format(50 - subtotal)} more to get{' '}
                        <strong>FREE shipping!</strong>
                      </p>
                    </div>
                  )}

                  {subtotal >= 50 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs md:text-sm text-green-800 mt-4">
                      <p className="font-semibold">🎉 You qualify for FREE shipping!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
