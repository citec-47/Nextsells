import { auth0 } from '@/lib/auth0';
import { extractRolesFromUser, ROLE_CLAIMS } from '@/lib/auth/roles';

export default async function DebugPage() {
  try {
    const session = await auth0.getSession();

    if (!session?.user) {
      return (
        <div className="p-8 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-4 text-red-600">No Active Session</h1>
          <p className="mb-4">
            You are not logged in. Please{' '}
            <a href="/api/auth/login" className="text-blue-600 underline">
              login first
            </a>
          </p>
        </div>
      );
    }

    const { roles, sources } = extractRolesFromUser(session.user);

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Auth Debug Info</h1>

        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-2">✅ Authenticated</h2>
          <p className="text-green-800">
            <strong>Email:</strong> {session.user.email}
          </p>
          <p className="text-green-800">
            <strong>Name:</strong> {session.user.name || 'N/A'}
          </p>
        </div>

        <div className={`border rounded p-4 mb-6 ${roles.length > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h2 className="text-lg font-semibold mb-2">
            {roles.length > 0 ? '✅ Roles Found' : '⚠️ No Roles Assigned'}
          </h2>
          <p className="mb-2">
            <strong>Role claims:</strong> {ROLE_CLAIMS.join(', ')}
          </p>
          <p className="mb-2">
            <strong>Sources found:</strong> {sources.length > 0 ? sources.join(', ') : 'NONE'}
          </p>
          <p className="mb-2">
            <strong>Roles:</strong>{' '}
            {roles.length > 0 ? (
              <span className="bg-green-100 px-2 py-1 rounded">
                {roles.map((r) => `"${r}"`).join(', ')}
              </span>
            ) : (
              <span className="bg-yellow-100 px-2 py-1 rounded">
                EMPTY - Need to set up Auth0 Action
              </span>
            )}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Has 'seller' role: {roles.includes('seller') ? '✅ Yes' : '❌ No'}
          </p>
        </div>

        {roles.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">🔧 Need to Set Up Auth0?</h3>
            <p className="text-blue-800 mb-2">
              Your roles array is empty. You need to:
            </p>
            <ol className="list-decimal list-inside text-blue-800 space-y-2">
              <li>Go to Auth0 Dashboard: https://manage.auth0.com</li>
              <li>Find your user in User Management → Users</li>
              <li>Edit their app_metadata to add: {'{'}
                <strong>"roles": ["seller"]</strong>
                {'}'}
              </li>
              <li>Save and logout/login to refresh</li>
            </ol>
            <p className="text-blue-800 mt-2 text-sm">
              Or see <a href="/AUTH0_ROLES_SETUP.md" className="underline">AUTH0_ROLES_SETUP.md</a> for detailed instructions
            </p>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h3 className="font-semibold mb-2">All User Claims ({Object.keys(session.user).length} total)</h3>
          <div className="bg-white p-3 rounded text-xs overflow-auto max-h-64">
            <pre>{JSON.stringify(session.user, null, 2)}</pre>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <a
            href="/seller/dashboard"
            className="block text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Try Seller Dashboard
          </a>
          <a
            href="/api/auth/logout"
            className="block text-center bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            Logout
          </a>
        </div>
      </div>
    );
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-red-600">{(error as any).message}</p>
      </div>
    );
  }
}
