'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ShoppingCart, ArrowRight } from 'lucide-react';

export default function RoleSelectionModal() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'SELLER' | null>(
    null
  );

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/auth/register?role=${selectedRole.toLowerCase()}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-indigo-100">
            Choose your account type to get started
          </p>
        </div>

        {/* Role Selection */}
        <div className="p-8">
          <p className="text-gray-600 text-center mb-8 font-semibold">
            What brings you here today?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Buyer Option */}
            <button
              onClick={() => setSelectedRole('BUYER')}
              className={`relative p-8 rounded-xl border-2 transition-all transform hover:scale-105 ${
                selectedRole === 'BUYER'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`p-4 rounded-full ${
                    selectedRole === 'BUYER'
                      ? 'bg-indigo-600'
                      : 'bg-gray-100'
                  }`}
                >
                  <ShoppingCart
                    size={40}
                    className={
                      selectedRole === 'BUYER'
                        ? 'text-white'
                        : 'text-gray-600'
                    }
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    I want to buy
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Browse and purchase products
                  </p>
                </div>
              </div>

              {/* Checkmark */}
              {selectedRole === 'BUYER' && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
              )}
            </button>

            {/* Seller Option */}
            <button
              onClick={() => setSelectedRole('SELLER')}
              className={`relative p-8 rounded-xl border-2 transition-all transform hover:scale-105 ${
                selectedRole === 'SELLER'
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className={`p-4 rounded-full ${
                    selectedRole === 'SELLER'
                      ? 'bg-purple-600'
                      : 'bg-gray-100'
                  }`}
                >
                  <Store
                    size={40}
                    className={
                      selectedRole === 'SELLER'
                        ? 'text-white'
                        : 'text-gray-600'
                    }
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    I want to sell
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Start your online business
                  </p>
                </div>
              </div>

              {/* Checkmark */}
              {selectedRole === 'SELLER' && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">✓</span>
                </div>
              )}
            </button>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-gray-900 mb-3">
              {selectedRole === 'BUYER' ? 'As a Buyer' : selectedRole === 'SELLER' ? 'As a Seller' : 'Next Steps'}
            </h4>
            {selectedRole === 'BUYER' ? (
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Browse thousands of products</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Add items to wishlist</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Track your orders</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Leave reviews and ratings</span>
                </li>
              </ul>
            ) : selectedRole === 'SELLER' ? (
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>List unlimited products</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Manage inventory efficiently</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Receive payments securely</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Track sales and analytics</span>
                </li>
              </ul>
            ) : (
              <p className="text-gray-600">
                Select an account type above to see what's included.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedRole}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                selectedRole
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-lg">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-indigo-600 font-semibold hover:text-indigo-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
