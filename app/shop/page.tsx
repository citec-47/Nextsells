import Link from 'next/link';

export const metadata = {
  title: 'Store Preview | Nextsells',
  description: 'Preview a seller storefront',
};

export default function ShopIndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Store Preview</h1>
        <p className="mt-2 text-sm text-slate-600">Open a seller store preview from the seller dashboard.</p>
        <Link
          href="/seller/store"
          className="mt-4 inline-flex rounded-lg bg-[#173b62] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12304f]"
        >
          Back to My Store
        </Link>
      </div>
    </div>
  );
}
