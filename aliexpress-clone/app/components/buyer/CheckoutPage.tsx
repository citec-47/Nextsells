'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useShopState } from './ShopStateProvider';
import Link from 'next/link';
import { Home } from 'lucide-react';


interface CheckoutFormData {
  shippingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export default function CheckoutPage() {
  const { cartItems, updateCartItemQuantity, removeFromCart } = useShopState();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    shippingAddress: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    updateCartItemQuantity(id, quantity);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!formData.shippingAddress || !formData.city || !formData.zipCode) {
      toast.error('Please fill in all shipping details');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/buyer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: String(item.product.id),
            quantity: item.quantity,
            pricePerUnit: item.product.price,
          })),
          shippingAddress: formData.shippingAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: formData.phone,
          subtotal,
          tax,
          shippingCost: shipping,
          totalAmount: total,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Order placed successfully! Funds held until delivery.');
        cartItems.forEach((item) => removeFromCart(item.product.id));
      } else {
        toast.error(data.error || 'Order placement failed');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error('An error occurred while placing the order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 md:gap-2 bg-white text-gray-700 border border-gray-200 px-2.5 md:px-3 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold hover:bg-gray-50"
            aria-label="Back to home"
          >
            <Home size={16} className="md:w-[18px] md:h-[18px]" aria-hidden="true" />
            Home
          </Link>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Cart Items & Shipping Form */}
          <div className="lg:col-span-2">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Order Items</h2>

              {cartItems.length === 0 ? (
                <p className="text-sm md:text-base text-gray-600">Your cart is empty</p>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex gap-3 md:gap-4 pb-3 md:pb-4 border-b">
                      <img
                        src={item.product.thumbnail || item.product.images?.[0] || '/placeholder.jpg'}
                        alt={item.product.title}
                        className="w-16 h-16 md:w-24 md:h-24 object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base line-clamp-2">{item.product.title}</h3>
                          <p className="font-bold text-indigo-600 text-sm md:text-base whitespace-nowrap">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs md:text-sm text-gray-600">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value))}
                            className="w-14 md:w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, 0)}
                            className="text-red-600 hover:text-red-700 text-xs md:text-sm font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Information */}
            <form onSubmit={handleSubmitOrder} className="bg-white rounded-lg shadow p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Shipping Address</h2>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="123 Main St"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    placeholder="10001"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mt-4 md:mt-6">
                <p className="text-xs md:text-sm text-blue-800">
                  <strong>Payment Secure:</strong> Your payment will be held securely until the
                  product is delivered. Once confirmed delivered, funds will be released to the
                  seller.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || cartItems.length === 0}
                className="w-full mt-4 md:mt-6 bg-indigo-600 text-white py-2.5 md:py-3 rounded-lg text-sm md:text-base font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 md:p-6 lg:sticky lg:top-20">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Order Summary</h2>

              <div className="space-y-2 md:space-y-3 pb-3 md:pb-4 border-b">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Tax (10%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 md:pt-4 mb-3 md:mb-4">
                <span className="text-base md:text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl md:text-2xl font-bold text-indigo-600">${total.toFixed(2)}</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 md:p-3 text-xs md:text-sm text-green-800">
                Free shipping on orders over $50!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
