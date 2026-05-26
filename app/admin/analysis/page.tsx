import AdminAIControls from '../../components/admin/AdminAIControls'

export default function AdminAnalysisPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">AI Analysis Plans</h1>
          <p className="text-sm text-gray-600">Manage seller AI market analysis subscriptions</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Review</p>
            <div className="mt-4 text-3xl font-bold" id="pending-count">0</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">Active Subscriptions</p>
            <div className="mt-4 text-3xl font-bold" id="active-count">0</div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <div className="mt-2 text-3xl font-bold" id="revenue-amount">$0</div>
            </div>
            <div className="text-gray-400">$</div>
          </div>
        </div>

        <div className="mb-6">
          {/* Client-driven admin controls */}
          <AdminAIControls />
        </div>
      </div>
    </div>
  );
}
