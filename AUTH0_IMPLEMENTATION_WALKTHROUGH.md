# Auth0 Implementation Walkthrough

A step-by-step guide to integrate Auth0 into your existing pages and components.

---

## 📋 Implementation Steps

### Step 1: Update Your Layout/Root Component

Add Auth0 provider wrapper to your root layout:

**File**: `app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { getSession } from '@auth0/nextjs-auth0';

export const metadata: Metadata = {
  title: 'AliExpress Clone',
  description: 'Shop Amazing Products',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session if user is logged in
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        {/* Your navbar/header with Auth0 */}
        <header>
          {/* Include your navbar here with user info */}
        </header>
        
        {children}
      </body>
    </html>
  );
}
```

---

### Step 2: Update Your Navbar to Show User

**File**: `app/components/common/Navbar.tsx`

```tsx
'use client';

import Link from 'next/link';
import { useAuth0User } from '@/lib/auth/auth0Client';
import { LogoutButton } from './auth/LogoutButton';

export function Navbar() {
  const { user, isAuthenticated, isLoading } = useAuth0User();

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          AliExpress
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-8">
          <Link href="/products">Products</Link>
          
          {isAuthenticated && (
            <>
              <Link href="/buyer/cart">Cart</Link>
              <Link href="/buyer/orders">Orders</Link>
            </>
          )}
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-4">
          {isLoading && <span>Loading...</span>}
          
          {isAuthenticated && user ? (
            <>
              <Link href="/profile" className="flex items-center space-x-2">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span>{user.name || user.email}</span>
              </Link>
              <LogoutButton>Sign Out</LogoutButton>
            </>
          ) : (
            <>
              <a href="/api/auth/login" className="text-blue-600">
                Sign In
              </a>
              <a
                href="/api/auth/login?screen_hint=signup"
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Sign Up
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

---

### Step 3: Create Protected Profile Page

**File**: `app/profile/page.tsx`

```tsx
'use client';

import { useAuth0User } from '@/lib/auth/auth0Client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default function ProfilePage() {
  const { user, isLoading, isAuthenticated } = useAuth0User();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/api/auth/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return <div className="p-8">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8">User not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Avatar */}
        {user.picture && (
          <div className="flex justify-center">
            <img
              src={user.picture}
              alt={user.name}
              className="w-24 h-24 rounded-full"
            />
          </div>
        )}

        {/* User Info */}
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Name
          </label>
          <p className="text-lg">{user.name}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Email
          </label>
          <p className="text-lg">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Email Verified
          </label>
          <p>{user.email_verified ? '✓ Yes' : '✗ No'}</p>
        </div>

        {/* Logout Button */}
        <div className="pt-6 border-t">
          <LogoutButton className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Sign Out
          </LogoutButton>
        </div>
      </div>
    </div>
  );
}
```

---

### Step 4: Create Protected Seller Routes

**File**: `app/seller/dashboard/page.tsx`

```tsx
'use client';

import { useAuth0User } from '@/lib/auth/auth0Client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SellerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth0User();
  const router = useRouter();
  const [sellerData, setSellerData] = useState(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/api/auth/login');
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    // Fetch seller-specific data
    const fetchData = async () => {
      try {
        const response = await fetch('/api/seller/dashboard');
        const data = await response.json();
        setSellerData(data);
      } catch (error) {
        console.error('Failed to fetch seller data:', error);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Unauthorized</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Seller Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Total Sales</h3>
          <p className="text-3xl font-bold">$0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Orders</h3>
          <p className="text-3xl font-bold">0</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm">Products</h3>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Content */}
      {sellerData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Dashboard Data</h2>
          <pre>{JSON.stringify(sellerData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

**File**: `app/api/seller/dashboard/route.ts`

```tsx
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getAuth0Session } from '@/lib/auth/auth0Server';
import { NextResponse } from 'next/server';

export const GET = withApiAuthRequired(async (req) => {
  try {
    const session = await getAuth0Session();
    
    // Get seller data from database
    const sellerData = {
      userId: session?.user.sub,
      email: session?.user.email,
      totalProducts: 0,
      totalOrders: 0,
      totalSales: 0,
    };

    return NextResponse.json(sellerData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
});
```

---

### Step 5: Create Protected Buyer Routes

**File**: `app/buyer/cart/page.tsx`

```tsx
'use client';

import { useAuth0User } from '@/lib/auth/auth0Client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CartPage() {
  const { isAuthenticated, isLoading } = useAuth0User();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/api/auth/login?returnTo=/buyer/cart');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Redirecting to login...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Your cart is empty</p>
      </div>
    </div>
  );
}
```

---

### Step 6: Create Protected API Routes

**File**: `app/api/buyer/cart/route.ts`

```tsx
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getAuth0Session } from '@/lib/auth/auth0Server';
import { NextRequest, NextResponse } from 'next/server';

// Get user's cart
export const GET = withApiAuthRequired(async (req: NextRequest) => {
  try {
    const session = await getAuth0Session();
    const userId = session?.user.sub;

    // Fetch cart from database
    const cart = {
      items: [],
      total: 0,
      userId,
    };

    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
});

// Add item to cart
export const POST = withApiAuthRequired(async (req: NextRequest) => {
  try {
    const session = await getAuth0Session();
    const data = await req.json();

    // Add to cart in database
    const result = {
      success: true,
      item: data,
      userId: session?.user.sub,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
});
```

---

### Step 7: Database Integration

**File**: `lib/auth/database.ts`

```tsx
import { getAuth0Session } from './auth0Server';
import prisma from '@/lib/prisma';

/**
 * Sync Auth0 user to database on first login
 */
export async function syncAuth0UserToDatabase() {
  const session = await getAuth0Session();
  
  if (!session) return null;

  const { user } = session;

  // Check if user exists
  let dbUser = await prisma.user.findUnique({
    where: { auth0Id: user.sub },
  });

  if (!dbUser) {
    // Create new user
    dbUser = await prisma.user.create({
      data: {
        auth0Id: user.sub,
        email: user.email,
        name: user.name,
        avatar: user.picture,
        emailVerified: user.email_verified || false,
      },
    });
  }

  return dbUser;
}

/**
 * Get user by Auth0 ID
 */
export async function getUserByAuth0Id(auth0Id: string) {
  return prisma.user.findUnique({
    where: { auth0Id },
  });
}

/**
 * Get current logged-in user from database
 */
export async function getCurrentUser() {
  const session = await getAuth0Session();
  
  if (!session) return null;

  return getUserByAuth0Id(session.user.sub);
}
```

---

### Step 8: Update Admin Routes

**File**: `app/admin/dashboard/page.tsx`

```tsx
'use client';

import { useAuth0User } from '@/lib/auth/auth0Client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { isAuthenticated, isLoading } = useAuth0User();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/api/auth/login');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Unauthorized</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Admin content here */}
      <div className="bg-white rounded-lg shadow p-6">
        <p>Welcome, Admin!</p>
      </div>
    </div>
  );
}
```

---

## ✅ Checklist

- [ ] Updated navbar with Auth0 user display
- [ ] Created protected profile page
- [ ] Created protected seller routes
- [ ] Created protected buyer routes
- [ ] Wrapped API routes with `withApiAuthRequired()`
- [ ] Added database sync for Auth0 users
- [ ] Tested login/logout flow
- [ ] Tested protected pages redirect to login
- [ ] Tested API authentication
- [ ] Verified user data is accessible

---

## 🧪 Testing

```bash
# Start dev server
npm run dev

# Test login
curl http://localhost:3000/api/auth/login

# Test protected route (should redirect to login)
curl http://localhost:3000/seller/dashboard

# After login - test API
curl -b "appSession=COOKIE_VALUE" http://localhost:3000/api/seller/dashboard
```

---

## 🚀 Deploy to Production

Before deploying:

1. Update `AUTH0_BASE_URL` to your production URL
2. Add production URL to Auth0 callback URLs
3. Generate new `AUTH0_SECRET` for production
4. Set all environment variables in production

```env
AUTH0_SECRET=your-production-secret-value
AUTH0_BASE_URL=https://yourdomain.com
AUTH0_ISSUER_BASE_URL=https://dev-8ha8nzx35jc1k4tq.us.auth0.com
AUTH0_CLIENT_ID=odqviJLjpRqZu0qaVEnKCsaJPLiUIQhd
AUTH0_CLIENT_SECRET=WVVbVL1Umac7WPrDwPl-uHpBfkjI78X0owafcHP7DG6ioK0VHOdUro4tlxTQvPCF
DATABASE_URL=your-production-database-url
```

---

## 📞 Support

- See [AUTH0_INTEGRATION_GUIDE.md](./AUTH0_INTEGRATION_GUIDE.md) for troubleshooting
- See [AUTH0_QUICK_REFERENCE.md](./AUTH0_QUICK_REFERENCE.md) for quick lookup

