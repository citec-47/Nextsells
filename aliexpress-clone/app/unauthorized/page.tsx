import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-xl text-gray-600 mb-8">
          You don't have permission to access this page.
        </p>
        <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go Home
        </Link>
      </div>
    </div>
  );
}
