import { requireAuth, getUser } from '@/lib/auth/protectedRoutes';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Seller Application Pending | Nextsells',
  description: 'Your seller application is under review',
};

export default async function SellerPendingPage() {
  await requireAuth();
  const user = await getUser();

  // If user is already a seller, redirect to dashboard
  if (user?.roles?.includes('seller')) {
    redirect('/seller/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-yellow-600" size={40} />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Application Under Review
              </h1>
              <p className="text-gray-600">
                Your seller application is being reviewed by our admin team.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-left space-y-3">
              <h3 className="font-semibold text-gray-900">What happens next:</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex gap-3">
                  <span className="font-semibold text-yellow-600">1.</span>
                  <span>Our admin team reviews your documents and information</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-yellow-600">2.</span>
                  <span>We typically review applications within 24-48 hours</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-yellow-600">3.</span>
                  <span>You&apos;ll receive a confirmation email at <strong>{user?.email}</strong> when approved</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-yellow-600">4.</span>
                  <span>Once approved, you can immediately start listing products</span>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> While you wait, you can explore our seller resources and best practices for listing products.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Return to Home
              </Link>
              <Link
                href="/profile"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
